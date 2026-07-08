'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  calcularAngulo,
  encontrarLandmarkMasCercano,
  calcularCalidadTracking,
  PUNTOS_MEDICION,
  RegionKey,
  LadoKey,
  LandmarkRaw,
  CalidadTracking,
  Point
} from '@/biblioteca/math/angles';
import {
  drawAngleOverlays,
  drawHoverHighlight,
  drawSelectionModeLandmarks,
  drawSkeletonConnections,
  drawMockLandmarks
} from '@/biblioteca/rendering/canvasDraw';

const UMBRAL_VISIBILIDAD = 0.65;

interface UseMediaPipeProps {
  region: RegionKey;
  lado: LadoKey;
  isRecording: boolean;
  isMockMode: boolean;
  landmarksPersonalizados: [number, number, number] | null;
  modoSeleccionActivo: boolean;
  zoom: number;
  onDataCollected: (data: { tiempo: number; angulo: number }[]) => void;
  onTrackingQuality?: (quality: CalidadTracking) => void;
  onLandmarkClick?: (index: number) => void;
}

/**
 * Facade / LifeCycle Pattern: Hook reactivo para encapsular la carga
 * y ejecución asíncrona de los modelos de visión de MediaPipe y el hardware de la cámara.
 */
export function useMediaPipe({
  region,
  lado,
  isRecording,
  isMockMode,
  landmarksPersonalizados,
  modoSeleccionActivo,
  zoom,
  onDataCollected,
  onTrackingQuality,
  onLandmarkClick
}: UseMediaPipeProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const liveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const meshCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fps, setFps] = useState(0);
  const [hoveredLandmark, setHoveredLandmark] = useState<number>(-1);

  // Refs de estado estable para el bucle de renderizado
  const recordingDataRef = useRef<{ tiempo: number; angulo: number }[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const latestLandmarksRef = useRef<LandmarkRaw[]>([]);
  const qualityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const filesetResolverRef = useRef<any>(null);
  const faceLandmarkerRef = useRef<any>(null);
  const poseLandmarkerRef = useRef<any>(null);

  const stopStreams = useCallback(() => {
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach(track => track.stop());
      activeStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startWebcam = useCallback(async () => {
    try {
      stopStreams();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, frameRate: { ideal: 30 } },
        audio: false
      });
      activeStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Error opening camera', err);
      setErrorMsg('Permiso de cámara denegado o no disponible.');
    }
  }, [stopStreams]);

  // Adapter Pattern: Translates raw coordinates based on current zoom
  const getCanvasCoords = useCallback((lm: LandmarkRaw, canvasW: number, canvasH: number) => {
    const rawX = lm.x * canvasW;
    const rawY = lm.y * canvasH;

    if (zoom === 1) {
      return { x: rawX, y: rawY };
    }

    const srcW = canvasW / zoom;
    const srcH = canvasH / zoom;
    const srcX = (canvasW - srcW) / 2;
    const srcY = (canvasH - srcH) / 2;

    const px = (rawX - srcX) * (canvasW / srcW);
    const py = (rawY - srcY) * (canvasH / srcH);
    return { x: px, y: py };
  }, [zoom]);

  // Recording lifecycle
  useEffect(() => {
    if (isRecording) {
      recordingDataRef.current = [];
      startTimeRef.current = performance.now();
    } else {
      if (recordingDataRef.current.length > 0) {
        onDataCollected([...recordingDataRef.current]);
      }
    }
  }, [isRecording, onDataCollected]);

  // Clean on unmount
  useEffect(() => {
    return () => {
      stopStreams();
      if (qualityTimerRef.current) clearInterval(qualityTimerRef.current);
    };
  }, [stopStreams]);

  // Observer: Quality tracking polling
  useEffect(() => {
    if (!onTrackingQuality) return;
    if (qualityTimerRef.current) clearInterval(qualityTimerRef.current);

    const getActiveIndices = () => {
      const config = PUNTOS_MEDICION[region];
      if (landmarksPersonalizados) return landmarksPersonalizados;
      return lado === 'IZQUIERDA' ? config.IZQUIERDA : config.DERECHA;
    };

    qualityTimerRef.current = setInterval(() => {
      if (isMockMode || latestLandmarksRef.current.length === 0) return;
      const activeIndices = getActiveIndices();
      const quality = calcularCalidadTracking(latestLandmarksRef.current, activeIndices);
      onTrackingQuality(quality);
    }, 1000);

    return () => {
      if (qualityTimerRef.current) clearInterval(qualityTimerRef.current);
    };
  }, [region, lado, landmarksPersonalizados, isMockMode, onTrackingQuality]);

  // Initialize MediaPipe Models (Facade/Singleton cache)
  useEffect(() => {
    let active = true;

    async function initMediaPipe() {
      if (isMockMode) {
        setLoading(false);
        return;
      }

      const regionType = PUNTOS_MEDICION[region].tipo;

      try {
        setLoading(true);
        setErrorMsg(null);

        const vision = await import('@mediapipe/tasks-vision');

        if (!filesetResolverRef.current) {
          filesetResolverRef.current = await vision.FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm'
          );
        }

        const filesetResolver = filesetResolverRef.current;

        if (regionType === 'rostro' && !faceLandmarkerRef.current) {
          const landmarker = await vision.FaceLandmarker.createFromOptions(filesetResolver, {
            baseOptions: {
              modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
              delegate: 'GPU'
            },
            runningMode: 'VIDEO',
            numFaces: 1,
            outputFaceBlendshapes: false
          });
          if (active) faceLandmarkerRef.current = landmarker;
        } else if (regionType === 'cuerpo' && !poseLandmarkerRef.current) {
          const landmarker = await vision.PoseLandmarker.createFromOptions(filesetResolver, {
            baseOptions: {
              modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task',
              delegate: 'GPU'
            },
            runningMode: 'VIDEO',
            numPoses: 1
          });
          if (active) poseLandmarkerRef.current = landmarker;
        }

        if (!active) return;
        setLoading(false);

        if (!activeStreamRef.current) {
          await startWebcam();
        }
      } catch (err: any) {
        console.error(err);
        if (active) {
          setErrorMsg('No se pudo inicializar la cámara o MediaPipe: ' + err.message);
          setLoading(false);
        }
      }
    }

    initMediaPipe();
    return () => { active = false; };
  }, [region, isMockMode, startWebcam]);

  // Main Render Loop (Strategy Pattern)
  useEffect(() => {
    const liveCanvas = liveCanvasRef.current;
    const meshCanvas = meshCanvasRef.current;
    const video = videoRef.current;
    if (!liveCanvas || !meshCanvas) return;

    const ctxLive = liveCanvas.getContext('2d');
    const ctxMesh = meshCanvas.getContext('2d');
    if (!ctxLive || !ctxMesh) return;

    let lastTime = performance.now();
    let frameCount = 0;

    const getActiveIndices = () => {
      const config = PUNTOS_MEDICION[region];
      if (landmarksPersonalizados) return landmarksPersonalizados;
      return lado === 'IZQUIERDA' ? config.IZQUIERDA : config.DERECHA;
    };

    const renderLoop = () => {
      const now = performance.now();
      frameCount++;
      if (now - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
      }

      ctxLive.clearRect(0, 0, liveCanvas.width, liveCanvas.height);
      ctxMesh.clearRect(0, 0, meshCanvas.width, meshCanvas.height);

      ctxMesh.fillStyle = 'rgba(9, 9, 11, 0.95)';
      ctxMesh.fillRect(0, 0, meshCanvas.width, meshCanvas.height);

      const regionType = PUNTOS_MEDICION[region].tipo;
      const isCustom = !!landmarksPersonalizados;
      const activeIndices = getActiveIndices();

      if (isMockMode) {
        // Strategy: Mock Mode simulated rendering
        const simAngle = drawMockLandmarks(
          ctxLive,
          ctxMesh,
          liveCanvas.width,
          liveCanvas.height,
          now,
          region,
          lado,
          landmarksPersonalizados
        );
        if (isRecording && startTimeRef.current !== null) {
          const elapsed = (performance.now() - startTimeRef.current) / 1000;
          recordingDataRef.current.push({ tiempo: elapsed, angulo: simAngle });
        }
      } else if (video && video.readyState >= 2) {
        // Strategy: Real Camera capturing & vision tracking
        if (zoom === 1) {
          ctxLive.drawImage(video, 0, 0, liveCanvas.width, liveCanvas.height);
        } else {
          const srcW = video.videoWidth / zoom;
          const srcH = video.videoHeight / zoom;
          const srcX = (video.videoWidth - srcW) / 2;
          const srcY = (video.videoHeight - srcH) / 2;
          ctxLive.drawImage(video, srcX, srcY, srcW, srcH, 0, 0, liveCanvas.width, liveCanvas.height);
        }

        if (regionType === 'rostro' && faceLandmarkerRef.current) {
          const results = faceLandmarkerRef.current.detectForVideo(video, now);
          if (results?.faceLandmarks?.length > 0) {
            const landmarks: LandmarkRaw[] = results.faceLandmarks[0];
            latestLandmarksRef.current = landmarks;

            if (modoSeleccionActivo) {
              drawSelectionModeLandmarks(ctxLive, landmarks, landmarksPersonalizados, (lm) =>
                getCanvasCoords(lm, liveCanvas.width, liveCanvas.height)
              );
              if (hoveredLandmark >= 0) {
                const lm = landmarks[hoveredLandmark];
                if (lm) {
                  const { x, y } = getCanvasCoords(lm, liveCanvas.width, liveCanvas.height);
                  drawHoverHighlight(ctxLive, x, y, hoveredLandmark);
                }
              }
            } else {
              ctxLive.fillStyle = 'rgba(52, 211, 153, 0.4)';
              ctxMesh.fillStyle = '#6366f1';
              landmarks.forEach(lm => {
                const { x, y } = getCanvasCoords(lm, liveCanvas.width, liveCanvas.height);
                ctxLive.beginPath();
                ctxLive.arc(x, y, 1.5, 0, 2 * Math.PI);
                ctxLive.fill();
                ctxMesh.beginPath();
                ctxMesh.arc(x, y, 1.5, 0, 2 * Math.PI);
                ctxMesh.fill();
              });

              const visibilityOk = activeIndices.every(idx => {
                const lm = landmarks[idx];
                return lm && (lm.visibility === undefined || lm.visibility >= UMBRAL_VISIBILIDAD);
              });

              if (visibilityOk) {
                const pts = activeIndices.map(idx => {
                  if (!landmarks[idx]) return null;
                  return getCanvasCoords(landmarks[idx], liveCanvas.width, liveCanvas.height);
                });

                if (pts.every(p => p !== null)) {
                  const nonNullPts = pts as Point[];
                  drawAngleOverlays(ctxLive, ctxMesh, nonNullPts, isCustom);
                  const currentAngle = calcularAngulo(nonNullPts[0], nonNullPts[1], nonNullPts[2]);

                  if (isRecording && startTimeRef.current !== null) {
                    const elapsed = (performance.now() - startTimeRef.current) / 1000;
                    recordingDataRef.current.push({ tiempo: elapsed, angulo: currentAngle });
                  }
                }
              }
            }
          }
        } else if (regionType === 'cuerpo' && poseLandmarkerRef.current) {
          const results = poseLandmarkerRef.current.detectForVideo(video, now);
          if (results?.landmarks?.length > 0) {
            const landmarks: LandmarkRaw[] = results.landmarks[0];
            latestLandmarksRef.current = landmarks;

            ctxLive.fillStyle = 'rgba(235, 137, 52, 0.4)';
            ctxMesh.fillStyle = '#6366f1';
            landmarks.forEach(lm => {
              const { x, y } = getCanvasCoords(lm, liveCanvas.width, liveCanvas.height);
              ctxLive.beginPath();
              ctxLive.arc(x, y, 2.5, 0, 2 * Math.PI);
              ctxLive.fill();
              ctxMesh.beginPath();
              ctxMesh.arc(x, y, 2.5, 0, 2 * Math.PI);
              ctxMesh.fill();
            });

            drawSkeletonConnections(ctxLive, landmarks, (lm) =>
              getCanvasCoords(lm, liveCanvas.width, liveCanvas.height)
            );
            drawSkeletonConnections(ctxMesh, landmarks, (lm) =>
              getCanvasCoords(lm, liveCanvas.width, liveCanvas.height)
            );

            const visibilityOk = activeIndices.every(idx => {
              const lm = landmarks[idx];
              return lm && (lm.visibility === undefined || lm.visibility >= UMBRAL_VISIBILIDAD);
            });

            if (visibilityOk) {
              const pts = activeIndices.map(idx => {
                if (!landmarks[idx]) return null;
                return getCanvasCoords(landmarks[idx], liveCanvas.width, liveCanvas.height);
              });

              if (pts.every(p => p !== null)) {
                const nonNullPts = pts as Point[];
                drawAngleOverlays(ctxLive, ctxMesh, nonNullPts, isCustom);
                const currentAngle = calcularAngulo(nonNullPts[0], nonNullPts[1], nonNullPts[2]);

                if (isRecording && startTimeRef.current !== null) {
                  const elapsed = (performance.now() - startTimeRef.current) / 1000;
                  recordingDataRef.current.push({ tiempo: elapsed, angulo: currentAngle });
                }
              }
            }
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(renderLoop);
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [region, lado, isRecording, isMockMode, landmarksPersonalizados, modoSeleccionActivo, hoveredLandmark, zoom, getCanvasCoords]);

  // Selection mode: hover hit-testing
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!modoSeleccionActivo || isMockMode || latestLandmarksRef.current.length === 0) return;
    const canvas = liveCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const rawX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const rawY = (e.clientY - rect.top) * (canvas.height / rect.height);
    const mirroredX = canvas.width - rawX;

    let videoX = mirroredX;
    let videoY = rawY;

    if (zoom > 1) {
      const srcW = canvas.width / zoom;
      const srcH = canvas.height / zoom;
      const srcX = (canvas.width - srcW) / 2;
      const srcY = (canvas.height - srcH) / 2;

      videoX = mirroredX * (srcW / canvas.width) + srcX;
      videoY = rawY * (srcH / canvas.height) + srcY;
    }

    const idx = encontrarLandmarkMasCercano(
      videoX, videoY,
      latestLandmarksRef.current,
      canvas.width, canvas.height,
      18
    );
    setHoveredLandmark(idx ?? -1);
  }, [modoSeleccionActivo, isMockMode, zoom]);

  // Selection mode: click selection callback
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!modoSeleccionActivo || isMockMode || latestLandmarksRef.current.length === 0) return;
    const canvas = liveCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const rawX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const rawY = (e.clientY - rect.top) * (canvas.height / rect.height);
    const mirroredX = canvas.width - rawX;

    let videoX = mirroredX;
    let videoY = rawY;

    if (zoom > 1) {
      const srcW = canvas.width / zoom;
      const srcH = canvas.height / zoom;
      const srcX = (canvas.width - srcW) / 2;
      const srcY = (canvas.height - srcH) / 2;

      videoX = mirroredX * (srcW / canvas.width) + srcX;
      videoY = rawY * (srcH / canvas.height) + srcY;
    }

    const idx = encontrarLandmarkMasCercano(
      videoX, videoY,
      latestLandmarksRef.current,
      canvas.width, canvas.height,
      18
    );
    if (idx !== null && onLandmarkClick) {
      onLandmarkClick(idx);
    }
  }, [modoSeleccionActivo, isMockMode, zoom, onLandmarkClick]);

  return {
    videoRef,
    liveCanvasRef,
    meshCanvasRef,
    loading,
    errorMsg,
    fps,
    handleCanvasMouseMove,
    handleCanvasClick,
    startWebcam,
    stopStreams
  };
}

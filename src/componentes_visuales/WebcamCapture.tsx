'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
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

// Minimum visibility score for a landmark to be trusted (KAN-10 / M2)
const UMBRAL_VISIBILIDAD = 0.65;

// Colors for Enfoque C custom landmark selection slots
const COLORES_SLOT: Record<number, string> = {
  0: '#22d3ee', // cyan  — P1
  1: '#facc15', // yellow — Vértice (P2)
  2: '#e879f9'  // magenta — P3
};

interface WebcamCaptureProps {
  region: RegionKey;
  lado: LadoKey;
  isRecording: boolean;
  isMockMode: boolean;
  /** Enfoque C: 3 custom landmark indices [P1, Vértice, P3] or null for defaults */
  landmarksPersonalizados: [number, number, number] | null;
  /** Enfoque C: when true the canvas is in landmark-selection mode */
  modoSeleccionActivo: boolean;
  /** Zoom factor: 1.0 to 3.0 */
  zoom?: number;
  onDataCollected: (data: { tiempo: number; angulo: number }[]) => void;
  /** KAN-10 / M5: called every ~1s with current tracking quality */
  onTrackingQuality?: (quality: CalidadTracking) => void;
  /** Enfoque C: called when user clicks a landmark in selection mode */
  onLandmarkClick?: (index: number) => void;
}

export default function WebcamCapture({
  region,
  lado,
  isRecording,
  isMockMode,
  landmarksPersonalizados,
  modoSeleccionActivo,
  zoom = 1,
  onDataCollected,
  onTrackingQuality,
  onLandmarkClick
}: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const liveCanvasRef = useRef<HTMLCanvasElement>(null);
  const meshCanvasRef = useRef<HTMLCanvasElement>(null);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fps, setFps] = useState(0);
  // Index of the landmark nearest to the cursor in selection mode (-1 = none)
  const [hoveredLandmark, setHoveredLandmark] = useState<number>(-1);

  // Stable refs — avoid re-triggering effects
  const recordingDataRef = useRef<{ tiempo: number; angulo: number }[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const latestLandmarksRef = useRef<LandmarkRaw[]>([]);
  const qualityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const filesetResolverRef = useRef<any>(null);
  const faceLandmarkerRef = useRef<any>(null);
  const poseLandmarkerRef = useRef<any>(null);

  // ─── Coordinate transformation helper (Zoom mapping) ──────────────────────
  const getCanvasCoords = (lm: LandmarkRaw, canvasW: number, canvasH: number) => {
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
  };

  // ─── Recording lifecycle ───────────────────────────────────────────────────
  useEffect(() => {
    if (isRecording) {
      recordingDataRef.current = [];
      startTimeRef.current = performance.now();
    } else {
      if (recordingDataRef.current.length > 0) {
        onDataCollected([...recordingDataRef.current]);
      }
    }
  }, [isRecording]);

  // ─── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopStreams();
      if (qualityTimerRef.current) clearInterval(qualityTimerRef.current);
    };
  }, []);

  // ─── KAN-10 / M5: quality polling ─────────────────────────────────────────
  useEffect(() => {
    if (!onTrackingQuality) return;
    if (qualityTimerRef.current) clearInterval(qualityTimerRef.current);

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

  // ─── MediaPipe initialization ──────────────────────────────────────────────
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
  }, [region, isMockMode]);

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const getActiveIndices = (): number[] => {
    if (landmarksPersonalizados) return [...landmarksPersonalizados];
    return [...(PUNTOS_MEDICION[region][lado] as unknown as number[])];
  };

  const startWebcam = async () => {
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
  };

  const stopStreams = () => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach(track => track.stop());
      activeStreamRef.current = null;
    }
  };

  // ─── Canvas interaction (Enfoque C with Zoom adaptation) ───────────────────
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!modoSeleccionActivo || isMockMode || latestLandmarksRef.current.length === 0) return;
    const canvas = liveCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const rawX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const rawY = (e.clientY - rect.top) * (canvas.height / rect.height);
    // Compensate for CSS scale-x-[-1] mirror
    const mirroredX = canvas.width - rawX;

    let videoX = mirroredX;
    let videoY = rawY;

    if (zoom > 1) {
      const srcW = canvas.width / zoom;
      const srcH = canvas.height / zoom;
      const srcX = (canvas.width - srcW) / 2;
      const srcY = (canvas.height - srcH) / 2;

      // Inverse zoom mapping: maps zoomed canvas coordinate back to original video pixels
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

  // ─── Drawing helpers ───────────────────────────────────────────────────────
  const drawAngleOverlays = (
    ctxLive: CanvasRenderingContext2D,
    ctxMesh: CanvasRenderingContext2D,
    pts: Point[],
    isCustom: boolean
  ) => {
    const lineColor = isCustom ? '#f59e0b' : '#10b981'; // gold vs emerald

    [ctxLive, ctxMesh].forEach(ctx => {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      ctx.lineTo(pts[1].x, pts[1].y);
      ctx.lineTo(pts[2].x, pts[2].y);
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // Vertex glow (P2)
      ctx.beginPath();
      ctx.arc(pts[1].x, pts[1].y, 8, 0, 2 * Math.PI);
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.35;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Slot-colored dots
      pts.forEach((p, i) => {
        const slotColor = isCustom ? COLORES_SLOT[i] : '#f4f4f5';
        ctx.fillStyle = slotColor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, 2 * Math.PI);
        ctx.fill();

        if (isCustom) {
          ctx.fillStyle = slotColor;
          ctx.font = 'bold 10px monospace';
          ctx.fillText(`P${i + 1}`, p.x + 7, p.y - 4);
        }
      });
    });
  };

  const drawHoverHighlight = (
    ctx: CanvasRenderingContext2D,
    landmarks: LandmarkRaw[],
    hoveredIdx: number,
    canvasW: number,
    canvasH: number
  ) => {
    if (hoveredIdx < 0 || !landmarks[hoveredIdx]) return;
    const lm = landmarks[hoveredIdx];
    const { x: px, y: py } = getCanvasCoords(lm, canvasW, canvasH);

    ctx.save();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(px, py, 10, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`#${hoveredIdx}`, px + 12, py + 4);
    ctx.restore();
  };

  // ─── Selection mode: draw all landmarks larger with slot colors ───────────
  const drawSelectionModeLandmarks = (
    ctx: CanvasRenderingContext2D,
    landmarks: LandmarkRaw[],
    customIndices: [number, number, number] | null,
    canvasW: number,
    canvasH: number
  ) => {
    ctx.fillStyle = 'rgba(99, 102, 241, 0.5)';
    landmarks.forEach(lm => {
      const { x: px, y: py } = getCanvasCoords(lm, canvasW, canvasH);
      ctx.beginPath();
      ctx.arc(px, py, 3.5, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Highlight already-selected custom points
    if (customIndices) {
      customIndices.forEach((idx, slot) => {
        if (idx < 0 || !landmarks[idx]) return;
        const lm = landmarks[idx];
        const { x: px, y: py } = getCanvasCoords(lm, canvasW, canvasH);
        ctx.fillStyle = COLORES_SLOT[slot];
        ctx.beginPath();
        ctx.arc(px, py, 7, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(`P${slot + 1}`, px - 5, py + 4);
      });
    }
  };

  // ─── Main render loop ──────────────────────────────────────────────────────
  useEffect(() => {
    let lastTime = performance.now();
    let frameCount = 0;

    const renderLoop = () => {
      const now = performance.now();
      frameCount++;
      if (now - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = now;
      }

      const liveCanvas = liveCanvasRef.current;
      const meshCanvas = meshCanvasRef.current;
      const video = videoRef.current;

      if (!liveCanvas || !meshCanvas) {
        animFrameIdRef.current = requestAnimationFrame(renderLoop);
        return;
      }

      const ctxLive = liveCanvas.getContext('2d');
      const ctxMesh = meshCanvas.getContext('2d');

      if (!ctxLive || !ctxMesh) {
        animFrameIdRef.current = requestAnimationFrame(renderLoop);
        return;
      }

      ctxLive.clearRect(0, 0, liveCanvas.width, liveCanvas.height);
      ctxMesh.fillStyle = '#09090b';
      ctxMesh.fillRect(0, 0, meshCanvas.width, meshCanvas.height);

      const regionType = PUNTOS_MEDICION[region].tipo;
      const isCustom = !!landmarksPersonalizados;
      const activeIndices = getActiveIndices();

      if (isMockMode) {
        drawMockLandmarks(ctxLive, ctxMesh, liveCanvas.width, liveCanvas.height, now);
      } else if (video && video.readyState >= 2) {
        // Draw video stream (zoomed or full)
        if (zoom === 1) {
          ctxLive.drawImage(video, 0, 0, liveCanvas.width, liveCanvas.height);
        } else {
          const vWidth = video.videoWidth || 640;
          const vHeight = video.videoHeight || 480;
          const srcW = vWidth / zoom;
          const srcH = vHeight / zoom;
          const srcX = (vWidth - srcW) / 2;
          const srcY = (vHeight - srcH) / 2;
          ctxLive.drawImage(video, srcX, srcY, srcW, srcH, 0, 0, liveCanvas.width, liveCanvas.height);
        }

        if (regionType === 'rostro' && faceLandmarkerRef.current) {
          const results = faceLandmarkerRef.current.detectForVideo(video, now);
          if (results?.faceLandmarks?.length > 0) {
            const landmarks: LandmarkRaw[] = results.faceLandmarks[0];
            latestLandmarksRef.current = landmarks;

            if (modoSeleccionActivo) {
              // ── Selection mode: show all landmarks enlarged ──
              drawSelectionModeLandmarks(ctxLive, landmarks, landmarksPersonalizados, liveCanvas.width, liveCanvas.height);
              drawSelectionModeLandmarks(ctxMesh, landmarks, landmarksPersonalizados, meshCanvas.width, meshCanvas.height);
              drawHoverHighlight(ctxLive, landmarks, hoveredLandmark, liveCanvas.width, liveCanvas.height);

            } else {
              // ── Normal mode: draw the full mesh lightly ──
              ctxLive.fillStyle = 'rgba(235, 137, 52, 0.3)';
              ctxMesh.fillStyle = '#6366f1';

              landmarks.forEach(lm => {
                const { x, y } = getCanvasCoords(lm, liveCanvas.width, liveCanvas.height);
                ctxLive.beginPath();
                ctxLive.arc(x, y, 1, 0, 2 * Math.PI);
                ctxLive.fill();
                ctxMesh.beginPath();
                ctxMesh.arc(x, y, 1, 0, 2 * Math.PI);
                ctxMesh.fill();
              });

              // ── KAN-10 M2: visibility filter ──
              const visibilityOk = activeIndices.every(idx => {
                const lm = landmarks[idx];
                return lm && (lm.visibility === undefined || lm.visibility >= UMBRAL_VISIBILIDAD);
              });

              if (visibilityOk) {
                const pts = activeIndices.map(idx => {
                  const lm = landmarks[idx];
                  if (!lm) return null;
                  return getCanvasCoords(lm, liveCanvas.width, liveCanvas.height);
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

            // Skeleton lines
            const poseConnections = [
              [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
              [11, 23], [12, 24], [23, 24],
              [15, 19], [16, 20]
            ];
            [ctxLive, ctxMesh].forEach(ctx => {
              ctx.strokeStyle = 'rgba(99, 102, 241, 0.25)';
              ctx.lineWidth = 1.5;
              poseConnections.forEach(([i1, i2]) => {
                if (landmarks[i1] && landmarks[i2]) {
                  const p1 = getCanvasCoords(landmarks[i1], liveCanvas.width, liveCanvas.height);
                  const p2 = getCanvasCoords(landmarks[i2], liveCanvas.width, liveCanvas.height);
                  ctx.beginPath();
                  ctx.moveTo(p1.x, p1.y);
                  ctx.lineTo(p2.x, p2.y);
                  ctx.stroke();
                }
              });
            });

            // KAN-10 M2: visibility filter
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
  }, [region, lado, isRecording, isMockMode, landmarksPersonalizados, modoSeleccionActivo, hoveredLandmark, zoom]);

  // ─── Mock mode rendering ───────────────────────────────────────────────────
  const drawMockLandmarks = (
    ctxLive: CanvasRenderingContext2D,
    ctxMesh: CanvasRenderingContext2D,
    width: number,
    height: number,
    timestamp: number
  ) => {
    const regionType = PUNTOS_MEDICION[region].tipo;

    if (regionType === 'rostro') {
      ctxLive.fillStyle = '#18181b';
      ctxLive.fillRect(0, 0, width, height);
      ctxLive.strokeStyle = '#27272a';
      ctxLive.lineWidth = 2;
      ctxLive.beginPath();
      ctxLive.arc(width / 2, height / 2, 120, 0, 2 * Math.PI);
      ctxLive.stroke();

      const t = timestamp / 1000;
      const baseFreq = 5.2;
      const tremor = Math.sin(t * baseFreq * 2 * Math.PI) * 1.5;
      const slowMove = Math.sin(t * 0.5 * 2 * Math.PI) * 10;

      let simulatedAngle = 0;
      if (region === 'BOCA') {
        simulatedAngle = 120 + slowMove + tremor;
      } else if (region === 'PARPADO') {
        const blink = Math.sin(t * 0.25 * 2 * Math.PI) > 0.8 ? 5 : 28;
        simulatedAngle = blink + tremor;
      } else if (region === 'CEJA') {
        simulatedAngle = 150 - (slowMove / 2) + tremor;
      } else {
        simulatedAngle = 90 + tremor;
      }

      const cx = width / 2;
      const cy = height / 2;
      let pts: Point[] = [];

      if (region === 'BOCA') {
        pts = [
          { x: cx - 40, y: cy + 40 },
          { x: cx, y: cy + 50 + (simulatedAngle - 120) / 3 },
          { x: cx + 40, y: cy + 40 }
        ];
      } else if (region === 'PARPADO') {
        pts = [
          { x: cx - 40, y: cy - 30 },
          { x: cx - 20, y: cy - 35 - (simulatedAngle / 3) },
          { x: cx, y: cy - 30 }
        ];
      } else {
        pts = [
          { x: cx - 50, y: cy - 60 },
          { x: cx - 25, y: cy - 70 - (simulatedAngle / 10) },
          { x: cx, y: cy - 60 }
        ];
      }

      if (lado === 'DERECHA') {
        pts = pts.map(p => ({ x: p.x + 35, y: p.y }));
      } else {
        pts = pts.map(p => ({ x: p.x - 35, y: p.y }));
      }

      [ctxLive, ctxMesh].forEach(ctx => {
        ctx.fillStyle = 'rgba(99, 102, 241, 0.35)';
        for (let i = 0; i < 30; i++) {
          const angle = (i / 30) * 2 * Math.PI;
          const x = cx + Math.cos(angle) * 80;
          const y = cy + Math.sin(angle) * 80;
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, 2 * Math.PI);
          ctx.fill();
        }
      });

      drawAngleOverlays(ctxLive, ctxMesh, pts, !!landmarksPersonalizados);

      if (isRecording && startTimeRef.current !== null) {
        const elapsed = (performance.now() - startTimeRef.current) / 1000;
        recordingDataRef.current.push({ tiempo: elapsed, angulo: simulatedAngle });
      }
    } else {
      // Body mock
      ctxLive.fillStyle = '#18181b';
      ctxLive.fillRect(0, 0, width, height);

      const t = timestamp / 1000;
      const baseFreq = 5.2;
      const tremor = Math.sin(t * baseFreq * 2 * Math.PI) * 1.8;
      const slowMove = Math.sin(t * 0.4 * 2 * Math.PI) * 15;

      let simulatedAngle = 0;
      if (region === 'CODO') {
        simulatedAngle = 90 + slowMove + tremor;
      } else if (region === 'MUÑECA') {
        simulatedAngle = 160 + slowMove / 2 + tremor * 2;
      } else if (region === 'HOMBRO') {
        simulatedAngle = 10 + Math.sin(t * 0.2 * 2 * Math.PI) * 4 + tremor / 3;
      }

      const cx = width / 2;
      const cy = height / 2 - 20;

      const head = { x: cx, y: cy - 70 };
      const neck = { x: cx, y: cy - 40 };
      const leftShoulder = { x: cx - 60, y: cy - 30 };
      const rightShoulder = { x: cx + 60, y: cy - 30 };
      const leftHip = { x: cx - 40, y: cy + 90 };
      const rightHip = { x: cx + 40, y: cy + 90 };

      let lElbow = { x: cx - 90, y: cy + 20 };
      let lWrist = { x: cx - 110, y: cy + 70 };
      let rElbow = { x: cx + 90, y: cy + 20 };
      let rWrist = { x: cx + 110, y: cy + 70 };

      if (region === 'CODO') {
        const angleRad = (simulatedAngle * Math.PI) / 180;
        if (lado === 'IZQUIERDA') {
          lElbow = { x: leftShoulder.x - Math.cos(angleRad - 0.5) * 60, y: leftShoulder.y + Math.sin(angleRad - 0.5) * 60 };
          lWrist = { x: lElbow.x - Math.cos(angleRad + 0.2) * 50, y: lElbow.y + Math.sin(angleRad + 0.2) * 50 };
        } else {
          rElbow = { x: rightShoulder.x + Math.cos(angleRad - 0.5) * 60, y: rightShoulder.y + Math.sin(angleRad - 0.5) * 60 };
          rWrist = { x: rElbow.x + Math.cos(angleRad + 0.2) * 50, y: rElbow.y + Math.sin(angleRad + 0.2) * 50 };
        }
      } else if (region === 'MUÑECA') {
        const angleRad = (simulatedAngle * Math.PI) / 180;
        if (lado === 'IZQUIERDA') {
          lWrist = { x: lElbow.x - 40, y: lElbow.y + Math.sin(angleRad) * 40 };
        } else {
          rWrist = { x: rElbow.x + 40, y: rElbow.y + Math.sin(angleRad) * 40 };
        }
      } else if (region === 'HOMBRO') {
        const tilt = (simulatedAngle * Math.PI) / 180;
        leftShoulder.y = cy - 30 - Math.sin(tilt) * 20;
        rightShoulder.y = cy - 30 + Math.sin(tilt) * 20;
      }

      [ctxLive, ctxMesh].forEach(ctx => {
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.25)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(head.x, head.y, 18, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(neck.x, neck.y);
        ctx.lineTo(cx, cy + 90);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(leftShoulder.x, leftShoulder.y);
        ctx.lineTo(rightShoulder.x, rightShoulder.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(leftHip.x, leftHip.y);
        ctx.lineTo(rightHip.x, rightHip.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(leftShoulder.x, leftShoulder.y);
        ctx.lineTo(lElbow.x, lElbow.y);
        ctx.lineTo(lWrist.x, lWrist.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(rightShoulder.x, rightShoulder.y);
        ctx.lineTo(rElbow.x, rElbow.y);
        ctx.lineTo(rWrist.x, rWrist.y);
        ctx.stroke();

        ctx.fillStyle = 'rgba(99, 102, 241, 0.55)';
        [leftShoulder, rightShoulder, lElbow, rElbow, lWrist, rWrist, leftHip, rightHip].forEach(p => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
          ctx.fill();
        });
      });

      let pts: Point[] = [];
      if (region === 'CODO') {
        pts = lado === 'IZQUIERDA' ? [leftShoulder, lElbow, lWrist] : [rightShoulder, rElbow, rWrist];
      } else if (region === 'MUÑECA') {
        const lHandTip = { x: lWrist.x - 15, y: lWrist.y + 10 };
        const rHandTip = { x: rWrist.x + 15, y: rWrist.y + 10 };
        pts = lado === 'IZQUIERDA' ? [lElbow, lWrist, lHandTip] : [rElbow, rWrist, rHandTip];
      } else if (region === 'HOMBRO') {
        pts = lado === 'IZQUIERDA' ? [rightShoulder, leftShoulder, leftHip] : [leftShoulder, rightShoulder, rightHip];
      }

      drawAngleOverlays(ctxLive, ctxMesh, pts, !!landmarksPersonalizados);

      if (isRecording && startTimeRef.current !== null) {
        const elapsed = (performance.now() - startTimeRef.current) / 1000;
        recordingDataRef.current.push({ tiempo: elapsed, angulo: simulatedAngle });
      }
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      {loading && (
        <div className="flex flex-col items-center justify-center p-8 bg-zinc-900 border border-zinc-800 rounded-xl h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-500 mb-4" />
          <p className="text-zinc-400 text-sm">Cargando MediaPipe WASM e inicializando modelos...</p>
        </div>
      )}

      {errorMsg && (
        <div className="flex flex-col items-center justify-center p-8 bg-red-950/20 border border-red-900/50 rounded-xl text-center h-96">
          <p className="text-red-400 font-semibold mb-2">Error de Inicialización</p>
          <p className="text-zinc-400 text-sm max-w-md">{errorMsg}</p>
        </div>
      )}

      <video ref={videoRef} className="hidden" width="640" height="480" playsInline muted />

      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${loading || errorMsg ? 'hidden' : ''}`}>
        {/* Live Camera Canvas */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-semibold text-zinc-400">VISTA CÁMARA</span>
            <div className="flex items-center gap-2">
              {modoSeleccionActivo && !isMockMode && (
                <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-950/40 text-amber-400 border border-amber-800/40 rounded animate-pulse">
                  ✦ MODO SELECCIÓN
                </span>
              )}
              <span className="text-[10px] font-mono px-2 py-0.5 bg-zinc-800 rounded text-emerald-400">
                FPS: {fps}
              </span>
            </div>
          </div>
          <div
            className={`aspect-[4/3] bg-zinc-900 border rounded-xl overflow-hidden shadow-inner relative ${
              modoSeleccionActivo && !isMockMode
                ? 'border-amber-700/60 ring-1 ring-amber-600/30'
                : 'border-zinc-800'
            }`}
          >
            <canvas
              ref={liveCanvasRef}
              width="640"
              height="480"
              className={`w-full h-full object-cover scale-x-[-1] ${
                modoSeleccionActivo && !isMockMode ? 'cursor-crosshair' : ''
              }`}
              onMouseMove={handleCanvasMouseMove}
              onClick={handleCanvasClick}
            />
            {/* Viewfinder corners */}
            <div className="viewfinder-overlay">
              <div className="absolute top-4 left-4 w-3.5 h-3.5 border-t-2 border-l-2 border-emerald-500/50" />
              <div className="absolute top-4 right-4 w-3.5 h-3.5 border-t-2 border-r-2 border-emerald-500/50" />
              <div className="absolute bottom-4 left-4 w-3.5 h-3.5 border-b-2 border-l-2 border-emerald-500/50" />
              <div className="absolute bottom-4 right-4 w-3.5 h-3.5 border-b-2 border-r-2 border-emerald-500/50" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 border border-emerald-500/20 rounded-full flex items-center justify-center">
                <div className="w-1 h-1 bg-emerald-500/30 rounded-full" />
              </div>
            </div>
            {/* Selection mode tooltip */}
            {modoSeleccionActivo && !isMockMode && hoveredLandmark >= 0 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-zinc-900/90 border border-amber-700/50 rounded px-2 py-1 text-[10px] font-mono text-amber-400">
                Landmark #{hoveredLandmark} — click para seleccionar
              </div>
            )}
          </div>
        </div>

        {/* Mesh Canvas */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-semibold text-zinc-400">VISTA MALLA BIOMÉTRICA</span>
            {isMockMode && (
              <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-950/40 text-indigo-400 border border-indigo-900/50 rounded">
                SIMULADO
              </span>
            )}
          </div>
          <div className="aspect-[4/3] bg-zinc-950 border border-zinc-850 rounded-xl overflow-hidden shadow-lg relative">
            <canvas
              ref={meshCanvasRef}
              width="640"
              height="480"
              className="w-full h-full object-cover scale-x-[-1]"
            />
            <div className="viewfinder-overlay">
              <div className="absolute top-4 left-4 w-3.5 h-3.5 border-t-2 border-l-2 border-indigo-500/50" />
              <div className="absolute top-4 right-4 w-3.5 h-3.5 border-t-2 border-r-2 border-indigo-500/50" />
              <div className="absolute bottom-4 left-4 w-3.5 h-3.5 border-b-2 border-l-2 border-indigo-500/50" />
              <div className="absolute bottom-4 right-4 w-3.5 h-3.5 border-b-2 border-r-2 border-indigo-500/50" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 border border-indigo-500/20 rounded-full flex items-center justify-center">
                <div className="w-1 h-1 bg-indigo-500/30 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

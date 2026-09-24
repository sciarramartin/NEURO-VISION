'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { PuntoMuscular, NODO_CANTO_EXTERNO_IZQ, NODO_CANTO_EXTERNO_DER } from '@/biblioteca/math/musculosFaciales';

interface LandmarkRaw { x: number; y: number; z?: number; visibility?: number; }

interface FaceLandmarkerInstance {
  detectForVideo: (video: HTMLVideoElement, timestampMs: number) => { faceLandmarks: LandmarkRaw[][] };
}

export interface MuestraMuscular { tiempo: number; valor: number }

interface UseFacialMuscleCaptureOptions {
  punto: PuntoMuscular | null;
  isRecording: boolean;
  isMockMode: boolean;
  onDataCollected: (data: MuestraMuscular[]) => void;
}

/**
 * Hook de captura dedicado al Análisis Facial por músculo. Es intencionalmente
 * independiente de `useMediaPipe` (que impulsa /capture): en vez de reducir
 * el movimiento a un ángulo de 3 puntos, sigue el desplazamiento vertical de
 * los nodos exactos del músculo elegido y lo normaliza por la distancia
 * interocular (nodos 226/446), para obtener una "amplitud relativa" de
 * contracción independiente de cuán cerca esté el paciente de la cámara.
 * Mantenerlo separado evita tocar el motor ya probado de /capture.
 */
export function useFacialMuscleCapture({ punto, isRecording, isMockMode, onDataCollected }: UseFacialMuscleCaptureOptions) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const faceLandmarkerRef = useRef<FaceLandmarkerInstance | null>(null);
  const animRef = useRef<number | null>(null);
  const recordingRef = useRef<MuestraMuscular[]>([]);
  const startTimeRef = useRef<number | null>(null);

  const onDataRef = useRef(onDataCollected);
  useEffect(() => { onDataRef.current = onDataCollected; }, [onDataCollected]);

  const stopStreams = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startWebcam = useCallback(async () => {
    try {
      stopStreams();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, frameRate: { ideal: 30 } }, audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setErrorMsg('Permiso de cámara denegado o no disponible.');
    }
  }, [stopStreams]);

  // Ciclo de grabación
  useEffect(() => {
    if (isRecording) {
      recordingRef.current = [];
      startTimeRef.current = performance.now();
    } else if (recordingRef.current.length > 0) {
      onDataRef.current([...recordingRef.current]);
    }
  }, [isRecording]);

  // Carga del modelo (se omite en modo simulador)
  useEffect(() => {
    let activo = true;
    async function init() {
      if (isMockMode) { setLoading(false); return; }
      try {
        setLoading(true);
        setErrorMsg(null);
        const vision = await import('@mediapipe/tasks-vision');
        const filesetResolver = await vision.FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'
        );
        const landmarker = await vision.FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          outputFaceBlendshapes: false
        });
        if (!activo) return;
        faceLandmarkerRef.current = landmarker;
        setLoading(false);
        if (!streamRef.current) await startWebcam();
      } catch (err) {
        if (activo) {
          const mensaje = err instanceof Error ? err.message : String(err);
          setErrorMsg('No se pudo inicializar la cámara o MediaPipe: ' + mensaje);
          setLoading(false);
        }
      }
    }
    init();
    return () => { activo = false; };
  }, [isMockMode, startWebcam]);

  useEffect(() => () => { stopStreams(); }, [stopStreams]);

  // Bucle de renderizado + tracking
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isMockMode) {
        // Curva sintética relajación -> contracción máxima -> leve relajación,
        // consistente con el "Modo Simulador" del resto de la app.
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#80868B';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Modo simulador — sin cámara', canvas.width / 2, canvas.height / 2);

        if (isRecording && startTimeRef.current !== null) {
          const t = (performance.now() - startTimeRef.current) / 1000;
          const fase = Math.min(1, t / 6);
          const valor = Math.sin(fase * Math.PI * 0.5) * 8 + Math.sin(t * 9) * 0.4;
          recordingRef.current.push({ tiempo: t, valor });
        }
      } else if (video && video.readyState >= 2 && faceLandmarkerRef.current) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const now = performance.now();
        const results = faceLandmarkerRef.current.detectForVideo(video, now);
        if (results?.faceLandmarks?.length > 0) {
          const landmarks: LandmarkRaw[] = results.faceLandmarks[0];

          const toXY = (lm: LandmarkRaw) => ({ x: lm.x * canvas.width, y: lm.y * canvas.height });

          // Malla tenue de referencia
          ctx.fillStyle = 'rgba(232, 234, 237, 0.25)';
          landmarks.forEach(lm => {
            const { x, y } = toXY(lm);
            ctx.beginPath(); ctx.arc(x, y, 1, 0, 2 * Math.PI); ctx.fill();
          });

          if (punto) {
            const puntosActivos = punto.nodos.map(i => landmarks[i]).filter(Boolean);
            ctx.fillStyle = '#10B981';
            puntosActivos.forEach(lm => {
              const { x, y } = toXY(lm);
              ctx.beginPath(); ctx.arc(x, y, 5, 0, 2 * Math.PI); ctx.fill();
            });

            const ojoIzq = landmarks[NODO_CANTO_EXTERNO_IZQ];
            const ojoDer = landmarks[NODO_CANTO_EXTERNO_DER];

            if (puntosActivos.length > 0 && ojoIzq && ojoDer) {
              const interocular = Math.hypot((ojoIzq.x - ojoDer.x) * canvas.width, (ojoIzq.y - ojoDer.y) * canvas.height) || 1;
              const avgY = puntosActivos.reduce((s, lm) => s + lm.y * canvas.height, 0) / puntosActivos.length;
              const valorNormalizado = (avgY / interocular) * 100;

              if (isRecording && startTimeRef.current !== null) {
                const elapsed = (now - startTimeRef.current) / 1000;
                recordingRef.current.push({ tiempo: elapsed, valor: valorNormalizado });
              }
            }
          }
        }
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [isMockMode, isRecording, punto]);

  return { videoRef, canvasRef, loading, errorMsg, startWebcam };
}

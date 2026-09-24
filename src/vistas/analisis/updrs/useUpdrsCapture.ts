'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Muestra } from '@/biblioteca/math/ritmoMotor';
import type { LadoUpdrs } from '@/biblioteca/math/updrs';
import type { ConfigTarea, ModeloVision, Punto } from './tareasCamara';

interface LandmarkRaw { x: number; y: number; z?: number; visibility?: number }
interface Categoria { categoryName: string; score: number }

interface Detector {
  detectForVideo: (video: HTMLVideoElement, ts: number) => {
    landmarks: LandmarkRaw[][];
    handedness?: Categoria[][];
  };
}

const WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm';
const MODELOS: Record<ModeloVision, string> = {
  MANO: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
  POSE: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task',
};

/**
 * Los detectores se cachean a nivel de módulo: durante una UPDRS se pasa
 * de un ítem a otro muchas veces y recargar el modelo (varios MB + WASM)
 * cada vez haría la evaluación lenta.
 */
const cacheDetectores: Partial<Record<ModeloVision, Promise<Detector>>> = {};

function obtenerDetector(modelo: ModeloVision): Promise<Detector> {
  if (!cacheDetectores[modelo]) {
    cacheDetectores[modelo] = (async () => {
      const vision = await import('@mediapipe/tasks-vision');
      const fs = await vision.FilesetResolver.forVisionTasks(WASM);
      const baseOptions = { modelAssetPath: MODELOS[modelo], delegate: 'GPU' as const };
      if (modelo === 'MANO') {
        return (await vision.HandLandmarker.createFromOptions(fs, { baseOptions, runningMode: 'VIDEO', numHands: 2 })) as unknown as Detector;
      }
      return (await vision.PoseLandmarker.createFromOptions(fs, { baseOptions, runningMode: 'VIDEO', numPoses: 1 })) as unknown as Detector;
    })().catch(err => { delete cacheDetectores[modelo]; throw err; });
  }
  return cacheDetectores[modelo]!;
}

/**
 * Elige la mano del lado evaluado. MediaPipe Hands etiqueta la lateralidad
 * asumiendo imagen ESPEJADA (selfie); como aquí el video se procesa sin
 * espejar, la etiqueta "Left" corresponde a la mano DERECHA del paciente.
 * Si sólo hay una mano en cuadro (lo que pide el instructivo) se usa esa,
 * aunque la clasificación de lateralidad falle.
 */
function elegirMano(res: { landmarks: LandmarkRaw[][]; handedness?: Categoria[][] }, lado: LadoUpdrs): LandmarkRaw[] | null {
  const manos = res.landmarks ?? [];
  if (manos.length === 0) return null;
  if (manos.length === 1) return manos[0];
  const buscada = lado === 'DERECHA' ? 'Left' : 'Right';
  const i = (res.handedness ?? []).findIndex(h => h[0]?.categoryName === buscada);
  return i >= 0 ? manos[i] : null;
}

const CONEXIONES_MANO: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [0, 17], [17, 18], [18, 19], [19, 20],
];
const CONEXIONES_POSE: [number, number][] = [
  [11, 12], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [27, 29], [29, 31], [27, 31],
  [24, 26], [26, 28], [28, 30], [30, 32], [28, 32], [11, 13], [13, 15], [12, 14], [14, 16],
];

interface Opciones {
  tarea: ConfigTarea;
  lado: LadoUpdrs;
  isRecording: boolean;
  isMockMode: boolean;
  onDataCollected: (m: Muestra[]) => void;
}

export function useUpdrsCapture({ tarea, lado, isRecording, isMockMode, onDataCollected }: Opciones) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [detectado, setDetectado] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<Detector | null>(null);
  const muestrasRef = useRef<Muestra[]>([]);
  const inicioRef = useRef<number | null>(null);
  const detectadoRef = useRef(false);
  const onDataRef = useRef(onDataCollected);
  useEffect(() => { onDataRef.current = onDataCollected; }, [onDataCollected]);

  const detenerCamara = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const iniciarCamara = useCallback(async () => {
    if (streamRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, frameRate: { ideal: 30 } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play().catch(() => {}); }
    } catch {
      setErrorMsg('Permiso de cámara denegado o no disponible.');
    }
  }, []);

  // Inicio / fin de grabación
  useEffect(() => {
    if (isRecording) {
      muestrasRef.current = [];
      inicioRef.current = performance.now();
    } else if (inicioRef.current !== null) {
      inicioRef.current = null;
      onDataRef.current([...muestrasRef.current]);
    }
  }, [isRecording]);

  // Carga del modelo + cámara
  useEffect(() => {
    let activo = true;
    (async () => {
      if (isMockMode) { detenerCamara(); setLoading(false); setErrorMsg(null); return; }
      setLoading(true); setErrorMsg(null);
      try {
        const det = await obtenerDetector(tarea.modelo);
        if (!activo) return;
        detectorRef.current = det;
        await iniciarCamara();
        if (activo) setLoading(false);
      } catch (err) {
        if (activo) {
          setErrorMsg('No se pudo inicializar MediaPipe: ' + (err instanceof Error ? err.message : String(err)));
          setLoading(false);
        }
      }
    })();
    return () => { activo = false; };
  }, [isMockMode, tarea.modelo, iniciarCamara, detenerCamara]);

  useEffect(() => () => detenerCamara(), [detenerCamara]);

  // Indicador "detectado" throttled (evita re-render en cada cuadro)
  useEffect(() => {
    const id = setInterval(() => setDetectado(detectadoRef.current), 400);
    return () => clearInterval(id);
  }, []);

  // Bucle de render + tracking
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    let ultimoTs = 0;
    const conexiones = tarea.modelo === 'MANO' ? CONEXIONES_MANO : CONEXIONES_POSE;
    const resaltados = new Set(tarea.nodos(lado));

    const registrar = (ahora: number, m: Omit<Muestra, 't'> | null) => {
      if (m && inicioRef.current !== null) muestrasRef.current.push({ t: (ahora - inicioRef.current) / 1000, ...m });
    };

    const loop = () => {
      const W = canvas.width, H = canvas.height;
      const ahora = performance.now();
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, W, H);

      if (isMockMode) {
        ctx.fillStyle = '#80868B';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Modo simulador — sin cámara', W / 2, H / 2);
        detectadoRef.current = true;
        if (inicioRef.current !== null) registrar(ahora, tarea.simular((ahora - inicioRef.current) / 1000));
      } else {
        const video = videoRef.current;
        const det = detectorRef.current;
        if (video && det && video.readyState >= 2) {
          ctx.drawImage(video, 0, 0, W, H);
          const ts = Math.max(ahora, ultimoTs + 1); // timestamps estrictamente crecientes
          ultimoTs = ts;
          let lmRaw: LandmarkRaw[] | null = null;
          try {
            const res = det.detectForVideo(video, ts);
            lmRaw = tarea.modelo === 'MANO' ? elegirMano(res, lado) : (res.landmarks?.[0] ?? null);
          } catch { lmRaw = null; }

          if (lmRaw) {
            const lm: Punto[] = lmRaw.map(p => ({ x: p.x * W, y: p.y * H }));
            // Esqueleto tenue
            ctx.strokeStyle = 'rgba(255,255,255,0.35)';
            ctx.lineWidth = 1.5;
            for (const [a, b] of conexiones) {
              if (!lm[a] || !lm[b]) continue;
              ctx.beginPath(); ctx.moveTo(lm[a].x, lm[a].y); ctx.lineTo(lm[b].x, lm[b].y); ctx.stroke();
            }
            // Nodos de la tarea
            ctx.fillStyle = '#10B981';
            resaltados.forEach(i => { if (lm[i]) { ctx.beginPath(); ctx.arc(lm[i].x, lm[i].y, 5, 0, 2 * Math.PI); ctx.fill(); } });

            const visiblesOk = tarea.modelo === 'MANO' || tarea.nodos(lado).every(i => (lmRaw![i]?.visibility ?? 1) > 0.5);
            const muestra = visiblesOk ? tarea.extraer(lm, lado) : null;
            detectadoRef.current = !!muestra;
            registrar(ahora, muestra);
          } else {
            detectadoRef.current = false;
          }
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tarea, lado, isMockMode]);

  return { videoRef, canvasRef, loading, errorMsg, detectado };
}

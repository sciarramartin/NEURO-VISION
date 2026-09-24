'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, RotateCcw, Square } from 'lucide-react';
import { CapturaTimerRing } from '../CapturaTimerRing';
import { useCountdown7s } from '../useCountdown7s';
import { reproducirTono } from '@/biblioteca/audio';
import { useVisionCapture, ModeloVision, Lado, Punto, LandmarkRaw } from './useVisionCapture';

export interface FaseGuiada {
  /** Segundo (desde el inicio) en que termina esta fase. */
  hastaS: number;
  texto: string;
}

export interface CapturaGuiadaProps<T extends object> {
  titulo: string;
  modelo: ModeloVision;
  lado?: Lado;
  duracionMs: number;
  nodos: number[];
  extraer: (lm: Punto[], raw: LandmarkRaw[]) => T | null;
  simular: (t: number) => T;
  /** Consigna fija durante la grabación. */
  consigna?: string;
  /** Consignas secuenciales (con un tono en cada cambio), p. ej. reposo → pico → cejas → sonrisa. */
  fases?: FaseGuiada[];
  /** Permite terminar antes (marcha). */
  permitirDetener?: boolean;
  isMockMode: boolean;
  setIsMockMode: React.Dispatch<React.SetStateAction<boolean>>;
  /** Recibe las muestras; devuelve un mensaje de error o null si se pudo analizar. */
  onData: (m: (T & { t: number })[]) => string | null;
  /** Contenido extra bajo el video (p. ej. accesos rápidos). */
  pie?: React.ReactNode;
}

/**
 * Paso de captura estándar de los módulos guiados: video con overlay,
 * indicador de detección, anillo de cuenta regresiva con tonos y consigna.
 * Es un componente propio (se monta sólo en la fase de captura) para que
 * la cámara arranque con el <canvas> ya montado y se libere al salir.
 */
export function CapturaGuiada<T extends object>(p: CapturaGuiadaProps<T>) {
  const { titulo, modelo, lado = 'DERECHA', duracionMs, nodos, extraer, simular, consigna, fases, permitirDetener, isMockMode, setIsMockMode, onData, pie } = p;
  const [isRecording, setIsRecording] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const recibir = useCallback((m: (T & { t: number })[]) => setAviso(onData(m)), [onData]);
  const { videoRef, canvasRef, loading, errorMsg, detectado } = useVisionCapture<T>({
    modelo, lado, isRecording, isMockMode, extraer, simular, nodos, onDataCollected: recibir,
  });

  const countdown = useCountdown7s({
    duracionMs,
    onIniciar: () => { setAviso(null); setIsRecording(true); },
    onFinalizar: () => setIsRecording(false),
  });

  // Consigna secuencial: índice de la fase actual según el tiempo transcurrido.
  const transcurrido = (duracionMs / 1000) * countdown.progreso;
  const idxFase = fases ? Math.max(0, fases.findIndex(f => transcurrido < f.hastaS)) : -1;
  const faseAnterior = useRef(-1);
  useEffect(() => {
    if (countdown.fase !== 'grabando') { faseAnterior.current = -1; return; }
    if (fases && idxFase > 0 && idxFase !== faseAnterior.current) reproducirTono(660, 120);
    faseAnterior.current = idxFase;
  }, [idxFase, countdown.fase, fases]);

  const textoGrabando = fases ? fases[idxFase]?.texto : consigna;

  return (
    <div className="card" style={{ gap: 20 }}>
      <div className="section-header">Captura — {titulo}</div>

      <button type="button" className="btn btn-secondary" style={{ alignSelf: 'flex-start', fontSize: 11 }}
        disabled={countdown.fase === 'grabando'} onClick={() => { setIsMockMode(m => !m); countdown.reiniciar(); }}>
        {isMockMode ? 'Usando modo simulador' : 'Usando cámara real'}
      </button>

      <div className="updrs-video">
        <video ref={videoRef} className="absolute pointer-events-none opacity-0" style={{ top: -9999, left: -9999, width: 640, height: 480 }} playsInline muted />
        <canvas ref={canvasRef} width={640} height={480} className="absolute inset-0 w-full h-full object-cover" />
        {loading && <div className="updrs-video-overlay">Cargando modelo de {modelo === 'MANO' ? 'manos' : modelo === 'CARA' ? 'rostro' : 'pose'}…</div>}
        {errorMsg && <div className="updrs-video-overlay" style={{ color: 'var(--danger)' }}>{errorMsg}</div>}
        {!loading && !errorMsg && (
          <span className={`updrs-deteccion ${detectado ? 'ok' : ''}`}>{detectado ? 'Detectado' : 'Buscando…'}</span>
        )}
        {countdown.fase === 'grabando' && fases && textoGrabando && (
          <div className="captura-consigna" key={idxFase}>{textoGrabando}</div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
        <CapturaTimerRing fase={countdown.fase} segundos={countdown.segundos} progreso={countdown.progreso} total={Math.round(duracionMs / 1000)} />
        {countdown.fase === 'lista' && (
          <button type="button" onClick={countdown.iniciar} className="btn btn-primary" style={{ padding: '10px 20px' }}
            disabled={loading || !!errorMsg}>
            <Camera size={14} /> Iniciar ({Math.round(duracionMs / 1000)}s)
          </button>
        )}
        {countdown.fase === 'grabando' && !fases && <span className="captura-fase-badge grabando">{consigna}</span>}
        {countdown.fase === 'grabando' && permitirDetener && (
          <button type="button" className="btn btn-outline" onClick={countdown.detener}><Square size={12} /> Detener</button>
        )}
        {countdown.fase === 'finalizada' && !aviso && <span className="captura-fase-badge listo">Analizando…</span>}
        {countdown.fase === 'finalizada' && aviso && (
          <button type="button" className="btn btn-outline" onClick={() => { setAviso(null); countdown.reiniciar(); }}>
            <RotateCcw size={13} /> Reintentar
          </button>
        )}
      </div>

      {aviso && <div className="warning-banner">{aviso}</div>}
      {pie}
    </div>
  );
}

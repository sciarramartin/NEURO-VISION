'use client';

import React from 'react';
import { useMediaPipe } from './hooks/useMediaPipe';
import { RegionKey, LadoKey, CalidadTracking } from '@/biblioteca/math/angles';

interface WebcamCaptureProps {
  region: RegionKey;
  lado: LadoKey;
  isRecording: boolean;
  isMockMode: boolean;
  landmarksPersonalizados: [number, number, number] | null;
  modoSeleccionActivo: boolean;
  zoom?: number;
  onDataCollected: (data: { tiempo: number; angulo: number }[]) => void;
  onTrackingQuality?: (quality: CalidadTracking) => void;
  onLandmarkClick?: (index: number) => void;
}

/**
 * Composite / Presenter Pattern: Componente visual puro para la rejilla de los Canvas de Webcam.
 * Delegando todo el procesamiento del hardware y detección en el hook `useMediaPipe`.
 * 
 * Corrección Crítica Vercel: Se posiciona el elemento <video> de forma invisible pero activa a 640x480
 * en el DOM off-screen, evitando que Chrome congele las texturas (solución a bug de resultados vacíos).
 */
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
  const {
    videoRef,
    liveCanvasRef,
    meshCanvasRef,
    loading,
    errorMsg,
    fps,
    handleCanvasMouseMove,
    handleCanvasClick
  } = useMediaPipe({
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
  });

  return (
    <div className="flex flex-col gap-4 w-full">
      {loading && (
        <div className="flex flex-col items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl h-[420px] transition-all">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-500 mb-4" />
          <p className="text-zinc-550 dark:text-zinc-400 text-sm font-semibold">Cargando MediaPipe WASM e inicializando modelos...</p>
        </div>
      )}

      {errorMsg && (
        <div className="flex flex-col items-center justify-center p-8 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl text-center h-[420px] transition-all">
          <p className="text-red-600 dark:text-red-400 font-bold mb-2">Error de Inicialización</p>
          <p className="text-zinc-650 dark:text-zinc-400 text-sm max-w-md">{errorMsg}</p>
        </div>
      )}

      {/* 
        Video invisible pero activo en dimensiones lógicas óptimas (640x480).
        Esto previene que los navegadores desactiven el stream y dejen la cámara en 0x0.
      */}
      <video
        ref={videoRef}
        className="absolute pointer-events-none opacity-0"
        style={{ top: '-9999px', left: '-9999px', width: '640px', height: '480px' }}
        playsInline
        muted
      />

      <div className={`grid grid-cols-1 md:grid-cols-2 gap-5 w-full ${loading || errorMsg ? 'hidden' : ''}`}>
        {/* Live Camera Canvas */}
        <div className="flex flex-col gap-2 w-full">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold text-zinc-550 dark:text-zinc-400 tracking-wide uppercase">VISTA CÁMARA</span>
            <div className="flex items-center gap-2">
              {modoSeleccionActivo && !isMockMode && (
                <span className="text-[10px] bg-amber-100 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded font-mono font-bold leading-none animate-pulse">
                  Ajuste Fino Activo
                </span>
              )}
              <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-450 font-bold">FPS: {fps}</span>
            </div>
          </div>
          <div className="relative w-full aspect-video bg-zinc-950 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-md">
            <canvas
              ref={liveCanvasRef}
              className="absolute inset-0 w-full h-full object-cover cursor-crosshair"
              width="640"
              height="480"
              onMouseMove={handleCanvasMouseMove}
              onClick={handleCanvasClick}
            />
          </div>
        </div>

        {/* Mesh Visualizer Canvas */}
        <div className="flex flex-col gap-2 w-full">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold text-zinc-550 dark:text-zinc-400 tracking-wide uppercase">VISTA MALLA BIOMÉTRICA</span>
            {isMockMode && (
              <span className="text-[10px] bg-amber-100 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded font-mono font-bold leading-none">
                Simulado
              </span>
            )}
          </div>
          <div className="relative w-full aspect-video bg-zinc-950 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-md">
            <canvas
              ref={meshCanvasRef}
              className="absolute inset-0 w-full h-full object-cover"
              width="640"
              height="480"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

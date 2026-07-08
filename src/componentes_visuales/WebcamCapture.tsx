'use client';

import React from 'react';
import { useMediaPipe } from './hooks/useMediaPipe';
import { RegionKey, LadoKey, CalidadTracking } from '@/biblioteca/math/angles';
import { Camera, Activity } from 'lucide-react';

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

export default function WebcamCapture({
  region, lado, isRecording, isMockMode,
  landmarksPersonalizados, modoSeleccionActivo, zoom = 1,
  onDataCollected, onTrackingQuality, onLandmarkClick
}: WebcamCaptureProps) {
  const {
    videoRef, liveCanvasRef, meshCanvasRef,
    loading, errorMsg, fps,
    handleCanvasMouseMove, handleCanvasClick
  } = useMediaPipe({
    region, lado, isRecording, isMockMode,
    landmarksPersonalizados, modoSeleccionActivo, zoom,
    onDataCollected, onTrackingQuality, onLandmarkClick
  });

  return (
    <div className="flex flex-col gap-4 w-full">
      {loading && (
        <div className="flex flex-col items-center justify-center p-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-md)', height: 420 }}>
          <div className="animate-spin rounded-full h-10 w-10 border-t-2" style={{ borderColor: 'var(--accent)', marginBottom: 16 }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>Cargando MediaPipe WASM...</p>
        </div>
      )}

      {errorMsg && (
        <div className="flex flex-col items-center justify-center p-8" style={{ background: 'var(--danger-dim)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-md)', height: 420, textAlign: 'center' }}>
          <p style={{ color: 'var(--danger)', fontWeight: 700, marginBottom: 8 }}>Error de Inicialización</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{errorMsg}</p>
        </div>
      )}

      <video ref={videoRef} className="absolute pointer-events-none opacity-0" style={{ top: '-9999px', left: '-9999px', width: '640px', height: '480px' }} playsInline muted />

      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 w-full ${loading || errorMsg ? 'hidden' : ''}`}>
        <div className="flex flex-col gap-2 w-full">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 2px' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)' }}>
              VISTA CÁMARA
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {modoSeleccionActivo && !isMockMode && (
                <span style={{ fontSize: 9, background: 'var(--accent-dim)', color: 'var(--accent)', padding: '2px 6px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  Ajuste Activo
                </span>
              )}
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontWeight: 700 }}>FPS: {fps}</span>
            </div>
          </div>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-card)' }}>
            <div className="viewfinder-frame">
              <div className="viewfinder-corner tl" />
              <div className="viewfinder-corner tr" />
              <div className="viewfinder-corner bl" />
              <div className="viewfinder-corner br" />
            </div>
            <canvas
              ref={liveCanvasRef}
              className="absolute inset-0 w-full h-full object-cover cursor-crosshair"
              width="640" height="480"
              onMouseMove={handleCanvasMouseMove}
              onClick={handleCanvasClick}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 2px' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)' }}>
              MALLA BIOMÉTRICA
            </span>
            {isMockMode && (
              <span style={{ fontSize: 9, background: 'var(--accent-dim)', color: 'var(--accent)', padding: '2px 6px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                Simulado
              </span>
            )}
          </div>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-card)' }}>
            <canvas
              ref={meshCanvasRef}
              className="absolute inset-0 w-full h-full object-cover"
              width="640" height="480"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

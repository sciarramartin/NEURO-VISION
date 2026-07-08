'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRecordingState } from './hooks/useRecordingState';
import { useCaptureData } from './hooks/useCaptureData';
import { RegistroClinicoForm } from './componentes/RegistroClinicoForm';
import { ResultadosCard } from './componentes/ResultadosCard';
import { NuevoPacienteModal } from './componentes/NuevoPacienteModal';

import {
  Camera, Circle, Square, Crosshair, ChevronDown, ChevronUp,
  Eye, EyeOff, RotateCcw, Info, AlertTriangle, Check,
  Activity, Zap, Save
} from 'lucide-react';
import { TooltipAyuda } from '@/componentes_visuales/TooltipAyuda';

const WebcamCapture = dynamic(() => import('@/componentes_visuales/WebcamCapture'), { ssr: false });

const QUALITY_CONFIG: Record<string, { bg: string; color: string; dot: string; label: string }> = {
  excelente: { bg: '#0A2E1A', color: '#10B981', dot: '#10B981', label: 'Tracking: Excelente' },
  degradado: { bg: '#2E1A0A', color: '#F59E0B', dot: '#F59E0B', label: 'Tracking: Degradado' },
  perdido: { bg: '#2E0A0A', color: '#EF4444', dot: '#EF4444', label: 'Oclusión/Pérdida' }
};

const SLOT_LABELS = ['P1 (Origen)', 'Vértice (Ángulo)', 'P3 (Destino)'];

export function CaptureView() {
  const {
    modo, setModo, region, handleRegionChange, lado, setLado,
    isMockMode, setIsMockMode, isCameraActive, setIsCameraActive,
    zoom, setZoom, panelAjusteAbierto, setPanelAjusteAbierto,
    modoSeleccionActivo, setModoSeleccionActivo,
    slotsPersonalizados, defaultIndices, isRecording,
    timerText, startRecording, stopRecording,
    handleLandmarkClick, resetSlot, resetAllSlots,
    getCustomLandmarksArray, stopChronometer
  } = useRecordingState();

  const {
    patients, selectedPatientId, setSelectedPatientId,
    saveStatus, createPatient, saveSession, resetSaveStatus
  } = useCaptureData();

  const [calculatedMetrics, setCalculatedMetrics] = useState<any | null>(null);
  const [capturedData, setCapturedData] = useState<any[]>([]);
  const [trackingQuality, setTrackingQuality] = useState<string>('excelente');
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleDataCollected = (data: { tiempo: number; angulo: number }[]) => {
    setCapturedData(data);
    if (data.length < 2) return;

    const angles = data.map(d => d.angulo);
    const times = data.map(d => d.tiempo);
    const angMin = Math.min(...angles);
    const angMax = Math.max(...angles);
    const angAvg = angles.reduce((a, b) => a + b, 0) / angles.length;

    const velocities: number[] = [];
    for (let i = 1; i < data.length; i++) {
      const dt = data[i].tiempo - data[i - 1].tiempo;
      const da = Math.abs(data[i].angulo - data[i - 1].angulo);
      if (dt > 0) velocities.push(da / dt);
    }
    const maxVel = velocities.length > 0 ? Math.max(...velocities) : 0;

    let dominantFrequency = 0;
    let amplitude = 0;
    if (angles.length > 10) {
      let swings = 0;
      for (let i = 1; i < angles.length - 1; i++) {
        if ((angles[i] > angles[i - 1] && angles[i] > angles[i + 1]) ||
            (angles[i] < angles[i - 1] && angles[i] < angles[i + 1])) {
          swings++;
        }
      }
      const duration = times[times.length - 1] - times[0];
      const estFreq = duration > 0 ? (swings / 2) / duration : 0;
      if (estFreq > 2) {
        dominantFrequency = estFreq;
        amplitude = (angMax - angMin) / 4;
      }
    }

    setCalculatedMetrics({
      angMin: parseFloat(angMin.toFixed(1)),
      angMax: parseFloat(angMax.toFixed(1)),
      angAvg: parseFloat(angAvg.toFixed(1)),
      maxVel: parseFloat(maxVel.toFixed(1)),
      tremorFreq: dominantFrequency > 0 ? parseFloat(dominantFrequency.toFixed(1)) : 0,
      tremorAmp: amplitude > 0 ? parseFloat(amplitude.toFixed(2)) : 0
    });
  };

  const handleStartRecording = () => {
    if (!selectedPatientId) { alert('Seleccione un paciente primero.'); return; }
    setCalculatedMetrics(null);
    setCapturedData([]);
    startRecording();
  };

  const handleStopRecording = () => stopRecording();

  const handleSaveSession = async () => {
    if (!calculatedMetrics) return;
    const success = await saveSession(selectedPatientId, modo, region, lado, capturedData, calculatedMetrics);
    if (success) {
      setTimeout(() => { setCalculatedMetrics(null); setCapturedData([]); resetSaveStatus(); }, 2000);
    }
  };

  const handleDiscardRecording = () => {
    if (confirm('¿Descartar esta grabación?')) { setCalculatedMetrics(null); setCapturedData([]); }
  };

  const getTimestamp = () => {
    const n = new Date();
    return n.toLocaleDateString('es-ES') + ' ' + n.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="main-content" style={{ gap: 16, paddingBottom: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="stepper">
          <div className="stepper-step completed"><Check size={12} /> Paciente</div>
          <div className="stepper-connector" />
          <div className="stepper-step active"><Circle size={12} fill="currentColor" /> Captura</div>
          <div className="stepper-connector" />
          <div className="stepper-step">Resultados</div>
        </div>
        <div style={{ flex: 1 }} />
        {mounted && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            <Activity size={11} style={{ color: 'var(--accent)' }} />
            Sesión activa · {getTimestamp()}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full">
        <div className="lg:col-span-2 flex flex-col gap-4 w-full">
          <div className="relative w-full">
            {isCameraActive ? (
              <WebcamCapture
                region={region} lado={lado} isRecording={isRecording}
                isMockMode={isMockMode} landmarksPersonalizados={getCustomLandmarksArray()}
                modoSeleccionActivo={modoSeleccionActivo && !isRecording}
                zoom={zoom} onDataCollected={handleDataCollected}
                onTrackingQuality={setTrackingQuality}
                onLandmarkClick={handleLandmarkClick}
              />
            ) : (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 24, padding: '48px 32px',
                background: 'var(--bg-card)', border: '1px solid var(--border-card)',
                borderRadius: 'var(--radius-md)', textAlign: 'center', position: 'relative', overflow: 'hidden'
              }}>
                <div className="viewfinder-frame">
                  <div className="viewfinder-corner tl" />
                  <div className="viewfinder-corner tr" />
                  <div className="viewfinder-corner bl" />
                  <div className="viewfinder-corner br" />
                </div>
                <div className="scan-animation" style={{ top: 0 }} />

                <svg width="160" height="180" viewBox="0 0 160 180" fill="none" style={{ opacity: 0.25 }}>
                  <ellipse cx="80" cy="70" rx="55" ry="65" stroke="#10B981" strokeWidth="1" strokeDasharray="3 3" />
                  <circle cx="58" cy="62" r="3" fill="#10B981" opacity="0.7" />
                  <circle cx="102" cy="62" r="3" fill="#10B981" opacity="0.7" />
                  <circle cx="80" cy="80" r="2" fill="#10B981" opacity="0.5" />
                  <circle cx="70" cy="96" r="1.5" fill="#10B981" opacity="0.4" />
                  <circle cx="90" cy="96" r="1.5" fill="#10B981" opacity="0.4" />
                  <circle cx="80" cy="105" r="2" fill="#10B981" opacity="0.6" />
                  <circle cx="44" cy="50" r="2" fill="#10B981" opacity="0.3" />
                  <circle cx="116" cy="50" r="2" fill="#10B981" opacity="0.3" />
                  <circle cx="52" cy="44" r="1.5" fill="#10B981" opacity="0.25" />
                  <circle cx="108" cy="44" r="1.5" fill="#10B981" opacity="0.25" />
                  <circle cx="80" cy="130" r="2" fill="#10B981" opacity="0.4" />
                  <path d="M62 100 Q80 115 98 100" stroke="#10B981" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.3" />
                  <path d="M68 50 Q80 44 92 50" stroke="#10B981" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.3" />
                </svg>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 280 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Cámara inactiva</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    Active la cámara y posicione al paciente frente a la pantalla.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, fontSize: 10, color: 'var(--text-muted)', width: '100%', maxWidth: 360 }}>
                  {[
                    { icon: '💡', text: 'Iluminación uniforme' },
                    { icon: '📏', text: '40–60 cm de distancia' },
                    { icon: '🎯', text: 'Alineación horizontal' },
                  ].map(({ icon, text }) => (
                    <div key={text} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: 10, background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-card)' }}>
                      <span style={{ fontSize: 16, lineHeight: 1 }}>{icon}</span>
                      <span style={{ fontWeight: 600, fontSize: 10 }}>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isRecording && (
              <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(239,68,68,0.9)', border: '1px solid var(--danger-border)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: 6, color: '#fff', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
                <Circle size={8} fill="currentColor" className="pulse-glow" />
                <span>{timerText}</span>
              </div>
            )}

            {isCameraActive && !isMockMode && (
              <div style={{
                position: 'absolute', top: 12, left: 12,
                background: QUALITY_CONFIG[trackingQuality].bg,
                border: `1px solid ${QUALITY_CONFIG[trackingQuality].color}40`,
                padding: '5px 10px', borderRadius: 'var(--radius-sm)',
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)',
                color: QUALITY_CONFIG[trackingQuality].color,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: QUALITY_CONFIG[trackingQuality].dot, display: 'inline-block' }} />
                {QUALITY_CONFIG[trackingQuality].label}
              </div>
            )}

            {getCustomLandmarksArray() && !isRecording && (
              <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(245,158,11,0.9)', border: '1px solid var(--warning-border)', padding: '5px 10px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                <Zap size={12} />
                PUNTOS PERSONALIZADOS [{getCustomLandmarksArray()?.join(' → ')}]
              </div>
            )}

            {isCameraActive && (
              <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontWeight: 700 }}>Zoom: {zoom.toFixed(1)}x</span>
                <input type="range" min="1" max="3" step="0.1" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} style={{ width: 72, accentColor: '#10B981' }} />
                <button onClick={() => setZoom(1)} style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-sm)', padding: '2px 6px', background: 'transparent', cursor: 'pointer' }}>
                  Reset
                </button>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: '12px 16px', flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {!isCameraActive ? (
                <button onClick={() => setIsCameraActive(true)} className="btn btn-primary" style={{ fontSize: 11, padding: '7px 14px' }}>
                  <Camera size={14} /> Activar Cámara
                </button>
              ) : (
                <button onClick={() => { setIsCameraActive(false); stopRecording(); }} disabled={isRecording} className="btn btn-secondary" style={{ fontSize: 11, padding: '7px 14px' }}>
                  Apagar Cámara
                </button>
              )}

              {isCameraActive && (
                !isRecording ? (
                  <button onClick={handleStartRecording} className="btn" style={{ fontSize: 11, padding: '7px 14px', background: '#DC2626', borderColor: '#DC2626', color: '#fff' }}>
                    <Circle size={10} fill="currentColor" /> Iniciar Grabación
                  </button>
                ) : (
                  <button onClick={handleStopRecording} className="btn" style={{ fontSize: 11, padding: '7px 14px', background: 'var(--bg-elevated)', borderColor: 'var(--border-card)' }}>
                    <Square size={10} fill="currentColor" /> Detener
                  </button>
                )
              )}
            </div>

            <div style={{ flex: 1 }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Zap size={10} style={{ color: 'var(--accent)' }} />
                Modo Ejecución
              </span>
              <div className="segmented-control" style={{ width: 160 }}>
                <button onClick={() => !isRecording && setIsMockMode(true)} disabled={isRecording} className={`segmented-option ${isMockMode ? 'active-warning' : ''}`} style={{ fontSize: 10, padding: '4px 8px' }}>
                  Simulado
                </button>
                <button onClick={() => !isRecording && setIsMockMode(false)} disabled={isRecording} className={`segmented-option ${!isMockMode ? 'active' : ''}`} style={{ fontSize: 10, padding: '4px 8px' }}>
                  Cámara Real
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 flex flex-col gap-4 w-full">
          <RegistroClinicoForm
            patients={patients} selectedPatientId={selectedPatientId}
            setSelectedPatientId={setSelectedPatientId} modo={modo}
            setModo={setModo} region={region} handleRegionChange={handleRegionChange}
            lado={lado} setLado={setLado} isRecording={isRecording}
            onOpenModal={() => setIsPatientModalOpen(true)}
          />

          <div style={{ border: '1px solid var(--border-card)', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <button
              onClick={() => setPanelAjusteAbierto(!panelAjusteAbierto)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 16px', background: 'transparent', border: 'none', cursor: 'pointer',
                borderBottom: panelAjusteAbierto ? '1px solid var(--border-card)' : 'none',
                color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <Crosshair size={14} style={{ color: 'var(--accent)' }} />
                Ajuste Fino de Landmarks
                {getCustomLandmarksArray() && (
                  <span style={{ fontSize: 9, background: 'var(--accent-dim)', color: 'var(--accent)', padding: '1px 5px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    ACTIVO
                  </span>
                )}
              </span>
              {panelAjusteAbierto ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {panelAjusteAbierto && (
              <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="info-banner">
                  <Info size={13} style={{ color: 'var(--info)', flexShrink: 0, marginTop: 1 }} />
                  <span>Define manualmente qué puntos de referencia de la malla se usarán como vértices del ángulo.</span>
                </div>

                <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  Valores default <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{region}/{lado}</span>
                  <span className="chip" style={{ fontSize: 10 }}>[{defaultIndices.join(', ')}]</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border-card)' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>Modo click sobre cámara</span>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={modoSeleccionActivo}
                      onChange={() => setModoSeleccionActivo(!modoSeleccionActivo)}
                      disabled={isRecording || isMockMode}
                    />
                    <div className="toggle-track" />
                    <span className="toggle-label">{modoSeleccionActivo ? 'Activo' : 'Inactivo'}</span>
                  </label>
                </div>

                {isMockMode && (
                  <div className="warning-banner">
                    <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>Desactive el Modo Simulado (Cámara Real) y active la cámara.</span>
                  </div>
                )}

                {modoSeleccionActivo && (
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Haga click sobre los puntos en el canvas para asignar P1, Vértice y P3.
                  </p>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {SLOT_LABELS.map((label, i) => {
                    const isSet = slotsPersonalizados[i] !== null;
                    return (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '7px 10px', background: 'var(--bg-base)',
                        border: '1px solid var(--border-card)', borderRadius: 'var(--radius-sm)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', display: 'inline-block', flexShrink: 0, background: isSet ? 'var(--accent)' : 'var(--text-muted)', opacity: isSet ? 1 : 0.3 }} />
                          <span style={{ fontSize: 11, fontWeight: 600, color: isSet ? 'var(--text-primary)' : 'var(--text-muted)' }}>{label}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span className="chip" style={{ fontSize: 10 }}>{isSet ? `#${slotsPersonalizados[i]}` : '—'}</span>
                          {isSet && (
                            <button type="button" onClick={() => resetSlot(i)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, padding: 2 }}>
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button type="button" onClick={resetAllSlots} className="btn btn-outline" style={{ fontSize: 10, padding: '6px 12px', justifyContent: 'center', gap: 4 }}>
                  <RotateCcw size={11} /> Restablecer por Defectos
                </button>
              </div>
            )}
          </div>

          <ResultadosCard metrics={calculatedMetrics} saveStatus={saveStatus} onSave={handleSaveSession} onDiscard={handleDiscardRecording} />
        </div>
      </div>

      <div className="status-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>Estado: <span style={{ color: isRecording ? 'var(--danger)' : isCameraActive ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 700 }}>
            {isRecording ? 'GRABANDO' : isCameraActive ? 'CÁMARA ACTIVA' : 'INACTIVO'}
          </span></span>
          <span style={{ opacity: 0.4 }}>|</span>
          {mounted && <span>Sesión: {getTimestamp()}</span>}
          <span style={{ opacity: 0.4 }}>|</span>
          <span>Paciente: {patients.find(p => p.id === selectedPatientId)?.name || 'No seleccionado'}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" style={{ fontSize: 10, padding: '5px 12px' }}>Cancelar</button>
          <button className="btn btn-primary" style={{ fontSize: 10, padding: '5px 12px' }} onClick={handleSaveSession} disabled={!calculatedMetrics}>
            <Save size={12} /> Guardar Sesión
          </button>
        </div>
      </div>

      <NuevoPacienteModal isOpen={isPatientModalOpen} onClose={() => setIsPatientModalOpen(false)} onCreate={createPatient} />
    </div>
  );
}

export default CaptureView;

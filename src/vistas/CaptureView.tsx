'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRecordingState } from './hooks/useRecordingState';
import { useCaptureData } from './hooks/useCaptureData';
import { RegistroClinicoForm } from './componentes/RegistroClinicoForm';
import { ResultadosCard } from './componentes/ResultadosCard';
import { NuevoPacienteModal } from './componentes/NuevoPacienteModal';
import { calcularAsimetriaClinica } from '@/biblioteca/math/angles';
import { analizarCicloMarcha } from '@/biblioteca/math/gait';
import { useAccelerometer } from './hooks/useAccelerometer';

import {
  Camera, Circle, Square, Crosshair, ChevronDown, ChevronUp,
  Eye, EyeOff, RotateCcw, Info, AlertTriangle, Check,
  Activity, Zap, Save
} from 'lucide-react';
import { TooltipAyuda } from '@/componentes_visuales/TooltipAyuda';

const WebcamCapture = dynamic(() => import('@/componentes_visuales/WebcamCapture'), { ssr: false });

const QUALITY_CONFIG: Record<string, { bg: string; color: string; dot: string; label: string }> = {
  excelente: { bg: 'var(--accent-dim)', color: 'var(--accent)', dot: 'var(--accent)', label: 'Tracking: Excelente' },
  degradado: { bg: 'var(--warning-dim)', color: 'var(--warning)', dot: 'var(--warning)', label: 'Tracking: Degradado' },
  perdido: { bg: 'var(--danger-dim)', color: 'var(--danger)', dot: 'var(--danger)', label: 'Oclusión/Pérdida' }
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
  const [recordingFeedback, setRecordingFeedback] = useState<{ type: 'warning' | 'info' | 'error'; message: string } | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [alturaRealCm, setAlturaRealCm] = useState<number>(170);
  const [voltageDbs, setVoltageDbs] = useState<number>(0.0);
  const [frecuenciaDbs, setFrecuenciaDbs] = useState<number>(0);
  const [anchoPulsoDbs, setAnchoPulsoDbs] = useState<number>(0);

  const {
    isCapturing: isAccelCapturing,
    startCapture: startAccelCapture,
    stopCapture: stopAccelCapture,
    latestReading: latestAccelReading,
    capturedSamplesCount: accelSamplesCount,
    rawSeries: accelRawSeries
  } = useAccelerometer(isMockMode);

  useEffect(() => { setMounted(true); }, []);

  const handleDataCollected = (raw: { tiempo: number; angulo: number; anguloContralateral?: number }[]) => {
    // Filtrar ángulos = 0: ocurre cuando los landmarks están superpuestos
    // en pantalla (normV1=0 o normV2=0 en calcularAngulo). No es un
    // ángulo real, es un artefacto de la malla facial. Lo filtramos
    // para no contaminar ROM, promedio ni velocidad máxima.
    const data = raw.filter(d => d.angulo > 0);
    setCapturedData(data);

    if (raw.length > 0 && data.length === 0) {
      setRecordingFeedback({
        type: 'warning',
        message: 'No se pudieron calcular ángulos válidos. Los 3 landmarks de medición (' +
          defaultIndices.join(', ') + ') están demasiado próximos en la malla facial para formar un ángulo. ' +
          'Pruebe seleccionar otra región anatómica o use "Ajuste Fino de Landmarks" para elegir puntos más separados.'
      });
      return;
    }

    if (data.length < 2) {
      if (raw.length === 0) {
        setRecordingFeedback({
          type: 'info',
          message: 'No se detectaron landmarks faciales durante la grabación. ' +
            'Asegúrese de que el rostro del paciente esté visible y bien iluminado frente a la cámara.'
        });
      } else {
        setRecordingFeedback({
          type: 'info',
          message: 'Solo se registraron ' + raw.length + ' muestra(s) con ángulo > 0° de ' + raw.length + ' total(es). ' +
            'Se necesitan al menos 2 muestras válidas para calcular métricas. ' +
            'Intente grabar por más tiempo o verifique la detección facial.'
        });
      }
      return;
    }

    // Datos válidos: limpiar feedback y calcular métricas
    setRecordingFeedback(null);

    if (region === 'MARCHA') {
      const heightsPx = data.map(d => d.anguloContralateral).filter((v): v is number => v !== undefined && v !== null && v > 0);
      const avgHeightPx = heightsPx.length > 0 ? (heightsPx.reduce((a, b) => a + b, 0) / heightsPx.length) : 350;
      const scaleCmPx = avgHeightPx > 0 ? (alturaRealCm / avgHeightPx) : 0.35;

      const timeSeries = data.map(d => ({ tiempo: d.tiempo, distanciaPixeles: d.angulo }));
      const analysis = analizarCicloMarcha(timeSeries, scaleCmPx);

      setCalculatedMetrics({
        angMin: analysis.minimoCm,
        angMax: analysis.maximoCm,
        angAvg: analysis.promedioCm,
        maxVel: 0,
        tremorFreq: 0,
        tremorAmp: 0
      });
      setShowResultsModal(true);
      return;
    }

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

    // Calculate bilateral asymmetry index
    const activeRom = angMax - angMin;
    const contralateralAngles = data.map(d => d.anguloContralateral).filter((v): v is number => v !== undefined && v !== null);
    let asimetriaVal: number | undefined = undefined;

    if (contralateralAngles.length > 0) {
      const contraMin = Math.min(...contralateralAngles);
      const contraMax = Math.max(...contralateralAngles);
      const contraRom = contraMax - contraMin;
      asimetriaVal = calcularAsimetriaClinica(activeRom, contraRom);
    }

    setCalculatedMetrics({
      angMin: parseFloat(angMin.toFixed(1)),
      angMax: parseFloat(angMax.toFixed(1)),
      angAvg: parseFloat(angAvg.toFixed(1)),
      maxVel: parseFloat(maxVel.toFixed(1)),
      tremorFreq: dominantFrequency > 0 ? parseFloat(dominantFrequency.toFixed(1)) : 0,
      tremorAmp: amplitude > 0 ? parseFloat(amplitude.toFixed(2)) : 0,
      asimetria_index: asimetriaVal !== undefined ? parseFloat(asimetriaVal.toFixed(1)) : undefined
    });
    setShowResultsModal(true);
  };

  const handleStartRecording = () => {
    if (!selectedPatientId) { alert('Seleccione un paciente primero.'); return; }
    setCalculatedMetrics(null);
    setCapturedData([]);
    setRecordingFeedback(null);
    setShowResultsModal(false);
    if (region === 'TEMBLOR') {
      startAccelCapture();
      startRecording();
    } else {
      startRecording();
    }
  };

  const handleStopRecording = () => {
    if (region === 'TEMBLOR') {
      stopRecording();
      const analysis = stopAccelCapture();
      const mappedData = accelRawSeries.map(d => ({
        tiempo: d.tiempo,
        angulo: Math.sqrt(d.x * d.x + d.y * d.y + d.z * d.z)
      }));
      setCapturedData(mappedData);
      setCalculatedMetrics({
        angMin: 0,
        angMax: 0,
        angAvg: 0,
        maxVel: 0,
        tremorFreq: parseFloat(analysis.frecuenciaDominante.toFixed(1)),
        tremorAmp: parseFloat(analysis.amplitudTremor.toFixed(2)),
        asimetria_index: null
      });
      setShowResultsModal(true);
    } else {
      stopRecording();
    }
  };

  const handleSaveSession = async () => {
    if (!calculatedMetrics) return;
    const dbsParams = region === 'TEMBLOR' ? { voltage: voltageDbs, frecuencia: frecuenciaDbs, anchoPulso: anchoPulsoDbs } : undefined;
    const success = await saveSession(selectedPatientId, modo, region, lado, capturedData, calculatedMetrics, dbsParams);
    if (success) {
      setShowResultsModal(false);
      setTimeout(() => { setCalculatedMetrics(null); setCapturedData([]); resetSaveStatus(); }, 2000);
    }
  };

  const handleDiscardRecording = () => {
    if (confirm('¿Descartar esta grabación?')) { setCalculatedMetrics(null); setCapturedData([]); setRecordingFeedback(null); setShowResultsModal(false); }
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
            {region === 'TEMBLOR' ? (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 20, padding: '32px 24px', minHeight: 320,
                background: 'var(--bg-card)', border: '1px solid var(--border-card)',
                borderRadius: 'var(--radius-md)', textAlign: 'center', position: 'relative', overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--accent)', background: 'var(--accent-dim)', padding: '4px 8px', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
                  <Activity size={12} className="pulse-glow" style={{ animationDuration: isAccelCapturing ? '1s' : '3s' }} /> 
                  {isAccelCapturing ? 'Capturando Temblor' : 'Sensor Wearable Conectado'}
                </div>
                
                <div style={{ display: 'flex', gap: 40, justifyContent: 'center', width: '100%', margin: '20px 0' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#ef4444' }}>{latestAccelReading.x.toFixed(2)}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Eje X (m/s²)</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#22c55e' }}>{latestAccelReading.y.toFixed(2)}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Eje Y (m/s²)</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6' }}>{latestAccelReading.z.toFixed(2)}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Eje Z (m/s²)</div>
                  </div>
                </div>

                <div style={{ width: '100%', height: 100, display: 'flex', alignItems: 'flex-end', gap: 3, padding: '10px 0', borderBottom: '1px dashed var(--border-card)' }}>
                  {Array.from({ length: 40 }).map((_, i) => {
                    const heightVal = isAccelCapturing 
                      ? 15 + Math.abs(Math.sin((i + accelSamplesCount) * 0.4)) * 60 + Math.random() * 15
                      : 10 + Math.sin(i * 0.2) * 10;
                    return (
                      <div 
                        key={i} 
                        style={{ 
                          flex: 1, 
                          height: `${heightVal}%`, 
                          background: isAccelCapturing 
                            ? 'linear-gradient(to top, var(--accent-dim), var(--accent))' 
                            : 'var(--border-card)',
                          borderRadius: '2px 2px 0 0',
                          transition: 'height 0.1s ease'
                        }} 
                      />
                    );
                  })}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 280 }}>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {isAccelCapturing 
                      ? `Registrando datos inerciales... (${accelSamplesCount} muestras)` 
                      : 'Sensor listo para medir temblor. Pulse Grabar en el panel lateral.'
                    }
                  </p>
                </div>
              </div>
            ) : isCameraActive ? (
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
                  <ellipse cx="80" cy="70" rx="55" ry="65" stroke="var(--accent)" strokeWidth="1" strokeDasharray="3 3" />
                  <circle cx="58" cy="62" r="3" fill="var(--accent)" opacity="0.7" />
                  <circle cx="102" cy="62" r="3" fill="var(--accent)" opacity="0.7" />
                  <circle cx="80" cy="80" r="2" fill="var(--accent)" opacity="0.5" />
                  <circle cx="70" cy="96" r="1.5" fill="var(--accent)" opacity="0.4" />
                  <circle cx="90" cy="96" r="1.5" fill="var(--accent)" opacity="0.4" />
                  <circle cx="80" cy="105" r="2" fill="var(--accent)" opacity="0.6" />
                  <circle cx="44" cy="50" r="2" fill="var(--accent)" opacity="0.3" />
                  <circle cx="116" cy="50" r="2" fill="var(--accent)" opacity="0.3" />
                  <circle cx="52" cy="44" r="1.5" fill="var(--accent)" opacity="0.25" />
                  <circle cx="108" cy="44" r="1.5" fill="var(--accent)" opacity="0.25" />
                  <circle cx="80" cy="130" r="2" fill="var(--accent)" opacity="0.4" />
                  <path d="M62 100 Q80 115 98 100" stroke="var(--accent)" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.3" />
                  <path d="M68 50 Q80 44 92 50" stroke="var(--accent)" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.3" />
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
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>Zoom: {zoom.toFixed(1)}x<TooltipAyuda posicion="top" texto="Zoom digital del canvas. Útil para acercar regiones faciales pequeñas y mejorar la precisión del análisis." /></span>
                <input type="range" min="1" max="3" step="0.1" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} style={{ width: 72, accentColor: 'var(--accent)' }} />
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
                  <button onClick={handleStartRecording} className="btn" style={{ fontSize: 11, padding: '7px 14px', background: 'var(--danger)', borderColor: 'var(--danger)', color: '#fff' }}>
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
                <TooltipAyuda posicion="top" texto="'Simulado': genera datos de prueba sin cámara. 'Cámara Real': captura con webcam para evaluación clínica en vivo." />
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
            alturaRealCm={alturaRealCm} setAlturaRealCm={setAlturaRealCm}
            voltageDbs={voltageDbs} setVoltageDbs={setVoltageDbs}
            frecuenciaDbs={frecuenciaDbs} setFrecuenciaDbs={setFrecuenciaDbs}
            anchoPulsoDbs={anchoPulsoDbs} setAnchoPulsoDbs={setAnchoPulsoDbs}
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
                <TooltipAyuda posicion="top" texto="Personalice manualmente los puntos de referencia (landmarks) de la malla facial para el cálculo de ángulos." />
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
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>Modo click sobre cámara<TooltipAyuda posicion="top" texto="Active para seleccionar landmarks directamente haciendo clic sobre el canvas de la cámara. Asigne P1, Vértice y P3 manualmente." /></span>
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

          {recordingFeedback && (
            <div className="card animate-fade-in" style={{
              padding: 16, gap: 8,
              borderColor: recordingFeedback.type === 'warning' ? 'var(--warning-border)' :
                recordingFeedback.type === 'error' ? 'var(--danger-border)' : 'var(--info-border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 8, borderBottom: '1px solid var(--border-card)' }}>
                <AlertTriangle size={15} style={{
                  color: recordingFeedback.type === 'warning' ? 'var(--warning)' :
                    recordingFeedback.type === 'error' ? 'var(--danger)' : 'var(--info)'
                }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {recordingFeedback.type === 'warning' ? 'Aviso Clínico' :
                   recordingFeedback.type === 'error' ? 'Error de Medición' : 'Información'}
                </span>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6, padding: '4px 0' }}>
                {recordingFeedback.message}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Resultados Modal Overlay ──────────────────────────────────────── */}
      {showResultsModal && calculatedMetrics && (
        <div className="modal-overlay" onClick={() => setShowResultsModal(false)}>
          <div className="modal-content" style={{ maxWidth: 560, maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <ResultadosCard metrics={calculatedMetrics} saveStatus={saveStatus} onSave={handleSaveSession} onDiscard={handleDiscardRecording} region={region} />
          </div>
        </div>
      )}

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

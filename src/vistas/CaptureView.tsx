'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

// Hooks
import { useRecordingState } from './hooks/useRecordingState';
import { useCaptureData } from './hooks/useCaptureData';

// Componentes
import { RegistroClinicoForm } from './componentes/RegistroClinicoForm';
import { ResultadosCard } from './componentes/ResultadosCard';
import { NuevoPacienteModal } from './componentes/NuevoPacienteModal';

// Icons
import {
  Camera,
  Circle,
  Square,
  Crosshair,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  RotateCcw,
  Info
} from 'lucide-react';
import { TooltipAyuda } from '@/componentes_visuales/TooltipAyuda';

// Carga dinámica para evitar errores SSR de la webcam
const WebcamCapture = dynamic(
  () => import('@/componentes_visuales/WebcamCapture'),
  { ssr: false }
);

const QUALITY_CONFIG: Record<string, { bg: string; color: string; dot: string; label: string }> = {
  excelente: { bg: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-900/40', color: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500', label: 'Tracking: Excelente' },
  bueno: { bg: 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-900/40', color: 'text-indigo-700 dark:text-indigo-400', dot: 'bg-indigo-500', label: 'Tracking: Bueno' },
  inestable: { bg: 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/40', color: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500', label: 'Tracking: Inestable' },
  critico: { bg: 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-900/40', color: 'text-red-700 dark:text-red-400', dot: 'bg-red-500', label: 'Oclusión/Pérdida' }
};

const SLOT_LABELS = ['P1 (Origen)', 'Vértice (Ángulo)', 'P3 (Destino)'];
const SLOT_COLORES = ['#22d3ee', '#facc15', '#e879f9'];

/**
 * Controller / Orchestrator Pattern: Vista de Captura de Movimiento Facial/Articular.
 * Integra todos los componentes y hooks atómicos de presentación.
 * 
 * Ergonomía y Spacing: Uso sistemático de paddings abundantes (px-6 py-5) y distribución de tarjetas
 * para evitar que ningún texto o control toque los bordes físicos del front.
 */
export function CaptureView() {
  const {
    modo,
    setModo,
    region,
    handleRegionChange,
    lado,
    setLado,
    isMockMode,
    setIsMockMode,
    isCameraActive,
    setIsCameraActive,
    zoom,
    setZoom,
    panelAjusteAbierto,
    setPanelAjusteAbierto,
    modoSeleccionActivo,
    setModoSeleccionActivo,
    slotsPersonalizados,
    defaultIndices,
    isRecording,
    timerText,
    startRecording,
    stopRecording,
    handleLandmarkClick,
    resetSlot,
    resetAllSlots,
    getCustomLandmarksArray,
    stopChronometer
  } = useRecordingState();

  const {
    patients,
    selectedPatientId,
    setSelectedPatientId,
    saveStatus,
    createPatient,
    saveSession,
    resetSaveStatus
  } = useCaptureData();

  // Resultados calculados localmente
  const [calculatedMetrics, setCalculatedMetrics] = useState<any | null>(null);
  const [capturedData, setCapturedData] = useState<any[]>([]);
  const [trackingQuality, setTrackingQuality] = useState<string>('excelente');
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);

  // Mapear utilidades matemáticas para procesar la grabación al terminar
  const handleDataCollected = (data: { tiempo: number; angulo: number }[]) => {
    setCapturedData(data);
    if (data.length < 3) return;

    // Calcular cinemática
    const angles = data.map(d => d.angulo);
    const times = data.map(d => d.tiempo);
    const angMin = Math.min(...angles);
    const angMax = Math.max(...angles);
    const angAvg = angles.reduce((a, b) => a + b, 0) / angles.length;

    // Velocidades por diferencias finitas
    const velocities: number[] = [];
    for (let i = 1; i < data.length; i++) {
      const dt = data[i].tiempo - data[i - 1].tiempo;
      const da = Math.abs(data[i].angulo - data[i - 1].angulo);
      if (dt > 0) velocities.push(da / dt);
    }
    const maxVel = velocities.length > 0 ? Math.max(...velocities) : 0;

    // FFT simulada de temblor
    let dominantFrequency = 0;
    let amplitude = 0;
    if (angles.length > 10) {
      // Simular espectro parkinsoniano típico si hay oscilaciones rápidas
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
    if (!selectedPatientId) {
      alert('Por favor seleccione un paciente primero.');
      return;
    }
    setCalculatedMetrics(null);
    setCapturedData([]);
    startRecording();
  };

  const handleStopRecording = () => {
    stopRecording();
  };

  const handleSaveSession = async () => {
    if (!calculatedMetrics) return;
    const success = await saveSession(
      selectedPatientId,
      modo,
      region,
      lado,
      capturedData,
      calculatedMetrics
    );
    if (success) {
      setTimeout(() => {
        setCalculatedMetrics(null);
        setCapturedData([]);
        resetSaveStatus();
      }, 2000);
    }
  };

  const handleDiscardRecording = () => {
    if (confirm('¿Está seguro de que desea descartar esta grabación? Los datos se perderán.')) {
      setCalculatedMetrics(null);
      setCapturedData([]);
    }
  };

  return (
    <div className="flex flex-col gap-6 px-6 py-5 max-w-7xl mx-auto w-full transition-all">
      {/* Header section */}
      <div className="flex flex-col gap-1 px-1">
        <h2 className="text-xl font-extrabold text-zinc-800 dark:text-zinc-150 tracking-tight">Captura Biomecánica</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Análisis cinemático articular en tiempo real mediante visión artificial.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start w-full">
        {/* ── Left side: Webcam displays and hardware controls (2/3 width) ────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-6 w-full">
          <div className="relative w-full">
            {isCameraActive ? (
              <WebcamCapture
                region={region}
                lado={lado}
                isRecording={isRecording}
                isMockMode={isMockMode}
                landmarksPersonalizados={getCustomLandmarksArray()}
                modoSeleccionActivo={modoSeleccionActivo && !isRecording}
                zoom={zoom}
                onDataCollected={handleDataCollected}
                onTrackingQuality={setTrackingQuality}
                onLandmarkClick={handleLandmarkClick}
              />
            ) : (
              /* Rich Idle state representation with instructions */
              <div className="flex flex-col items-center justify-center gap-6 py-16 px-8 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-850 rounded-xl shadow-sm text-center">
                <div className="relative flex items-center justify-center">
                  <svg width="180" height="210" viewBox="0 0 180 210" fill="none" className="opacity-30 dark:opacity-20 text-indigo-500 dark:text-indigo-400">
                    <ellipse cx="90" cy="85" rx="62" ry="72" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
                    <rect x="76" y="154" width="28" height="30" rx="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
                    <ellipse cx="67" cy="78" rx="12" ry="7" stroke="currentColor" strokeWidth="1.2" />
                    <circle cx="67" cy="78" r="3" fill="currentColor" opacity="0.5" />
                    <ellipse cx="113" cy="78" rx="12" ry="7" stroke="currentColor" strokeWidth="1.2" />
                    <circle cx="113" cy="78" r="3" fill="currentColor" opacity="0.5" />
                    <path d="M90 88 L83 108 L97 108" stroke="#9ca3af" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M72 122 Q90 134 108 122" stroke="#9ca3af" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                    <path d="M55 68 Q67 62 79 66" stroke="#9ca3af" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                    <path d="M101 66 Q113 62 125 68" stroke="#9ca3af" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                    <path d="M10 30 L10 10 L30 10" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
                    <path d="M150 10 L170 10 L170 30" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
                    <path d="M10 180 L10 200 L30 200" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
                    <path d="M150 200 L170 200 L170 180" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-36 h-36 rounded-full border border-indigo-500/10 dark:border-indigo-400/5 animate-ping" style={{ animationDuration: '3s' }} />
                  </div>
                </div>

                <div className="max-w-xs flex flex-col gap-1">
                  <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Cámara inactiva</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Active la cámara y posicione al paciente frente a la pantalla.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 text-[10px] text-zinc-550 dark:text-zinc-500 w-full max-w-sm">
                  {[
                    { icon: '💡', text: 'Iluminación uniforme' },
                    { icon: '📏', text: '40–60 cm de distancia' },
                    { icon: '🎯', text: 'Alineación horizontal' },
                  ].map(({ icon, text }) => (
                    <div key={text} className="flex flex-col items-center gap-1.5 p-2 bg-zinc-100 dark:bg-zinc-900/40 rounded-lg border border-zinc-200 dark:border-zinc-800/30">
                      <span className="text-base leading-none">{icon}</span>
                      <span className="font-semibold">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recording chronometer Overlay */}
            {isRecording && (
              <div className="absolute top-4 right-4 bg-red-600/90 dark:bg-red-950/80 border border-red-400 dark:border-red-800/40 px-3 py-1.5 rounded-lg flex items-center gap-2 text-white dark:text-red-400 font-mono text-xs font-bold shadow-md animate-pulse">
                <Circle size={10} fill="currentColor" />
                <span>{timerText}</span>
              </div>
            )}

            {/* Tracking quality indicator */}
            {isCameraActive && !isMockMode && (
              <div className={`absolute top-4 left-4 border px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-[11px] font-bold shadow-sm ${QUALITY_CONFIG[trackingQuality].bg} ${QUALITY_CONFIG[trackingQuality].color}`}>
                <span className={`w-1.5 h-1.5 rounded-full inline-block ${QUALITY_CONFIG[trackingQuality].dot}`} />
                {QUALITY_CONFIG[trackingQuality].label}
              </div>
            )}

            {/* Personalized slots active notification */}
            {getCustomLandmarksArray() && !isRecording && (
              <div className="absolute bottom-4 left-4 bg-amber-500/90 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700/50 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-[10px] font-mono font-bold text-white dark:text-amber-400 shadow-md">
                ✦ PUNTOS PERSONALIZADOS ACTIVOS [{getCustomLandmarksArray()?.join(' → ')}]
              </div>
            )}

            {/* Floating Zoom Control slider */}
            {isCameraActive && (
              <div className="absolute bottom-4 right-4 bg-white/95 dark:bg-zinc-950/80 border border-zinc-250 dark:border-zinc-800 rounded-lg px-3 py-2 flex items-center gap-2.5 z-10 shadow-md backdrop-blur-sm">
                <span className="text-[10px] font-mono text-zinc-550 dark:text-zinc-400 font-bold">Zoom: {zoom.toFixed(1)}x</span>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-20 accent-indigo-600 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  title="Ajuste el zoom óptico"
                />
                <button
                  onClick={() => setZoom(1)}
                  className="text-[9px] font-mono text-zinc-600 hover:text-zinc-800 dark:text-zinc-450 dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-800 px-1 py-0.5 rounded transition-colors"
                >
                  Reset
                </button>
              </div>
            )}
          </div>

          {/* Controls Bar card */}
          <div className="card p-5 flex flex-wrap justify-between items-center gap-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl shadow-sm">
            <div className="flex gap-3">
              {!isCameraActive ? (
                <button
                  onClick={() => setIsCameraActive(true)}
                  className="btn bg-indigo-650 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
                >
                  <Camera size={15} /> Activar Cámara
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsCameraActive(false);
                    stopRecording();
                  }}
                  disabled={isRecording}
                  className="btn py-2 px-4 rounded-lg text-xs font-bold border border-zinc-250 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                >
                  Apagar Cámara
                </button>
              )}

              {isCameraActive && (
                <>
                  {!isRecording ? (
                    <button
                      onClick={handleStartRecording}
                      className="btn py-2 px-4 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 shadow-sm transition-all"
                    >
                      <Circle size={12} fill="currentColor" /> Iniciar Grabación
                    </button>
                  ) : (
                    <button
                      onClick={handleStopRecording}
                      className="btn py-2 px-4 rounded-lg text-xs font-bold bg-zinc-850 hover:bg-zinc-900 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-white flex items-center gap-2 transition-all"
                    >
                      <Square size={12} fill="currentColor" /> Detener Grabación
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Execution mode segmented pill control */}
            <div className="flex flex-col gap-1 text-xs">
              <span className="flex items-center gap-1 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                Modo Ejecución
                <TooltipAyuda
                  posicion="top"
                  texto="Simulado: simula mediciones con oscilaciones típicas de prueba. Cámara Real: mide los ángulos reales a partir del feed de su cámara web."
                />
              </span>
              <div className="flex border border-zinc-200 dark:border-zinc-850 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-950 p-0.5 w-[220px]">
                <button
                  onClick={() => !isRecording && setIsMockMode(true)}
                  disabled={isRecording}
                  className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition-all ${
                    isMockMode
                      ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-extrabold shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  Simulado
                </button>
                <button
                  onClick={() => !isRecording && setIsMockMode(false)}
                  disabled={isRecording}
                  className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition-all ${
                    !isMockMode
                      ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-extrabold shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  Cámara Real
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right side: Clinical Profile, Fine Tuning & Results (1/3 width) ───────────── */}
        <div className="lg:col-span-1 flex flex-col gap-6 w-full">
          {/* Clinical Profile Form */}
          <RegistroClinicoForm
            patients={patients}
            selectedPatientId={selectedPatientId}
            setSelectedPatientId={setSelectedPatientId}
            modo={modo}
            setModo={setModo}
            region={region}
            handleRegionChange={handleRegionChange}
            lado={lado}
            setLado={setLado}
            isRecording={isRecording}
            onOpenModal={() => setIsPatientModalOpen(true)}
          />

          {/* Enfoque C: Fine Tuning Accordion */}
          <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-sm">
            <button
              onClick={() => setPanelAjusteAbierto(!panelAjusteAbierto)}
              className="w-full flex items-center justify-between px-5 py-4 text-xs font-bold text-zinc-550 dark:text-zinc-300 hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20 transition-all border-b border-transparent dark:border-transparent"
            >
              <span className="flex items-center gap-2">
                <Crosshair size={16} className="text-amber-500" />
                Ajuste Fino de Landmarks
                {getCustomLandmarksArray() && (
                  <span className="ml-1 text-[9px] bg-amber-100 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded font-mono font-bold leading-none animate-pulse">
                    ACTIVO
                  </span>
                )}
              </span>
              {panelAjusteAbierto ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {panelAjusteAbierto && (
              <div className="px-5 pb-5 pt-4 flex flex-col gap-4 border-t border-zinc-150 dark:border-zinc-850">
                <div className="bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/80 dark:border-zinc-850 rounded-lg p-3 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400 flex gap-2">
                  <Info size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                  <p>
                    Permite definir manualmente qué puntos de referencia de la malla se usarán como vértices o extremos del ángulo.
                  </p>
                </div>

                <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-450">
                  Valores default de <span className="text-indigo-650 dark:text-indigo-400 font-mono font-bold">{region}/{lado}</span>:{' '}
                  <span className="font-mono text-zinc-650 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-950 px-1.5 py-0.5 rounded">
                    [{defaultIndices.join(', ')}]
                  </span>
                </p>

                {/* Toggle click selection mode */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-150 dark:border-zinc-850">
                  <span className="text-[11px] font-bold text-zinc-650 dark:text-zinc-300">Modo click sobre cámara</span>
                  <button
                    onClick={() => setModoSeleccionActivo(!modoSeleccionActivo)}
                    disabled={isRecording || isMockMode}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                      modoSeleccionActivo
                        ? 'bg-amber-100 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/40 text-amber-700 dark:text-amber-400'
                        : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-250 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                    }`}
                    title={isMockMode ? 'Desactive el modo simulado para habilitar el ajuste' : ''}
                  >
                    {modoSeleccionActivo ? <Eye size={12} /> : <EyeOff size={12} />}
                    {modoSeleccionActivo ? 'Seleccionando' : 'Inactivo'}
                  </button>
                </div>

                {isMockMode && (
                  <div className="text-[10px] text-amber-600 dark:text-amber-500 font-bold bg-amber-50 dark:bg-amber-955/20 border border-amber-200 dark:border-amber-900/40 p-2.5 rounded-lg leading-snug">
                    ⚠ Para personalizar los puntos, desactive el Modo Simulado (Cámara Real) y active la cámara.
                  </div>
                )}

                {modoSeleccionActivo && (
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 italic">
                    Haga click sobre los puntos verdes en el canvas para rellenar P1, Vértice y P3 en orden.
                  </p>
                )}

                {/* Slots display */}
                <div className="flex flex-col gap-2">
                  {SLOT_LABELS.map((label, i) => (
                    <div key={i} className="flex items-center justify-between bg-zinc-55 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-lg px-3.5 py-2.5 shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-sm" style={{ backgroundColor: SLOT_COLORES[i] }} />
                        <span className="text-[11px] font-bold text-zinc-650 dark:text-zinc-350">{label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold" style={{ color: SLOT_COLORES[i] }}>
                          {slotsPersonalizados[i] !== null ? `#${slotsPersonalizados[i]}` : <span className="text-zinc-400">—</span>}
                        </span>
                        {slotsPersonalizados[i] !== null && (
                          <button
                            type="button"
                            onClick={() => resetSlot(i)}
                            className="text-zinc-400 hover:text-red-500 font-bold text-xs p-1"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reset all custom indices button */}
                <button
                  type="button"
                  onClick={resetAllSlots}
                  className="btn py-2 text-[10px] font-bold flex items-center justify-center gap-1.5 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-450 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  <RotateCcw size={13} /> Restablecer por Defectos
                </button>
              </div>
            )}
          </div>

          {/* Analytical Results table display */}
          <ResultadosCard
            metrics={calculatedMetrics}
            saveStatus={saveStatus}
            onSave={handleSaveSession}
            onDiscard={handleDiscardRecording}
          />
        </div>
      </div>

      {/* Patient registration modal overlay */}
      <NuevoPacienteModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        onCreate={createPatient}
      />
    </div>
  );
}

export default CaptureView;

'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { PUNTOS_MEDICION, RegionKey, LadoKey, CalidadTracking } from '@/biblioteca/math/angles';
import { calcularVelocidades } from '@/biblioteca/math/kinematics';
import { analyzeTremor } from '@/biblioteca/math/fft';
import dynamic from 'next/dynamic';
import { TooltipAyuda } from '@/componentes_visuales/TooltipAyuda';
import {
  Camera, Circle, Square, Save, Trash2, ArrowLeft,
  Activity, User, CheckCircle, Crosshair, RotateCcw,
  Eye, EyeOff, ChevronDown, ChevronUp
} from 'lucide-react';

const WebcamCapture = dynamic(() => import('@/componentes_visuales/WebcamCapture'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center p-8 bg-zinc-900 border border-zinc-800 rounded-xl h-96">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500 mb-4" />
      <p className="text-zinc-400 text-sm">Cargando módulo de cámara...</p>
    </div>
  )
});

// ── Region button metadata (M1) ──────────────────────────────────────────────
const REGION_BOTONES: { key: RegionKey; icono: React.ReactNode; label: string }[] = [
  {
    key: 'CEJA',
    label: 'Ceja',
    icono: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-indigo-400">
        <path d="M3 13C6 8 9 8 11 10M13 10C15 8 18 8 21 13" />
      </svg>
    )
  },
  {
    key: 'PARPADO',
    label: 'Párpado',
    icono: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-cyan-400">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3.5" strokeWidth="1.5" />
      </svg>
    )
  },
  {
    key: 'BOCA',
    label: 'Boca',
    icono: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-pink-400">
        <path d="M4 10c4 4 12 4 16 0M4 10c4-2 12-2 16 0Z" />
      </svg>
    )
  },
  {
    key: 'NARIZ',
    label: 'Nariz',
    icono: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
        <path d="M12 4v12M9 13h6M8 16c2 1 6 1 8 0" />
      </svg>
    )
  },
  {
    key: 'CODO',
    label: 'Codo',
    icono: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
        <circle cx="18" cy="18" r="2" />
        <circle cx="6" cy="6" r="2" />
        <path d="M6 8v6a4 4 0 0 0 4 4h6" />
      </svg>
    )
  },
  {
    key: 'MUÑECA',
    label: 'Muñeca',
    icono: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400">
        <rect x="7" y="11" width="10" height="8" rx="2" />
        <path d="M12 11V5M10 5h4" />
      </svg>
    )
  },
  {
    key: 'HOMBRO',
    label: 'Hombro',
    icono: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-400">
        <path d="M4 18v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" />
        <circle cx="12" cy="6" r="3" />
      </svg>
    )
  }
];

// Enfoque C slot colors (must match WebcamCapture COLORES_SLOT)
const SLOT_COLORES = ['#22d3ee', '#facc15', '#e879f9'];
const SLOT_LABELS  = ['P1 (inicio)', 'Vértice (P2)', 'P3 (fin)'];

interface PatientOption {
  id: string;
  name: string;
}

export function CaptureView() {
  // ── Patient ────────────────────────────────────────────────────────────────
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [newPatientName, setNewPatientName] = useState<string>('');
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);

  // ── Measurement config ─────────────────────────────────────────────────────
  const [modo, setModo]     = useState<'PRE' | 'POST'>('PRE');
  const [region, setRegion] = useState<RegionKey>('CEJA');
  const [lado, setLado]     = useState<LadoKey>('DERECHA');
  const [isMockMode, setIsMockMode] = useState(true);
  const [zoom, setZoom] = useState<number>(1);

  // ── Enfoque C state ────────────────────────────────────────────────────────
  const [modoSeleccionActivo, setModoSeleccionActivo] = useState(false);
  const [panelAjusteAbierto, setPanelAjusteAbierto]  = useState(false);
  /** Custom landmark slots: [P1, Vértice, P3] — null = use defaults */
  const [slotsPersonalizados, setSlotsPersonalizados] = useState<(number | null)[]>([null, null, null]);
  const landmarksPersonalizados: [number, number, number] | null =
    slotsPersonalizados.every(s => s !== null)
      ? (slotsPersonalizados as [number, number, number])
      : null;

  // ── KAN-10 M5: tracking quality ────────────────────────────────────────────
  const [trackingQuality, setTrackingQuality] = useState<CalidadTracking | null>(null);

  // ── Recording ──────────────────────────────────────────────────────────────
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Reset zoom when camera goes inactive
  useEffect(() => {
    if (!isCameraActive) {
      setZoom(1);
    }
  }, [isCameraActive]);
  const [isRecording, setIsRecording]       = useState(false);
  const [timerText, setTimerText]           = useState('00:00:00');
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartRef = useRef<number>(0);

  // ── Results ────────────────────────────────────────────────────────────────
  const [capturedData, setCapturedData] = useState<{ tiempo: number; angulo: number }[]>([]);
  const [calculatedMetrics, setCalculatedMetrics] = useState<{
    angMin: number; angMax: number; angAvg: number;
    maxVel: number; tremorFreq: number; tremorAmp: number;
  } | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // ── Load patients ──────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadPatients() {
      try {
        const response = await fetch('/api/patients');
        const data = await response.json();
        if (response.ok && data?.length > 0) {
          setPatients(data);
          setSelectedPatientId(data[0].id);
        } else {
          const fallback = [
            { id: 'mock-p1', name: 'Paciente A (Simulado)' },
            { id: 'mock-p2', name: 'Paciente B (Simulado)' }
          ];
          setPatients(fallback);
          setSelectedPatientId(fallback[0].id);
        }
      } catch {
        const fallback = [
          { id: 'mock-p1', name: 'Paciente A (Simulado)' },
          { id: 'mock-p2', name: 'Paciente B (Simulado)' }
        ];
        setPatients(fallback);
        setSelectedPatientId(fallback[0].id);
      }
    }
    loadPatients();
  }, []);

  // ── Chronometer ────────────────────────────────────────────────────────────
  const startChronometer = () => {
    recordingStartRef.current = performance.now();
    recordingTimerRef.current = setInterval(() => {
      const elapsed = performance.now() - recordingStartRef.current;
      const minutes = Math.floor(elapsed / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      const millis  = Math.floor((elapsed % 1000) / 10);
      const pad = (n: number) => String(n).padStart(2, '0');
      setTimerText(`${pad(minutes)}:${pad(seconds)}:${pad(millis)}`);
    }, 10);
  };

  const stopChronometer = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  // ── Recording controls ─────────────────────────────────────────────────────
  const handleStartRecording = () => {
    if (!selectedPatientId) { alert('Por favor seleccione un paciente primero.'); return; }
    // Disable selection mode when recording starts
    setModoSeleccionActivo(false);
    setCalculatedMetrics(null);
    setCapturedData([]);
    setIsRecording(true);
    startChronometer();
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    stopChronometer();
  };

  const handleDataCollected = (data: { tiempo: number; angulo: number }[]) => {
    setCapturedData(data);
    if (data.length < 3) return;

    const angles = data.map(d => d.angulo);
    const times  = data.map(d => d.tiempo);
    const angMin = Math.min(...angles);
    const angMax = Math.max(...angles);
    const angAvg = angles.reduce((a, b) => a + b, 0) / angles.length;
    const velocities = calcularVelocidades(data);
    const maxVel = velocities.length > 0 ? Math.max(...velocities) : 0;
    const tremorResult = analyzeTremor(angles, times);

    setCalculatedMetrics({
      angMin: parseFloat(angMin.toFixed(1)),
      angMax: parseFloat(angMax.toFixed(1)),
      angAvg: parseFloat(angAvg.toFixed(1)),
      maxVel: parseFloat(maxVel.toFixed(1)),
      tremorFreq: tremorResult.dominantFrequency,
      tremorAmp:  tremorResult.amplitude
    });
  };

  // ── Save session ───────────────────────────────────────────────────────────
  const handleSaveToDatabase = async () => {
    if (!calculatedMetrics || capturedData.length === 0) return;
    setSaveStatus('saving');
    try {
      const anglesStr = capturedData.map(d => `${d.tiempo.toFixed(2)},${d.angulo.toFixed(1)}`).join(';');
      const newSession = {
        patient_id: selectedPatientId, modo, region, lado,
        tiempo_medicion: capturedData[capturedData.length - 1].tiempo,
        angulo_min: calculatedMetrics.angMin, angulo_max: calculatedMetrics.angMax,
        angulo_promedio: calculatedMetrics.angAvg, velocidad_max: calculatedMetrics.maxVel,
        frecuencia_temblor: calculatedMetrics.tremorFreq, amplitud_temblor: calculatedMetrics.tremorAmp,
        asimetria_index: null, datos_angulos: anglesStr
      };
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSession)
      });
      if (!response.ok) throw new Error('Save failed');
      setSaveStatus('success');
      setTimeout(() => { setCalculatedMetrics(null); setCapturedData([]); setSaveStatus('idle'); }, 2000);
    } catch {
      setSaveStatus('success');
      alert('Guardado simulado correctamente (Base de datos desconectada).');
      setTimeout(() => { setCalculatedMetrics(null); setCapturedData([]); setSaveStatus('idle'); }, 2000);
    }
  };

  const handleDiscardRecording = () => {
    if (confirm('¿Está seguro de que desea descartar esta grabación? Los datos se perderán.')) {
      setCalculatedMetrics(null);
      setCapturedData([]);
    }
  };

  // ── Create patient ─────────────────────────────────────────────────────────
  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim()) return;
    try {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPatientName.trim() })
      });
      const data = await response.json();
      if (!response.ok) throw new Error('Create failed');
      if (data) { setPatients(prev => [...prev, data]); setSelectedPatientId(data.id); }
      setNewPatientName(''); setIsPatientModalOpen(false);
    } catch {
      const newMock = { id: `mock-${Date.now()}`, name: newPatientName.trim() };
      setPatients(prev => [...prev, newMock]); setSelectedPatientId(newMock.id);
      setNewPatientName(''); setIsPatientModalOpen(false);
    }
  };

  // ── Enfoque C: handle landmark click from WebcamCapture ───────────────────
  const handleLandmarkClick = (index: number) => {
    setSlotsPersonalizados(prev => {
      const next = [...prev];
      // Fill the first empty slot
      const emptyIdx = next.findIndex(s => s === null);
      if (emptyIdx >= 0) {
        next[emptyIdx] = index;
      } else {
        // All 3 filled — cycle: shift left and add at end
        next[0] = next[1];
        next[1] = next[2];
        next[2] = index;
      }
      return next;
    });
  };

  const handleResetSlot = (slotIdx: number) => {
    setSlotsPersonalizados(prev => {
      const next = [...prev];
      next[slotIdx] = null;
      return next;
    });
  };

  const handleResetAllSlots = () => {
    setSlotsPersonalizados([null, null, null]);
  };

  // ── Region change resets custom selection ──────────────────────────────────
  const handleRegionChange = (r: RegionKey) => {
    setRegion(r);
    setSlotsPersonalizados([null, null, null]);
    setModoSeleccionActivo(false);
  };

  // ── Tracking quality badge ─────────────────────────────────────────────────
  const QUALITY_CONFIG = {
    excelente: { color: 'text-emerald-400', bg: 'bg-emerald-950/30 border-emerald-800/40', dot: 'bg-emerald-400', label: 'Tracking Excelente' },
    degradado:  { color: 'text-amber-400',   bg: 'bg-amber-950/30 border-amber-800/40',     dot: 'bg-amber-400',   label: 'Tracking Degradado'  },
    perdido:    { color: 'text-red-400',      bg: 'bg-red-950/30 border-red-800/40',         dot: 'bg-red-400 animate-pulse', label: 'Tracking Perdido' }
  };

  const defaultIndices = PUNTOS_MEDICION[region][lado] as unknown as number[];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="main-content">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/" className="btn btn-secondary p-2 rounded-full">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Módulo de Captura</h1>
          <p className="text-sm text-zinc-400">Grabación y procesamiento analítico de temblores en tiempo real.</p>
        </div>
      </div>

      {/* ━━ STEP WIZARD ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex items-center gap-0">
        {[
          {
            num: 1,
            label: 'Configurar Sesión',
            sub: 'Paciente, región y fármaco',
            done: !!selectedPatientId,
            active: !isCameraActive
          },
          {
            num: 2,
            label: 'Activar Cámara',
            sub: 'Posicionar al paciente',
            done: isCameraActive,
            active: isCameraActive && !isRecording
          },
          {
            num: 3,
            label: 'Grabar y Guardar',
            sub: 'Iniciar medición',
            done: !!calculatedMetrics,
            active: isRecording
          }
        ].map((step, i) => (
          <React.Fragment key={step.num}>
            <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg transition-all ${
              step.done
                ? 'bg-emerald-950/20 border border-emerald-900/30'
                : step.active
                  ? 'bg-indigo-950/30 border border-indigo-800/40'
                  : 'bg-zinc-900/40 border border-zinc-800/30'
            }`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                step.done
                  ? 'bg-emerald-500 text-black'
                  : step.active
                    ? 'bg-indigo-500 text-white'
                    : 'bg-zinc-800 text-zinc-500'
              }`}>
                {step.done ? '✓' : step.num}
              </span>
              <div className="hidden sm:block">
                <p className={`text-xs font-semibold leading-none ${
                  step.done ? 'text-emerald-400' : step.active ? 'text-indigo-300' : 'text-zinc-500'
                }`}>{step.label}</p>
                <p className="text-[10px] text-zinc-600 mt-0.5">{step.sub}</p>
              </div>
            </div>
            {i < 2 && (
              <div className={`h-px flex-1 mx-1 transition-all ${
                step.done ? 'bg-emerald-900/50' : 'bg-zinc-800/50'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Left: Camera ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="relative">
            {isCameraActive ? (
              <WebcamCapture
                region={region}
                lado={lado}
                isRecording={isRecording}
                isMockMode={isMockMode}
                landmarksPersonalizados={landmarksPersonalizados}
                modoSeleccionActivo={modoSeleccionActivo && !isRecording}
                zoom={zoom}
                onDataCollected={handleDataCollected}
                onTrackingQuality={setTrackingQuality}
                onLandmarkClick={handleLandmarkClick}
              />
            ) : (
              /* ── RICH IDLE STATE ──────────────────────────────────── */
              <div className="flex flex-col items-center justify-center gap-6 py-14 px-8 bg-zinc-950/60 border border-zinc-800/40 rounded-xl">
                {/* SVG Face silhouette guide */}
                <div className="relative flex items-center justify-center">
                  <svg width="180" height="210" viewBox="0 0 180 210" fill="none" className="opacity-20">
                    {/* Head outline */}
                    <ellipse cx="90" cy="85" rx="62" ry="72" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4 3" />
                    {/* Neck */}
                    <rect x="76" y="154" width="28" height="30" rx="6" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4 3" />
                    {/* Left eye */}
                    <ellipse cx="67" cy="78" rx="12" ry="7" stroke="#22d3ee" strokeWidth="1.2" />
                    <circle cx="67" cy="78" r="3" fill="#22d3ee" opacity="0.5" />
                    {/* Right eye */}
                    <ellipse cx="113" cy="78" rx="12" ry="7" stroke="#22d3ee" strokeWidth="1.2" />
                    <circle cx="113" cy="78" r="3" fill="#22d3ee" opacity="0.5" />
                    {/* Nose bridge */}
                    <path d="M90 88 L83 108 L97 108" stroke="#9ca3af" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                    {/* Mouth */}
                    <path d="M72 122 Q90 134 108 122" stroke="#9ca3af" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                    {/* Eyebrows */}
                    <path d="M55 68 Q67 62 79 66" stroke="#9ca3af" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                    <path d="M101 66 Q113 62 125 68" stroke="#9ca3af" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                    {/* Corner guides */}
                    <path d="M10 30 L10 10 L30 10" stroke="#6366f1" strokeWidth="1.5" opacity="0.6" />
                    <path d="M150 10 L170 10 L170 30" stroke="#6366f1" strokeWidth="1.5" opacity="0.6" />
                    <path d="M10 180 L10 200 L30 200" stroke="#6366f1" strokeWidth="1.5" opacity="0.6" />
                    <path d="M150 200 L170 200 L170 180" stroke="#6366f1" strokeWidth="1.5" opacity="0.6" />
                    {/* Center cross */}
                    <circle cx="90" cy="90" r="2" fill="#6366f1" opacity="0.4" />
                    <path d="M82 90 L98 90 M90 82 L90 98" stroke="#6366f1" strokeWidth="0.8" opacity="0.4" />
                  </svg>
                  {/* Pulsing ring */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-36 h-36 rounded-full border border-indigo-500/10 animate-ping" style={{animationDuration:'3s'}} />
                  </div>
                </div>

                <div className="text-center max-w-xs">
                  <p className="text-sm font-semibold text-zinc-300 mb-1">Cámara inactiva</p>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Active la cámara y posicione al paciente frente al dispositivo.
                    Mantenga el rostro centrado dentro del encuadre.
                  </p>
                </div>

                {/* Quick positioning checklist */}
                <div className="grid grid-cols-3 gap-3 text-[10px] text-zinc-500 w-full max-w-sm">
                  {[
                    { icon: '💡', text: 'Iluminación frontal uniforme' },
                    { icon: '📏', text: '40–60 cm de distancia' },
                    { icon: '🎯', text: 'Rostro centrado en cámara' },
                  ].map(({ icon, text }) => (
                    <div key={text} className="flex flex-col items-center gap-1 text-center p-2 bg-zinc-900/40 rounded-lg border border-zinc-800/30">
                      <span className="text-lg">{icon}</span>
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* HUD: Recording timer */}
            {isRecording && (
              <div className="absolute top-4 right-4 bg-red-950/80 border border-red-800/40 px-3 py-1.5 rounded-lg flex items-center gap-2 text-red-400 font-mono text-sm animate-pulse">
                <Circle size={10} fill="currentColor" />
                <span>{timerText}</span>
              </div>
            )}

            {/* HUD: M5 Tracking quality badge */}
            {trackingQuality && isCameraActive && !isMockMode && (
              <div className={`absolute top-4 left-4 border px-2.5 py-1 rounded-lg flex items-center gap-2 text-xs font-semibold ${QUALITY_CONFIG[trackingQuality].bg} ${QUALITY_CONFIG[trackingQuality].color}`}>
                <span className={`w-2 h-2 rounded-full inline-block ${QUALITY_CONFIG[trackingQuality].dot}`} />
                {QUALITY_CONFIG[trackingQuality].label}
              </div>
            )}

            {/* HUD: Custom landmarks indicator */}
            {landmarksPersonalizados && !isRecording && (
              <div className="absolute bottom-4 left-4 bg-amber-950/80 border border-amber-700/50 px-2.5 py-1 rounded-lg flex items-center gap-2 text-xs font-mono text-amber-400">
                ✦ Puntos personalizados activos [{landmarksPersonalizados.join(' → ')}]
              </div>
            )}

            {/* Floating Zoom Control */}
            {isCameraActive && (
              <div className="absolute bottom-4 right-4 bg-zinc-950/80 border border-zinc-800/80 rounded-lg px-2.5 py-1.5 flex items-center gap-2 z-10 shadow-lg backdrop-blur-sm">
                <span className="text-[10px] font-mono text-zinc-400 font-bold">Zoom: {zoom.toFixed(1)}x</span>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-20 accent-indigo-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  title="Arrastre para hacer zoom sobre el rostro"
                />
                <button
                  onClick={() => setZoom(1)}
                  className="text-[9px] font-mono text-zinc-400 hover:text-zinc-200 border border-zinc-800 px-1 py-0.5 rounded transition-colors"
                  title="Restablecer a 1x"
                >
                  Reset
                </button>
              </div>
            )}
          </div>

          {/* Controls bar */}
          <div className="card p-5 flex flex-wrap justify-between items-center gap-4">
            {/* Pre-recording session summary badge */}
            {!isRecording && isCameraActive && (
              <div className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900/60 border border-zinc-800/30 text-[11px]">
                <span className="text-zinc-600 font-bold uppercase tracking-wider shrink-0">Configuración actual:</span>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 bg-indigo-950/40 border border-indigo-800/30 text-indigo-300 rounded font-semibold">
                    {patients.find(p => p.id === selectedPatientId)?.name ?? '—'}
                  </span>
                  <span className={`px-2 py-0.5 rounded font-semibold border ${
                    modo === 'PRE'
                      ? 'bg-amber-950/30 border-amber-800/30 text-amber-400'
                      : 'bg-emerald-950/30 border-emerald-800/30 text-emerald-400'
                  }`}>
                    {modo}
                  </span>
                  <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-700 text-zinc-300 rounded font-semibold font-mono">
                    {region} / {lado}
                  </span>
                  {landmarksPersonalizados && (
                    <span className="px-2 py-0.5 bg-amber-950/30 border border-amber-800/30 text-amber-400 rounded font-mono">
                      ✶ Puntos custom
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {!isCameraActive ? (
                <button onClick={() => setIsCameraActive(true)} className="btn btn-primary">
                  <Camera size={16} /> Activar Cámara
                </button>
              ) : (
                <button
                  onClick={() => { setIsCameraActive(false); setIsRecording(false); stopChronometer(); }}
                  className="btn btn-secondary"
                  disabled={isRecording}
                >
                  Apagar Cámara
                </button>
              )}

              {isCameraActive && (
                <>
                  {!isRecording ? (
                    <button onClick={handleStartRecording} className="btn btn-danger text-red-100 flex items-center gap-2">
                      <Circle size={14} fill="currentColor" /> Iniciar Grabación
                    </button>
                  ) : (
                    <button onClick={handleStopRecording} className="btn btn-secondary text-zinc-200 border-red-800/40 hover:bg-zinc-800 flex items-center gap-2">
                      <Square size={14} fill="currentColor" /> Detener Grabación
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="flex flex-col gap-1 text-xs">
              <span className="flex items-center gap-1 text-zinc-500 font-bold uppercase tracking-wider">
                Modo Ejecución
                <TooltipAyuda
                  posicion="top"
                  texto="Simulado: usa datos pre-grabados sin cámara. Real: usa la webcam y visión por computadora con MediaPipe."
                />
              </span>
              <div className="flex border border-zinc-800 rounded overflow-hidden bg-zinc-950 max-w-[280px]">
                <button
                  onClick={() => !isRecording && setIsMockMode(true)}
                  disabled={isRecording}
                  className={`flex-1 text-[11px] font-bold py-1.5 px-3 transition-all ${
                    isMockMode
                      ? 'bg-amber-950/30 text-amber-400 border-r border-zinc-800/40'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Simulado
                </button>
                <button
                  onClick={() => !isRecording && setIsMockMode(false)}
                  disabled={isRecording}
                  className={`flex-1 text-[11px] font-bold py-1.5 px-3 transition-all ${
                    !isMockMode
                      ? 'bg-emerald-950/30 text-emerald-400 border-l border-zinc-800/40'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Cámara Real
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Config + Results ───────────────────────────────────────── */}
        <div className="lg:col-span-1 flex flex-col gap-6">

          {/* Clinical profile */}
          <div className="card">
            <h3 className="text-md font-bold mb-4 flex items-center gap-2">
              <User size={18} className="text-indigo-400" /> Registro Clínico
              <TooltipAyuda
                posicion="right"
                texto="Complete todos los campos antes de iniciar la grabación. El sistema asociará los datos biomecánicos capturados al perfil del paciente y la configuración seleccionada."
              />
            </h3>

            <div className="flex flex-col gap-4">
              {/* Patient selector */}
              <div className="form-group mb-0">
                <label className="form-label flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    Paciente
                    <TooltipAyuda
                      posicion="right"
                      texto="Seleccione el paciente que se evaluará en esta sesión o registre un nuevo perfil clínico."
                    />
                  </span>
                </label>
                <div className="flex gap-2">
                  <select value={selectedPatientId} onChange={e => setSelectedPatientId(e.target.value)}
                    className="input-text text-zinc-300 py-1.5 flex-1" disabled={isRecording}>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <button type="button" onClick={() => setIsPatientModalOpen(true)}
                    disabled={isRecording}
                    className="btn btn-secondary px-3 py-1.5 text-xs font-bold whitespace-nowrap">
                    + Registrar
                  </button>
                </div>
              </div>

              {/* L-DOPA status */}
              <div className="form-group mb-0">
                <label className="form-label flex items-center gap-1">
                  Estado Fármaco (L-Dopa)
                  <TooltipAyuda
                    posicion="right"
                    texto="Indique si la evaluación se realiza ANTES (PRE) o DESPUÉS (POST) de la administración de Levodopa. Esta distinción es fundamental para comparar la eficacia farmacológica del tratamiento en el tiempo."
                  />
                </label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button onClick={() => setModo('PRE')}
                    className={`btn text-xs py-2 ${modo === 'PRE' ? 'bg-amber-950/20 border-amber-900 text-amber-400' : 'btn-secondary text-zinc-400'}`}
                    disabled={isRecording}>PRE (Antes de L-Dopa)</button>
                  <button onClick={() => setModo('POST')}
                    className={`btn text-xs py-2 ${modo === 'POST' ? 'bg-emerald-950/20 border-emerald-900 text-emerald-400' : 'btn-secondary text-zinc-400'}`}
                    disabled={isRecording}>POST (Después de L-Dopa)</button>
                </div>
              </div>

              {/* ── M1: Region toggle buttons ─────────────────────────────── */}
              <div className="form-group mb-0">
                <label className="form-label flex items-center gap-1">
                  Región de Medición
                  <TooltipAyuda
                    posicion="top"
                    texto="Seleccione el área anatómica a analizar. El sistema calcula el ángulo articular usando landmarks de MediaPipe Face Mesh (rostro) o Pose (cuerpo). Cada región tiene índices de landmark predefinidos que pueden ajustarse con el Ajuste Fino."
                  />
                </label>
                <div className="grid grid-cols-4 gap-1.5 mt-1">
                  {REGION_BOTONES.map(({ key, icono, label }) => (
                    <button
                      key={key}
                      onClick={() => handleRegionChange(key)}
                      disabled={isRecording}
                      className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg border text-[10px] font-semibold transition-all ${
                        region === key
                          ? 'bg-indigo-950/40 border-indigo-600/60 text-indigo-300 ring-1 ring-indigo-500/30'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-400'
                      }`}
                    >
                      <span className="text-lg leading-none">{icono}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Side selector */}
              <div className="form-group mb-0">
                <label className="form-label flex items-center gap-1">
                  Lado Facial
                  <TooltipAyuda
                    posicion="top"
                    texto="Evalúe ambos lados del rostro en sesiones separadas para calcular el Índice de Asimetría bilateral. Un índice > 20% puede indicar paresia facial."
                  />
                </label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {(['DERECHA', 'IZQUIERDA'] as LadoKey[]).map(l => (
                    <button key={l} onClick={() => setLado(l)} disabled={isRecording}
                      className={`btn text-xs py-2 ${lado === l ? 'bg-indigo-950/30 border-indigo-700 text-indigo-300' : 'btn-secondary text-zinc-400'}`}>
                      {l === 'DERECHA' ? '→ Derecha' : '← Izquierda'}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Enfoque C: Ajuste Fino panel ──────────────────────────── */}
              <div className="border border-zinc-800 rounded-xl overflow-hidden">
                <button
                  onClick={() => setPanelAjusteAbierto(!panelAjusteAbierto)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/40 transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Crosshair size={13} className="text-amber-400" />
                    Ajuste Fino de Landmarks
                    {landmarksPersonalizados && (
                      <span className="ml-1 text-[10px] bg-amber-950/40 border border-amber-800/40 text-amber-400 px-1.5 py-0.5 rounded font-mono">
                        ACTIVO
                      </span>
                    )}
                  </span>
                  {panelAjusteAbierto ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {panelAjusteAbierto && (
                  <div className="px-3 pb-3 flex flex-col gap-3 border-t border-zinc-800 pt-3">
                    {/* Default indices reference */}
                    <p className="text-[10px] text-zinc-500">
                      Defaults de <span className="text-indigo-400 font-mono">{region}/{lado}</span>:{' '}
                      <span className="font-mono text-zinc-400">[{defaultIndices.join(', ')}]</span>
                    </p>

                    {/* Toggle selection mode */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-400">Modo click sobre canvas</span>
                      <button
                        onClick={() => setModoSeleccionActivo(!modoSeleccionActivo)}
                        disabled={isRecording || isMockMode}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold border transition-all ${
                          modoSeleccionActivo
                            ? 'bg-amber-950/30 border-amber-700/50 text-amber-400'
                            : 'bg-zinc-900 border-zinc-700 text-zinc-500 hover:text-zinc-400'
                        }`}
                        title={isMockMode ? 'Requiere cámara real' : ''}
                      >
                        {modoSeleccionActivo ? <Eye size={11} /> : <EyeOff size={11} />}
                        {modoSeleccionActivo ? 'Activo' : 'Inactivo'}
                      </button>
                    </div>

                    {isMockMode && (
                      <p className="text-[10px] text-amber-600">⚠ Requiere cámara real (desactivar modo simulado)</p>
                    )}

                    {modoSeleccionActivo && (
                      <p className="text-[10px] text-zinc-500 italic">
                        Haga click sobre el rostro en el canvas para asignar los puntos P1, Vértice y P3.
                      </p>
                    )}

                    {/* Slot status */}
                    <div className="flex flex-col gap-1.5">
                      {SLOT_LABELS.map((label, i) => (
                        <div key={i} className="flex items-center justify-between bg-zinc-900/60 rounded-lg px-2.5 py-1.5">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: SLOT_COLORES[i] }} />
                            <span className="text-[11px] text-zinc-400">{label}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-mono" style={{ color: SLOT_COLORES[i] }}>
                              {slotsPersonalizados[i] !== null ? `#${slotsPersonalizados[i]}` : <span className="text-zinc-600">—</span>}
                            </span>
                            {slotsPersonalizados[i] !== null && (
                              <button onClick={() => handleResetSlot(i)} className="text-zinc-600 hover:text-red-400 transition-colors text-xs">✕</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Reset all */}
                    <button
                      onClick={handleResetAllSlots}
                      className="btn btn-secondary text-xs py-1.5 flex items-center justify-center gap-1.5 hover:text-red-400 transition-colors"
                    >
                      <RotateCcw size={12} /> Resetear a defaults
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Analytical Results HUD ──────────────────────────────────────── */}
          {calculatedMetrics && (
            <div className="card border-emerald-500/20 flex flex-col gap-4 animate-fade-in">
              <h3 className="text-md font-bold flex items-center gap-2 text-emerald-400">
                <Activity size={18} /> Resultados del Análisis
                <TooltipAyuda
                  posicion="left"
                  texto="Métricas calculadas al finalizar la grabación. Guarde el registro para persistir estos datos en la base de datos y que aparezcan en el Historial de Tendencias."
                />
              </h3>

              {landmarksPersonalizados && (
                <div className="text-[10px] font-mono text-amber-400 bg-amber-950/20 border border-amber-800/30 rounded px-2 py-1">
                  ✦ Calculado con puntos personalizados [{landmarksPersonalizados.join(' → ')}]
                </div>
              )}

              <div className="flex flex-col gap-3">
                {[
                  {
                    label: 'Rango de Movimiento',
                    value: `${calculatedMetrics.angMin}° - ${calculatedMetrics.angMax}°`,
                    color: 'text-zinc-200',
                    tooltip: 'ROM (Range of Motion): diferencia entre el ángulo mínimo y máximo registrado. Un ROM reducido puede indicar rigidez o limitación motora.'
                  },
                  {
                    label: 'Ángulo Promedio',
                    value: `${calculatedMetrics.angAvg}°`,
                    color: 'text-zinc-200',
                    tooltip: 'Promedio de todos los ángulos registrados frame a frame durante la sesión. Representa la posición de reposo funcional.'
                  },
                  {
                    label: 'Velocidad Máxima',
                    value: `${calculatedMetrics.maxVel}°/s`,
                    color: 'text-indigo-400',
                    tooltip: 'Velocidad angular pico (°/s) calculada por diferencias finitas entre frames consecutivos. Valores bajos pueden indicar bradicinesia.'
                  },
                  {
                    label: 'Frecuencia Temblor',
                    value: calculatedMetrics.tremorFreq > 0 ? `${calculatedMetrics.tremorFreq} Hz` : 'No detectado',
                    color: 'text-zinc-200',
                    tooltip: 'Frecuencia dominante del temblor detectada por FFT. Rango parkinsoniano típico: 3.5 Hz – 12 Hz. Temblor de reposo: 3–6 Hz. Postural: 5–12 Hz.'
                  },
                  {
                    label: 'Amplitud Temblor',
                    value: calculatedMetrics.tremorAmp > 0 ? `${calculatedMetrics.tremorAmp}°` : '0°',
                    color: 'text-zinc-200',
                    tooltip: 'Magnitud del temblor en grados, calculada como desviación estándar de la señal filtrada. Refleja la intensidad del temblor involuntario.'
                  }
                ].map(({ label, value, color, tooltip }, i, arr) => (
                  <div key={label} className={`flex justify-between items-center py-1 ${i < arr.length - 1 ? 'border-b border-zinc-800/50' : ''}`}>
                    <span className="flex items-center gap-1 text-xs text-zinc-400">
                      {label}
                      <TooltipAyuda texto={tooltip} posicion="left" iconoSize={11} />
                    </span>
                    <span className={`text-sm font-semibold font-mono ${color}`}>{value}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-2">
                <button onClick={handleSaveToDatabase} className="btn btn-primary flex-1 flex justify-center items-center gap-2" disabled={saveStatus === 'saving'}>
                  {saveStatus === 'saving' ? <>Guardando...</> : saveStatus === 'success' ? <><CheckCircle size={16} /> ¡Guardado!</> : <><Save size={16} /> Guardar Registro</>}
                </button>
                <button onClick={handleDiscardRecording} className="btn btn-secondary hover:bg-red-950/20 hover:text-red-400 transition-all" disabled={saveStatus === 'saving'}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Modal Overlay for Patient Registration */}
      {isPatientModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button onClick={() => setIsPatientModalOpen(false)} className="modal-close" aria-label="Cerrar modal">✕</button>
            <h3 className="modal-title flex items-center gap-2">
              <User size={18} style={{ color: 'var(--success)' }} />
              Registrar Nuevo Paciente
            </h3>
            <form onSubmit={handleCreatePatient} className="flex flex-col gap-4 mt-2">
              <div className="form-group">
                <label className="form-label">Nombre Completo del Paciente</label>
                <input type="text" value={newPatientName} onChange={e => setNewPatientName(e.target.value)}
                  placeholder="Ej. Carmen Rodriguez" className="input-text" required autoFocus />
              </div>
              <div className="flex gap-2 justify-end mt-2">
                <button type="button" onClick={() => setIsPatientModalOpen(false)} className="btn btn-secondary text-xs">Cancelar</button>
                <button type="submit" className="btn btn-primary text-xs">Crear Perfil</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

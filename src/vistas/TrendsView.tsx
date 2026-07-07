'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Session } from '@/biblioteca/types/database';
import dynamic from 'next/dynamic';

const LongitudinalCharts = dynamic(() => import('@/componentes_visuales/LongitudinalCharts'), {
  ssr: false,
  loading: () => (
    <div className="card h-96 flex flex-col items-center justify-center bg-zinc-900 border border-zinc-800 rounded-xl text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500 mb-4" />
      <p className="text-zinc-400 text-sm">Cargando gráficos de tendencias...</p>
    </div>
  )
});
import { 
  TrendingUp, Download, ArrowLeft, Activity, 
  Sparkles, Calendar, Info, BarChart2, Scale, AlertCircle 
} from 'lucide-react';
import { exportarPDF, exportarExcel } from '@/biblioteca/exports';

interface PatientDetail {
  id: string;
  name: string;
  birth_date: string | null;
}

function TrendsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const patientId = searchParams.get('patientId');

  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('CEJA');
  const [selectedLado, setSelectedLado] = useState<string>('IZQUIERDA');

  // Load patient details & sessions
  useEffect(() => {
    if (!patientId) return;
    const pId = patientId;

    async function loadPatientData() {
      try {
        // Fetch patients list and find active patient profile
        const pResponse = await fetch('/api/patients');
        const pData = await pResponse.json();
        const activeP = pData.find((p: any) => p.id === pId);

        if (pResponse.ok && activeP) {
          setPatient(activeP);
        } else {
          setPatient({ id: pId, name: 'Paciente A (Simulado)', birth_date: '1960-04-12' });
        }

        // Fetch sessions from local SQLite API
        const sResponse = await fetch(`/api/sessions?patientId=${pId}`);
        const sData = await sResponse.json();

        if (sResponse.ok) {
          setSessions(sData || []);
          if (sData && sData.length > 0) {
            setSelectedRegion(sData[0].region);
            setSelectedLado(sData[0].lado);
          }
        } else if (pId.startsWith('mock-')) {
          setSessions(getMockSessions(pId));
        } else {
          setSessions([]);
        }
      } catch (err) {
        console.warn('Error loading trend data:', err);
        if (pId.startsWith('mock-')) {
          setPatient({ id: pId, name: 'Paciente A (Simulado)', birth_date: '1960-04-12' });
          setSessions(getMockSessions(pId));
        } else {
          setPatient(null);
          setSessions([]);
        }
      }
    }

    loadPatientData();
  }, [patientId]);

  // Mock sessions helper (synchronized with dates)
  const getMockSessions = (pId: string): Session[] => [
    {
      id: 'sess-1',
      patient_id: pId,
      modo: 'PRE',
      region: 'CEJA',
      lado: 'IZQUIERDA',
      tiempo_medicion: 8.5,
      angulo_min: 135.2,
      angulo_max: 154.1,
      angulo_promedio: 144.5,
      velocidad_max: 42.1,
      frecuencia_temblor: 5.2,
      amplitud_temblor: 1.8,
      asimetria_index: null,
      datos_angulos: '0,140;1,142;2,141;3,138;4,145;5,143;6,150;7,148;8,154',
      created_at: new Date(Date.now() - 3 * 86400000).toISOString() // 3 days ago
    },
    {
      id: 'sess-2',
      patient_id: pId,
      modo: 'POST',
      region: 'CEJA',
      lado: 'IZQUIERDA',
      tiempo_medicion: 9.1,
      angulo_min: 132.1,
      angulo_max: 159.4,
      angulo_promedio: 145.8,
      velocidad_max: 56.4,
      frecuencia_temblor: 0,
      amplitud_temblor: 0,
      asimetria_index: null,
      datos_angulos: '0,142;1,145;2,148;3,150;4,152;5,155;6,158;7,159;8,157',
      created_at: new Date(Date.now() - 3 * 86400000 + 1800000).toISOString()
    },
    {
      id: 'sess-3',
      patient_id: pId,
      modo: 'PRE',
      region: 'CEJA',
      lado: 'IZQUIERDA',
      tiempo_medicion: 8.2,
      angulo_min: 138.4,
      angulo_max: 151.2,
      angulo_promedio: 142.8,
      velocidad_max: 38.2,
      frecuencia_temblor: 5.5,
      amplitud_temblor: 2.2,
      asimetria_index: null,
      datos_angulos: '0,140;1,141;2,139;3,143;4,142;5,148;6,150;7,151',
      created_at: new Date(Date.now() - 86400000).toISOString() // Yesterday
    },
    {
      id: 'sess-4',
      patient_id: pId,
      modo: 'POST',
      region: 'CEJA',
      lado: 'IZQUIERDA',
      tiempo_medicion: 8.9,
      angulo_min: 134.1,
      angulo_max: 161.5,
      angulo_promedio: 147.2,
      velocidad_max: 60.1,
      frecuencia_temblor: 0,
      amplitud_temblor: 0,
      asimetria_index: null,
      datos_angulos: '0,140;1,144;2,148;3,152;4,156;5,160;6,161;7,159',
      created_at: new Date(Date.now() - 86400000 + 1800000).toISOString()
    }
  ];

  if (!patientId) {
    return (
      <div className="main-content flex flex-col items-center justify-center h-96">
        <AlertCircle size={48} className="text-zinc-500 mb-4" />
        <h2 className="text-lg font-bold">Sin paciente seleccionado</h2>
        <p className="text-sm text-zinc-400 mb-4">Por favor, vuelva al dashboard para seleccionar un paciente.</p>
        <Link href="/" className="btn btn-primary">Ir al Dashboard</Link>
      </div>
    );
  }

  // Filter sessions for the active chart parameters
  const activeSessions = sessions.filter(
    s => s.region === selectedRegion && s.lado === selectedLado
  );

  // Format Recharts data (combine PRE and POST of the same date/time)
  const chartData = activeSessions.reduce((acc: any[], session) => {
    const dateStr = new Date(session.created_at).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
    
    // Find if date already exists in accumulator
    let day = acc.find(d => d.date === dateStr);
    if (!day) {
      day = { date: dateStr };
      acc.push(day);
    }
    
    const rom = session.angulo_max - session.angulo_min;
    
    if (session.modo === 'PRE') {
      day.PRE_ROM = parseFloat(rom.toFixed(1));
      day.PRE_Vel = session.velocidad_max;
      day.PRE_Tremor = session.frecuencia_temblor || 0;
    } else {
      day.POST_ROM = parseFloat(rom.toFixed(1));
      day.POST_Vel = session.velocidad_max;
      day.POST_Tremor = session.frecuencia_temblor || 0;
    }
    
    return acc;
  }, []);

  // Compute PRE vs POST Comparison (take the latest session pair)
  const preSession = [...activeSessions].reverse().find(s => s.modo === 'PRE');
  const postSession = [...activeSessions].reverse().find(s => s.modo === 'POST');

  const preRom = preSession ? preSession.angulo_max - preSession.angulo_min : 0;
  const postRom = postSession ? postSession.angulo_max - postSession.angulo_min : 0;

  const romDiffAbs = postRom - preRom;
  const romDiffPct = preRom > 0 ? (romDiffAbs / preRom) * 100 : 0;

  const velDiffAbs = postSession && preSession ? postSession.velocidad_max - preSession.velocidad_max : 0;
  const velDiffPct = preSession && preSession.velocidad_max > 0 ? (velDiffAbs / preSession.velocidad_max) * 100 : 0;

  const tremorDiffAbs = postSession && preSession ? (postSession.amplitud_temblor || 0) - (preSession.amplitud_temblor || 0) : 0;

  // Handles export calls
  const handleExportPDF = () => {
    if (!patient) return;
    exportarPDF(patient, activeSessions);
  };

  const handleExportExcel = () => {
    if (!patient) return;
    exportarExcel(patient, activeSessions);
  };

  return (
    <div className="main-content">
      {/* Navigation & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <Link href="/" className="btn btn-secondary py-2 px-3 text-xs">
          <ArrowLeft size={16} /> Volver al Dashboard
        </Link>
        
        {patient && (
          <div className="flex flex-col items-end">
            <h1 className="text-xl font-bold">{patient.name}</h1>
            <span className="text-xs text-zinc-400 font-mono">ID Paciente: {patient.id.slice(0, 8)}...</span>
          </div>
        )}

        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={handleExportExcel} className="btn btn-secondary py-2 px-3 text-xs flex-1 md:flex-none">
            <Download size={14} /> Exportar Excel
          </button>
          <button onClick={handleExportPDF} className="btn btn-primary py-2 px-3 text-xs flex-1 md:flex-none">
            <Download size={14} /> Exportar Reporte PDF
          </button>
        </div>
      </div>

      {/* Grid: Configurations & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Metric Configuration (Region, Side) */}
        <div className="lg:col-span-1 card flex flex-col gap-4">
          <h3 className="text-md font-bold mb-1">Parámetros del Gráfico</h3>
          
          <div className="form-group mb-0">
            <label className="form-label">Región Facial</label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="input-text text-zinc-300 py-1.5"
            >
              <option value="CEJA">Cejas</option>
              <option value="BOCA">Comisura Labial</option>
              <option value="PARPADO">Párpados</option>
            </select>
          </div>

          <div className="form-group mb-0">
            <label className="form-label">Lado Analizado</label>
            <select
              value={selectedLado}
              onChange={(e) => setSelectedLado(e.target.value)}
              className="input-text text-zinc-300 py-1.5"
            >
              <option value="DERECHA">Derecha</option>
              <option value="IZQUIERDA">Izquierda</option>
            </select>
          </div>

          <div className="p-3.5 bg-zinc-950/20 border border-zinc-800/40 rounded-lg flex gap-3 text-zinc-400 mt-2">
            <Info size={28} className="text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Seleccione la región y el lado correspondientes para comparar visualmente la evolución de las sesiones de medición **PRE** y **POST** (efecto de la administración de L-DOPA).
            </p>
          </div>
        </div>

        {/* Right: Evolution Comparison Stats */}
        <div className="lg:col-span-2 card grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-3 pb-2 border-b border-zinc-800/60">
            <h3 className="text-md font-bold flex items-center gap-2">
              <Scale size={18} className="text-indigo-400" /> Comparativa Farmacológica (Efecto L-Dopa)
            </h3>
            <span className="text-[10px] text-zinc-500">Última medición registrada contra línea base.</span>
          </div>

          {/* ROM Difference */}
          <div className="flex flex-col gap-1.5 justify-center">
            <span className="text-xs text-zinc-500 block uppercase font-bold tracking-wider">Rango Movimiento (ROM)</span>
            <div className="flex items-baseline gap-2">
              <span className={`text-xl font-bold font-mono ${romDiffAbs >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {romDiffAbs >= 0 ? `+${romDiffAbs.toFixed(1)}°` : `${romDiffAbs.toFixed(1)}°`}
              </span>
              <span className="text-xs text-zinc-400">({romDiffPct >= 0 ? `+${romDiffPct.toFixed(1)}%` : `${romDiffPct.toFixed(1)}%`})</span>
            </div>
            <span className="text-[10px] text-zinc-400 leading-normal">
              {romDiffAbs >= 0 ? 'Mejora en la movilidad facial.' : 'Disminución del rango activo.'}
            </span>
          </div>

          {/* Velocity Difference */}
          <div className="flex flex-col gap-1.5 justify-center">
            <span className="text-xs text-zinc-500 block uppercase font-bold tracking-wider">Velocidad Máxima</span>
            <div className="flex items-baseline gap-2">
              <span className={`text-xl font-bold font-mono ${velDiffAbs >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {velDiffAbs >= 0 ? `+${velDiffAbs.toFixed(1)}°/s` : `${velDiffAbs.toFixed(1)}°/s`}
              </span>
              <span className="text-xs text-zinc-400">({velDiffPct >= 0 ? `+${velDiffPct.toFixed(1)}%` : `${velDiffPct.toFixed(1)}%`})</span>
            </div>
            <span className="text-[10px] text-zinc-400 leading-normal">
              {velDiffAbs >= 0 ? 'Mayor agilidad en la contracción.' : 'Movimiento más lento/rígido.'}
            </span>
          </div>

          {/* Tremor Difference */}
          <div className="flex flex-col gap-1.5 justify-center">
            <span className="text-xs text-zinc-500 block uppercase font-bold tracking-wider">Amplitud Temblor</span>
            <span className={`text-xl font-bold font-mono ${tremorDiffAbs <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {tremorDiffAbs <= 0 ? `${tremorDiffAbs.toFixed(1)}°` : `+${tremorDiffAbs.toFixed(1)}°`}
            </span>
            <span className="text-[10px] text-zinc-400 leading-normal">
              {tremorDiffAbs <= 0 ? 'Reducción o estabilidad del temblor.' : 'Incremento en oscilaciones involuntarias.'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Longitudinal Charts Panel */}
      <div className="card border-zinc-800/70 p-6 flex flex-col gap-6">
        <div className="flex justify-between items-center pb-3 border-b border-zinc-800/50">
          <h3 className="text-md font-bold flex items-center gap-2">
            <BarChart2 size={20} className="text-emerald-400" /> Tendencias del Paciente
          </h3>
          <span className="text-[11px] font-mono text-zinc-500">
            Filtro: {selectedRegion} - LADO {selectedLado}
          </span>
        </div>

        {activeSessions.length > 0 ? (
          <div className="w-full">
            <LongitudinalCharts chartData={chartData} />
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6">
            <AlertCircle size={36} className="text-zinc-600 mb-2" />
            <h4 className="text-zinc-300 font-semibold text-sm">Sin datos para graficar</h4>
            <p className="text-xs text-zinc-500 max-w-sm mt-1">
              No se han registrado suficientes sesiones para la región {selectedRegion} y lado {selectedLado}. Realice más mediciones.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function TrendsView() {
  return (
    <Suspense fallback={
      <div className="main-content flex flex-col items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500 mb-4" />
        <p className="text-zinc-400 text-sm">Cargando módulo de tendencias...</p>
      </div>
    }>
      <TrendsContent />
    </Suspense>
  );
}

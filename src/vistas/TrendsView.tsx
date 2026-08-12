'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Session } from '@/biblioteca/types/database';
import { RegionKey, LadoKey } from '@/biblioteca/math/angles';
import dynamic from 'next/dynamic';

const LongitudinalCharts = dynamic(() => import('@/componentes_visuales/LongitudinalCharts'), {
  ssr: false,
  loading: () => (
    <div className="card" style={{ height: 384, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 mb-4" style={{ borderColor: 'var(--accent)' }} />
      <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Cargando gráficos de tendencias...</p>
    </div>
  )
});
import { 
  TrendingUp, Download, ArrowLeft, Activity, 
  Sparkles, Calendar, Info, BarChart2, Scale, AlertCircle,
  Brain, HeartPulse, Fingerprint
} from 'lucide-react';
import { exportarPDF, exportarExcel } from '@/biblioteca/exports';
import { TooltipAyuda } from '@/componentes_visuales/TooltipAyuda';

function parseDbsParams(datosAngulos: string) {
  if (datosAngulos && datosAngulos.startsWith('#DBS:')) {
    const match = datosAngulos.match(/#DBS:V=([\d.]+),F=(\d+),W=(\d+);/);
    if (match) {
      return {
        voltage: parseFloat(match[1]),
        frecuencia: parseInt(match[2]),
        anchoPulso: parseInt(match[3])
      };
    }
  }
  return null;
}

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
  const [selectedRegion, setSelectedRegion] = useState<RegionKey>('CEJA');
  const [selectedLado, setSelectedLado] = useState<LadoKey>('IZQUIERDA');

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
  const getMockSessions = (pId: string): Session[] => {
    const now = Date.now();
    return [
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
        created_at: new Date(now - 3 * 86400000).toISOString() // 3 days ago
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
        created_at: new Date(now - 3 * 86400000 + 1800000).toISOString()
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
        created_at: new Date(now - 86400000).toISOString() // Yesterday
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
        created_at: new Date(now - 86400000 + 1800000).toISOString()
      },
      {
        id: 'sess-5',
        patient_id: pId,
        modo: 'PRE',
        region: 'MARCHA',
        lado: 'IZQUIERDA',
        tiempo_medicion: 10.0,
        angulo_min: 30.5,
        angulo_max: 52.4,
        angulo_promedio: 41.2,
        velocidad_max: 0,
        frecuencia_temblor: 0,
        amplitud_temblor: 0,
        asimetria_index: null,
        datos_angulos: '0,35;2,45;4,38;6,52;8,40;10,48',
        created_at: new Date(now - 86400000).toISOString()
      },
      {
        id: 'sess-6',
        patient_id: pId,
        modo: 'POST',
        region: 'MARCHA',
        lado: 'IZQUIERDA',
        tiempo_medicion: 10.0,
        angulo_min: 35.1,
        angulo_max: 65.2,
        angulo_promedio: 53.6,
        velocidad_max: 0,
        frecuencia_temblor: 0,
        amplitud_temblor: 0,
        asimetria_index: null,
        datos_angulos: '0,40;2,58;4,42;6,65;8,50;10,61',
        created_at: new Date(now - 86400000 + 1800000).toISOString()
      }
    ];
  };

  if (!patientId) {
    return (
      <div className="main-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 384 }}>
        <div className="empty-state">
          <div className="empty-state-ring">
            <AlertCircle size={24} />
          </div>
          <span className="empty-state-text">Por favor, vuelva al dashboard para seleccionar un paciente.</span>
          <Link href="/" className="btn btn-primary">Ir al Dashboard</Link>
        </div>
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
    
    const rom = session.region === 'MARCHA'
      ? session.angulo_promedio
      : session.region === 'TEMBLOR'
      ? session.amplitud_temblor || 0
      : session.angulo_max - session.angulo_min;
    
    const decimals = session.region === 'TEMBLOR' ? 3 : 1;
    
    if (session.modo === 'PRE') {
      day.PRE_ROM = parseFloat(rom.toFixed(decimals));
      day.PRE_Vel = session.velocidad_max;
      day.PRE_Tremor = session.frecuencia_temblor || 0;
    } else {
      day.POST_ROM = parseFloat(rom.toFixed(decimals));
      day.POST_Vel = session.velocidad_max;
      day.POST_Tremor = session.frecuencia_temblor || 0;
    }
    
    return acc;
  }, []);

  // Compute PRE vs POST Comparison (take the latest session pair)
  const preSession = [...activeSessions].reverse().find(s => s.modo === 'PRE');
  const postSession = [...activeSessions].reverse().find(s => s.modo === 'POST');

  const preRom = preSession 
    ? (preSession.region === 'MARCHA' ? preSession.angulo_promedio : preSession.region === 'TEMBLOR' ? preSession.amplitud_temblor || 0 : preSession.angulo_max - preSession.angulo_min)
    : 0;
  const postRom = postSession 
    ? (postSession.region === 'MARCHA' ? postSession.angulo_promedio : postSession.region === 'TEMBLOR' ? postSession.amplitud_temblor || 0 : postSession.angulo_max - postSession.angulo_min)
    : 0;

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
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>ID Paciente: {patient.id.slice(0, 8)}...</span>
          </div>
        )}

        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={handleExportExcel} className="btn btn-secondary py-2 px-3 text-xs flex-1 md:flex-none">
            <Download size={14} /> Exportar Excel <TooltipAyuda posicion="top" texto="Descarga la serie temporal completa de ángulos y velocidades en formato .xlsx para análisis en programas estadísticos." />
          </button>
          <button onClick={handleExportPDF} className="btn btn-primary py-2 px-3 text-xs flex-1 md:flex-none">
            <Download size={14} /> Exportar Reporte PDF <TooltipAyuda posicion="top" texto="Genera un informe clínico profesional en PDF con gráficos, métricas y comparativa PRE vs POST para entregar al paciente." />
          </button>
        </div>
      </div>

      {/* Grid: Configurations & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Metric Configuration (Region, Side) */}
        <div className="lg:col-span-1 card flex flex-col gap-4">
          <h3 className="text-md font-bold mb-1" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Parámetros del Gráfico<TooltipAyuda posicion="top" texto="Seleccione la región anatómica y el lado para filtrar las sesiones a comparar en los gráficos evolutivos." /></h3>
          
          <div className="form-group mb-0">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Región de Evaluación<TooltipAyuda posicion="top" texto="Filtre por la región anatómica o corporal medida durante las sesiones." /></label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value as RegionKey)}
              className="input-text py-1.5"
            >
              <option value="CEJA">Cejas</option>
              <option value="BOCA">Comisura Labial</option>
              <option value="PARPADO">Párpados</option>
              <option value="MARCHA">Marcha (Amplitud)</option>
              <option value="CODO">Codos</option>
              <option value="MUÑECA">Muñecas</option>
              <option value="HOMBRO">Hombros</option>
              <option value="RODILLA">Rodillas</option>
              <option value="CADERA">Caderas</option>
              <option value="TOBILLO">Tobillos</option>
            </select>
          </div>

          <div className="form-group mb-0">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Lado Analizado<TooltipAyuda posicion="top" texto="Seleccione el lado (derecho o izquierdo) para visualizar los resultados de forma independiente y detectar asimetrías." /></label>
            <select
              value={selectedLado}
              onChange={(e) => setSelectedLado(e.target.value as LadoKey)}
              className="input-text py-1.5"
            >
              <option value="DERECHA">Derecha</option>
              <option value="IZQUIERDA">Izquierda</option>
            </select>
          </div>

          <div className="info-banner" style={{ marginTop: 8 }}>
            <Info size={16} style={{ color: 'var(--info)', flexShrink: 0, marginTop: 1 }} />
            <span>
              Seleccione la región y el lado correspondientes para comparar visualmente la evolución de las sesiones de medición PRE y POST (efecto de la administración de L-DOPA).
            </span>
          </div>
        </div>

        {/* Right: Evolution Comparison Stats */}
        <div className="lg:col-span-2 card grid grid-cols-1 md:grid-cols-3 gap-6">
          <div style={{ gridColumn: '1 / -1', paddingBottom: 8, borderBottom: '1px solid var(--border-card)' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Scale size={16} style={{ color: 'var(--info)' }} /> Comparativa Farmacológica (Efecto L-Dopa)
              <TooltipAyuda posicion="top" texto="Compara los resultados PRE vs POST administración de Levodopa para cuantificar la respuesta al tratamiento farmacológico." />
            </h3>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Última medición registrada contra línea base.</span>
          </div>

          {selectedRegion === 'MARCHA' ? (
            <>
              {/* Marcha Difference */}
              <div className="stat-card">
                <span className="stat-card-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Diferencia de Marcha<TooltipAyuda posicion="top" texto="Cambio absoluto y porcentual en la amplitud de paso entre la sesión POST y PRE punción." /></span>
                <div className="stat-card-value">
                  <span style={{ color: romDiffAbs >= 0 ? 'var(--accent)' : 'var(--warning)' }}>
                    {romDiffAbs >= 0 ? `+${romDiffAbs.toFixed(1)}` : `${romDiffAbs.toFixed(1)}`}
                  </span>
                  <span className="unit"> cm</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                    ({romDiffPct >= 0 ? `+${romDiffPct.toFixed(1)}%` : `${romDiffPct.toFixed(1)}%`})
                  </span>
                </div>
                <span className="stat-card-context">
                  {romDiffAbs >= 0 ? 'Aumento del paso post-punción.' : 'Reducción del paso post-punción.'}
                </span>
              </div>

              {/* POST Stride */}
              <div className="stat-card">
                <span className="stat-card-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Amplitud POST-Punción<TooltipAyuda posicion="top" texto="Amplitud promedio del paso registrada después de la punción evacuadora." /></span>
                <div className="stat-card-value">
                  <span style={{ color: 'var(--text-primary)' }}>
                    {postRom > 0 ? `${postRom.toFixed(1)}` : '—'}
                  </span>
                  <span className="unit"> cm</span>
                </div>
                <span className="stat-card-context">
                  Referencia clínica normal: ≥ 50 cm
                </span>
              </div>

              {/* PRE Stride */}
              <div className="stat-card">
                <span className="stat-card-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Amplitud PRE-Punción (Basal)<TooltipAyuda posicion="top" texto="Amplitud promedio del paso inicial registrada antes de la punción." /></span>
                <div className="stat-card-value">
                  <span style={{ color: 'var(--text-primary)' }}>
                    {preRom > 0 ? `${preRom.toFixed(1)}` : '—'}
                  </span>
                  <span className="unit"> cm</span>
                </div>
                <span className="stat-card-context">
                  Amplitud basal del paciente
                </span>
              </div>
            </>
          ) : (
            <>
              {/* ROM Difference */}
              <div className="stat-card">
                <span className="stat-card-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Rango Movimiento (ROM)<TooltipAyuda posicion="top" texto="Diferencia entre el ángulo máximo y mínimo. Un ROM mayor indica mejor movilidad. Valores ≥ 35° se consideran normales en región facial." /></span>
                <div className="stat-card-value">
                  <span style={{ color: romDiffAbs >= 0 ? 'var(--accent)' : 'var(--warning)' }}>
                    {romDiffAbs >= 0 ? `+${romDiffAbs.toFixed(1)}` : `${romDiffAbs.toFixed(1)}`}
                  </span>
                  <span className="unit">°</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                    ({romDiffPct >= 0 ? `+${romDiffPct.toFixed(1)}%` : `${romDiffPct.toFixed(1)}%`})
                  </span>
                </div>
                <span className="stat-card-context">
                  {romDiffAbs >= 0 ? 'Mejora en la movilidad facial.' : 'Disminución del rango activo.'}
                </span>
              </div>

              {/* Velocity Difference */}
              <div className="stat-card">
                <span className="stat-card-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Velocidad Máxima<TooltipAyuda posicion="top" texto="Velocidad angular pico del movimiento en °/s. Una velocidad reducida puede indicar bradicinesia (lentitud), síntoma cardinal del Parkinson." /></span>
                <div className="stat-card-value">
                  <span style={{ color: velDiffAbs >= 0 ? 'var(--accent)' : 'var(--warning)' }}>
                    {velDiffAbs >= 0 ? `+${velDiffAbs.toFixed(1)}` : `${velDiffAbs.toFixed(1)}`}
                  </span>
                  <span className="unit">°/s</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                    ({velDiffPct >= 0 ? `+${velDiffPct.toFixed(1)}%` : `${velDiffPct.toFixed(1)}%`})
                  </span>
                </div>
                <span className="stat-card-context">
                  {velDiffAbs >= 0 ? 'Mayor agilidad en la contracción.' : 'Movimiento más lento/rígido.'}
                </span>
              </div>

              {/* Tremor Difference */}
              <div className="stat-card">
                <span className="stat-card-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Amplitud Temblor<TooltipAyuda posicion="top" texto="Magnitud de la oscilación del temblor en grados. Una reducción POST medicación indica respuesta positiva a Levodopa." /></span>
                <div className="stat-card-value">
                  <span style={{ color: tremorDiffAbs <= 0 ? 'var(--accent)' : 'var(--danger)' }}>
                    {tremorDiffAbs <= 0 ? `${tremorDiffAbs.toFixed(1)}` : `+${tremorDiffAbs.toFixed(1)}`}
                  </span>
                  <span className="unit">°</span>
                </div>
                <span className="stat-card-context">
                  {tremorDiffAbs <= 0 ? 'Reducción o estabilidad del temblor.' : 'Incremento en oscilaciones involuntarias.'}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Additional Clinical Metrics */}
        {selectedRegion === 'MARCHA' ? (
          <div className="lg:col-span-2 card" style={{ borderColor: 'var(--info-border)' }}>
            <div style={{ gridColumn: '1 / -1', paddingBottom: 8, borderBottom: '1px solid var(--border-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Brain size={16} style={{ color: 'var(--info)' }} /> Evaluación de Hidrocefalia Normotensiva (HNT)
                <TooltipAyuda posicion="top" texto="Criterios clínicos de respuesta al Tap Test (Punción Lumbar Evacuadora). Un incremento ≥ 10% en la amplitud de paso sugiere una respuesta positiva al test de punción." />
              </h3>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Tap Test de Marcha</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {/* Respuesta al Tap Test */}
              <div className="stat-card">
                <span className="stat-card-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <HeartPulse size={12} style={{ color: 'var(--info)' }} /> Respuesta al Tap Test
                </span>
                <div className="stat-card-value">
                  <span style={{ color: romDiffPct >= 10 ? 'var(--accent)' : 'var(--warning)', fontSize: 14 }}>
                    {romDiffPct >= 10 ? 'POSITIVA' : 'S/R SIGNIFICATIVA'}
                  </span>
                </div>
                <span className="stat-card-context">
                  {romDiffPct >= 10 ? 'Indicativo de beneficio por derivación VP.' : 'Mejora por debajo del 10% clínico.'}
                </span>
              </div>

              {/* Clasificación de Marcha */}
              <div className="stat-card">
                <span className="stat-card-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Fingerprint size={12} style={{ color: 'var(--info)' }} /> Clasificación de Marcha
                </span>
                <div className="stat-card-value">
                  <span style={{ color: postRom >= 50 ? 'var(--accent)' : 'var(--danger)', fontSize: 14 }}>
                    {postRom >= 50 ? 'Funcional' : 'Marcha Corta/Festinante'}
                  </span>
                </div>
                <span className="stat-card-context">
                  {postRom >= 50 ? 'Amplitud de paso normal' : 'Paso muy acortado'}
                </span>
              </div>

              {/* Sugerencia Clínica */}
              <div className="stat-card">
                <span className="stat-card-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Activity size={12} style={{ color: 'var(--info)' }} /> Recomendación Médica
                </span>
                <div className="stat-card-value" style={{ fontSize: 13, fontWeight: 700, paddingTop: 4 }}>
                  {romDiffPct >= 10 ? 'Evaluar Derivación VP' : 'Monitoreo / Repetir Test'}
                </div>
                <span className="stat-card-context">
                  Basado en criterio de consenso HNT
                </span>
              </div>
            </div>
          </div>
        ) : selectedRegion === 'TEMBLOR' ? (
          <div className="lg:col-span-2 card" style={{ borderColor: 'var(--accent-border)' }}>
            <div style={{ gridColumn: '1 / -1', paddingBottom: 8, borderBottom: '1px solid var(--border-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Brain size={16} style={{ color: 'var(--accent)' }} /> Ajuste de Estimulación Cerebral Profunda (DBS)
                <TooltipAyuda posicion="top" texto="Análisis de respuesta terapéutica del temblor parkinsoniano al ajuste del neuroestimulador DBS." />
              </h3>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Correlación Clínica DBS/FFT</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {/* Respuesta al ajuste */}
              <div className="stat-card">
                <span className="stat-card-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <HeartPulse size={12} style={{ color: 'var(--accent)' }} /> Supresión del Temblor
                </span>
                <div className="stat-card-value">
                  <span style={{ color: (preRom > postRom) ? 'var(--accent)' : 'var(--danger)', fontSize: 14 }}>
                    {preRom > postRom 
                      ? `${((preRom - postRom) / (preRom || 1) * 100).toFixed(1)}%` 
                      : 'Sin Supresión'
                    }
                  </span>
                </div>
                <span className="stat-card-context">
                  {preRom > postRom ? 'Reducción de aceleración RMS' : 'Incremento o sin cambios'}
                </span>
              </div>

              {/* Parámetros DBS */}
              <div className="stat-card">
                <span className="stat-card-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Fingerprint size={12} style={{ color: 'var(--accent)' }} /> Parámetros DBS Activos
                </span>
                <div className="stat-card-value" style={{ fontSize: 13, fontWeight: 700, paddingTop: 4 }}>
                  {(() => {
                    const dbs = postSession ? parseDbsParams(postSession.datos_angulos) : null;
                    return dbs ? `${dbs.voltage}V · ${dbs.frecuencia}Hz` : 'No Configurado';
                  })()}
                </div>
                <span className="stat-card-context">
                  {(() => {
                    const dbs = postSession ? parseDbsParams(postSession.datos_angulos) : null;
                    return dbs ? `Ancho pulso: ${dbs.anchoPulso} µs` : 'Basal sin estimulación';
                  })()}
                </span>
              </div>

              {/* Sugerencia Clínica */}
              <div className="stat-card">
                <span className="stat-card-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Activity size={12} style={{ color: 'var(--accent)' }} /> Recomendación Médica
                </span>
                <div className="stat-card-value" style={{ fontSize: 13, fontWeight: 700, paddingTop: 4 }}>
                  {(() => {
                    const reduction = preRom > 0 ? ((preRom - postRom) / preRom * 100) : 0;
                    return reduction >= 50 
                      ? 'DBS Optimizado' 
                      : postRom >= 0.05 
                      ? 'Incrementar Voltaje' 
                      : 'Mantener Parámetros';
                  })()}
                </div>
                <span className="stat-card-context">
                  {(() => {
                    const reduction = preRom > 0 ? ((preRom - postRom) / preRom * 100) : 0;
                    return reduction >= 50 
                      ? 'Excelente respuesta motora' 
                      : postRom >= 0.05 
                      ? 'Titular +0.2V con precaución' 
                      : 'Temblor residual controlado';
                  })()}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 card" style={{ borderColor: 'var(--info-border)' }}>
            <div style={{ gridColumn: '1 / -1', paddingBottom: 8, borderBottom: '1px solid var(--border-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Brain size={16} style={{ color: 'var(--info)' }} /> Métricas Clínicas Adicionales
                <TooltipAyuda posicion="top" texto="Indicadores clínicos derivados de la última sesión PRE (basal). Incluye estimación UPDRS, asimetría facial y clasificación del temblor." />
              </h3>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Derivado de última sesión PRE/POST</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {/* UPDRS Estimado */}
              <div className="stat-card">
                <span className="stat-card-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <HeartPulse size={12} style={{ color: 'var(--info)' }} /> UPDRS Estimado<TooltipAyuda posicion="top" texto="Puntaje estimado (0-9) basado en ROM, velocidad y temblor de la sesión PRE. A menor puntaje, mejor función motora. Análogo a la Escala Unificada de Parkinson (UPDRS III)." />
                </span>
                <div className="stat-card-value">
                  <span style={{ color: preRom < 25 || (preSession?.velocidad_max ?? 0) < 50 ? 'var(--danger)' : preRom < 35 ? 'var(--warning)' : 'var(--accent)' }}>
                    {(() => {
                      const romScore = preRom < 20 ? 3 : preRom < 30 ? 2 : preRom < 40 ? 1 : 0;
                      const velScore = (preSession?.velocidad_max ?? 0) < 40 ? 3 : (preSession?.velocidad_max ?? 0) < 70 ? 2 : (preSession?.velocidad_max ?? 0) < 90 ? 1 : 0;
                      const tremorScore = (preSession?.frecuencia_temblor ?? 0) > 4 ? 2 : (preSession?.frecuencia_temblor ?? 0) > 0 ? 1 : 0;
                      const total = romScore + velScore + tremorScore;
                      return total;
                    })()}
                  </span>
                  <span className="unit">/9</span>
                </div>
                <span className="stat-card-context">
                  {(() => {
                    const romScore = preRom < 20 ? 3 : preRom < 30 ? 2 : preRom < 40 ? 1 : 0;
                    const velScore = (preSession?.velocidad_max ?? 0) < 40 ? 3 : (preSession?.velocidad_max ?? 0) < 70 ? 2 : (preSession?.velocidad_max ?? 0) < 90 ? 1 : 0;
                    const tremorScore = (preSession?.frecuencia_temblor ?? 0) > 4 ? 2 : (preSession?.frecuencia_temblor ?? 0) > 0 ? 1 : 0;
                    const total = romScore + velScore + tremorScore;
                    return total <= 2 ? 'Leve' : total <= 5 ? 'Moderado' : 'Severo';
                  })()}
                </span>
              </div>

              {/* Índice de Asimetría */}
              <div className="stat-card">
                <span className="stat-card-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Fingerprint size={12} style={{ color: 'var(--info)' }} /> Índice de Asimetría<TooltipAyuda posicion="top" texto="Porcentaje de diferencia entre lado derecho e izquierdo. Un índice > 15% indica asimetría clínicamente significativa." />
                </span>
                <div className="stat-card-value">
                  <span style={{ color: 'var(--text-muted)' }}>
                    {preSession?.asimetria_index !== null && preSession?.asimetria_index !== undefined
                      ? `${preSession.asimetria_index.toFixed(1)}`
                      : '—'}
                  </span>
                  <span className="unit">%</span>
                </div>
                <span className="stat-card-context">
                  {preSession?.asimetria_index !== null && preSession?.asimetria_index !== undefined
                    ? (preSession.asimetria_index < 15 ? 'Simetría conservada' : 'Asimetría significativa')
                    : 'Requiere medición bilateral'}
                </span>
              </div>

              {/* Clasificación del Temblor */}
              <div className="stat-card">
                <span className="stat-card-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Activity size={12} style={{ color: 'var(--info)' }} /> Clasificación Temblor<TooltipAyuda posicion="top" texto="Clasifica el temblor según su frecuencia: 'Reposo' (3.5-6.5 Hz, típico parkinsoniano) o 'Acción' (> 6.5 Hz, temblor no parkinsoniano)." />
                </span>
                <div className="stat-card-value">
                  <span style={{ color: !preSession?.frecuencia_temblor ? 'var(--accent)' : (preSession?.frecuencia_temblor ?? 0) >= 3.5 && (preSession?.frecuencia_temblor ?? 0) <= 6.5 ? 'var(--warning)' : 'var(--info)' }}>
                    {!preSession?.frecuencia_temblor || preSession.frecuencia_temblor === 0
                      ? 'Ausente'
                      : (preSession.frecuencia_temblor >= 3.5 && preSession.frecuencia_temblor <= 6.5)
                        ? 'Reposo'
                        : 'Acción'}
                  </span>
                </div>
                <span className="stat-card-context">
                  {preSession?.frecuencia_temblor && preSession.frecuencia_temblor > 0
                    ? `${preSession.frecuencia_temblor} Hz — ${preSession.frecuencia_temblor >= 3.5 && preSession.frecuencia_temblor <= 6.5 ? 'Temblor parkinsoniano clásico' : 'Temblor no parkinsoniano'}`
                    : 'Sin actividad tremórica detectada'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Longitudinal Charts Panel */}
      <div className="card">
        <div className="section-header">
          <BarChart2 size={15} style={{ color: 'var(--accent)' }} />
          Tendencias del Paciente
          <TooltipAyuda posicion="top" texto="Gráficos de evolución longitudinal del ROM, velocidad y temblor a lo largo del tiempo con curvas PRE (coral) y POST (cian) superpuestas." />
          <span style={{ marginLeft: 'auto', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
            Filtro: {selectedRegion} - LADO {selectedLado}
          </span>
        </div>

        {activeSessions.length > 0 ? (
          <div>
            <LongitudinalCharts chartData={chartData} region={selectedRegion} />
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-ring">
              <BarChart2 size={20} />
            </div>
            <span className="empty-state-text">
              No se han registrado suficientes sesiones para la región {selectedRegion} y lado {selectedLado}. Realice más mediciones.
            </span>
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
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 mb-4" style={{ borderColor: 'var(--accent)' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Cargando módulo de tendencias...</p>
      </div>
    }>
      <TrendsContent />
    </Suspense>
  );
}

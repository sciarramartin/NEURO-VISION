'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useApp } from '@/contexto_global/AppContext';
import { Session } from '@/biblioteca/types/database';
import { TooltipAyuda } from '@/componentes_visuales/TooltipAyuda';
import {
  Play, FileText, Search,
  Trash2, UserPlus, TrendingUp, Info
} from 'lucide-react';

interface PatientSummary {
  id: string; name: string; birth_date: string | null; sessions_count: number;
}

export function DashboardView() {
  const { role, activePatientId, setActivePatientId } = useApp();

  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [newPatientName, setNewPatientName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const [patientProfile, setPatientProfile] = useState<any>(null);
  const [patientSessions, setPatientSessions] = useState<Session[]>([]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const tempDeletedSessionRef = useRef<Session | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (role !== 'admin') return;
    async function loadClinicianData() {
      try {
        const pResponse = await fetch('/api/patients');
        const pData = await pResponse.json();
        const sResponse = await fetch('/api/sessions?limit=5');
        const sData = await sResponse.json();
        if (pResponse.ok && pData) setPatients(pData);
        else setPatients([{ id: 'mock-p1', name: 'Paciente A (Simulado)', birth_date: '1960-04-12', sessions_count: 3 }, { id: 'mock-p2', name: 'Paciente B (Simulado)', birth_date: '1955-08-22', sessions_count: 1 }]);
        if (sResponse.ok && sData) setRecentSessions(sData);
        else setRecentSessions(getMockSessions());
      } catch (err) {
        setPatients([{ id: 'mock-p1', name: 'Paciente A (Simulado)', birth_date: '1960-04-12', sessions_count: 3 }, { id: 'mock-p2', name: 'Paciente B (Simulado)', birth_date: '1955-08-22', sessions_count: 1 }]);
        setRecentSessions(getMockSessions());
      }
    }
    loadClinicianData();
  }, [role]);

  useEffect(() => {
    if (role !== 'patient') return;
    async function loadPatientData() {
      try {
        const pResponse = await fetch('/api/patients');
        const pData = await pResponse.json();
        const activeP = pData.find((p: any) => p.id === activePatientId);
        if (pResponse.ok && activeP) setPatientProfile({ id: activeP.id, name: activeP.name, birth_date: activeP.birth_date, doctor: 'Dr. Sciarra' });
        else if (activePatientId.startsWith('mock-')) setPatientProfile({ id: activePatientId, name: activePatientId === 'mock-p1' ? 'Paciente A (Simulado)' : 'Paciente B (Simulado)', birth_date: activePatientId === 'mock-p1' ? '1960-04-12' : '1955-08-22', doctor: 'Dr. Sciarra' });
        else setPatientProfile(null);

        const response = await fetch(`/api/sessions?patientId=${activePatientId}`);
        const data = await response.json();
        if (response.ok) setPatientSessions(data || []);
        else if (activePatientId.startsWith('mock-')) setPatientSessions(getMockSessions().filter(s => s.patient_id === activePatientId));
        else setPatientSessions([]);
      } catch (err) {
        if (activePatientId.startsWith('mock-')) { setPatientProfile({ id: activePatientId, name: activePatientId === 'mock-p1' ? 'Paciente A (Simulado)' : 'Paciente B (Simulado)', birth_date: activePatientId === 'mock-p1' ? '1960-04-12' : '1955-08-22', doctor: 'Dr. Sciarra' }); setPatientSessions(getMockSessions().filter(s => s.patient_id === activePatientId)); }
        else { setPatientProfile(null); setPatientSessions([]); }
      }
    }
    loadPatientData();
  }, [role, activePatientId]);

  const getMockSessions = (): Session[] => [
    { id: 'sess-1', patient_id: 'mock-p1', modo: 'PRE', region: 'CEJA', lado: 'IZQUIERDA', tiempo_medicion: 8.5, angulo_min: 135.2, angulo_max: 154.1, angulo_promedio: 144.5, velocidad_max: 42.1, frecuencia_temblor: 5.2, amplitud_temblor: 1.8, asimetria_index: null, datos_angulos: '', created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: 'sess-2', patient_id: 'mock-p1', modo: 'POST', region: 'CEJA', lado: 'IZQUIERDA', tiempo_medicion: 9.1, angulo_min: 132.1, angulo_max: 159.4, angulo_promedio: 145.8, velocidad_max: 56.4, frecuencia_temblor: 0, amplitud_temblor: 0, asimetria_index: null, datos_angulos: '', created_at: new Date(Date.now() - 1800000).toISOString() },
    { id: 'sess-3', patient_id: 'mock-p2', modo: 'PRE', region: 'BOCA', lado: 'DERECHA', tiempo_medicion: 10.0, angulo_min: 110.4, angulo_max: 125.8, angulo_promedio: 118.2, velocidad_max: 30.5, frecuencia_temblor: 4.8, amplitud_temblor: 2.1, asimetria_index: null, datos_angulos: '', created_at: new Date(Date.now() - 86400000).toISOString() }
  ];

  const handleDeleteSession = (session: Session) => {
    if (undoTimeoutRef.current) { clearTimeout(undoTimeoutRef.current); executeDeletionInDB(); }
    tempDeletedSessionRef.current = session;
    setRecentSessions(prev => prev.filter(s => s.id !== session.id));
    setPatientSessions(prev => prev.filter(s => s.id !== session.id));
    setToastMessage(`Sesión (${session.region} ${session.modo}) eliminada.`);
    setShowToast(true);
    undoTimeoutRef.current = setTimeout(() => { executeDeletionInDB(); }, 5000);
  };

  const handleUndoDelete = () => {
    if (undoTimeoutRef.current) { clearTimeout(undoTimeoutRef.current); undoTimeoutRef.current = null; }
    if (tempDeletedSessionRef.current) { const restored = tempDeletedSessionRef.current; setRecentSessions(prev => [restored, ...prev]); setPatientSessions(prev => [restored, ...prev]); tempDeletedSessionRef.current = null; }
    setShowToast(false); setToastMessage(null);
  };

  const executeDeletionInDB = async () => {
    if (!tempDeletedSessionRef.current) return;
    const sessionToDelete = tempDeletedSessionRef.current; tempDeletedSessionRef.current = null; setShowToast(false);
    try { const response = await fetch(`/api/sessions?id=${sessionToDelete.id}`, { method: 'DELETE' }); if (!response.ok) throw new Error('Delete failed'); } catch (err) { console.error(err); }
  };

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim()) return;
    try {
      const response = await fetch('/api/patients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newPatientName.trim() }) });
      const data = await response.json();
      if (!response.ok) throw new Error('Create failed');
      if (data) setPatients(prev => [data, ...prev]);
      setNewPatientName(''); setShowAddForm(false);
    } catch (err) {
      setPatients(prev => [{ id: `mock-${Date.now()}`, name: newPatientName.trim(), birth_date: 'N/A', sessions_count: 0 }, ...prev]);
      setNewPatientName(''); setShowAddForm(false);
    }
  };

  const filteredPatients = patients.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="main-content">
      {showToast && (
        <div className="toast-container">
          <div className="toast">
            <span className="toast-message flex items-center gap-2">
              <Info size={15} style={{ color: 'var(--accent)' }} /> {toastMessage}
            </span>
            <button onClick={handleUndoDelete} className="toast-action-btn">DESHACER</button>
          </div>
        </div>
      )}

      {role === 'admin' && (
        <>
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Portal Clínico</h1>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Panel de evaluación facial de la enfermedad de Parkinson.</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowAddForm(!showAddForm)} className="btn btn-secondary" style={{ fontSize: 11, padding: '7px 14px' }}>
                <UserPlus size={14} /> Registrar Paciente
              </button>
              <Link href="/capture" className="btn btn-primary" style={{ fontSize: 11, padding: '7px 14px' }}>
                <Play size={13} fill="currentColor" /> Nueva Medición
              </Link>
            </div>
          </div>



          {showAddForm && (
            <div className="card" style={{ borderColor: 'var(--accent-border)' }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <UserPlus size={15} style={{ color: 'var(--accent)' }} /> Crear Perfil de Paciente
              </h3>
              <form onSubmit={handleAddPatient} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, alignItems: 'end' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Nombre Completo</label>
                  <input type="text" value={newPatientName} onChange={(e) => setNewPatientName(e.target.value)} placeholder="Ej. Carmen Rodriguez" className="input-text" required />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Crear Registro</button>
                  <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-secondary">Cancelar</button>
                </div>
              </form>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 13, fontWeight: 700 }}>Listado de Pacientes</h3>
                <div style={{ position: 'relative', width: 200 }}>
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar paciente..." className="input-text" style={{ padding: '6px 10px 6px 28px', fontSize: 12, width: '100%' }} />
                  <Search size={13} style={{ position: 'absolute', left: 8, top: 8, color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Paciente</th>
                      <th>Fecha Nac.</th>
                      <th style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        Grabaciones
                        <TooltipAyuda posicion="top" texto="Número de sesiones de evaluación registradas." />
                      </th>
                      <th style={{ textAlign: 'right' }}>
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                          Acciones
                          <TooltipAyuda posicion="top" texto="Análisis: ver tendencias. Captura: nueva sesión." />
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPatients.length > 0 ? filteredPatients.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: 12 }}>{p.birth_date ?? '—'}</td>
                        <td>
                          {p.sessions_count > 0 ? (
                            <span className="chip chip-accent">{p.sessions_count} sesion{p.sessions_count !== 1 ? 'es' : ''}</span>
                          ) : (
                            <span className="chip" style={{ color: 'var(--text-muted)' }}>Sin sesiones</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                            <Link href={`/trends?patientId=${p.id}`} className="btn btn-secondary" style={{ fontSize: 10, padding: '5px 8px' }} title="Ver tendencias y gráficos">
                              <TrendingUp size={11} />
                            </Link>
                            <Link href={`/capture?patientId=${p.id}`} className="btn btn-primary" style={{ fontSize: 10, padding: '5px 8px' }} title="Nueva sesión de captura">
                              <Play size={9} fill="currentColor" />
                            </Link>
                            <button className="btn btn-secondary" style={{ fontSize: 10, padding: '5px 8px' }} title="Editar perfil del paciente"
                              onClick={() => alert('Editar paciente: ' + p.name + ' - Función en desarrollo')}>
                              <FileText size={11} />
                            </button>
                            <button className="btn btn-secondary" style={{ fontSize: 10, padding: '5px 8px' }} title="Notas clínicas"
                              onClick={() => alert('Notas clínicas para: ' + p.name + ' - Función en desarrollo')}>
                              <Info size={11} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>No se encontraron pacientes.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                Registros Recientes
                <TooltipAyuda posicion="top" texto="Últimas 5 sesiones." />
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recentSessions.length > 0 ? recentSessions.map(session => {
                  const patient = patients.find(p => p.id === session.patient_id);
                  return (
                    <div key={session.id} className="card" style={{ padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 'var(--radius-sm)',
                            fontFamily: 'var(--font-mono)',
                            background: session.modo === 'PRE' ? 'var(--warning-dim)' : 'var(--accent-dim)',
                            color: session.modo === 'PRE' ? 'var(--warning)' : 'var(--accent)',
                            border: `1px solid ${session.modo === 'PRE' ? 'var(--warning-border)' : 'var(--accent-border)'}`
                          }}>
                            {session.modo}
                          </span>
                          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {session.region} · {session.lado}
                          </span>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                          {patient ? patient.name : 'Paciente'}
                        </span>
                        <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {new Date(session.created_at).toLocaleString('es-ES')}
                        </span>
                      </div>
                      <button onClick={() => handleDeleteSession(session)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 'var(--radius-sm)' }}
                        aria-label={`Eliminar sesión`}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                }) : (
                  <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                    No hay mediciones registradas.
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {role === 'patient' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Portal del Paciente</h1>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Consulte el historial de sus resultados clínicos.</p>
            </div>
            {patientProfile && (
              <Link href={`/trends?patientId=${patientProfile.id}`} className="btn btn-primary" style={{ fontSize: 11, padding: '7px 14px' }}>
                <TrendingUp size={14} /> Ver Mis Gráficos
              </Link>
            )}
          </div>

          {patientProfile && (
            <div className="card" style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 16, background: 'var(--bg-elevated)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontWeight: 700, fontSize: 16 }}>
                  {patientProfile.name.charAt(0)}
                </div>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700 }}>{patientProfile.name}</h3>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Fecha Nac: {patientProfile.birth_date}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="stat-label">MÉDICO A CARGO</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block' }}>{patientProfile.doctor}</span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700 }}>Mis Evaluaciones Recientes</h3>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Fecha y Hora</th>
                    <th>Estado (L-Dopa)</th>
                    <th>Región</th>
                    <th>Lado</th>
                    <th>Rango Movimiento</th>
                    <th>Temblor</th>
                  </tr>
                </thead>
                <tbody>
                  {patientSessions.length > 0 ? patientSessions.map(session => (
                    <tr key={session.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: 12 }}>
                        {new Date(session.created_at).toLocaleDateString('es-ES')} {new Date(session.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 'var(--radius-sm)',
                          fontFamily: 'var(--font-mono)',
                          background: session.modo === 'PRE' ? 'var(--warning-dim)' : 'var(--accent-dim)',
                          color: session.modo === 'PRE' ? 'var(--warning)' : 'var(--accent)',
                          border: `1px solid ${session.modo === 'PRE' ? 'var(--warning-border)' : 'var(--accent-border)'}`
                        }}>
                          {session.modo}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{session.region}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{session.lado}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{session.angulo_min}° - {session.angulo_max}°</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>
                        {session.frecuencia_temblor && session.frecuencia_temblor > 0 ? `${session.frecuencia_temblor} Hz (±${session.amplitud_temblor}°)` : 'No detectado'}
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>Aún no hay sesiones registradas.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { useCaptureData } from '@/vistas/hooks/useCaptureData';

interface Props {
  tipo: string;
  puntajeTotal: number | null;
  datos: Record<string, unknown>;
}

/**
 * Fila estándar "Paciente · PRE/POST · Guardar" para evaluaciones
 * estructuradas (tabla `evaluaciones`). Mismo diseño que las filas de
 * guardado de goniómetro y análisis facial.
 */
export function GuardarEvaluacion({ tipo, puntajeTotal, datos }: Props) {
  const { patients, selectedPatientId, setSelectedPatientId } = useCaptureData();
  const [modo, setModo] = useState('PRE');
  const [estado, setEstado] = useState<'idle' | 'guardando' | 'ok' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const guardar = async () => {
    setEstado('guardando'); setError(null);
    try {
      const r = await fetch('/api/evaluaciones', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: selectedPatientId, tipo, modo, puntaje_total: puntajeTotal, datos }),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? `HTTP ${r.status}`);
      setEstado('ok');
    } catch (e) {
      setEstado('error'); setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <>
      <div className="responsive-form-2fr1fr-auto" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 10, alignItems: 'end' }}>
        <div className="form-group">
          <label className="form-label">Paciente</label>
          <select className="select-input" value={selectedPatientId} onChange={e => { setSelectedPatientId(e.target.value); setEstado('idle'); }}>
            {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Estado</label>
          <div className="segmented-control">
            <button type="button" className={`segmented-option ${modo === 'PRE' ? 'active-warning' : ''}`} onClick={() => { setModo('PRE'); setEstado('idle'); }}>PRE</button>
            <button type="button" className={`segmented-option ${modo === 'POST' ? 'active' : ''}`} onClick={() => { setModo('POST'); setEstado('idle'); }}>POST</button>
          </div>
        </div>
        <button type="button" onClick={guardar} className="btn btn-primary" disabled={estado === 'guardando' || estado === 'ok' || !selectedPatientId}>
          <Save size={14} /> {estado === 'ok' ? 'Guardado' : estado === 'guardando' ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
      {estado === 'error' && <div className="warning-banner">No se pudo guardar: {error}</div>}
    </>
  );
}

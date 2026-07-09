'use client';

import React from 'react';
import { RegionKey, LadoKey } from '@/biblioteca/math/angles';
import { TooltipAyuda } from '@/componentes_visuales/TooltipAyuda';
import { User, ChevronRight } from 'lucide-react';

interface Patient { id: string; name: string; }

interface RegistroClinicoFormProps {
  patients: Patient[];
  selectedPatientId: string;
  setSelectedPatientId: (id: string) => void;
  modo: string;
  setModo: (modo: string) => void;
  region: RegionKey;
  handleRegionChange: (region: RegionKey) => void;
  lado: LadoKey;
  setLado: (lado: LadoKey) => void;
  isRecording: boolean;
  onOpenModal: () => void;
}

const REGION_BOTONES: { key: RegionKey; label: string }[] = [
  { key: 'CEJA', label: 'Ceja' },
  { key: 'PARPADO', label: 'Párpado' },
  { key: 'BOCA', label: 'Boca' },
  { key: 'NARIZ', label: 'Nariz' },
  { key: 'CODO', label: 'Codo' },
  { key: 'MUÑECA', label: 'Muñeca' },
  { key: 'HOMBRO', label: 'Hombro' },
];

export function RegistroClinicoForm({
  patients, selectedPatientId, setSelectedPatientId,
  modo, setModo, region, handleRegionChange,
  lado, setLado, isRecording, onOpenModal
}: RegistroClinicoFormProps) {
  return (
    <div className="card">
      <div className="section-header">
        <User size={15} className="icon" style={{ color: 'var(--accent)' }} />
        Registro Clínico
        <TooltipAyuda posicion="right" texto="Complete todos los campos antes de iniciar la grabación." />
      </div>

      <div className="form-group">
        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          Paciente
          <TooltipAyuda posicion="top" texto="Seleccione el paciente a evaluar. Si no aparece, regístrelo presionando '+ Registrar'." />
        </label>
        <div style={{ display: 'flex', gap: 6 }}>
          <select
            value={selectedPatientId}
            onChange={e => setSelectedPatientId(e.target.value)}
            className="input-text" style={{ flex: 1, fontSize: 12, padding: '7px 10px' }}
            disabled={isRecording}
          >
            {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button type="button" onClick={onOpenModal} disabled={isRecording} className="btn btn-primary" style={{ padding: '7px 12px', fontSize: 11, gap: 4 }}>
            + Registrar
          </button>
        </div>
      </div>

      <div className="section-divider" />

      <div className="form-group">
        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          Estado Fármaco (L-Dopa)
          <TooltipAyuda posicion="top" texto="Indique si la medición es PRE o POST administración de Levodopa para evaluar la respuesta farmacológica." />
        </label>
        <div className="segmented-control">
          <button type="button" onClick={() => setModo('PRE')} disabled={isRecording}
            className={`segmented-option ${modo === 'PRE' ? 'active-warning' : ''}`}>PRE</button>
          <button type="button" onClick={() => setModo('POST')} disabled={isRecording}
            className={`segmented-option ${modo === 'POST' ? 'active' : ''}`}>POST</button>
        </div>
      </div>

      <div className="section-divider" />

      <div className="form-group">
        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          Región de Medición
          <TooltipAyuda posicion="top" texto="Zona anatómica a evaluar: cejas, párpados, boca, nariz (facial) o codo, muñeca, hombro (extremidades superiores)." />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
          {REGION_BOTONES.map(({ key, label }, i) => {
            const isSelected = region === key;
            const isLast = i === REGION_BOTONES.length - 1;
            return (
              <button
                type="button" key={key} onClick={() => handleRegionChange(key)} disabled={isRecording}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isLast ? 6 : 4,
                  padding: isLast ? '8px 10px' : '10px 6px', fontSize: 11, fontWeight: 700,
                  fontFamily: 'var(--font-sans)',
                  border: isSelected ? '1.5px solid var(--info-border)' : '1px solid var(--border-card)',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'var(--info-dim)' : 'var(--bg-base)',
                  color: isSelected ? 'var(--info)' : 'var(--text-muted)',
                  cursor: isRecording ? 'not-allowed' : 'pointer', transition: 'all 0.15s ease',
                  gridColumn: isLast ? '1 / -1' : 'auto',
                  textTransform: 'uppercase', letterSpacing: '0.03em', opacity: isRecording ? 0.35 : 1,
                }}
              >
                {isLast && <ChevronRight size={12} />}
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="section-divider" />

      <div className="form-group">
        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          Lado Facial / Corporal
          <TooltipAyuda posicion="top" texto="Lado del cuerpo a evaluar: Derecho o Izquierdo. Evalúe ambos por separado para detectar asimetrías clínicas." />
        </label>
        <div className="segmented-control">
          {(['DERECHA', 'IZQUIERDA'] as LadoKey[]).map(l => (
            <button type="button" key={l} onClick={() => setLado(l)} disabled={isRecording}
              className={`segmented-option ${lado === l ? 'active' : ''}`}>
              {l === 'DERECHA' ? '→ Der' : '← Izq'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

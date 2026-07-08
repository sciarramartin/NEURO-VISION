'use client';

import React from 'react';
import { TooltipAyuda } from '@/componentes_visuales/TooltipAyuda';
import { BarChart3, Save, Trash2, HelpCircle } from 'lucide-react';

interface CalculatedMetrics {
  angMin: number; angMax: number; angAvg: number;
  maxVel: number; tremorFreq: number; tremorAmp: number;
}

interface ResultadosCardProps {
  metrics: CalculatedMetrics | null;
  saveStatus: 'idle' | 'saving' | 'success' | 'error';
  onSave: () => void;
  onDiscard: () => void;
}

export function ResultadosCard({ metrics, saveStatus, onSave, onDiscard }: ResultadosCardProps) {
  if (!metrics) return null;

  const rows = [
    { label: 'Rango de Movimiento (ROM)', value: `${metrics.angMin}° - ${metrics.angMax}°`, ref: '> 35°', tooltip: 'Rango angular total durante la sesión.', alert: (metrics.angMax - metrics.angMin) < 35 },
    { label: 'Ángulo Promedio', value: `${metrics.angAvg}°`, ref: '120° - 160°', tooltip: 'Posición angular media.', alert: false },
    { label: 'Velocidad Máxima', value: `${metrics.maxVel}°/s`, ref: '> 90°/s', tooltip: 'Velocidad angular máxima. < 60°/s correlaciona con bradicinesia.', alert: metrics.maxVel < 60 },
    { label: 'Frecuencia del Temblor', value: `${metrics.tremorFreq.toFixed(1)} Hz`, ref: '0.0 Hz', tooltip: 'Frecuencia dominante. Parkinson: 3.5-6.5 Hz.', alert: metrics.tremorFreq > 1.0 },
    { label: 'Amplitud del Temblor', value: `${metrics.tremorAmp.toFixed(2)}°`, ref: '< 0.20°', tooltip: 'Amplitud de oscilación.', alert: metrics.tremorAmp >= 0.25 }
  ];

  return (
    <div className="card animate-fade-in" style={{ padding: '16px', gap: '2px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 10, borderBottom: '1px solid var(--border-card)' }}>
        <BarChart3 size={15} style={{ color: 'var(--accent)' }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Resultados
        </span>
        <TooltipAyuda posicion="left" texto="Métricas cinemáticas calculadas del tracking en tiempo real." />
      </div>

      <div style={{ overflowX: 'auto', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-md)', marginTop: 8 }}>
        <table style={{ width: '100%', textAlign: 'left', fontSize: 11, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-elevated)' }}>
              <th style={{ padding: '8px 10px', color: 'var(--text-muted)', fontWeight: 700, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)', borderBottom: '1px solid var(--border-card)' }}>Métrica</th>
              <th style={{ padding: '8px 10px', color: 'var(--text-muted)', fontWeight: 700, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)', borderBottom: '1px solid var(--border-card)', textAlign: 'center' }}>Registrado</th>
              <th style={{ padding: '8px 10px', color: 'var(--text-muted)', fontWeight: 700, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)', borderBottom: '1px solid var(--border-card)', textAlign: 'right' }}>Ref.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} style={{ borderBottom: idx < rows.length - 1 ? '1px solid var(--border-card)' : 'none' }}>
                <td style={{ padding: '8px 10px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {row.label}
                    <TooltipAyuda posicion="top" texto={row.tooltip} />
                  </div>
                </td>
                <td style={{ padding: '8px 10px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 11,
                    background: row.alert ? 'var(--danger-dim)' : 'var(--bg-elevated)',
                    color: row.alert ? 'var(--danger)' : 'var(--text-primary)',
                  }}>
                    {row.value}
                  </span>
                </td>
                <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                  {row.ref}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
        <button type="button" onClick={onDiscard} disabled={saveStatus === 'saving'} className="btn btn-secondary" style={{ flex: 1, fontSize: 11, padding: '8px 12px' }}>
          <Trash2 size={13} /> Descartar
        </button>
        <button type="button" onClick={onSave} disabled={saveStatus === 'saving'} className="btn btn-primary" style={{ flex: 1, fontSize: 11, padding: '8px 12px' }}>
          {saveStatus === 'saving' ? (
            <><div className="animate-spin rounded-full h-3 w-3 border-t-2 border-white" /> Guardando...</>
          ) : (
            <><Save size={13} /> Guardar Sesión</>
          )}
        </button>
      </div>
    </div>
  );
}

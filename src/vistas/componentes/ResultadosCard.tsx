'use client';

import React from 'react';
import { TooltipAyuda } from '@/componentes_visuales/TooltipAyuda';
import { BarChart3, Save, Trash2 } from 'lucide-react';

interface CalculatedMetrics {
  angMin: number; angMax: number; angAvg: number;
  maxVel: number; tremorFreq: number; tremorAmp: number;
  asimetria_index?: number;
}

interface ResultadosCardProps {
  metrics: CalculatedMetrics | null;
  saveStatus: 'idle' | 'saving' | 'success' | 'error';
  onSave: () => void;
  onDiscard: () => void;
}

interface RowConfig {
  label: string; value: string; ref: string;
  alert: boolean; tooltip: string;
}

export function ResultadosCard({ metrics, saveStatus, onSave, onDiscard }: ResultadosCardProps) {
  if (!metrics) return null;

  const rom = metrics.angMax - metrics.angMin;

  const rows: RowConfig[] = [
    { label: 'Rango de Movimiento (ROM)', value: `${rom}° (${metrics.angMin}° - ${metrics.angMax}°)`, ref: '≥ 35°', alert: rom < 35,
      tooltip: 'Diferencia entre el ángulo máximo y mínimo registrado. Un ROM reducido (< 30°) puede indicar rigidez articular, espasticidad o hipocinesia — síntomas cardinales del Parkinson. En CEJA, un ROM normal ≥ 35°.' },
    { label: 'Ángulo Promedio', value: `${metrics.angAvg}°`, ref: '120° - 160°', alert: metrics.angAvg < 100 || metrics.angAvg > 170,
      tooltip: 'Media de todos los ángulos medidos durante la sesión. Refleja la posición postural de reposo. Valores fuera del rango de referencia pueden indicar contractura o distonía postural.' },
    { label: 'Velocidad Angular Máx.', value: `${metrics.maxVel}°/s`, ref: '≥ 90°/s', alert: metrics.maxVel < 60,
      tooltip: 'Velocidad pico del movimiento. La bradicinesia (lentitud) es un síntoma cardinal del Parkinson. Valores < 60°/s tienen correlación clínica significativa con bradicinesia.' },
    { label: 'Frecuencia del Temblor', value: `${metrics.tremorFreq.toFixed(1)} Hz`, ref: '0.0 Hz (ausente)', alert: metrics.tremorFreq > 1.0 && metrics.tremorFreq < 10,
      tooltip: 'Frecuencia dominante del temblor. El temblor parkinsoniano clásico es de reposo y oscila entre 3.5 y 6.5 Hz.' },
    { label: 'Amplitud del Temblor', value: `${metrics.tremorAmp.toFixed(2)}°`, ref: '< 0.20°', alert: metrics.tremorAmp >= 0.25,
      tooltip: 'Magnitud de la oscilación del temblor. Amplitudes > 0.25° indican temblor clínicamente significativo.' },
    { label: 'Índice de Simetría', value: metrics.asimetria_index !== undefined ? `${metrics.asimetria_index?.toFixed(1)}%` : '—', ref: '< 15%', alert: (metrics.asimetria_index ?? 0) >= 15,
      tooltip: 'Compara lado derecho vs izquierdo. Un índice > 15% sugiere asimetría significativa.' },
  ];

  return (
    <div className="card animate-fade-in">
      <div className="section-header">
        <BarChart3 size={15} className="icon" style={{ color: 'var(--accent)' }} />
        Resultados Clínicos
      </div>

      <div className="table-container">
        <table className="custom-table" style={{ fontSize: 11 }}>
          <thead>
            <tr>
              <th>Métrica Clínica</th>
              <th style={{ textAlign: 'center' }}>Valor Obtenido</th>
              <th style={{ textAlign: 'right' }}>Rango Normal</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                <td style={{ color: 'var(--text-secondary)', fontWeight: 600, padding: '8px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {row.label}
                    <TooltipAyuda posicion="top" texto={row.tooltip} />
                  </div>
                </td>
                <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, padding: '8px 10px' }}>
                  <span style={{
                    padding: '2px 6px', borderRadius: 'var(--radius-sm)', fontSize: 11,
                    background: row.alert ? 'var(--warning-dim)' : 'var(--bg-elevated)',
                    color: row.alert ? 'var(--warning)' : 'var(--text-primary)',
                  }}>
                    {row.value}
                  </span>
                </td>
                <td style={{ textAlign: 'right', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 10, padding: '8px 10px' }}>
                  {row.ref}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
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

'use client';

import React from 'react';
import { TooltipAyuda } from '@/componentes_visuales/TooltipAyuda';
import { BarChart2, Save, Trash2 } from 'lucide-react';

interface CalculatedMetrics {
  angMin: number;
  angMax: number;
  angAvg: number;
  maxVel: number;
  tremorFreq: number;
  tremorAmp: number;
}

interface ResultadosCardProps {
  metrics: CalculatedMetrics | null;
  saveStatus: 'idle' | 'saving' | 'success' | 'error';
  onSave: () => void;
  onDiscard: () => void;
}

/**
 * Presenter Pattern: Tarjeta de Resultados Clínicos y Análisis Biomecánico.
 * Muestra las métricas detectadas con una columna comparativa de Valores Normales.
 * 
 * Ergonomía: Celdas de la tabla con abundante espaciado (px-4 py-3) para evitar
 * el contacto visual estrecho con los bordes (solución a bug de Text-to-Border).
 */
export function ResultadosCard({
  metrics,
  saveStatus,
  onSave,
  onDiscard
}: ResultadosCardProps) {
  if (!metrics) return null;

  const rows = [
    {
      label: 'Rango de Movimiento (ROM)',
      value: `${metrics.angMin}° - ${metrics.angMax}°`,
      ref: '> 35°',
      tooltip: 'Rango angular total (máximo - mínimo) durante la sesión de registro. Valores reducidos (< 30°) sugieren rigidez articular, espasticidad o hipocinesia.',
      alert: (metrics.angMax - metrics.angMin) < 35
    },
    {
      label: 'Ángulo Promedio',
      value: `${metrics.angAvg}°`,
      ref: '120° - 160°',
      tooltip: 'Posición angular media calculada a lo largo del tiempo de registro. Útil como base de postura y deformidad postural articular.',
      alert: false
    },
    {
      label: 'Velocidad Máxima',
      value: `${metrics.maxVel}°/s`,
      ref: '> 90°/s',
      tooltip: 'Velocidad angular máxima alcanzada durante la extensión/flexión. Un valor inferior a 60°/s correlaciona clínicamente con bradicinesia.',
      alert: metrics.maxVel < 60
    },
    {
      label: 'Frecuencia del Temblor',
      value: `${metrics.tremorFreq.toFixed(1)} Hz`,
      ref: '0.0 Hz (Sin Temblor)',
      tooltip: 'Frecuencia dominante espectral obtenida mediante transformada rápida de Fourier. El temblor en Parkinson típicamente oscila entre 3.5 y 6.5 Hz.',
      alert: metrics.tremorFreq > 1.0
    },
    {
      label: 'Amplitud del Temblor',
      value: `${metrics.tremorAmp.toFixed(2)}°`,
      ref: '< 0.20°',
      tooltip: 'Amplitud de oscilación del temblor fisiológico. Desviaciones por encima de 0.3° indican temblor clínico significativo o inestabilidad motora.',
      alert: metrics.tremorAmp >= 0.25
    }
  ];

  return (
    <div className="card p-6 flex flex-col gap-5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl shadow-sm animate-fade-in">
      <h3 className="text-sm font-bold flex items-center gap-2 text-zinc-800 dark:text-zinc-200 pb-1 border-b border-zinc-150/40 dark:border-zinc-800/40">
        <BarChart2 size={18} className="text-emerald-500 dark:text-emerald-450" /> Resultados Obtenidos
        <TooltipAyuda
          posicion="left"
          texto="Métricas cinemáticas calculadas a partir del tracking en tiempo real. Compare los valores obtenidos con la columna de referencia fisiológica para el diagnóstico."
        />
      </h3>

      {/* Table grid layout with reference values */}
      <div className="overflow-x-auto w-full border border-zinc-150 dark:border-zinc-800/60 rounded-lg">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-950/60 text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider border-b border-zinc-150 dark:border-zinc-850">
              <th className="px-4 py-3 font-semibold">Métrica</th>
              <th className="px-4 py-3 font-semibold text-center">Registrado</th>
              <th className="px-4 py-3 font-semibold text-right">Referencia (Normal)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850">
            {rows.map((row, idx) => (
              <tr
                key={idx}
                className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20 transition-all"
              >
                {/* Metric label with help icon */}
                <td className="px-4 py-3 text-zinc-700 dark:text-zinc-350 font-semibold align-middle">
                  <div className="flex items-center gap-1.5">
                    {row.label}
                    <TooltipAyuda posicion="top" texto={row.tooltip} />
                  </div>
                </td>

                {/* Recorded Value */}
                <td className="px-4 py-3 text-center align-middle font-mono font-bold">
                  <span className={`px-2 py-0.5 rounded ${
                    row.alert
                      ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300'
                  }`}>
                    {row.value}
                  </span>
                </td>

                {/* Reference Value */}
                <td className="px-4 py-3 text-right align-middle text-zinc-450 dark:text-zinc-500 font-mono font-medium">
                  {row.ref}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Control Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onDiscard}
          disabled={saveStatus === 'saving'}
          className="btn btn-secondary flex-1 py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-2 border border-zinc-250 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
        >
          <Trash2 size={15} /> Descartar
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saveStatus === 'saving'}
          className="btn btn-primary flex-1 py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-2 bg-indigo-650 hover:bg-indigo-700 text-white shadow-sm rounded-lg transition-all"
        >
          {saveStatus === 'saving' ? (
            <>
              <div className="animate-spin rounded-full h-3.5 w-3.5 border-t-2 border-white" />
              Guardando...
            </>
          ) : (
            <>
              <Save size={15} /> Guardar Sesión
            </>
          )}
        </button>
      </div>
    </div>
  );
}

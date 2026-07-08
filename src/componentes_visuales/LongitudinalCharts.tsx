'use client';

import React from 'react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, BarChart, Bar 
} from 'recharts';
import { Maximize2 } from 'lucide-react';

interface LongitudinalChartsProps {
  chartData: any[];
}

export default function LongitudinalCharts({ chartData }: LongitudinalChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Chart 1: Range of Motion Evolution */}
      <div className="card flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
            Rango de Movimiento (ROM)
          </h3>
          <span className="chip" style={{ fontSize: 10 }}>
            Ángulo en grados (°)
          </span>
        </div>
        <div className="chart-container h-72 w-full" style={{ position: 'relative' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} />
              <YAxis stroke="var(--text-muted)" fontSize={10} unit="°" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--bg-elevated)', 
                  borderColor: 'var(--border-card)', 
                  borderRadius: 6, 
                  color: 'var(--text-primary)',
                  fontSize: 12
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Line type="monotone" dataKey="PRE_ROM" name="Antes (PRE)" stroke="var(--warning)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="POST_ROM" name="Después (POST)" stroke="var(--accent)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
          <button className="chart-expand" title="Expandir gráfico">
            <Maximize2 size={12} />
          </button>
        </div>
      </div>

      {/* Chart 2: Speed Evolution */}
      <div className="card flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
            Velocidad Máxima
          </h3>
          <span className="chip" style={{ fontSize: 10 }}>
            Grados por segundo (°/s)
          </span>
        </div>
        <div className="chart-container h-72 w-full" style={{ position: 'relative' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} />
              <YAxis stroke="var(--text-muted)" fontSize={10} unit="°/s" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--bg-elevated)', 
                  borderColor: 'var(--border-card)', 
                  borderRadius: 6,
                  fontSize: 12
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Bar dataKey="PRE_Vel" name="Antes (PRE)" fill="var(--warning)" radius={[4, 4, 0, 0]} maxBarSize={25} />
              <Bar dataKey="POST_Vel" name="Después (POST)" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={25} />
            </BarChart>
          </ResponsiveContainer>
          <button className="chart-expand" title="Expandir gráfico">
            <Maximize2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

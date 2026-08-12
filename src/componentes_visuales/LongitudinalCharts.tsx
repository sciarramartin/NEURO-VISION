'use client';

import React from 'react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, BarChart, Bar 
} from 'recharts';
import { Maximize2 } from 'lucide-react';

import { RegionKey } from '@/biblioteca/math/angles';

interface LongitudinalChartsProps {
  chartData: any[];
  region?: RegionKey;
}

export default function LongitudinalCharts({ chartData, region = 'CEJA' }: LongitudinalChartsProps) {
  const isTemblor = region === 'TEMBLOR';
  const isMarcha = region === 'MARCHA';

  const chart1Title = isTemblor 
    ? "Amplitud de Aceleración (RMS)" 
    : isMarcha 
    ? "Amplitud de Paso" 
    : "Rango de Movimiento (ROM)";

  const chart1Unit = isTemblor ? " m/s²" : isMarcha ? " cm" : "°";
  const chart1KeyPre = "PRE_ROM";
  const chart1KeyPost = "POST_ROM";

  const chart2Title = isTemblor 
    ? "Frecuencia del Temblor" 
    : "Velocidad Máxima";

  const chart2Unit = isTemblor ? " Hz" : "°/s";
  const chart2KeyPre = isTemblor ? "PRE_Tremor" : "PRE_Vel";
  const chart2KeyPost = isTemblor ? "POST_Tremor" : "POST_Vel";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Chart 1: Amplitude / ROM */}
      <div className="card flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
            {chart1Title}
          </h3>
          <span className="chip" style={{ fontSize: 10 }}>
            Unidad: {chart1Unit.trim()}
          </span>
        </div>
        <div className="chart-container h-72 w-full" style={{ position: 'relative' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} />
              <YAxis stroke="var(--text-muted)" fontSize={10} unit={chart1Unit} />
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
              <Line type="monotone" dataKey={chart1KeyPre} name="Antes (PRE)" stroke="var(--pre-color)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey={chart1KeyPost} name="Después (POST)" stroke="var(--post-color)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
          <button className="chart-expand" title="Expandir gráfico">
            <Maximize2 size={12} />
          </button>
        </div>
      </div>

      {/* Chart 2: Speed / Frequency */}
      <div className="card flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
            {chart2Title}
          </h3>
          <span className="chip" style={{ fontSize: 10 }}>
            Unidad: {chart2Unit.trim()}
          </span>
        </div>
        <div className="chart-container h-72 w-full" style={{ position: 'relative' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} />
              <YAxis stroke="var(--text-muted)" fontSize={10} unit={chart2Unit} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--bg-elevated)', 
                  borderColor: 'var(--border-card)', 
                  borderRadius: 6,
                  fontSize: 12
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Bar dataKey={chart2KeyPre} name="Antes (PRE)" fill="var(--pre-color)" radius={[4, 4, 0, 0]} maxBarSize={25} />
              <Bar dataKey={chart2KeyPost} name="Después (POST)" fill="var(--post-color)" radius={[4, 4, 0, 0]} maxBarSize={25} />
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

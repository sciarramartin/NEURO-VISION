'use client';

import React, { useState } from 'react';
import { PUNTOS_MUSCULARES, PuntoMuscular, etiquetaCompleta } from '@/biblioteca/math/musculosFaciales';

interface Props {
  seleccion: PuntoMuscular | null;
  onSeleccionar: (p: PuntoMuscular) => void;
}

/** Esquema simplificado de rostro de frente, solo como referencia espacial para ubicar los nodos. */
function EsquemaRostro() {
  return (
    <g opacity="0.9">
      <ellipse cx="100" cy="140" rx="72" ry="98" fill="var(--bg-base)" stroke="var(--border-hover)" strokeWidth="1.5" />
      {/* orejas */}
      <ellipse cx="28" cy="140" rx="8" ry="16" fill="var(--bg-base)" stroke="var(--border-hover)" strokeWidth="1.5" />
      <ellipse cx="172" cy="140" rx="8" ry="16" fill="var(--bg-base)" stroke="var(--border-hover)" strokeWidth="1.5" />
      {/* Lateralidad del paciente (vista de frente): su derecha queda a la izquierda del esquema */}
      <text x="10" y="20" fontSize="10" fontWeight="700" fill="var(--text-muted)" fontFamily="var(--font-mono)">D</text>
      <text x="184" y="20" fontSize="10" fontWeight="700" fill="var(--text-muted)" fontFamily="var(--font-mono)">I</text>
      {/* ojos (referencia) */}
      <ellipse cx="70" cy="115" rx="10" ry="5" fill="none" stroke="var(--border-card)" strokeWidth="1" />
      <ellipse cx="130" cy="115" rx="10" ry="5" fill="none" stroke="var(--border-card)" strokeWidth="1" />
      {/* nariz (referencia) */}
      <path d="M100 100 L94 150 Q100 156 106 150 Z" fill="none" stroke="var(--border-card)" strokeWidth="1" />
      {/* boca (referencia) */}
      <path d="M75 185 Q100 195 125 185" fill="none" stroke="var(--border-card)" strokeWidth="1" />
    </g>
  );
}

export function FaceMuscleSelector({ seleccion, onSeleccionar }: Props) {
  const [hover, setHover] = useState<PuntoMuscular | null>(null);
  const activo = hover ?? seleccion;

  return (
    <div className="face-selector-wrap">
      <svg viewBox="0 0 200 260">
        <EsquemaRostro />
        {PUNTOS_MUSCULARES.map(p => (
          <circle
            key={p.id}
            className={`face-point ${seleccion?.id === p.id ? 'selected' : ''}`}
            cx={p.pos.x} cy={p.pos.y} r={seleccion?.id === p.id ? 6 : 4.5}
            onMouseEnter={() => setHover(p)}
            onMouseLeave={() => setHover(null)}
            onClick={() => onSeleccionar(p)}
            role="button"
            aria-label={etiquetaCompleta(p)}
          />
        ))}
      </svg>

      {activo && (
        <div
          className="face-point-label"
          style={{ left: `${(activo.pos.x / 200) * 100}%`, top: `${(activo.pos.y / 260) * 100}%` }}
        >
          {etiquetaCompleta(activo)}
        </div>
      )}
    </div>
  );
}

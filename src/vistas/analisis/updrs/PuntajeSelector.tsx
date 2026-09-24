'use client';

import React from 'react';
import { ETIQUETAS_PUNTAJE } from '@/biblioteca/math/updrs';

interface Props {
  valor: number | undefined;
  onCambiar: (v: number | undefined) => void;
  /** Puntaje sugerido por la cámara, marcado con un punto. */
  sugerido?: number;
  compacto?: boolean;
  etiqueta?: string;
}

/**
 * Selector 0–4 de una puntuación UPDRS. Un segundo clic sobre el valor
 * activo lo borra (vuelve a "sin puntuar"), para poder corregir sin un
 * botón extra.
 */
export function PuntajeSelector({ valor, onCambiar, sugerido, compacto = false, etiqueta }: Props) {
  return (
    <div className={`updrs-puntaje ${compacto ? 'compacto' : ''}`} role="radiogroup" aria-label={etiqueta ?? 'Puntaje'}>
      {ETIQUETAS_PUNTAJE.map((txt, n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={valor === n}
          title={`${n} · ${txt}`}
          className={`updrs-puntaje-opcion ${valor === n ? 'active' : ''}`}
          onClick={() => onCambiar(valor === n ? undefined : n)}
        >
          <span className="n">{n}</span>
          {!compacto && <span className="t">{txt}</span>}
          {sugerido === n && <span className="updrs-puntaje-sugerido" aria-label="sugerido" />}
        </button>
      ))}
    </div>
  );
}

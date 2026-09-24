'use client';

import React from 'react';
import { Check } from 'lucide-react';
import type { FaseCaptura } from './useCountdown7s';

interface Props {
  fase: FaseCaptura;
  segundos: number;
  progreso: number; // 0 -> 1
  /** Duración total en segundos, mostrada antes de iniciar (por defecto 7). */
  total?: number;
}

const RADIO = 48;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;

export function CapturaTimerRing({ fase, segundos, progreso, total = 7 }: Props) {
  const offset = CIRCUNFERENCIA * (1 - progreso);
  return (
    <div className="captura-timer-ring">
      <svg viewBox="0 0 108 108">
        <circle className="captura-timer-track" cx="54" cy="54" r={RADIO} />
        <circle
          className="captura-timer-fill"
          cx="54" cy="54" r={RADIO}
          strokeDasharray={CIRCUNFERENCIA}
          strokeDashoffset={fase === 'lista' ? CIRCUNFERENCIA : offset}
        />
      </svg>
      <div className="captura-timer-label">
        {fase === 'lista' && <span className="n">{total}</span>}
        {fase === 'grabando' && <span className="n">{segundos}</span>}
        {fase === 'finalizada' && <span className="n" style={{ color: 'var(--accent)', display: 'flex' }}><Check size={26} strokeWidth={3} /></span>}
        <span className="u">{fase === 'grabando' ? 'segundos' : fase === 'finalizada' ? 'listo' : 'duración'}</span>
      </div>
    </div>
  );
}

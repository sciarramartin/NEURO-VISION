'use client';

import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipAyudaProps {
  /** Texto o JSX que se muestra dentro del globo */
  texto: string | React.ReactNode;
  /** Posición preferida del globo. Default: 'top' */
  posicion?: 'top' | 'bottom' | 'left' | 'right';
  /** Tamaño del ícono en px. Default: 13 */
  iconoSize?: number;
  /** Clase CSS adicional para el ícono contenedor */
  className?: string;
}

/**
 * TooltipAyuda — Ícono de signo de pregunta con globo informativo al hover.
 *
 * Nielsen Heuristic #10: "Help and Documentation"
 * — Proporciona información contextual sin interrumpir el flujo del usuario.
 *
 * Uso:
 * <TooltipAyuda texto="Seleccione el paciente a evaluar" />
 */
export function TooltipAyuda({
  texto,
  posicion = 'top',
  iconoSize = 18,
  className = ''
}: TooltipAyudaProps) {
  const [visible, setVisible] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  // Keyboard: show on focus, hide on blur (Nielsen #7 accessibility)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const show = () => setVisible(true);
    const hide = () => setVisible(false);
    el.addEventListener('focusin', show);
    el.addEventListener('focusout', hide);
    return () => {
      el.removeEventListener('focusin', show);
      el.removeEventListener('focusout', hide);
    };
  }, []);

  const positionClasses: Record<string, string> = {
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left:   'right-full top-1/2 -translate-y-1/2 mr-2',
    right:  'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses: Record<string, string> = {
    top:    'top-full left-1/2 -translate-x-1/2 border-t-zinc-700',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-zinc-700',
    left:   'left-full top-1/2 -translate-y-1/2 border-l-zinc-700',
    right:  'right-full top-1/2 -translate-y-1/2 border-r-zinc-700',
  };

  return (
    <span
      ref={containerRef}
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      tabIndex={0}
      role="button"
      aria-label="Más información"
    >
      <HelpCircle
        size={iconoSize}
        className="text-[var(--info)] opacity-75 hover:opacity-100 hover:scale-125 transition-all cursor-help"
        style={{ color: 'var(--info)' }}
      />

      {visible && (
        <span
          role="tooltip"
          className={`
            absolute z-50 w-72 px-4 py-2.5
            bg-zinc-900 border border-zinc-700
            rounded-lg shadow-xl
            text-[13px] text-zinc-300 leading-relaxed
            pointer-events-none
            ${positionClasses[posicion]}
          `}
        >
          {texto}
          {/* Arrow */}
          <span
            className={`
              absolute w-0 h-0
              border-4 border-transparent
              ${arrowClasses[posicion]}
            `}
          />
        </span>
      )}
    </span>
  );
}

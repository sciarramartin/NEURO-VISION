'use client';

import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipAyudaProps {
  texto: string | React.ReactNode;
  posicion?: 'top' | 'bottom' | 'left' | 'right';
  iconoSize?: number;
  className?: string;
}

export function TooltipAyuda({
  texto, posicion = 'top', iconoSize = 14, className = ''
}: TooltipAyudaProps) {
  const [visible, setVisible] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const show = () => setVisible(true);
    const hide = () => setVisible(false);
    el.addEventListener('focusin', show);
    el.addEventListener('focusout', hide);
    return () => { el.removeEventListener('focusin', show); el.removeEventListener('focusout', hide); };
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
    <span ref={containerRef} className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}
      tabIndex={0} role="button" aria-label="Más información"
    >
      <HelpCircle size={iconoSize} style={{ color: 'var(--info)', opacity: 0.7, cursor: 'help', transition: 'all 0.15s ease' }}
        className="hover:opacity-100 hover:scale-110"
      />
      {visible && (
        <span role="tooltip" className={`absolute z-50 w-64 px-3 py-2 bg-[#1C1C24] border border-[var(--border-card)] rounded-lg shadow-xl text-xs text-[var(--text-secondary)] leading-relaxed pointer-events-none ${positionClasses[posicion]}`}>
          {texto}
          <span className={`absolute w-0 h-0 border-4 border-transparent ${arrowClasses[posicion]}`} />
        </span>
      )}
    </span>
  );
}

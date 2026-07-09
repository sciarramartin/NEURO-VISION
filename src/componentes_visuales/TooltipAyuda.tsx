'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle } from 'lucide-react';

interface TooltipAyudaProps {
  texto: string | React.ReactNode;
  posicion?: 'top' | 'bottom' | 'left' | 'right';
  iconoSize?: number;
  className?: string;
}

export function TooltipAyuda({
  texto, posicion, iconoSize = 14, className = ''
}: TooltipAyudaProps) {
  const [visible, setVisible] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLSpanElement>(null);
  const [mounted, setMounted] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ left: 0, top: 0 });

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const show = () => setVisible(true);
    const hide = () => setVisible(false);
    el.addEventListener('focusin', show);
    el.addEventListener('focusout', hide);
    return () => { el.removeEventListener('focusin', show); el.removeEventListener('focusout', hide); };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!posicion) {
      setMousePos({ x: e.clientX, y: e.clientY });
    }
  }, [posicion]);

  const calcularPosicionFija = useCallback(() => {
    if (!containerRef.current || !posicion) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const gap = 8;
    switch (posicion) {
      case 'top':
        return { left: rect.left + rect.width / 2 - 128, top: rect.top - gap - 8 };
      case 'bottom':
        return { left: rect.left + rect.width / 2 - 128, top: rect.bottom + gap };
      case 'left':
        return { left: rect.left - gap - 256, top: rect.top - 4 };
      case 'right':
        return { left: rect.right + gap, top: rect.top - 4 };
      default:
        return null;
    }
  }, [posicion]);

  useEffect(() => {
    if (!visible || !posicion) return;
    const update = () => {
      const p = calcularPosicionFija();
      if (p) setTooltipPos(p);
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [visible, posicion, calcularPosicionFija]);

  const tooltipStyle: React.CSSProperties = posicion
    ? {
        position: 'fixed',
        left: tooltipPos.left,
        top: tooltipPos.top,
        zIndex: 9999,
        background: 'var(--bg-elevated)',
        color: 'var(--text-secondary)',
        border: '1px solid var(--border-card)',
        borderRadius: 'var(--radius-md)',
        padding: '8px 12px',
        width: 256,
        fontSize: 12,
        lineHeight: 1.5,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        pointerEvents: 'none',
        animation: 'fadeIn 0.12s ease forwards',
      }
    : {
        position: 'fixed',
        left: Math.min(mousePos.x + 14, window.innerWidth - 272),
        top: mousePos.y - 8,
        zIndex: 9999,
        background: 'var(--bg-elevated)',
        color: 'var(--text-secondary)',
        border: '1px solid var(--border-card)',
        borderRadius: 'var(--radius-md)',
        padding: '8px 12px',
        width: 256,
        fontSize: 12,
        lineHeight: 1.5,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        pointerEvents: 'none',
        animation: 'fadeIn 0.12s ease forwards',
      };

  return (
    <span ref={containerRef} className={`inline-flex items-center ${className}`}
      onMouseEnter={(e) => {
        setVisible(true);
        if (!posicion) setMousePos({ x: e.clientX, y: e.clientY });
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setVisible(false)}
      tabIndex={0} role="button" aria-label="Más información"
    >
      <HelpCircle size={iconoSize} style={{ color: 'var(--info)', opacity: 0.7, cursor: 'help', transition: 'all 0.15s ease' }}
        className="hover:opacity-100 hover:scale-110"
      />
      {visible && mounted && createPortal(
        <span role="tooltip" style={tooltipStyle}>
          {texto}
        </span>,
        document.body
      )}
    </span>
  );
}

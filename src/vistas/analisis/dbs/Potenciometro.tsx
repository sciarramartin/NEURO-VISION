'use client';

import React, { useRef } from 'react';
import { Minus, Plus } from 'lucide-react';

interface Props {
  etiqueta: string;
  unidad: string;
  valor: number;
  min: number;
  max: number;
  paso: number;
  decimales?: number;
  deshabilitado?: boolean;
  onCambiar: (v: number) => void;
}

const ANG = 135; // barrido total de 270°

function polar(r: number, grados: number) {
  const rad = ((grados - 90) * Math.PI) / 180;
  return { x: 50 + r * Math.cos(rad), y: 50 + r * Math.sin(rad) };
}
function arco(r: number, desde: number, hasta: number) {
  const a = polar(r, desde), b = polar(r, hasta);
  const grande = hasta - desde > 180 ? 1 : 0;
  return `M ${a.x} ${a.y} A ${r} ${r} 0 ${grande} 1 ${b.x} ${b.y}`;
}

/**
 * Potenciómetro rotatorio para parámetros de estimulación.
 * Se ajusta arrastrando (vertical u horizontal), con las flechas del teclado (Shift = ×10) o con los botones − / +.
 * Accesible como `role="slider"`. No responde a la rueda del mouse a
 * propósito: evita cambiar un parámetro sin querer al desplazar la página.
 */
export function Potenciometro({ etiqueta, unidad, valor, min, max, paso, decimales = 0, deshabilitado, onCambiar }: Props) {
  const arrastre = useRef<{ x: number; y: number; v: number } | null>(null);
  const clamp = (v: number) => {
    const q = Math.round((v - min) / paso) * paso + min;
    return +Math.min(max, Math.max(min, q)).toFixed(4);
  };
  const frac = (valor - min) / (max - min);
  const angulo = -ANG + frac * 2 * ANG;
  const perilla = polar(30, angulo);

  const onPointerDown = (e: React.PointerEvent) => {
    if (deshabilitado) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    arrastre.current = { x: e.clientX, y: e.clientY, v: valor };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const a = arrastre.current;
    if (!a) return;
    // 180 px de arrastre = recorrido completo
    const delta = ((a.y - e.clientY) + (e.clientX - a.x)) / 180;
    onCambiar(clamp(a.v + delta * (max - min)));
  };
  const onPointerUp = () => { arrastre.current = null; };

  const onKey = (e: React.KeyboardEvent) => {
    if (deshabilitado) return;
    const m = e.shiftKey ? 10 : 1;
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { e.preventDefault(); onCambiar(clamp(valor + paso * m)); }
    if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { e.preventDefault(); onCambiar(clamp(valor - paso * m)); }
    if (e.key === 'Home') { e.preventDefault(); onCambiar(min); }
    if (e.key === 'End') { e.preventDefault(); onCambiar(max); }
  };

  return (
    <div className={`pot ${deshabilitado ? 'deshabilitado' : ''}`}>
      <span className="pot-etiqueta">{etiqueta}</span>
      <div
        className="pot-dial"
        role="slider"
        tabIndex={deshabilitado ? -1 : 0}
        aria-label={`${etiqueta} (${unidad})`}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={valor}
        aria-valuetext={`${valor.toFixed(decimales)} ${unidad}`}
        aria-disabled={deshabilitado}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKey}
      >
        <svg viewBox="0 0 100 100">
          <path d={arco(42, -ANG, ANG)} className="pot-pista" />
          {frac > 0.001 && <path d={arco(42, -ANG, angulo)} className="pot-valor" />}
          {Array.from({ length: 11 }, (_, i) => {
            const g = -ANG + (i / 10) * 2 * ANG;
            const a = polar(47, g), b = polar(i % 5 === 0 ? 51 : 49.5, g);
            return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="pot-marca" />;
          })}
          <circle cx="50" cy="50" r="34" className="pot-cuerpo" />
          <circle cx={perilla.x} cy={perilla.y} r="3.2" className="pot-indicador" />
        </svg>
        <div className="pot-lectura">
          <span className="pot-num">{valor.toFixed(decimales)}</span>
          <span className="pot-unidad">{unidad}</span>
        </div>
      </div>
      <div className="pot-botones">
        <button type="button" onClick={() => onCambiar(clamp(valor - paso))} disabled={deshabilitado || valor <= min} aria-label={`Bajar ${etiqueta}`}><Minus size={12} /></button>
        <button type="button" onClick={() => onCambiar(clamp(valor + paso))} disabled={deshabilitado || valor >= max} aria-label={`Subir ${etiqueta}`}><Plus size={12} /></button>
      </div>
    </div>
  );
}

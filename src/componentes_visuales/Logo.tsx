import React from 'react';

interface LogoProps {
  size?: 'sm' | 'lg';
  className?: string;
}

/**
 * Logo de NEUROVISION: tres puntos verdes sin fondo, sobre el fondo oscuro
 * de la app. Cada punto rebota verticalmente con una fase distinta
 * (desincronizada), de forma que el movimiento conjunto de los tres da la
 * ilusión de una onda que se desplaza — como una sonda solenoidal, o el
 * caminar ondulante de una oruga.
 *
 * Es 100% CSS (ver .nv-logo / .nv-logo-dot / @keyframes nv-dot-wave en
 * globals.css): sin JS ni imágenes, así carga instantáneo y respeta
 * `prefers-reduced-motion` automáticamente.
 */
export function Logo({ size = 'sm', className = '' }: LogoProps) {
  return (
    <span className={`nv-logo ${size === 'lg' ? 'nv-logo-lg' : ''} ${className}`} role="img" aria-label="Neuro Vision">
      <span className="nv-logo-dot" />
      <span className="nv-logo-dot" />
      <span className="nv-logo-dot" />
    </span>
  );
}

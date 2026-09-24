'use client';

import React from 'react';
import { Ruler, Hand, Armchair, Timer, Eye, Footprints } from 'lucide-react';
import type { PasoInstructivo } from '../InstructivoAnimado';
import type { TareaCamara, LadoUpdrs } from '@/biblioteca/math/updrs';
import {
  Muestra, analizarRepetitivo, sugerirPuntajeRepetitivo, analizarTemblor2D, sugerirPuntajeTemblor,
  FRECUENCIA_REFERENCIA, MetricasRepetitivas, MetricasTemblor, Sugerencia,
} from '@/biblioteca/math/ritmoMotor';

export interface Punto { x: number; y: number }

export type ModeloVision = 'MANO' | 'POSE';

export interface ResultadoTarea {
  tipo: 'repetitivo' | 'temblor';
  metricas: MetricasRepetitivas | MetricasTemblor;
  sugerencia: Sugerencia;
}

export interface ConfigTarea {
  titulo: string;
  modelo: ModeloVision;
  duracionMs: number;
  consigna: string; // texto corto durante la captura
  pasos: PasoInstructivo[];
  escena: React.ReactNode;
  /** Índices de landmarks a resaltar en el overlay, según el lado. */
  nodos: (lado: LadoUpdrs) => number[];
  /**
   * Convierte los landmarks de un cuadro (en píxeles) en una muestra.
   * Devuelve null si faltan puntos o la escala es inválida.
   */
  extraer: (lm: Punto[], lado: LadoUpdrs) => Omit<Muestra, 't'> | null;
  analizar: (muestras: Muestra[]) => ResultadoTarea;
  /** Señal sintética para el modo simulador. */
  simular: (t: number) => Omit<Muestra, 't'>;
}

const d = (a: Punto, b: Punto) => Math.hypot(a.x - b.x, a.y - b.y);
const DURACION = 10000;

/* Mano (MediaPipe Hands): 0 muñeca · 4 punta pulgar · 5 MCF índice · 8 punta índice
   9 MCF medio · 12/16/20 puntas medio/anular/meñique · 17 MCF meñique */
const PALMA = (lm: Punto[]) => d(lm[0], lm[9]);

/* Pose (MediaPipe Pose): lado del PACIENTE. 25/26 rodillas · 27/28 tobillos
   29/30 talones · 31/32 punta del pie. */
const POSE = {
  IZQUIERDA: { rodilla: 25, tobillo: 27, talon: 29, punta: 31 },
  DERECHA: { rodilla: 26, tobillo: 28, talon: 30, punta: 32 },
};

const ruido = () => (Math.random() - 0.5) * 0.02;

const repetitivo = (tarea: TareaCamara) => (m: Muestra[]): ResultadoTarea => {
  const metricas = analizarRepetitivo(m);
  return { tipo: 'repetitivo', metricas, sugerencia: sugerirPuntajeRepetitivo(metricas, FRECUENCIA_REFERENCIA[tarea]) };
};

/**
 * El temblor se registra en píxeles (centroide de la mano) junto con la
 * longitud de la palma de cada cuadro; se normaliza por la MEDIANA de esa
 * longitud para que el ruido cuadro a cuadro de la escala no se sume a la
 * posición.
 */
const temblor = (m: Muestra[]): ResultadoTarea => {
  const escalas = m.map(s => s.v).filter(v => v > 0).sort((a, b) => a - b);
  const esc = escalas[Math.floor(escalas.length / 2)] || 1;
  const norm = m.map(s => ({ t: s.t, v: 0, x: (s.x ?? 0) / esc, y: (s.y ?? 0) / esc }));
  const metricas = analizarTemblor2D(norm);
  return { tipo: 'temblor', metricas, sugerencia: sugerirPuntajeTemblor(metricas) };
};

/* ---------------- Escenas animadas (SVG, mismo lenguaje que el resto) ---------------- */

const Escena = ({ children, leyenda }: { children: React.ReactNode; leyenda: string }) => (
  <svg viewBox="0 0 300 120" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
    <text x="150" y="16" textAnchor="middle" fontSize="9" fill="var(--text-muted)" fontFamily="var(--font-mono)">{leyenda}</text>
    {children}
  </svg>
);

const EscenaPinza = (
  <Escena leyenda="Pulgar ↔ índice · 10 s">
    <g transform="translate(150,70)" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" fill="none">
      <line x1="-30" y1="20" x2="0" y2="0" />
      <line x1="0" y1="0" x2="34" y2="-18">
        <animateTransform attributeName="transform" type="rotate" values="0 0 0; 28 0 0; 0 0 0" dur="0.45s" repeatCount="indefinite" />
      </line>
      <line x1="0" y1="0" x2="34" y2="10" />
      <circle cx="0" cy="0" r="4" fill="var(--accent)" stroke="none" />
    </g>
  </Escena>
);

const EscenaPuno = (
  <Escena leyenda="Abrir ↔ cerrar el puño · 10 s">
    <g transform="translate(150,72)" fill="var(--accent)">
      <circle r="12" />
      {[-30, -10, 10, 30].map((a, i) => (
        <rect key={i} x="-3" y="-38" width="6" height="24" rx="3" transform={`rotate(${a})`}>
          <animate attributeName="height" values="24;6;24" dur="0.6s" repeatCount="indefinite" />
        </rect>
      ))}
    </g>
  </Escena>
);

const EscenaProno = (
  <Escena leyenda="Palma arriba ↔ palma abajo · 10 s">
    <g transform="translate(150,70)">
      <line x1="-80" y1="0" x2="-20" y2="0" stroke="var(--text-muted)" strokeWidth="6" strokeLinecap="round" />
      <ellipse cx="0" cy="0" rx="20" ry="14" fill="var(--accent)">
        <animate attributeName="ry" values="14;2;14" dur="0.7s" repeatCount="indefinite" />
      </ellipse>
    </g>
  </Escena>
);

const EscenaPie = (leyenda: string, dy: number, dur: string) => (
  <Escena leyenda={leyenda}>
    <g transform="translate(150,40)" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" fill="none">
      <line x1="-40" y1="0" x2="0" y2="0" stroke="var(--text-muted)" />
      <g>
        <animateTransform attributeName="transform" type="translate" values={`0 0; 0 -${dy}; 0 0`} dur={dur} repeatCount="indefinite" />
        <line x1="0" y1="0" x2="0" y2="50" />
        <line x1="0" y1="50" x2="24" y2="50" />
      </g>
      <line x1="-60" y1="62" x2="60" y2="62" stroke="var(--border-hover)" strokeWidth="1.5" />
    </g>
  </Escena>
);

const EscenaTemblor = (leyenda: string, extendido: boolean) => (
  <Escena leyenda={leyenda}>
    <g transform="translate(150,70)">
      <line x1={extendido ? -90 : -40} y1={extendido ? 0 : -30} x2="-10" y2="0" stroke="var(--text-muted)" strokeWidth="6" strokeLinecap="round" />
      <g>
        <animateTransform attributeName="transform" type="translate" values="0 -2; 0 2; 0 -2" dur="0.2s" repeatCount="indefinite" />
        <ellipse cx="6" cy="0" rx="16" ry="9" fill="var(--accent)" />
      </g>
    </g>
  </Escena>
);

/* ---------------- Pasos comunes ---------------- */

const pasoCamara = (dist: string, extra: React.ReactNode): PasoInstructivo =>
  ({ icon: Ruler, texto: <>Cámara <b>fija</b> a <b>{dist}</b>, bien iluminada. {extra}</> });
const pasoTiempo: PasoInstructivo = {
  icon: Timer,
  texto: <>Al presionar <b>Iniciar</b> suena un tono: el paciente comienza y continúa <b>10 segundos</b>, hasta el segundo tono.</>,
};

export const TAREAS: Record<TareaCamara, ConfigTarea> = {
  GOLPETEO_DEDOS: {
    titulo: 'Golpeteo de dedos',
    modelo: 'MANO',
    duracionMs: DURACION,
    consigna: 'Pulgar contra índice, rápido y amplio',
    escena: EscenaPinza,
    pasos: [
      pasoCamara('0,5 m', <>Sólo la <b>mano evaluada</b> en cuadro, con el dorso o el perfil hacia la cámara.</>),
      { icon: Hand, texto: <>Golpear el <b>índice contra el pulgar</b> lo más <b>rápido y amplio</b> posible, sin pausas.</> },
      pasoTiempo,
    ],
    nodos: () => [4, 8, 0, 9],
    extraer: lm => { const p = PALMA(lm); return p > 0 ? { v: d(lm[4], lm[8]) / p } : null; },
    analizar: repetitivo('GOLPETEO_DEDOS'),
    simular: t => ({ v: 0.9 * (1 - 0.25 * t / 10) * 0.5 * (1 - Math.cos(2 * Math.PI * 2.8 * t)) + ruido() }),
  },
  MOVIMIENTOS_MANOS: {
    titulo: 'Movimientos de las manos',
    modelo: 'MANO',
    duracionMs: DURACION,
    consigna: 'Abrir y cerrar el puño completamente',
    escena: EscenaPuno,
    pasos: [
      pasoCamara('0,5 m', <>Palma <b>de frente</b> a la cámara, codo flexionado.</>),
      { icon: Hand, texto: <><b>Cerrar el puño</b> y <b>abrir la mano completamente</b>, lo más rápido posible.</> },
      pasoTiempo,
    ],
    nodos: () => [0, 8, 12, 16, 20],
    extraer: lm => {
      const p = PALMA(lm); if (!(p > 0)) return null;
      return { v: [8, 12, 16, 20].reduce((s, i) => s + d(lm[i], lm[0]), 0) / 4 / p };
    },
    analizar: repetitivo('MOVIMIENTOS_MANOS'),
    simular: t => ({ v: 1 + 0.9 * (1 - 0.15 * t / 10) * 0.5 * (1 - Math.cos(2 * Math.PI * 2.0 * t)) + ruido() }),
  },
  PRONO_SUPINACION: {
    titulo: 'Pronación-supinación',
    modelo: 'MANO',
    duracionMs: DURACION,
    consigna: 'Girar la palma arriba y abajo',
    escena: EscenaProno,
    pasos: [
      pasoCamara('0,7 m', <>La cámara ve la mano <b>de frente</b>, con el brazo extendido hacia ella.</>),
      { icon: Hand, texto: <>Brazo extendido, girar la <b>palma hacia arriba y hacia abajo</b> alternadamente, rápido y amplio.</> },
      pasoTiempo,
    ],
    nodos: () => [0, 5, 9, 17],
    // Ancho aparente con signo de la palma (producto cruz 2D): ≈ cos del
    // ángulo de rotación del antebrazo; cambia de signo al pasar de palma a dorso.
    extraer: lm => {
      const p = PALMA(lm); if (!(p > 0)) return null;
      const ax = lm[9].x - lm[0].x, ay = lm[9].y - lm[0].y;
      const bx = lm[17].x - lm[5].x, by = lm[17].y - lm[5].y;
      return { v: (ax * by - ay * bx) / (p * p) };
    },
    analizar: repetitivo('PRONO_SUPINACION'),
    simular: t => ({ v: 0.8 * Math.cos(2 * Math.PI * 1.7 * t) + ruido() }),
  },
  GOLPETEO_PIE: {
    titulo: 'Golpeteo con los dedos del pie',
    modelo: 'POSE',
    duracionMs: DURACION,
    consigna: 'Talón apoyado, golpear con el antepié',
    escena: EscenaPie('Talón fijo · antepié arriba/abajo · 10 s', 8, '0.4s'),
    pasos: [
      pasoCamara('1,5 m', <>Paciente <b>sentado</b>, de frente, con <b>ambas piernas</b> y pies visibles.</>),
      { icon: Armchair, texto: <>Silla firme con respaldo. <b>Talón apoyado</b>; golpear el piso con el <b>antepié</b>, rápido y amplio.</> },
      pasoTiempo,
    ],
    nodos: lado => { const n = POSE[lado]; return [n.rodilla, n.tobillo, n.talon, n.punta]; },
    extraer: (lm, lado) => {
      const n = POSE[lado]; const pierna = d(lm[n.rodilla], lm[n.tobillo]);
      if (!(pierna > 0)) return null;
      return { v: (lm[n.talon].y - lm[n.punta].y) / pierna };
    },
    analizar: repetitivo('GOLPETEO_PIE'),
    simular: t => ({ v: 0.25 * (1 - 0.3 * t / 10) * 0.5 * (1 - Math.cos(2 * Math.PI * 2.3 * t)) + ruido() * 0.3 }),
  },
  AGILIDAD_PIERNAS: {
    titulo: 'Agilidad de las piernas',
    modelo: 'POSE',
    duracionMs: DURACION,
    consigna: 'Levantar el pie y golpear el piso',
    escena: EscenaPie('Elevar la rodilla y golpear el piso · 10 s', 22, '0.55s'),
    pasos: [
      pasoCamara('1,5 m', <>Paciente <b>sentado</b>, de frente, con <b>ambas piernas</b> visibles.</>),
      { icon: Footprints, texto: <>Levantar el pie del piso <b>elevando la rodilla</b> y golpear el suelo, lo más <b>rápido y alto</b> posible.</> },
      pasoTiempo,
    ],
    nodos: lado => { const n = POSE[lado]; return [n.rodilla, n.tobillo]; },
    extraer: (lm, lado) => {
      const n = POSE[lado]; const pierna = d(lm[n.rodilla], lm[n.tobillo]);
      if (!(pierna > 0)) return null;
      return { v: -lm[n.tobillo].y / pierna };
    },
    analizar: repetitivo('AGILIDAD_PIERNAS'),
    simular: t => ({ v: 0.6 * 0.5 * (1 - Math.cos(2 * Math.PI * 1.5 * t)) + ruido() }),
  },
  TEMBLOR_POSTURAL: {
    titulo: 'Temblor postural',
    modelo: 'MANO',
    duracionMs: DURACION,
    consigna: 'Brazos extendidos, palmas hacia abajo',
    escena: EscenaTemblor('Brazo extendido al frente · 10 s', true),
    pasos: [
      pasoCamara('0,7 m', <>La <b>mano evaluada</b> completa en cuadro.</>),
      { icon: Hand, texto: <>Brazos <b>extendidos al frente</b>, palmas hacia abajo, dedos separados. Sin apoyar.</> },
      { icon: Eye, texto: <>La amplitud en cm es una <b>estimación</b> que asume una palma adulta de ~9,5 cm.</> },
      pasoTiempo,
    ],
    nodos: () => [0, 5, 9, 13, 17],
    // v = longitud de la palma (px) para normalizar después; x/y = centroide (px).
    extraer: lm => {
      const idx = [0, 5, 9, 13, 17];
      return { v: PALMA(lm), x: idx.reduce((s, i) => s + lm[i].x, 0) / 5, y: idx.reduce((s, i) => s + lm[i].y, 0) / 5 };
    },
    analizar: temblor,
    simular: t => ({ v: 80, x: 300 + 4 * t + 6 * Math.sin(2 * Math.PI * 6.2 * t) + ruido() * 40, y: 240 + 3 * Math.sin(2 * Math.PI * 6.2 * t) }),
  },
  TEMBLOR_REPOSO: {
    titulo: 'Temblor de reposo (miembro superior)',
    modelo: 'MANO',
    duracionMs: DURACION,
    consigna: 'Manos en reposo sobre el muslo',
    escena: EscenaTemblor('Mano en reposo sobre el muslo · 10 s', false),
    pasos: [
      pasoCamara('0,7 m', <>Paciente <b>sentado</b>, la mano evaluada completa en cuadro.</>),
      { icon: Armchair, texto: <>Manos <b>relajadas sobre los muslos</b>, pies apoyados. Para hacer aparecer el temblor puede pedirse <b>cálculo mental</b> (restar de 7 en 7).</> },
      { icon: Eye, texto: <>La amplitud en cm es una <b>estimación</b> que asume una palma adulta de ~9,5 cm.</> },
      pasoTiempo,
    ],
    nodos: () => [0, 5, 9, 13, 17],
    extraer: lm => {
      const idx = [0, 5, 9, 13, 17];
      return { v: PALMA(lm), x: idx.reduce((s, i) => s + lm[i].x, 0) / 5, y: idx.reduce((s, i) => s + lm[i].y, 0) / 5 };
    },
    analizar: temblor,
    simular: t => ({ v: 80, x: 320 + 14 * Math.sin(2 * Math.PI * 4.8 * t) + ruido() * 40, y: 250 + 5 * Math.sin(2 * Math.PI * 4.8 * t) }),
  },
};

/**
 * Modo programador DBS — análisis de las "firmas" motoras.
 *
 * Una firma = parámetros de estimulación vigentes + hasta 3 pruebas:
 *  1. Sentado (MediaPipe Pose, cuerpo completo a 1 m, 15 s quieto con las
 *     manos sobre las rodillas): manos y pies se analizan como TEMBLOR
 *     (oscilación rítmica 3–12 Hz); cabeza, hombros, codos, caderas y
 *     rodillas como MOVIMIENTO INVOLUNTARIO (discinesias) — cualquier
 *     desplazamiento sostenido de segmentos que deberían estar quietos.
 *  2. Marcha de perfil (Pose): longitud de paso, cadencia y asimetría.
 *  3. Expresión facial máxima (ver expresionFacial.ts).
 *
 * Escalas: el sentado se normaliza por el ancho biacromial (hombros 11–12)
 * asumiendo 38 cm en un adulto; la marcha, por la longitud del miembro
 * inferior (cadera–tobillo ≈ 0,48 × talla). Son ESTIMACIONES para comparar
 * firmas del mismo paciente, no mediciones absolutas. Los umbrales son
 * provisionales. Pose de MediaPipe suaviza los landmarks: el temblor de
 * baja amplitud puede subestimarse (de ahí el futuro módulo con acelerómetro).
 */

import { analizarTemblor2D, detectarCiclos, remuestrear, mediaMovil, FS_REMUESTREO } from './ritmoMotor';
import type { ResultadoExpresion } from './expresionFacial';

export interface Punto { x: number; y: number }

export const ANCHO_HOMBROS_CM = 38;
export const DURACION_SENTADO_MS = 15000;

/* ------------------------------------------------------------------ */
/* 1. Sentado                                                          */
/* ------------------------------------------------------------------ */

export type RegionTemblor = 'manoD' | 'manoI' | 'pieD' | 'pieI';
export type RegionMovimiento = 'cabeza' | 'hombroD' | 'hombroI' | 'codoD' | 'codoI' | 'caderaD' | 'caderaI' | 'rodillaD' | 'rodillaI';

/** Landmarks de Pose por región (lado del PACIENTE: 12/14/16… derecha, 11/13/15… izquierda). */
export const NODOS_TEMBLOR: Record<RegionTemblor, number[]> = {
  manoD: [16, 20], manoI: [15, 19], pieD: [28, 32], pieI: [27, 31],
};
export const NODOS_MOVIMIENTO: Record<RegionMovimiento, number[]> = {
  cabeza: [0], hombroD: [12], hombroI: [11], codoD: [14], codoI: [13],
  caderaD: [24], caderaI: [23], rodillaD: [26], rodillaI: [25],
};
export const ETIQUETA_REGION: Record<RegionTemblor | RegionMovimiento, string> = {
  manoD: 'Mano derecha', manoI: 'Mano izquierda', pieD: 'Pie derecho', pieI: 'Pie izquierdo',
  cabeza: 'Cabeza / tronco', hombroD: 'Hombro derecho', hombroI: 'Hombro izquierdo', codoD: 'Codo derecho', codoI: 'Codo izquierdo',
  caderaD: 'Cadera derecha', caderaI: 'Cadera izquierda', rodillaD: 'Rodilla derecha', rodillaI: 'Rodilla izquierda',
};

const REGIONES_T = Object.keys(NODOS_TEMBLOR) as RegionTemblor[];
const REGIONES_M = Object.keys(NODOS_MOVIMIENTO) as RegionMovimiento[];
export const NODOS_SENTADO = [...new Set([...Object.values(NODOS_TEMBLOR).flat(), ...Object.values(NODOS_MOVIMIENTO).flat(), 11, 12])];

/** Muestra de un cuadro: ancho de hombros (px) y centroide de cada región (px). */
export interface MuestraSentado { esc: number; r: Record<string, [number, number]> }

const centro = (lm: Punto[], idx: number[]): [number, number] =>
  [idx.reduce((s, i) => s + lm[i].x, 0) / idx.length, idx.reduce((s, i) => s + lm[i].y, 0) / idx.length];

export function extraerMuestraSentado(lm: Punto[], visible: (idx: number[]) => boolean): MuestraSentado | null {
  if (!visible([11, 12])) return null;
  const esc = Math.hypot(lm[11].x - lm[12].x, lm[11].y - lm[12].y);
  if (!(esc > 20)) return null;
  const r: Record<string, [number, number]> = {};
  for (const k of REGIONES_T) if (visible(NODOS_TEMBLOR[k])) r[k] = centro(lm, NODOS_TEMBLOR[k]);
  for (const k of REGIONES_M) if (visible(NODOS_MOVIMIENTO[k])) r[k] = centro(lm, NODOS_MOVIMIENTO[k]);
  return { esc, r };
}

export interface TemblorRegion { amplitudCm: number; frecuencia: number; ritmicidad: number; presente: boolean }
export interface MovimientoRegion { rangoCm: number; nivel: 0 | 1 | 2 | 3 }

export interface ResultadoSentado {
  temblor: Partial<Record<RegionTemblor, TemblorRegion>>;
  movimiento: Partial<Record<RegionMovimiento, MovimientoRegion>>;
  /** Suma de los rangos de movimiento por encima del umbral de ruido (cm). */
  indiceDiscinesias: number;
  regionesConMovimiento: number;
  temblorMaxCm: number;
  duracionS: number;
}

export const UMBRAL_TEMBLOR_POSE_CM = 0.6;
export const UMBRAL_MOVIMIENTO_CM = 1.5;
const nivelMovimiento = (cm: number): 0 | 1 | 2 | 3 => (cm < UMBRAL_MOVIMIENTO_CM ? 0 : cm < 4 ? 1 : cm < 8 ? 2 : 3);
export const ETIQUETA_NIVEL = ['Quieto', 'Leve', 'Moderado', 'Marcado'] as const;

function percentil(arr: number[], p: number) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.max(0, Math.round((p / 100) * (s.length - 1))))];
}

export function analizarSentado(m: (MuestraSentado & { t: number })[]): ResultadoSentado | null {
  if (m.length < 30) return null;
  const esc = percentil(m.map(x => x.esc), 50);
  const serie = (k: string) => m.filter(x => x.r[k]).map(x => ({ t: x.t, v: 0, x: x.r[k][0] / esc, y: x.r[k][1] / esc }));

  const temblor: ResultadoSentado['temblor'] = {};
  for (const k of REGIONES_T) {
    const s = serie(k);
    if (s.length < 30) continue;
    const a = analizarTemblor2D(s, ANCHO_HOMBROS_CM);
    temblor[k] = {
      amplitudCm: +a.amplitudCm.toFixed(2), frecuencia: a.frecuencia, ritmicidad: +a.potenciaRelativa.toFixed(2),
      presente: a.amplitudCm >= UMBRAL_TEMBLOR_POSE_CM && a.potenciaRelativa >= 0.2,
    };
  }

  const movimiento: ResultadoSentado['movimiento'] = {};
  for (const k of REGIONES_M) {
    const s = serie(k);
    if (s.length < 30) continue;
    // Rango robusto (p5–p95) sobre el eje de mayor desplazamiento, suavizado
    // para no contar el temblor ni el jitter como discinesia.
    const xs = mediaMovil(remuestrear(s, 'x'), 7), ys = mediaMovil(remuestrear(s, 'y'), 7);
    const mx = xs.reduce((a, b) => a + b, 0) / xs.length, my = ys.reduce((a, b) => a + b, 0) / ys.length;
    let sxx = 0, syy = 0, sxy = 0;
    xs.forEach((x, i) => { const dx = x - mx, dy = ys[i] - my; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; });
    const th = 0.5 * Math.atan2(2 * sxy, sxx - syy);
    const proy = xs.map((x, i) => (x - mx) * Math.cos(th) + (ys[i] - my) * Math.sin(th));
    const rango = (percentil(proy, 95) - percentil(proy, 5)) * ANCHO_HOMBROS_CM;
    movimiento[k] = { rangoCm: +rango.toFixed(2), nivel: nivelMovimiento(rango) };
  }

  const movs = Object.values(movimiento);
  const tr = Object.values(temblor);
  return {
    temblor, movimiento,
    indiceDiscinesias: +movs.reduce((s, x) => s + Math.max(0, x.rangoCm - UMBRAL_MOVIMIENTO_CM), 0).toFixed(1),
    regionesConMovimiento: movs.filter(x => x.nivel > 0).length,
    temblorMaxCm: +Math.max(0, ...tr.filter(x => x.presente).map(x => x.amplitudCm)).toFixed(2),
    duracionS: +(m[m.length - 1].t - m[0].t).toFixed(1),
  };
}

export function simularMuestraSentado(t: number): MuestraSentado {
  const ruido = () => (Math.random() - 0.5) * 0.8;
  const trem = 3.5 * Math.sin(2 * Math.PI * 5.2 * t); // temblor mano derecha
  const corea = 12 * Math.sin(2 * Math.PI * 0.6 * t) + 6 * Math.sin(2 * Math.PI * 1.3 * t + 1); // hombro/cabeza
  const r: Record<string, [number, number]> = {
    manoD: [250 + trem + ruido(), 330 + trem * 0.5 + ruido()], manoI: [390 + ruido(), 330 + ruido()],
    pieD: [270 + ruido(), 450 + ruido()], pieI: [370 + ruido(), 450 + ruido()],
    cabeza: [320 + corea * 0.6 + ruido(), 90 + ruido()], hombroD: [270 + corea * 0.3 + ruido(), 160 + ruido()], hombroI: [370 + ruido(), 160 + ruido()],
    codoD: [255 + ruido(), 240 + ruido()], codoI: [385 + ruido(), 240 + ruido()], caderaD: [285 + ruido(), 290 + ruido()], caderaI: [355 + ruido(), 290 + ruido()],
    rodillaD: [270 + ruido(), 330 + ruido()], rodillaI: [370 + ruido(), 330 + ruido()],
  };
  return { esc: 100, r };
}

/* ------------------------------------------------------------------ */
/* 2. Marcha                                                           */
/* ------------------------------------------------------------------ */

export const NODOS_MARCHA = [23, 24, 25, 26, 27, 28, 31, 32];
export const DURACION_MARCHA_MS = 15000;

/** x de tobillos y cadera (px) + longitud del miembro inferior (px). */
export interface MuestraMarcha { xI: number; xD: number; xCadera: number; pierna: number }

export function extraerMuestraMarcha(lm: Punto[], visible: (idx: number[]) => boolean): MuestraMarcha | null {
  if (!visible([23, 24, 27, 28])) return null;
  const pierna = (Math.hypot(lm[23].x - lm[27].x, lm[23].y - lm[27].y) + Math.hypot(lm[24].x - lm[28].x, lm[24].y - lm[28].y)) / 2;
  if (!(pierna > 30)) return null;
  return { xI: lm[27].x, xD: lm[28].x, xCadera: (lm[23].x + lm[24].x) / 2, pierna };
}

export interface ResultadoMarcha {
  pasos: number;
  longitudMediaCm: number;
  longitudDCm: number | null;
  longitudICm: number | null;
  /** (D − I) / máx × 100 */
  asimetria: number | null;
  cadencia: number; // pasos / min
  variabilidad: number; // CV de la longitud (%)
}

export function analizarMarcha(m: (MuestraMarcha & { t: number })[], tallaCm: number): ResultadoMarcha | null {
  if (m.length < 20) return null;
  const pierna = percentil(m.map(x => x.pierna), 50);
  const cmPorUnidad = 0.48 * tallaCm; // 1 unidad = longitud del miembro inferior
  const sig = m.map(x => ({ t: x.t, v: (x.xI - x.xD) / pierna }));
  const s = mediaMovil(remuestrear(sig, 'v'), 3);
  // Dirección de la marcha: signo del desplazamiento de la cadera.
  const dir = Math.sign(m[m.length - 1].xCadera - m[0].xCadera) || 1;
  // Picos positivos: tobillo izquierdo adelante si se camina hacia +x.
  const pos = detectarCiclos(s).map(c => ({ ...c, lado: dir > 0 ? 'I' : 'D' }));
  const neg = detectarCiclos(s.map(v => -v)).map(c => ({ ...c, lado: dir > 0 ? 'D' : 'I' }));
  const pico = (tp: number, signo: number) => Math.abs(s[Math.min(s.length - 1, Math.round(tp * FS_REMUESTREO))]) * signo;
  const pasos = [...pos.map(c => ({ t: c.tPico, lado: c.lado, long: Math.abs(pico(c.tPico, 1)) * cmPorUnidad })),
    ...neg.map(c => ({ t: c.tPico, lado: c.lado, long: Math.abs(pico(c.tPico, 1)) * cmPorUnidad }))].sort((a, b) => a.t - b.t);
  if (pasos.length < 2) return null;
  const media = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
  const longs = pasos.map(p => p.long);
  const lm = media(longs)!;
  const sd = Math.sqrt(longs.reduce((a, b) => a + (b - lm) ** 2, 0) / longs.length);
  const lD = media(pasos.filter(p => p.lado === 'D').map(p => p.long));
  const lI = media(pasos.filter(p => p.lado === 'I').map(p => p.long));
  const dur = pasos[pasos.length - 1].t - pasos[0].t;
  const r1 = (x: number) => +x.toFixed(1);
  return {
    pasos: pasos.length,
    longitudMediaCm: r1(lm),
    longitudDCm: lD === null ? null : r1(lD),
    longitudICm: lI === null ? null : r1(lI),
    asimetria: lD !== null && lI !== null ? r1(((lD - lI) / Math.max(lD, lI)) * 100) : null,
    cadencia: dur > 0 ? r1(((pasos.length - 1) / dur) * 60) : 0,
    variabilidad: r1(lm > 0 ? (sd / lm) * 100 : 0),
  };
}

export function simularMuestraMarcha(t: number): MuestraMarcha {
  const f = 0.9; // zancadas/s
  const amp = 0.55 + 0.05 * Math.sin(t);
  return { xI: 100 + 40 * t + amp * 160 * Math.sin(2 * Math.PI * f * t), xD: 100 + 40 * t - amp * 0.85 * 160 * Math.sin(2 * Math.PI * f * t), xCadera: 100 + 40 * t, pierna: 160 };
}

/* ------------------------------------------------------------------ */
/* 3. Firmas y comparación                                             */
/* ------------------------------------------------------------------ */

export interface ParametrosLado { activo: boolean; mA: number; us: number; Hz: number }
export type TipoFirma = 'BASAL' | 'PROGRAMA' | 'OFF_DISPOSITIVO' | 'PREOPERATORIO';

export const ETIQUETA_TIPO_FIRMA: Record<TipoFirma, string> = {
  BASAL: 'Basal (ingreso)', PROGRAMA: 'Programa', OFF_DISPOSITIVO: 'OFF de dispositivo', PREOPERATORIO: 'Preoperatorio',
};

export interface Firma {
  id: string;
  etiqueta: string;
  tipo: TipoFirma;
  hora: string; // ISO
  parametros: { D: ParametrosLado; I: ParametrosLado };
  notas: string;
  sentado?: ResultadoSentado;
  marcha?: ResultadoMarcha;
  facial?: ResultadoExpresion;
}

export const PARAMETROS_INICIALES: ParametrosLado = { activo: true, mA: 0, us: 60, Hz: 130 };

export const RANGOS = {
  mA: { min: 0, max: 10, paso: 0.1, unidad: 'mA', etiqueta: 'Amplitud' },
  us: { min: 0, max: 150, paso: 10, unidad: 'µs', etiqueta: 'Ancho de pulso' },
  Hz: { min: 0, max: 200, paso: 5, unidad: 'Hz', etiqueta: 'Frecuencia' },
} as const;

export function resumenParametros(f: Firma): string {
  if (f.tipo === 'OFF_DISPOSITIVO' || f.tipo === 'PREOPERATORIO') return ETIQUETA_TIPO_FIRMA[f.tipo];
  const l = (k: 'D' | 'I') => {
    const p = f.parametros[k];
    return p.activo ? `${k} ${p.mA.toFixed(1)} mA · ${p.us} µs · ${p.Hz} Hz` : `${k} OFF`;
  };
  return `${l('D')} | ${l('I')}`;
}

export type Dominio = 'temblor' | 'discinesias' | 'marcha' | 'facial';

export interface Metrica {
  clave: string;
  dominio: Dominio;
  etiqueta: string;
  unidad: string;
  /** Qué dirección es mejoría clínica. */
  mejor: 'menor' | 'mayor';
  valor: (f: Firma) => number | null | undefined;
}

const tr = (k: RegionTemblor) => (f: Firma) => f.sentado ? (f.sentado.temblor[k]?.presente ? f.sentado.temblor[k]!.amplitudCm : f.sentado.temblor[k] ? 0 : null) : undefined;

export const METRICAS: Metrica[] = [
  { clave: 't-max', dominio: 'temblor', etiqueta: 'Temblor máximo (cualquier segmento)', unidad: 'cm', mejor: 'menor', valor: f => f.sentado?.temblorMaxCm },
  { clave: 't-manoD', dominio: 'temblor', etiqueta: 'Temblor mano derecha', unidad: 'cm', mejor: 'menor', valor: tr('manoD') },
  { clave: 't-manoI', dominio: 'temblor', etiqueta: 'Temblor mano izquierda', unidad: 'cm', mejor: 'menor', valor: tr('manoI') },
  { clave: 't-pieD', dominio: 'temblor', etiqueta: 'Temblor pie derecho', unidad: 'cm', mejor: 'menor', valor: tr('pieD') },
  { clave: 't-pieI', dominio: 'temblor', etiqueta: 'Temblor pie izquierdo', unidad: 'cm', mejor: 'menor', valor: tr('pieI') },
  { clave: 'd-indice', dominio: 'discinesias', etiqueta: 'Índice de discinesias (suma sobre umbral)', unidad: 'cm', mejor: 'menor', valor: f => f.sentado?.indiceDiscinesias },
  { clave: 'd-regiones', dominio: 'discinesias', etiqueta: 'Regiones con movimiento involuntario', unidad: '', mejor: 'menor', valor: f => f.sentado?.regionesConMovimiento },
  { clave: 'm-long', dominio: 'marcha', etiqueta: 'Longitud media del paso', unidad: 'cm', mejor: 'mayor', valor: f => f.marcha?.longitudMediaCm },
  { clave: 'm-cad', dominio: 'marcha', etiqueta: 'Cadencia', unidad: 'pasos/min', mejor: 'mayor', valor: f => f.marcha?.cadencia },
  { clave: 'm-asim', dominio: 'marcha', etiqueta: 'Asimetría del paso (absoluta)', unidad: '%', mejor: 'menor', valor: f => (f.marcha?.asimetria === undefined ? undefined : f.marcha.asimetria === null ? null : Math.abs(f.marcha.asimetria)) },
  { clave: 'f-global', dominio: 'facial', etiqueta: 'Índice de expresión global', unidad: '% DIC', mejor: 'mayor', valor: f => f.facial?.indiceGlobal },
  { clave: 'f-asim', dominio: 'facial', etiqueta: 'Asimetría facial media', unidad: '%', mejor: 'menor', valor: f => f.facial?.asimetriaGlobal },
  { clave: 'f-sonrisa', dominio: 'facial', etiqueta: 'Sonrisa (media D/I)', unidad: '% DIC', mejor: 'mayor', valor: f => (f.facial ? (f.facial.gestos.sonrisa.derecha + f.facial.gestos.sonrisa.izquierda) / 2 : undefined) },
];

export const ETIQUETA_DOMINIO: Record<Dominio, string> = {
  temblor: 'Temblor', discinesias: 'Discinesias', marcha: 'Marcha', facial: 'Expresión facial',
};

/** Cambio respecto de la referencia, con signo clínico: positivo = mejoría. */
export function cambioClinico(m: Metrica, valor: number, referencia: number): number | null {
  if (referencia === 0) return valor === 0 ? 0 : null;
  const pct = ((valor - referencia) / Math.abs(referencia)) * 100;
  return m.mejor === 'menor' ? -pct : pct;
}

/**
 * Expresión facial máxima global.
 *
 * Secuencia guiada de 15 s: reposo → boca en pico (trompa) → elevación
 * máxima de cejas → sonrisa máxima. En cada cuadro se miden DISTANCIAS
 * entre landmarks de MediaPipe Face Landmarker, por hemicara, normalizadas
 * por la distancia intercantal externa (landmarks 33–263): así el resultado
 * no depende de la distancia a la cámara y se expresa como "% DIC".
 *
 * Landmarks (imagen SIN espejar: el lado derecho del paciente aparece a la
 * izquierda de la imagen; la numeración de MediaPipe ya es anatómica):
 *   33 / 263   canto externo derecho / izquierdo
 *   61 / 291   comisura labial derecha / izquierda
 *   0          centro del labio superior (línea media)
 *   105 / 334  ceja derecha / izquierda (porción media)
 *   159 / 386  párpado superior derecho / izquierdo
 */

export interface Punto { x: number; y: number }

export const NODOS_EXPRESION = [33, 263, 61, 291, 0, 105, 334, 159, 386];

export interface MuestraFacial {
  cejaD: number; cejaI: number; // ceja ↔ párpado superior
  comD: number; comI: number; // canto externo ↔ comisura (la sonrisa lo acorta)
  hemiD: number; hemiI: number; // comisura ↔ línea media (el pico lo acorta, la sonrisa lo alarga)
  ancho: number; // comisura ↔ comisura
}

const d = (a: Punto, b: Punto) => Math.hypot(a.x - b.x, a.y - b.y);

export function extraerMuestraFacial(lm: Punto[]): MuestraFacial | null {
  if (lm.length < 400) return null;
  const dic = d(lm[33], lm[263]);
  if (!(dic > 10)) return null;
  const n = (a: number, b: number) => (d(lm[a], lm[b]) / dic) * 100;
  return {
    cejaD: n(105, 159), cejaI: n(334, 386),
    comD: n(33, 61), comI: n(263, 291),
    hemiD: n(61, 0), hemiI: n(291, 0),
    ancho: n(61, 291),
  };
}

/** Fases de la secuencia (segundo en que termina cada una). */
export const FASES_EXPRESION = [
  { clave: 'reposo', hastaS: 3, texto: 'Rostro relajado' },
  { clave: 'pico', hastaS: 7, texto: 'Boca en pico (trompa)' },
  { clave: 'cejas', hastaS: 11, texto: 'Cejas arriba al máximo' },
  { clave: 'sonrisa', hastaS: 15, texto: 'Sonrisa máxima' },
] as const;
export const DURACION_EXPRESION_MS = 15000;

export type Gesto = 'pico' | 'cejas' | 'sonrisa';

export interface ResultadoGesto {
  derecha: number; // excursión en % DIC
  izquierda: number;
  /** (D − I) / máx(D, I) × 100. Positivo = la hemicara derecha se mueve más. */
  asimetria: number;
}

export interface ResultadoExpresion {
  gestos: Record<Gesto, ResultadoGesto>;
  /** Promedio de las excursiones de ambos lados en los 3 gestos (% DIC). */
  indiceGlobal: number;
  /** Asimetría media absoluta (%). */
  asimetriaGlobal: number;
  muestrasValidas: number;
}

export const ETIQUETA_GESTO: Record<Gesto, string> = {
  pico: 'Boca en pico',
  cejas: 'Elevación de cejas',
  sonrisa: 'Sonrisa máxima',
};

export const DESCRIPCION_GESTO: Record<Gesto, string> = {
  pico: 'Acortamiento comisura ↔ línea media',
  cejas: 'Aumento ceja ↔ párpado superior',
  sonrisa: 'Acortamiento canto externo ↔ comisura',
};

function percentil(arr: number[], p: number): number {
  if (!arr.length) return NaN;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.max(0, Math.round((p / 100) * (s.length - 1))))];
}

const asim = (a: number, b: number) => { const m = Math.max(Math.abs(a), Math.abs(b)); return m > 0 ? ((a - b) / m) * 100 : 0; };

/**
 * Para cada gesto se toma la ventana estable (se descartan 0,8 s iniciales
 * de transición) y se compara el pico de la contracción (percentil 90/10,
 * robusto a cuadros aislados) contra la mediana del reposo.
 */
export function analizarExpresion(muestras: (MuestraFacial & { t: number })[]): ResultadoExpresion | null {
  const ventana = (desde: number, hasta: number) => muestras.filter(m => m.t >= desde && m.t < hasta);
  const reposo = ventana(0.5, 3);
  const pico = ventana(3.8, 7);
  const cejas = ventana(7.8, 11);
  const sonrisa = ventana(11.8, 15.5);
  if ([reposo, pico, cejas, sonrisa].some(v => v.length < 5)) return null;

  const base = (k: keyof MuestraFacial) => percentil(reposo.map(m => m[k]), 50);
  const bajo = (v: typeof muestras, k: keyof MuestraFacial) => percentil(v.map(m => m[k]), 10);
  const alto = (v: typeof muestras, k: keyof MuestraFacial) => percentil(v.map(m => m[k]), 90);
  const pos = (x: number) => Math.max(0, x);

  const gPico = { derecha: pos(base('hemiD') - bajo(pico, 'hemiD')), izquierda: pos(base('hemiI') - bajo(pico, 'hemiI')) };
  const gCejas = { derecha: pos(alto(cejas, 'cejaD') - base('cejaD')), izquierda: pos(alto(cejas, 'cejaI') - base('cejaI')) };
  const gSonrisa = { derecha: pos(base('comD') - bajo(sonrisa, 'comD')), izquierda: pos(base('comI') - bajo(sonrisa, 'comI')) };

  const r = (x: number) => +x.toFixed(1);
  const armar = (g: { derecha: number; izquierda: number }): ResultadoGesto =>
    ({ derecha: r(g.derecha), izquierda: r(g.izquierda), asimetria: r(asim(g.derecha, g.izquierda)) });

  const gestos = { pico: armar(gPico), cejas: armar(gCejas), sonrisa: armar(gSonrisa) };
  const todos = Object.values(gestos);
  return {
    gestos,
    indiceGlobal: r(todos.reduce((s, g) => s + (g.derecha + g.izquierda) / 2, 0) / 3),
    asimetriaGlobal: r(todos.reduce((s, g) => s + Math.abs(g.asimetria), 0) / 3),
    muestrasValidas: muestras.length,
  };
}

/** Señal sintética para el modo simulador (hemicara izquierda ~30 % más débil). */
export function simularMuestraFacial(t: number): MuestraFacial {
  const env = (a: number, b: number) => (t < a || t > b ? 0 : Math.min(1, (t - a) / 0.6, (b - t) / 0.4));
  const ruido = () => (Math.random() - 0.5) * 0.6;
  const p = env(3, 7), c = env(7, 11), s = env(11, 15);
  return {
    cejaD: 38 + 9 * c + ruido(), cejaI: 38 + 6.3 * c + ruido(),
    comD: 118 - 10 * s + ruido(), comI: 118 - 7 * s + ruido(),
    hemiD: 46 - 11 * p + 5 * s + ruido(), hemiI: 46 - 7.7 * p + 3.5 * s + ruido(),
    ancho: 92 - 18 * p + 10 * s + ruido(),
  };
}

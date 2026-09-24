/**
 * Análisis de señales de movimiento para la UPDRS III asistida.
 *
 * Dos familias de tareas:
 *  1. Movimientos repetitivos (golpeteo de dedos, apertura/cierre de mano,
 *     prono-supinación, golpeteo del pie, agilidad de piernas): se detectan
 *     ciclos en una señal escalar y se calculan frecuencia, amplitud,
 *     decremento, interrupciones e irregularidad — los mismos rasgos que el
 *     evaluador mira a ojo.
 *  2. Temblor (postural y de reposo): se analiza la posición 2D de la mano,
 *     se filtra el movimiento voluntario lento, y se estiman frecuencia
 *     dominante (DFT 3–12 Hz) y amplitud pico a pico en centímetros.
 *
 * Los puntajes que devuelven las funciones `sugerir*` son ORIENTATIVOS: los
 * umbrales son provisionales y no están validados contra evaluadores
 * certificados. La app siempre pide al médico que confirme o corrija.
 */

export interface Muestra {
  t: number; // segundos
  v: number; // señal escalar normalizada (tareas repetitivas)
  x?: number; // posición normalizada (temblor)
  y?: number;
}

export const FS_REMUESTREO = 30; // Hz

/** Interpola linealmente una serie irregular a frecuencia fija. */
export function remuestrear(muestras: Muestra[], canal: 'v' | 'x' | 'y', fs = FS_REMUESTREO): number[] {
  const validas = muestras.filter(m => Number.isFinite(m[canal] as number));
  if (validas.length < 2) return [];
  const t0 = validas[0].t, t1 = validas[validas.length - 1].t;
  const n = Math.floor((t1 - t0) * fs) + 1;
  const out: number[] = new Array(n);
  let j = 0;
  for (let i = 0; i < n; i++) {
    const t = t0 + i / fs;
    while (j < validas.length - 2 && validas[j + 1].t < t) j++;
    const a = validas[j], b = validas[j + 1];
    const va = a[canal] as number, vb = b[canal] as number;
    const dt = b.t - a.t;
    out[i] = dt > 0 ? va + ((vb - va) * (t - a.t)) / dt : va;
  }
  return out;
}

export function mediaMovil(s: number[], ventana: number): number[] {
  if (ventana <= 1) return [...s];
  const half = Math.floor(ventana / 2);
  return s.map((_, i) => {
    let sum = 0, n = 0;
    for (let k = Math.max(0, i - half); k <= Math.min(s.length - 1, i + half); k++) { sum += s[k]; n++; }
    return sum / n;
  });
}

function percentil(arr: number[], p: number): number {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const idx = Math.min(s.length - 1, Math.max(0, Math.round((p / 100) * (s.length - 1))));
  return s[idx];
}

const mediana = (arr: number[]) => percentil(arr, 50);

/* ------------------------------------------------------------------ */
/* 1. Tareas repetitivas                                               */
/* ------------------------------------------------------------------ */

export interface Ciclo { tPico: number; amplitud: number }

export interface MetricasRepetitivas {
  ciclos: number;
  duracion: number; // s
  frecuencia: number; // Hz (ciclos / s entre el primer y último pico)
  amplitudMedia: number; // unidades relativas (normalizadas por tamaño corporal)
  /** Pérdida de amplitud estimada entre el inicio y el final (0–100 %). */
  decremento: number;
  /** Pausas: intervalos entre picos > 1,8 × la mediana. */
  interrupciones: number;
  /** Coeficiente de variación de los intervalos entre picos (%). */
  irregularidad: number;
  serie: { t: number; v: number }[];
  picos: Ciclo[];
}

/**
 * Detección de ciclos con histéresis: un ciclo se cuenta cuando la señal
 * sube desde un valle más de `h` y luego vuelve a bajar más de `h` desde el
 * pico. `h` es el 25 % del rango robusto (p5–p95) de la señal, lo que
 * descarta el jitter de los landmarks sin perder ciclos pequeños.
 */
export function detectarCiclos(s: number[], fs = FS_REMUESTREO): Ciclo[] {
  if (s.length < 5) return [];
  const rango = percentil(s, 95) - percentil(s, 5);
  if (rango <= 1e-6) return [];
  const h = rango * 0.25;
  const ciclos: Ciclo[] = [];
  let valle = s[0], pico = s[0], iPico = 0;
  let subiendo = false;
  for (let i = 1; i < s.length; i++) {
    const v = s[i];
    if (!subiendo) {
      if (v < valle) valle = v;
      if (v > valle + h) { subiendo = true; pico = v; iPico = i; }
    } else {
      if (v > pico) { pico = v; iPico = i; }
      if (v < pico - h) {
        ciclos.push({ tPico: iPico / fs, amplitud: pico - valle });
        subiendo = false;
        valle = v;
      }
    }
  }
  return ciclos;
}

function regresionLineal(xs: number[], ys: number[]) {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (xs[i] - mx) * (ys[i] - my); den += (xs[i] - mx) ** 2; }
  const b = den > 0 ? num / den : 0;
  return { a: my - b * mx, b };
}

export function analizarRepetitivo(muestras: Muestra[]): MetricasRepetitivas {
  const cruda = remuestrear(muestras, 'v');
  const s = mediaMovil(cruda, 3);
  const duracion = s.length / FS_REMUESTREO;
  const picos = detectarCiclos(s);
  const serie = s.map((v, i) => ({ t: +(i / FS_REMUESTREO).toFixed(3), v: +v.toFixed(4) }));
  const vacio = { ciclos: picos.length, duracion, frecuencia: 0, amplitudMedia: 0, decremento: 0, interrupciones: 0, irregularidad: 0, serie, picos };
  if (picos.length < 2) return { ...vacio, amplitudMedia: picos[0]?.amplitud ?? 0 };

  const intervalos = picos.slice(1).map((p, i) => p.tPico - picos[i].tPico);
  const med = mediana(intervalos);
  const frecuencia = (picos.length - 1) / (picos[picos.length - 1].tPico - picos[0].tPico);
  const amps = picos.map(p => p.amplitud);
  const amplitudMedia = amps.reduce((a, b) => a + b, 0) / amps.length;

  // Decremento: recta de amplitud vs. número de ciclo, comparando el valor
  // ajustado al final contra el del inicio (robusto a un ciclo aislado).
  const { a, b } = regresionLineal(amps.map((_, i) => i), amps);
  const ini = a, fin = a + b * (amps.length - 1);
  const decremento = ini > 0 ? Math.max(0, Math.min(100, ((ini - fin) / ini) * 100)) : 0;

  const interrupciones = intervalos.filter(d => d > med * 1.8).length;
  const mInt = intervalos.reduce((x, y) => x + y, 0) / intervalos.length;
  const sdInt = Math.sqrt(intervalos.reduce((x, y) => x + (y - mInt) ** 2, 0) / intervalos.length);
  const irregularidad = mInt > 0 ? (sdInt / mInt) * 100 : 0;

  return { ciclos: picos.length, duracion, frecuencia, amplitudMedia, decremento, interrupciones, irregularidad, serie, picos };
}

/** `puntaje` null = rasgo informativo, no aporta al puntaje sugerido. */
export interface Criterio { rasgo: string; valor: string; puntaje: number | null }
export interface Sugerencia { puntaje: number; criterios: Criterio[] }

/**
 * Frecuencia de referencia (Hz) de una persona sin parkinsonismo para cada
 * tarea — valores aproximados de la literatura de cinemática; provisionales.
 */
export const FRECUENCIA_REFERENCIA: Record<string, number> = {
  GOLPETEO_DEDOS: 3.5,
  MOVIMIENTOS_MANOS: 2.5,
  PRONO_SUPINACION: 2.2,
  GOLPETEO_PIE: 3.0,
  AGILIDAD_PIERNAS: 2.0,
};

export function sugerirPuntajeRepetitivo(m: MetricasRepetitivas, frecuenciaReferencia: number): Sugerencia {
  if (m.ciclos < 3) {
    return { puntaje: 4, criterios: [{ rasgo: 'Ciclos detectados', valor: String(m.ciclos), puntaje: 4 }] };
  }
  const ratio = m.frecuencia / frecuenciaReferencia;
  const pVel = ratio >= 0.85 ? 0 : ratio >= 0.65 ? 1 : ratio >= 0.45 ? 2 : ratio >= 0.25 ? 3 : 4;
  const pInt = m.interrupciones === 0 ? 0 : m.interrupciones <= 2 ? 1 : m.interrupciones <= 5 ? 2 : 3;
  const pDec = m.decremento < 15 ? 0 : m.decremento < 30 ? 1 : m.decremento < 50 ? 2 : 3;
  const criterios: Criterio[] = [
    { rasgo: 'Velocidad', valor: `${m.frecuencia.toFixed(2)} Hz (${Math.round(ratio * 100)} % de ref.)`, puntaje: pVel },
    { rasgo: 'Interrupciones', valor: String(m.interrupciones), puntaje: pInt },
    { rasgo: 'Decremento de amplitud', valor: `${Math.round(m.decremento)} %`, puntaje: pDec },
  ];
  // Como en la escala, manda el rasgo más afectado.
  return { puntaje: Math.max(pVel, pInt, pDec), criterios };
}

/* ------------------------------------------------------------------ */
/* 2. Temblor                                                          */
/* ------------------------------------------------------------------ */

/**
 * Longitud de referencia de la palma (muñeca → articulación MCF del dedo
 * medio, landmarks 0→9 de MediaPipe Hands) en un adulto: ~9,5 cm. Se usa
 * para pasar de unidades normalizadas a centímetros aproximados.
 */
export const LONGITUD_PALMA_CM = 9.5;

export interface MetricasTemblor {
  frecuencia: number; // Hz
  amplitudCm: number; // pico a pico, estimada
  potenciaRelativa: number; // fracción de la potencia 3–12 Hz en el pico ±0,5 Hz
  espectro: { f: number; p: number }[];
  serie: { t: number; v: number }[];
}

export function analizarTemblor2D(muestras: Muestra[], escalaCm = LONGITUD_PALMA_CM): MetricasTemblor {
  const xs = remuestrear(muestras, 'x');
  const ys = remuestrear(muestras, 'y');
  const n = Math.min(xs.length, ys.length);
  const vacio = { frecuencia: 0, amplitudCm: 0, potenciaRelativa: 0, espectro: [], serie: [] };
  if (n < FS_REMUESTREO * 2) return vacio;

  // Pasa-altos: se resta una media móvil de 1 s. Elimina la deriva y el
  // movimiento voluntario lento; para f ≥ 3 Hz la media móvil deja pasar
  // < 11 % de la oscilación, así que la amplitud del temblor casi no se
  // altera (con ventanas más cortas el error llegaba a ±20 %).
  const vent = FS_REMUESTREO + 1;
  const bx = mediaMovil(xs.slice(0, n), vent), by = mediaMovil(ys.slice(0, n), vent);
  const hx = bx.map((b, i) => xs[i] - b);
  const hy = by.map((b, i) => ys[i] - b);

  // Eje principal del temblor (PCA 2×2) para medir la amplitud sobre la
  // dirección en que realmente oscila la mano.
  let sxx = 0, syy = 0, sxy = 0;
  for (let i = 0; i < n; i++) { sxx += hx[i] * hx[i]; syy += hy[i] * hy[i]; sxy += hx[i] * hy[i]; }
  const theta = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  const proy = hx.map((x, i) => x * Math.cos(theta) + hy[i] * Math.sin(theta));

  // DFT 3–12 Hz.
  const espectro: { f: number; p: number }[] = [];
  let pMax = 0, fMax = 0, pTot = 0;
  for (let f = 3; f <= 12.0001; f += 0.1) {
    let re = 0, im = 0;
    for (let k = 0; k < n; k++) {
      const ang = (2 * Math.PI * f * k) / FS_REMUESTREO;
      re += proy[k] * Math.cos(ang);
      im -= proy[k] * Math.sin(ang);
    }
    const p = (re * re + im * im) / n;
    espectro.push({ f: +f.toFixed(1), p });
    pTot += p;
    if (p > pMax) { pMax = p; fMax = f; }
  }
  const pPico = espectro.filter(e => Math.abs(e.f - fMax) <= 0.5).reduce((a, e) => a + e.p, 0);

  // Amplitud pico a pico: percentiles 5–95 de la señal proyectada (robusto
  // a picos aislados), convertida a cm con la longitud de la palma.
  const pp = percentil(proy, 95) - percentil(proy, 5);
  return {
    frecuencia: +fMax.toFixed(1),
    amplitudCm: pp * escalaCm,
    potenciaRelativa: pTot > 0 ? pPico / pTot : 0,
    espectro,
    serie: proy.map((v, i) => ({ t: +(i / FS_REMUESTREO).toFixed(3), v: +(v * escalaCm).toFixed(3) })),
  };
}

/** Por debajo de esto, la oscilación no se distingue del ruido de los landmarks. */
export const UMBRAL_RUIDO_CM = 0.4;

export function sugerirPuntajeTemblor(m: MetricasTemblor): Sugerencia {
  const hayTemblor = m.amplitudCm >= UMBRAL_RUIDO_CM && m.potenciaRelativa >= 0.2;
  const a = m.amplitudCm;
  const p = !hayTemblor ? 0 : a < 1 ? 1 : a < 3 ? 2 : a < 10 ? 3 : 4;
  return {
    puntaje: p,
    criterios: [
      { rasgo: 'Amplitud pico a pico', valor: `${a.toFixed(1)} cm`, puntaje: p },
      { rasgo: 'Frecuencia dominante', valor: hayTemblor ? `${m.frecuencia.toFixed(1)} Hz` : '—', puntaje: null },
      { rasgo: 'Ritmicidad (potencia en el pico)', valor: `${Math.round(m.potenciaRelativa * 100)} %`, puntaje: null },
    ],
  };
}

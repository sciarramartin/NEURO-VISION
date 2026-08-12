export interface Point {
  x: number;
  y: number;
  z?: number;
}

export const PUNTOS_MEDICION = {
  // Rostro (Face Mesh Indices)
  CEJA: {
    IZQUIERDA: [70, 63, 105],
    DERECHA: [336, 296, 334],
    DESCRIPCION: 'Movimiento de cejas',
    tipo: 'rostro'
  },
  PARPADO: {
    IZQUIERDA: [159, 145, 133],
    DERECHA: [386, 374, 362],
    DESCRIPCION: 'Apertura palpebral',
    tipo: 'rostro'
  },
  BOCA: {
    IZQUIERDA: [61, 291, 0],
    DERECHA: [291, 61, 17],
    DESCRIPCION: 'Simetría de la sonrisa',
    tipo: 'rostro'
  },
  NARIZ: {
    IZQUIERDA: [198, 420, 437],
    DERECHA: [420, 198, 168],
    DESCRIPCION: 'Movilidad nasal',
    tipo: 'rostro'
  },
  // Cuerpo (Pose Landmarker Indices)
  CODO: {
    IZQUIERDA: [11, 13, 15], // Hombro - Codo - Muñeca
    DERECHA: [12, 14, 16],
    DESCRIPCION: 'Ángulo del codo (Flexión/Extensión)',
    tipo: 'cuerpo'
  },
  MUÑECA: {
    IZQUIERDA: [13, 15, 19], // Codo - Muñeca - Dedo Índice
    DERECHA: [14, 16, 20],
    DESCRIPCION: 'Ángulo de muñeca (Flexión/Temblor)',
    tipo: 'cuerpo'
  },
  HOMBRO: {
    IZQUIERDA: [12, 11, 23], // Hombro Der - Hombro Izq - Cadera Izq
    DERECHA: [11, 12, 24],
    DESCRIPCION: 'Simetría postural del hombro',
    tipo: 'cuerpo'
  },
  MARCHA: {
    IZQUIERDA: [29, 30], // Talón Izq y Talón Der (usados para medir paso)
    DERECHA: [29, 30],
    DESCRIPCION: 'Análisis de la marcha (amplitud de paso)',
    tipo: 'cuerpo'
  },
  RODILLA: {
    IZQUIERDA: [23, 25, 27], // Cadera Izq - Rodilla Izq - Tobillo Izq
    DERECHA: [24, 26, 28],
    DESCRIPCION: 'Ángulo de rodilla (Flexión/Extensión)',
    tipo: 'cuerpo'
  },
  CADERA: {
    IZQUIERDA: [11, 23, 25], // Hombro Izq - Cadera Izq - Rodilla Izq
    DERECHA: [12, 24, 26],
    DESCRIPCION: 'Ángulo de cadera (Flexión/Extensión)',
    tipo: 'cuerpo'
  },
  TOBILLO: {
    IZQUIERDA: [25, 27, 31], // Rodilla Izq - Tobillo Izq - Punta del Pie Izq
    DERECHA: [26, 28, 32],
    DESCRIPCION: 'Ángulo de tobillo (Dorsiflexión/Plantiflexión)',
    tipo: 'cuerpo'
  },
  TEMBLOR: {
    IZQUIERDA: [],
    DERECHA: [],
    DESCRIPCION: 'Análisis de temblor por acelerometría',
    tipo: 'cuerpo'
  }
} as const;

export type RegionKey = keyof typeof PUNTOS_MEDICION;
export type LadoKey = 'IZQUIERDA' | 'DERECHA';
export type CalidadTracking = 'excelente' | 'degradado' | 'perdido';

/**
 * Typed landmark as returned by MediaPipe (normalized 0-1 coordinates).
 */
export interface LandmarkRaw {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

/**
 * Calculates the angle (in degrees) between three points where p2 is the vertex.
 * Supports 3D calculation if z coordinate is present in all points.
 */
export function calcularAngulo(p1: Point, p2: Point, p3: Point): number {
  const hasZ = p1.z !== undefined && p2.z !== undefined && p3.z !== undefined;
  
  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y, z: hasZ ? (p1.z! - p2.z!) : 0 };
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y, z: hasZ ? (p3.z! - p2.z!) : 0 };

  const dotProduct = v1.x * v2.x + v1.y * v2.y + (hasZ ? v1.z * v2.z : 0);
  const normV1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + (hasZ ? v1.z * v1.z : 0));
  const normV2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + (hasZ ? v2.z * v2.z : 0));

  if (normV1 === 0 || normV2 === 0) return 0;

  const coseno = dotProduct / (normV1 * normV2);
  const clippedCoseno = Math.max(-1.0, Math.min(1.0, coseno));
  const anguloRad = Math.acos(clippedCoseno);

  return (anguloRad * 180) / Math.PI;
}

/**
 * Hit-test: finds the index of the nearest landmark to a canvas click.
 * Returns null if no landmark is within `umbralPx` pixels.
 *
 * IMPORTANT: pass the mirrored clickX (canvasWidth - rawClickX) when the
 * canvas is rendered with scale-x-[-1] (CSS mirror), so that the hit
 * coordinates match the landmark's un-mirrored normalized space.
 *
 * @param clickX      - Canvas-space X after mirror correction
 * @param clickY      - Canvas-space Y
 * @param landmarks   - Array of normalized MediaPipe landmarks
 * @param canvasWidth  - Canvas pixel width
 * @param canvasHeight - Canvas pixel height
 * @param umbralPx    - Maximum distance in pixels to consider a hit (default 15)
 */
export function encontrarLandmarkMasCercano(
  clickX: number,
  clickY: number,
  landmarks: LandmarkRaw[],
  canvasWidth: number,
  canvasHeight: number,
  umbralPx: number = 15
): number | null {
  let minDist = Infinity;
  let candidato = -1;

  landmarks.forEach((lm, idx) => {
    const px = lm.x * canvasWidth;
    const py = lm.y * canvasHeight;
    const dist = Math.hypot(clickX - px, clickY - py);

    if (dist < minDist && dist < umbralPx) {
      minDist = dist;
      candidato = idx;
    }
  });

  return candidato >= 0 ? candidato : null;
}

/**
 * Classifies the tracking quality based on the average visibility score
 * of a set of landmark indices.
 *
 * - excelente: avg visibility >= 0.80
 * - degradado:  avg visibility >= 0.50
 * - perdido:    avg visibility <  0.50 or landmark missing
 */
export function calcularCalidadTracking(
  landmarks: LandmarkRaw[],
  indices: readonly number[]
): CalidadTracking {
  if (!landmarks || landmarks.length === 0) return 'perdido';

  const scores = indices
    .map(i => landmarks[i]?.visibility ?? 0)
    .filter(v => v !== undefined);

  if (scores.length === 0) return 'perdido';

  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

  if (avg >= 0.80) return 'excelente';
  if (avg >= 0.50) return 'degradado';
  return 'perdido';
}

/**
 * Calculates Left vs Right asymmetry percentage index based on the max value denominator.
 * 0% means perfect symmetry, higher values indicate greater asymmetry.
 */
export function calcularAsimetriaClinica(valIzq: number, valDer: number): number {
  const maxVal = Math.max(valIzq, valDer);
  if (maxVal === 0) return 0;
  return (Math.abs(valIzq - valDer) / maxVal) * 100;
}

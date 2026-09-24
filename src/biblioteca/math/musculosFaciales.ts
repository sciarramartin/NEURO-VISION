/**
 * Puntos de referencia para el Análisis Facial por músculo (Fase 6 / MARIANO).
 *
 * A diferencia del motor genérico de `angles.ts` (que reduce cada región a
 * un ángulo de 3 puntos), acá cada "zona" seleccionable corresponde a un
 * grupo de nodos de MediaPipe Face Landmarker (478 puntos) sobre un músculo
 * y hemicara concretos. Durante la captura se sigue el desplazamiento
 * vertical relativo de esos nodos —normalizado por la distancia
 * interocular, para independizarse de la distancia a la cámara— y se
 * reporta la amplitud (máximo - mínimo) del recorrido entre relajación y
 * contracción máxima.
 */

export type ZonaFacial = 'LINEA_MEDIA' | 'IZQUIERDA' | 'DERECHA';

export interface PuntoMuscular {
  id: string;
  musculo: string;
  zona: ZonaFacial;
  zonaLabel: string;
  nodos: number[];
  /** Posición relativa (0-200 x, 0-260 y) sobre el esquema de rostro usado en el selector. */
  pos: { x: number; y: number };
}

// Nodos de referencia estables (poco afectados por la mímica) usados para
// normalizar la escala: distancia interocular = |canto externo izq - canto externo der|
export const NODO_CANTO_EXTERNO_IZQ = 226;
export const NODO_CANTO_EXTERNO_DER = 446;

export const PUNTOS_MUSCULARES: PuntoMuscular[] = [
  { id: 'frontal-medio', musculo: 'Músculo frontal (Frontalis)', zona: 'LINEA_MEDIA', zonaLabel: 'Línea media', nodos: [10], pos: { x: 100, y: 36 } },
  { id: 'frontal-izq', musculo: 'Músculo frontal (Frontalis)', zona: 'IZQUIERDA', zonaLabel: 'Hemicara izquierda', nodos: [67, 109], pos: { x: 66, y: 44 } },
  { id: 'frontal-der', musculo: 'Músculo frontal (Frontalis)', zona: 'DERECHA', zonaLabel: 'Hemicara derecha', nodos: [297, 338], pos: { x: 134, y: 44 } },

  { id: 'corrugador-izq', musculo: 'Corrugador de la ceja', zona: 'IZQUIERDA', zonaLabel: 'Hemicara izquierda', nodos: [55, 65], pos: { x: 84, y: 77 } },
  { id: 'corrugador-der', musculo: 'Corrugador de la ceja', zona: 'DERECHA', zonaLabel: 'Hemicara derecha', nodos: [285, 295], pos: { x: 116, y: 77 } },

  { id: 'procerus-medio', musculo: 'Prócer (Procerus)', zona: 'LINEA_MEDIA', zonaLabel: 'Línea media', nodos: [9, 151], pos: { x: 100, y: 86 } },

  { id: 'orbicular-ojos-izq', musculo: 'Orbicular de los ojos', zona: 'IZQUIERDA', zonaLabel: 'Hemicara izquierda', nodos: [33, 130, 226], pos: { x: 65, y: 112 } },
  { id: 'orbicular-ojos-der', musculo: 'Orbicular de los ojos', zona: 'DERECHA', zonaLabel: 'Hemicara derecha', nodos: [362, 263, 359], pos: { x: 135, y: 112 } },

  { id: 'cigomaticos-izq', musculo: 'Cigomáticos mayor y menor', zona: 'IZQUIERDA', zonaLabel: 'Hemicara izquierda', nodos: [205, 214], pos: { x: 60, y: 154 } },
  { id: 'cigomaticos-der', musculo: 'Cigomáticos mayor y menor', zona: 'DERECHA', zonaLabel: 'Hemicara derecha', nodos: [425, 434], pos: { x: 140, y: 154 } },

  { id: 'orbicular-boca-medio', musculo: 'Orbicular de la boca', zona: 'LINEA_MEDIA', zonaLabel: 'Línea media (labios)', nodos: [0, 17], pos: { x: 100, y: 181 } },
  { id: 'orbicular-boca-izq', musculo: 'Orbicular de la boca', zona: 'IZQUIERDA', zonaLabel: 'Comisura izquierda', nodos: [61], pos: { x: 80, y: 187 } },
  { id: 'orbicular-boca-der', musculo: 'Orbicular de la boca', zona: 'DERECHA', zonaLabel: 'Comisura derecha', nodos: [291], pos: { x: 120, y: 187 } },

  { id: 'depresor-boca-izq', musculo: 'Depresor del ángulo de la boca', zona: 'IZQUIERDA', zonaLabel: 'Hemicara izquierda', nodos: [43, 204], pos: { x: 76, y: 204 } },
  { id: 'depresor-boca-der', musculo: 'Depresor del ángulo de la boca', zona: 'DERECHA', zonaLabel: 'Hemicara derecha', nodos: [273, 424], pos: { x: 124, y: 204 } },

  { id: 'mentoniano-medio', musculo: 'Mentoniano', zona: 'LINEA_MEDIA', zonaLabel: 'Línea media', nodos: [152, 175], pos: { x: 100, y: 226 } },
];

export function etiquetaCompleta(p: PuntoMuscular): string {
  return `${p.musculo} — ${p.zonaLabel}`;
}

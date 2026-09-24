/**
 * Estructura de la Parte III (examen motor) de la MDS-UPDRS.
 *
 * 18 ítems → 33 puntuaciones (algunos ítems se puntúan por lado o por
 * segmento corporal), cada una de 0 a 4. Total máximo: 132.
 *
 * IMPORTANTE (licencia): la MDS-UPDRS es propiedad de la International
 * Parkinson and Movement Disorder Society. Aquí sólo se usan los nombres de
 * los ítems y descripciones breves redactadas en forma propia como ayuda
 * de pantalla; NO se reproduce el texto oficial de instrucciones ni de los
 * criterios de puntuación. El evaluador debe estar entrenado en la escala
 * oficial, y su uso en un producto (electrónico/comercial) requiere permiso
 * de la MDS.
 */

export type LadoUpdrs = 'DERECHA' | 'IZQUIERDA';

/** Tareas que la app puede medir con la cámara (puntaje sugerido). */
export type TareaCamara =
  | 'GOLPETEO_DEDOS'
  | 'MOVIMIENTOS_MANOS'
  | 'PRONO_SUPINACION'
  | 'GOLPETEO_PIE'
  | 'AGILIDAD_PIERNAS'
  | 'TEMBLOR_POSTURAL'
  | 'TEMBLOR_REPOSO';

export interface SubItemUpdrs {
  /** Clave única de la puntuación, p.ej. "3.4-D". */
  id: string;
  etiqueta: string;
  lado?: LadoUpdrs;
  tarea?: TareaCamara;
}

export type GrupoUpdrs = 'global' | 'rigidez' | 'bradicinesia' | 'axial' | 'temblor';

export interface ItemUpdrs {
  numero: string;
  nombre: string;
  ayuda: string;
  grupo: GrupoUpdrs;
  subitems: SubItemUpdrs[];
}

const bilateral = (numero: string, tarea?: TareaCamara): SubItemUpdrs[] => [
  { id: `${numero}-D`, etiqueta: 'Derecha', lado: 'DERECHA', tarea },
  { id: `${numero}-I`, etiqueta: 'Izquierda', lado: 'IZQUIERDA', tarea },
];

const unico = (numero: string): SubItemUpdrs[] => [{ id: numero, etiqueta: '' }];

export const ITEMS_UPDRS3: ItemUpdrs[] = [
  { numero: '3.1', nombre: 'Lenguaje', grupo: 'global', subitems: unico('3.1'),
    ayuda: 'Volumen, articulación e inteligibilidad del habla espontánea.' },
  { numero: '3.2', nombre: 'Expresión facial', grupo: 'global', subitems: unico('3.2'),
    ayuda: 'Hipomimia: parpadeo, expresividad y apertura de labios en reposo.' },
  { numero: '3.3', nombre: 'Rigidez', grupo: 'rigidez', ayuda: 'Movilización pasiva lenta de las grandes articulaciones; no medible por cámara.',
    subitems: [
      { id: '3.3-cuello', etiqueta: 'Cuello' },
      { id: '3.3-MSD', etiqueta: 'MS derecho', lado: 'DERECHA' },
      { id: '3.3-MSI', etiqueta: 'MS izquierdo', lado: 'IZQUIERDA' },
      { id: '3.3-MID', etiqueta: 'MI derecho', lado: 'DERECHA' },
      { id: '3.3-MII', etiqueta: 'MI izquierdo', lado: 'IZQUIERDA' },
    ] },
  { numero: '3.4', nombre: 'Golpeteo de dedos', grupo: 'bradicinesia', subitems: bilateral('3.4', 'GOLPETEO_DEDOS'),
    ayuda: 'Pulgar contra índice, lo más rápido y amplio posible. Velocidad, amplitud, interrupciones y decremento.' },
  { numero: '3.5', nombre: 'Movimientos de las manos', grupo: 'bradicinesia', subitems: bilateral('3.5', 'MOVIMIENTOS_MANOS'),
    ayuda: 'Abrir y cerrar el puño completamente, lo más rápido posible.' },
  { numero: '3.6', nombre: 'Pronación-supinación', grupo: 'bradicinesia', subitems: bilateral('3.6', 'PRONO_SUPINACION'),
    ayuda: 'Brazo extendido al frente, girar la palma arriba/abajo alternadamente.' },
  { numero: '3.7', nombre: 'Golpeteo con los dedos del pie', grupo: 'bradicinesia', subitems: bilateral('3.7', 'GOLPETEO_PIE'),
    ayuda: 'Sentado, talón apoyado: golpear el piso con el antepié.' },
  { numero: '3.8', nombre: 'Agilidad de las piernas', grupo: 'bradicinesia', subitems: bilateral('3.8', 'AGILIDAD_PIERNAS'),
    ayuda: 'Sentado: levantar y golpear el pie contra el piso, elevando la rodilla.' },
  { numero: '3.9', nombre: 'Levantarse de la silla', grupo: 'axial', subitems: unico('3.9'),
    ayuda: 'Brazos cruzados sobre el pecho; número de intentos y necesidad de apoyo.' },
  { numero: '3.10', nombre: 'Marcha', grupo: 'axial', subitems: unico('3.10'),
    ayuda: 'Longitud y velocidad del paso, braceo, giro. Ver también el módulo Longitud del paso.' },
  { numero: '3.11', nombre: 'Congelación de la marcha', grupo: 'axial', subitems: unico('3.11'),
    ayuda: 'Bloqueos al inicio, en giros o en pasos estrechos.' },
  { numero: '3.12', nombre: 'Estabilidad postural', grupo: 'axial', subitems: unico('3.12'),
    ayuda: 'Prueba del empujón (pull test): pasos de recuperación.' },
  { numero: '3.13', nombre: 'Postura', grupo: 'axial', subitems: unico('3.13'),
    ayuda: 'Flexión del tronco / inclinación lateral de pie.' },
  { numero: '3.14', nombre: 'Espontaneidad global del movimiento', grupo: 'bradicinesia', subitems: unico('3.14'),
    ayuda: 'Impresión global de bradicinesia/hipocinesia corporal.' },
  { numero: '3.15', nombre: 'Temblor postural de las manos', grupo: 'temblor', subitems: bilateral('3.15', 'TEMBLOR_POSTURAL'),
    ayuda: 'Brazos extendidos al frente, palmas hacia abajo. Se puntúa la mayor amplitud.' },
  { numero: '3.16', nombre: 'Temblor de acción de las manos', grupo: 'temblor', subitems: bilateral('3.16'),
    ayuda: 'Prueba dedo-nariz. Se puntúa la mayor amplitud.' },
  { numero: '3.17', nombre: 'Amplitud del temblor de reposo', grupo: 'temblor', ayuda: 'Mayor amplitud observada durante el examen, por segmento.',
    subitems: [
      { id: '3.17-MSD', etiqueta: 'MS derecho', lado: 'DERECHA', tarea: 'TEMBLOR_REPOSO' },
      { id: '3.17-MSI', etiqueta: 'MS izquierdo', lado: 'IZQUIERDA', tarea: 'TEMBLOR_REPOSO' },
      { id: '3.17-MID', etiqueta: 'MI derecho', lado: 'DERECHA' },
      { id: '3.17-MII', etiqueta: 'MI izquierdo', lado: 'IZQUIERDA' },
      { id: '3.17-labio', etiqueta: 'Labio / mandíbula' },
    ] },
  { numero: '3.18', nombre: 'Constancia del temblor de reposo', grupo: 'temblor', subitems: unico('3.18'),
    ayuda: 'Proporción del examen en que el temblor de reposo estuvo presente.' },
];

export const TODOS_LOS_SUBITEMS: SubItemUpdrs[] = ITEMS_UPDRS3.flatMap(i => i.subitems);
export const N_PUNTUACIONES = TODOS_LOS_SUBITEMS.length; // 33
export const PUNTAJE_MAXIMO = N_PUNTUACIONES * 4; // 132

export const ETIQUETAS_PUNTAJE = ['Normal', 'Mínimo', 'Leve', 'Moderado', 'Grave'] as const;

export type Puntajes = Record<string, number | undefined>;

export interface ResumenUpdrs {
  total: number;
  completos: number;
  porGrupo: Record<GrupoUpdrs, number>;
  derecha: number;
  izquierda: number;
  /** (D − I) / (D + I) × 100. Positivo = peor a derecha. */
  asimetria: number | null;
}

export function resumirPuntajes(p: Puntajes): ResumenUpdrs {
  const porGrupo: Record<GrupoUpdrs, number> = { global: 0, rigidez: 0, bradicinesia: 0, axial: 0, temblor: 0 };
  let total = 0, completos = 0, derecha = 0, izquierda = 0;
  for (const item of ITEMS_UPDRS3) {
    for (const s of item.subitems) {
      const v = p[s.id];
      if (v === undefined) continue;
      completos++;
      total += v;
      porGrupo[item.grupo] += v;
      if (s.lado === 'DERECHA') derecha += v;
      if (s.lado === 'IZQUIERDA') izquierda += v;
    }
  }
  const asimetria = derecha + izquierda > 0 ? ((derecha - izquierda) / (derecha + izquierda)) * 100 : null;
  return { total, completos, porGrupo, derecha, izquierda, asimetria };
}

export const ETIQUETAS_GRUPO: Record<GrupoUpdrs, string> = {
  global: 'Lenguaje / facial',
  rigidez: 'Rigidez',
  bradicinesia: 'Bradicinesia',
  axial: 'Axial / marcha',
  temblor: 'Temblor',
};

export const MAXIMO_POR_GRUPO: Record<GrupoUpdrs, number> = ITEMS_UPDRS3.reduce((acc, i) => {
  acc[i.grupo] = (acc[i.grupo] ?? 0) + i.subitems.length * 4;
  return acc;
}, {} as Record<GrupoUpdrs, number>);

/** Estadios de Hoehn y Yahr (versión modificada usada junto a la MDS-UPDRS). */
export const HOEHN_YAHR = ['0', '1', '1.5', '2', '2.5', '3', '4', '5'] as const;

export interface ContextoUpdrs {
  medicacion: 'ON' | 'OFF' | 'SIN_MEDICACION';
  estimulacion: 'ON' | 'OFF' | 'NO_APLICA';
  minutosUltimaDosis: number | null;
  discinesiasPresentes: boolean | null;
  discinesiasInterfirieron: boolean | null;
  hoehnYahr: string | null;
}

export const CONTEXTO_INICIAL: ContextoUpdrs = {
  medicacion: 'OFF',
  estimulacion: 'NO_APLICA',
  minutosUltimaDosis: null,
  discinesiasPresentes: null,
  discinesiasInterfirieron: null,
  hoehnYahr: null,
};

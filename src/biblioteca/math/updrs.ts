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
  /** Máximo posible con los ítems incluidos (132 en la versión completa). */
  maximo: number;
  completos: number;
  /** Puntuaciones esperadas con los ítems incluidos (33 en la versión completa). */
  esperados: number;
  porGrupo: Record<GrupoUpdrs, number>;
  maximoPorGrupo: Record<GrupoUpdrs, number>;
  derecha: number;
  izquierda: number;
  /** (D − I) / (D + I) × 100. Positivo = peor a derecha. */
  asimetria: number | null;
}

const GRUPOS_VACIOS = (): Record<GrupoUpdrs, number> => ({ global: 0, rigidez: 0, bradicinesia: 0, axial: 0, temblor: 0 });

/** `excluidos`: números de ítem (p. ej. '3.3') que no forman parte de la versión personalizada. */
export function itemsIncluidos(excluidos: string[] = []): ItemUpdrs[] {
  return ITEMS_UPDRS3.filter(i => !excluidos.includes(i.numero));
}

export function resumirPuntajes(p: Puntajes, excluidos: string[] = []): ResumenUpdrs {
  const porGrupo = GRUPOS_VACIOS(), maximoPorGrupo = GRUPOS_VACIOS();
  let total = 0, completos = 0, esperados = 0, derecha = 0, izquierda = 0;
  for (const item of itemsIncluidos(excluidos)) {
    for (const s of item.subitems) {
      esperados++;
      maximoPorGrupo[item.grupo] += 4;
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
  return { total, maximo: esperados * 4, completos, esperados, porGrupo, maximoPorGrupo, derecha, izquierda, asimetria };
}

export const ETIQUETAS_GRUPO: Record<GrupoUpdrs, string> = {
  global: 'Lenguaje / facial',
  rigidez: 'Rigidez',
  bradicinesia: 'Bradicinesia',
  axial: 'Axial / marcha',
  temblor: 'Temblor',
};


/** Estadios de Hoehn y Yahr (versión modificada usada junto a la MDS-UPDRS). */
export const HOEHN_YAHR = ['0', '1', '1.5', '2', '2.5', '3', '4', '5'] as const;

export type Modalidad = 'UNICA' | 'LEVODOPA';

export interface ContextoUpdrs {
  modalidad: Modalidad;
  medicacion: 'ON' | 'OFF' | 'SIN_MEDICACION';
  estimulacion: 'ON' | 'OFF' | 'NO_APLICA';
  minutosUltimaDosis: number | null;
  /** Test de levodopa */
  horasLavado: number | null;
  dosisPruebaMg: number | null;
  /** Versión personalizada: ítems excluidos (vacío = versión completa). */
  itemsExcluidos: string[];
}

export const CONTEXTO_INICIAL: ContextoUpdrs = {
  modalidad: 'UNICA',
  medicacion: 'OFF',
  estimulacion: 'NO_APLICA',
  minutosUltimaDosis: null,
  horasLavado: 12,
  dosisPruebaMg: null,
  itemsExcluidos: [],
};

/**
 * Una "toma" es una aplicación completa (o personalizada) de la Parte III.
 * Evaluación única = 1 toma. Test de levodopa = OFF basal + ON a los 30/60/90 min.
 */
export interface Toma<M = unknown> {
  id: string;
  etiqueta: string;
  estado: 'OFF' | 'ON';
  /** Minutos tras la dosis de prueba (null en OFF basal o evaluación única). */
  minutos: number | null;
  puntajes: Puntajes;
  mediciones: Record<string, M>;
  discinesiasPresentes: boolean | null;
  discinesiasInterfirieron: boolean | null;
  hoehnYahr: string | null;
}

export const MINUTOS_ON = [30, 60, 90] as const;

export function nuevaToma<M>(id: string, etiqueta: string, estado: 'OFF' | 'ON', minutos: number | null): Toma<M> {
  return { id, etiqueta, estado, minutos, puntajes: {}, mediciones: {}, discinesiasPresentes: null, discinesiasInterfirieron: null, hoehnYahr: null };
}

export function tomasIniciales<M>(ctx: ContextoUpdrs, minutosOn: number[]): Toma<M>[] {
  if (ctx.modalidad === 'UNICA') {
    const et = ctx.medicacion === 'ON' ? 'ON' : ctx.medicacion === 'OFF' ? 'OFF' : 'Sin medicación';
    return [nuevaToma<M>('UNICA', et, ctx.medicacion === 'ON' ? 'ON' : 'OFF', null)];
  }
  return [
    nuevaToma<M>('OFF', 'OFF basal', 'OFF', null),
    ...minutosOn.map(m => nuevaToma<M>(`ON${m}`, `ON ${m} min`, 'ON', m)),
  ];
}

/** Umbral habitual de respuesta a levodopa para candidatura a DBS (CAPSIT-PD). */
export const UMBRAL_RESPUESTA_LEVODOPA = 33;

export interface RespuestaLevodopa {
  off: number;
  mejorOn: { id: string; etiqueta: string; minutos: number | null; total: number } | null;
  /** % de mejoría del mejor ON respecto del OFF. */
  mejoria: number | null;
  porToma: { id: string; etiqueta: string; total: number; mejoria: number | null; completa: boolean }[];
  /** % de mejoría por dominio en el mejor ON. */
  porGrupo: Record<GrupoUpdrs, number | null>;
  positiva: boolean | null;
}

export function respuestaLevodopa<M>(tomas: Toma<M>[], excluidos: string[]): RespuestaLevodopa | null {
  const off = tomas.find(t => t.estado === 'OFF');
  const ons = tomas.filter(t => t.estado === 'ON');
  if (!off || !ons.length) return null;
  const rOff = resumirPuntajes(off.puntajes, excluidos);
  const pct = (a: number, b: number) => (a > 0 ? ((a - b) / a) * 100 : null);
  const porToma = tomas.map(t => {
    const r = resumirPuntajes(t.puntajes, excluidos);
    return { id: t.id, etiqueta: t.etiqueta, total: r.total, mejoria: t.estado === 'ON' && r.completos > 0 ? pct(rOff.total, r.total) : null, completa: r.completos === r.esperados };
  });
  const onsConDatos = ons.map(t => ({ t, r: resumirPuntajes(t.puntajes, excluidos) })).filter(x => x.r.completos > 0);
  if (!onsConDatos.length || rOff.completos === 0) {
    return { off: rOff.total, mejorOn: null, mejoria: null, porToma, porGrupo: { global: null, rigidez: null, bradicinesia: null, axial: null, temblor: null }, positiva: null };
  }
  const mejor = onsConDatos.reduce((a, b) => (b.r.total < a.r.total ? b : a));
  const mejoria = pct(rOff.total, mejor.r.total);
  const porGrupo = {} as Record<GrupoUpdrs, number | null>;
  (Object.keys(rOff.porGrupo) as GrupoUpdrs[]).forEach(g => { porGrupo[g] = pct(rOff.porGrupo[g], mejor.r.porGrupo[g]); });
  return {
    off: rOff.total,
    mejorOn: { id: mejor.t.id, etiqueta: mejor.t.etiqueta, minutos: mejor.t.minutos, total: mejor.r.total },
    mejoria, porToma, porGrupo,
    positiva: mejoria === null ? null : mejoria >= UMBRAL_RESPUESTA_LEVODOPA,
  };
}

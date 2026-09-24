/**
 * Instrucciones al evaluador, por módulo y por ítem de la MDS-UPDRS III.
 *
 * DERECHOS: los textos de la MDS-UPDRS son © International Parkinson and
 * Movement Disorder Society (MDS), todos los derechos reservados, y este
 * repositorio es público. Por eso aquí NO se copia el texto oficial: cada
 * entrada es un RESUMEN redactado en forma propia que conserva los datos
 * operativos (postura, número de repeticiones, qué observar, umbrales), con
 * la fuente citada. Si se obtiene permiso de la MDS, puede reemplazarse por
 * el texto oficial en este único archivo.
 */

export const FUENTE_MDS =
  'Resumen propio, no textual, basado en: Goetz CG, et al. Movement Disorder Society-sponsored revision of the Unified Parkinson\'s Disease Rating Scale (MDS-UPDRS). Mov Disord 2008;23(15):2129-70 — traducción oficial al español de la MDS (actualizada el 28/10/2019). © 2015 International Parkinson and Movement Disorder Society. El texto oficial y su uso en productos requieren permiso de la MDS.';

export const FUENTE_PROPIA = 'Protocolo propio de NeuroVision (no forma parte de la MDS-UPDRS).';

export interface SeccionInfo {
  titulo: string;
  puntos: string[];
  fuente: 'MDS' | 'PROPIA';
}

export interface InfoModuloContenido {
  titulo: string;
  resumen: string;
  secciones: SeccionInfo[];
}

/** Instrucciones por ítem de la Parte III (clave = número de ítem). */
export const INSTRUCCIONES_ITEM: Record<string, string[]> = {
  '3.1': [
    'Evalúe el habla espontánea; si hace falta, converse sobre trabajo, pasatiempos o cómo llegó a la consulta.',
    'Observe volumen, prosodia (modulación) y claridad: disartria, palilalia (repetición de sílabas) y taquifemia (habla acelerada).',
  ],
  '3.2': [
    'Observe al paciente sentado y en reposo unos 10 segundos, hablando y en silencio.',
    'Mire la frecuencia de parpadeo, la hipomimia ("cara de máscara"), la sonrisa espontánea y si los labios quedan entreabiertos en reposo.',
  ],
  '3.3': [
    'Movilización pasiva LENTA de las grandes articulaciones, con el paciente relajado. Cuello y cada extremidad por separado.',
    'Miembros superiores: muñeca y codo a la vez. Miembros inferiores: cadera y rodilla a la vez.',
    'Primero sin maniobra de activación; si no hay rigidez, use una maniobra de activación (tapping, abrir/cerrar la mano, taconeo) con una extremidad no evaluada.',
  ],
  '3.4': [
    'Cada mano por separado. Demuestre la tarea, pero no la siga haciendo mientras evalúa.',
    'Pida golpear el índice contra el pulgar 10 veces, lo más rápido y amplio posible.',
    'Puntúe cada lado: velocidad, amplitud, titubeos, interrupciones y decremento de la amplitud.',
  ],
  '3.5': [
    'Cada mano por separado. Demuestre sin acompañar la ejecución.',
    'Codo flexionado y palma hacia el evaluador: cerrar el puño con fuerza y abrir la mano por completo, 10 veces, lo más rápido posible. Recuérdele cerrar y abrir del todo si no lo hace.',
    'Evalúe velocidad, amplitud, titubeos, interrupciones y decremento.',
  ],
  '3.6': [
    'Cada mano por separado. Brazo extendido al frente, palma hacia abajo.',
    'Girar la palma arriba y abajo alternadamente 10 veces, lo más rápido y completo posible.',
    'Evalúe velocidad, amplitud, titubeos, interrupciones y decremento.',
  ],
  '3.7': [
    'Sentado en silla de respaldo recto y con apoyabrazos, ambos pies en el suelo. Cada pie por separado.',
    'Talón apoyado en posición cómoda: golpear el suelo con el antepié 10 veces, lo más amplio y rápido posible.',
    'Evalúe velocidad, amplitud, titubeos, interrupciones y decremento.',
  ],
  '3.8': [
    'Sentado en silla de respaldo recto y con apoyabrazos, pies cómodos en el suelo. Cada pierna por separado.',
    'Levantar el pie y golpear el suelo 10 veces, lo más rápido y amplio posible.',
    'Evalúe velocidad, amplitud, titubeos, interrupciones y decremento.',
  ],
  '3.9': [
    'Silla de respaldo recto con apoyabrazos, pies en el suelo y espalda apoyada. Brazos cruzados sobre el pecho: levantarse.',
    'Si no puede: hasta 2 intentos más; luego puede adelantarse en la silla (1 intento); luego puede usar los apoyabrazos (hasta 3 intentos); si aún no puede, ayúdelo.',
    'Al quedar de pie, observe la postura para el ítem 3.13.',
  ],
  '3.10': [
    'El paciente camina alejándose y acercándose al evaluador, al menos 10 metros, gira y vuelve, para ver ambos hemicuerpos a la vez.',
    'Evalúe amplitud y velocidad de la zancada, altura del paso, apoyo del talón, giro y braceo. La congelación NO se puntúa aquí (va en 3.11).',
    'Aproveche para observar la postura (3.13).',
  ],
  '3.11': [
    'Durante la prueba de marcha, busque episodios de congelación: dubitación al iniciar y pasos "tartamudeantes", sobre todo en el giro y al final.',
    'En la medida en que sea seguro, el paciente no debe usar trucos sensoriales durante la evaluación.',
  ],
  '3.12': [
    'De pie, ojos abiertos, pies cómodamente separados y paralelos. El evaluador se ubica detrás, con una pared a 1–2 m a sus espaldas, y explica la prueba.',
    'El primer tirón de hombros es de demostración (suave, no se puntúa). El segundo es rápido y enérgico, suficiente para obligar a dar un paso atrás.',
    'Cuente los pasos de retropulsión o si cae: hasta 2 pasos es normal; desde 3 pasos es anormal. Esté preparado para sujetarlo y no permita que se incline hacia adelante anticipándose.',
  ],
  '3.13': [
    'Evalúe la postura de pie al levantarse de la silla, durante la marcha y durante la prueba de reflejos posturales; puntúe la peor.',
    'Busque flexión e inclinación lateral. Si es anormal, pida que se enderece para ver si corrige.',
  ],
  '3.14': [
    'Puntuación global de bradicinesia corporal: enlentecimiento, titubeos, poca amplitud y pobreza de movimiento en general (menos gestos, no cruza las piernas).',
    'Se basa en la impresión de todo el examen: gesticulación espontánea sentado, forma de levantarse y de caminar.',
  ],
  '3.15': [
    'Cada mano por separado; incluye cualquier temblor presente en esta postura (también el temblor de reposo re-emergente).',
    'Brazos extendidos al frente, palmas hacia abajo, muñecas rectas y dedos separados sin tocarse. Observe 10 segundos.',
    'Puntúe la mayor amplitud observada (umbrales: < 1 cm, 1–3 cm, 3–10 cm, ≥ 10 cm).',
  ],
  '3.16': [
    'Maniobra dedo-nariz desde los brazos extendidos: tocar 3 veces la nariz y el dedo del evaluador, estirándose lo más posible. Cada mano por separado.',
    'Debe hacerse lento, para no enmascarar el temblor. Vale el temblor durante el trayecto o al llegar a cualquiera de los objetivos.',
    'Puntúe la mayor amplitud observada.',
  ],
  '3.17': [
    'Se deja para el final para reunir todo el temblor de reposo visto durante el examen (sentado, caminando, cuando una parte se mueve y otra descansa). Vale la amplitud máxima en cualquier momento, no la persistencia.',
    'Además: 10 segundos sentado tranquilo, manos apoyadas en los apoyabrazos (no en el regazo) y pies en el suelo, sin otras indicaciones.',
    'Se puntúa cada extremidad por separado y también labio/mandíbula.',
  ],
  '3.18': [
    'Puntuación única para todo el temblor de reposo: proporción del tiempo de examen en que estuvo presente (≤ 25 %, 26–50 %, 51–75 %, > 75 %).',
    'Se puntúa al final, integrando varios minutos de observación.',
  ],
};

const GENERALES_PARTE_III: SeccionInfo = {
  titulo: 'Directrices generales de la Parte III',
  fuente: 'MDS',
  puntos: [
    'Registre si el paciente toma medicación antiparkinsoniana, si toma levodopa, los minutos desde la última dosis, y su estado clínico: ON (buena respuesta con la medicación) u OFF (mala respuesta pese a la medicación).',
    '"Evalúe lo que ve": puntúe la ejecución tal como la realiza el paciente con su comorbilidad. Sólo si es imposible (amputación, paraplejía, miembro enyesado) anote NV (no valorable).',
    'Todos los ítems se puntúan con números enteros, sin medios puntos ni datos faltantes.',
    'Muestre cada maniobra mientras la describe y evalúe inmediatamente después.',
    'Los ítems 3.14 y 3.17 van al final a propósito: integran lo observado durante todo el examen.',
    'Al terminar, indique si hubo discinesias (corea o distonía) durante el examen y si interfirieron con la puntuación. Registre el estadio de Hoehn y Yahr.',
  ],
};

export const INFO_MODULOS: Record<string, InfoModuloContenido> = {
  paso: {
    titulo: 'Longitud del paso',
    resumen: 'Estimación de la amplitud de zancada por video, de perfil. Complementa (no reemplaza) los ítems 3.10 y 3.11 de la MDS-UPDRS.',
    secciones: [
      { titulo: 'Ítem 3.10 — Marcha', fuente: 'MDS', puntos: INSTRUCCIONES_ITEM['3.10'] },
      { titulo: 'Ítem 3.11 — Congelación de la marcha', fuente: 'MDS', puntos: INSTRUCCIONES_ITEM['3.11'] },
      { titulo: 'Cómo filmar para esta medición', fuente: 'PROPIA', puntos: [
        'Cámara fija a 2 m del recorrido, de perfil, cuerpo completo, sin acompañantes en cuadro.',
        'Mismo calzado en cada control (o descalzo) y ropa que no oculte las piernas.',
        'Ingrese la talla real del paciente: se usa para pasar de píxeles a centímetros.',
      ] },
    ],
  },
  goniometro: {
    titulo: 'Goniómetro',
    resumen: 'Rango de movimiento ACTIVO por articulación. La MDS-UPDRS no incluye goniometría: la rigidez (3.3) se evalúa con movilización PASIVA, por lo que ambas mediciones no son equivalentes.',
    secciones: [
      { titulo: 'Cómo medir', fuente: 'PROPIA', puntos: [
        'Cámara fija a 1 m, articulación descubierta y completa en cuadro.',
        'Movimiento activo, máximo y sin asistencia. Misma posición del paciente en cada control PRE/POST.',
        'Medir ambos lados en la misma sesión para comparar asimetría (botón "Medir lado contralateral").',
      ] },
      { titulo: 'Referencia: ítem 3.3 — Rigidez', fuente: 'MDS', puntos: INSTRUCCIONES_ITEM['3.3'] },
    ],
  },
  facial: {
    titulo: 'Análisis facial',
    resumen: 'Excursión de puntos del rostro (MediaPipe Face Landmarker) normalizada por la distancia intercantal. Útil para hipomimia y para asimetrías (p. ej., antes y después de toxina botulínica).',
    secciones: [
      { titulo: 'Ítem 3.2 — Expresión facial', fuente: 'MDS', puntos: INSTRUCCIONES_ITEM['3.2'] },
      { titulo: 'Ítem 3.17 — Temblor de reposo de labio/mandíbula', fuente: 'MDS', puntos: [INSTRUCCIONES_ITEM['3.17'][0], INSTRUCCIONES_ITEM['3.17'][2]] },
      { titulo: 'Expresión máxima global', fuente: 'PROPIA', puntos: [
        'Secuencia de 15 s: reposo, boca en pico, cejas arriba y sonrisa máxima, con un tono en cada cambio.',
        'Rostro de frente a 0,5 m, sin anteojos ni pelo sobre la frente.',
        'La lateralidad es siempre la del paciente: su hemicara derecha aparece a la izquierda de la imagen.',
      ] },
    ],
  },
  updrs: {
    titulo: 'UPDRS III',
    resumen: 'Examen motor de la MDS-UPDRS (Parte III): 18 ítems, 33 puntuaciones de 0 a 4, total máximo 132. Cada ítem tiene su propio botón de información.',
    secciones: [
      GENERALES_PARTE_III,
      { titulo: 'Test de levodopa (modo de esta app)', fuente: 'PROPIA', puntos: [
        'Evaluación OFF basal tras el período de lavado indicado, luego dosis de prueba y evaluaciones ON a los 30, 60 y/o 90 minutos.',
        'Respuesta (%) = (OFF − mejor ON) / OFF × 100, calculada sobre los mismos ítems en todas las tomas.',
        'Umbral de referencia habitual para candidatura a DBS: mejoría ≥ 33 % (protocolo CAPSIT-PD); algunos centros usan ≥ 30 %.',
      ] },
      { titulo: 'Puntaje asistido por cámara', fuente: 'PROPIA', puntos: [
        'La app propone un puntaje orientativo a partir de la medición; los umbrales son provisionales y no están validados. El evaluador confirma o corrige.',
        'La captura dura 10 s; la escala pide 10 repeticiones: si el paciente termina antes, puede detenerse igual.',
      ] },
    ],
  },
  dbs: {
    titulo: 'Modo programador DBS',
    resumen: 'Registro rápido de "firmas" motoras (sentado, marcha, expresión facial) para cada ajuste de estimulación, y comparación contra basal, OFF de dispositivo o preoperatorio.',
    secciones: [
      { titulo: 'Protocolo de la firma', fuente: 'PROPIA', puntos: [
        'Sentado: cámara a 1 m, cuerpo completo, lo más quieto posible, manos sobre las rodillas, 15 s. Manos y pies se analizan como temblor; cabeza, hombros, codos, caderas y rodillas como movimiento involuntario (discinesias).',
        'Marcha: de perfil a 2 m, cruzando el cuadro; se mide la amplitud del paso.',
        'Expresión facial: la misma secuencia de 15 s del análisis facial.',
        'Registre cada cambio de parámetros (lado, mA, µs, Hz) como una nueva firma y espere el tiempo de latencia clínica antes de medir.',
      ] },
      { titulo: 'Referencia: temblor (3.15 y 3.17)', fuente: 'MDS', puntos: [INSTRUCCIONES_ITEM['3.15'][2], INSTRUCCIONES_ITEM['3.17'][0]] },
      { titulo: 'Referencia: discinesias durante el examen', fuente: 'MDS', puntos: [GENERALES_PARTE_III.puntos[5]] },
    ],
  },
};

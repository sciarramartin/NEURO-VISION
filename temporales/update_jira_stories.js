const fs = require('fs');
const path = require('path');

const configPath = "C:\\Users\\arrai\\.gemini\\antigravity-ide\\mcp_config.json";

// Leer credenciales de Jira desde el mcp_config.json
let host, username, password;
try {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const jiraEnv = config.mcpServers.jira.env;
  host = jiraEnv.JIRA_HOST;
  username = jiraEnv.JIRA_USERNAME;
  password = jiraEnv.JIRA_PASSWORD;
} catch (e) {
  console.error("No se pudo leer la configuración de mcp_config.json:", e.message);
  process.exit(1);
}

const auth = Buffer.from(`${username}:${password}`).toString('base64');
const headers = {
  'Authorization': `Basic ${auth}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

const updatedDescriptions = {
  "KAN-9": {
    description: `### 👤 Historia de Usuario
**Como** evaluador clínico / neurólogo,
**quiero** elegir qué regiones faciales específicas monitorear (Frente/Cejas, Ojos/Párpados, Labios/Boca, Nariz) mediante interruptores de selección en la pantalla de configuración,
**para** focalizar el análisis en los síntomas específicos del paciente (ej. parálisis facial, temblor perioral) y optimizar el rendimiento de procesamiento del sistema.

### 🛠️ Especificaciones Técnicas
*   **Componente UI:** Panel de Configuración interactivo en [CaptureView.tsx](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/vistas/CaptureView.tsx).
*   **Índices de Landmark (MediaPipe):**
    *   *Ceja/Frente:* Ceja Izquierda (70, 107), Ceja Derecha (300, 336).
    *   *Ojo/Párpado:* Ojo Izquierdo (33, 133), Ojo Derecho (263, 362).
    *   *Boca/Labios:* Comisura Izquierda (61), Comisura Derecha (291), Labio Superior (0), Labio Inferior (17).
    *   *Nariz:* Puntas y aletas nasales (4, 98, 327).
*   **Estado:** Persistir la máscara de selección en \`src/contexto_global/\` para filtrar los landmarks en el bucle de renderizado.

### 📋 Criterios de Aceptación (Gherkin)
*   **Escenario: Activación parcial de landmarks**
    *   **Dado** que el clínico ingresa a la pantalla de preparación de captura,
    *   **Cuando** activa únicamente las regiones de "Ojos/Párpados" y "Labios/Boca" y desmarca las demás,
    *   **Entonces** el canvas de visualización y el motor analítico solo renderizarán e integrarán las coordenadas de esos grupos de puntos durante la sesión activa.

### 🔗 Dependencias
*   *Bloquea a:* KAN-10 (Extracción e integración de Face Mesh).`
  },
  "KAN-10": {
    description: `### 👤 Historia de Usuario
**Como** motor de procesamiento de visión de Neuro Vision,
**quiero** integrar la biblioteca MediaPipe Face Mesh para extraer las coordenadas tridimensionales $X, Y, Z$ de la malla facial en tiempo real a partir del feed de video,
**para** generar la serie de tiempo espacial cruda que requiere el módulo de cálculos cinemáticos.

### 🛠️ Especificaciones Técnicas
*   **Módulo:** Integrado con el componente de cámara en [CaptureView.tsx](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/vistas/CaptureView.tsx) utilizando el hook de MediaPipe.
*   **Frecuencia:** Garantizar una tasa de muestreo estable de mínimo 30 FPS.
*   **Tolerancia:** Implementar lógica de fallback en caso de oclusión parcial del rostro (ej. pérdida temporal de landmarks).

### 📋 Criterios de Aceptación (Gherkin)
*   **Escenario: Tracking facial exitoso**
    *   **Dado** que la cámara está activa o se reproduce la simulación pregrabada,
    *   **Cuando** el paciente se posiciona frente a la cámara,
    *   **Entonces** la malla de MediaPipe Face Mesh se superpone de forma alineada en tiempo real sin latencias perceptibles y extrae las coordenadas 3D de los puntos activos.

### 🔗 Dependencias
*   *Bloqueado por:* KAN-9
*   *Bloquea a:* KAN-11 (Cálculo de ROM y asimetría).`
  },
  "KAN-11": {
    description: `### 👤 Historia de Usuario
**Como** evaluador clínico,
**quiero** calcular el Rango de Movimiento (ROM) angular de las regiones activas y estimar el porcentaje de asimetría bilateral en reposo y sonrisa,
**para** cuantificar matemáticamente la severidad del déficit motor facial del paciente de forma objetiva.

### 🛠️ Especificaciones Técnicas
*   **Código:** Funciones matemáticas de soporte en [angles.ts](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/biblioteca/math/angles.ts) y [kinematics.ts](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/biblioteca/math/kinematics.ts).
*   **Fórmulas:**
    *   *Ángulo articular en 3D:* $\\theta = \\arccos\\left(\\frac{\\vec{v}_1 \\cdot \\vec{v}_2}{\\|\\vec{v}_1\\| \\|\\vec{v}_2\\|}\\right) \\times \\frac{180}{\\pi}$
    *   *Índice de Asimetría Bilateral:* $Asimetria = \\frac{|Val_{izq} - Val_{der}|}{\\max(Val_{izq}, Val_{der})} \\times 100$

### 📋 Criterios de Aceptación (Gherkin)
*   **Escenario: Estimación de asimetría labial en sonrisa**
    *   **Dado** que el paciente realiza una sonrisa máxima y el sistema finaliza la captura de landmarks faciales,
    *   **Cuando** se procesa la sesión,
    *   **Entonces** el sistema calcula el ángulo de excursión de ambas comisuras labiales y muestra en el HUD clínico el porcentaje de asimetría con una precisión de dos decimales.

### 🔗 Dependencias
*   *Bloqueado por:* KAN-10
*   *Bloquea a:* KAN-12 (Comparativa Pre vs Post).`
  },
  "KAN-12": {
    description: `### 👤 Historia de Usuario
**Como** neurólogo tratante,
**quiero** comparar en gráficos superpuestos el Rango de Movimiento (ROM) facial de una sesión previa a tomar Levodopa (PRE) contra una sesión posterior (POST),
**para** evaluar cuantitativamente la efectividad de la respuesta farmacológica en la motilidad facial del paciente.

### 🛠️ Especificaciones Técnicas
*   **Vista:** [TrendsView.tsx](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/vistas/TrendsView.tsx).
*   **Controlador:** Carga de datos filtrados por estado farmacológico (\`PRE\` vs \`POST\` L-Dopa) a través de [SessionController.ts](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/controladores/SessionController.ts).

### 📋 Criterios de Aceptación (Gherkin)
*   **Escenario: Superposición y cálculo de mejora**
    *   **Dado** que el paciente cuenta con una sesión catalogada como "PRE L-Dopa" y otra como "POST L-Dopa" del mismo día,
    *   **Cuando** el neurólogo ingresa a la vista de tendencias,
    *   **Entonces** el gráfico muestra las curvas de ROM superpuestas (PRE en color naranja/coral y POST en color cian/turquesa) y calcula automáticamente la diferencia porcentual de mejora motora.

### 🔗 Dependencias
*   *Bloqueado por:* KAN-11
*   *Bloquea a:* KAN-24 (Visualización Gráfica Longitudinal).`
  },
  "KAN-13": {
    description: `### 👤 Historia de Usuario
**Como** rehabilitador físico / kinesiólogo,
**quiero** medir la amplitud máxima del paso utilizando landmarks de talón izquierdo y derecho mediante una toma lateral de cámara de cuerpo completo con MediaPipe Pose,
**para** estimar de forma objetiva la longitud de zancada en el plano horizontal.

### 🛠️ Especificaciones Técnicas
*   **Articulaciones:** Rastrear tobillos (27, 28) y talones (29, 30) en MediaPipe Pose.
*   **Algoritmo:** Distancia máxima euclidiana en el eje X (horizontal) proyectado durante el ciclo de marcha.
*   **Calibración:** Convertir píxeles a metros usando un factor de escala basado en la altura conocida del paciente.

### 📋 Criterios de Aceptación (Gherkin)
*   **Escenario: Estimación de la amplitud de paso**
    *   **Dado** que el paciente realiza la caminata en vista lateral respecto a la cámara,
    *   **Cuando** el sistema detecta la máxima distancia horizontal entre los talones durante la zancada,
    *   **Entonces** calcula y muestra en pantalla la amplitud del paso en centímetros.

### 🔗 Dependencias
*   *Bloqueado por:* KAN-10
*   *Bloquea a:* KAN-14 (Historial comparativo).`
  },
  "KAN-14": {
    description: `### 👤 Historia de Usuario
**Como** médico neurólogo / cirujano,
**quiero** registrar las amplitudes de paso calculadas a lo largo de las sesiones del paciente y comparar automáticamente los cambios porcentuales entre ellas,
**para** monitorear la progresión y la respuesta clínica a tratamientos en pacientes con Hidrocefalia Normotensiva (HNT).

### 🛠️ Especificaciones Técnicas
*   **Base de datos:** [Session.ts](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/modelos/Session.ts) persistiendo el parámetro de amplitud de paso (\`step_amplitude\`).
*   **Lógica comparativa (Nuevo Requerimiento):** Calcular la diferencia porcentual ($\\Delta\\%$) de la amplitud de paso entre dos sesiones seleccionadas para evaluar la efectividad clínica (ej. mejora de marcha tras punción lumbar evacuadora).

### 📋 Criterios de Aceptación (Gherkin)
*   **Escenario: Comparación de amplitud de paso pre vs post punción**
    *   **Dado** que el médico selecciona una sesión de marcha "PRE punción" y otra "POST punción" del mismo paciente,
    *   **Cuando** presiona comparar,
    *   **Entonces** el sistema muestra la amplitud en cm de cada sesión y reporta el incremento o decremento neto en porcentaje ($\\Delta\\%$).

### 🔗 Dependencias
*   *Bloqueado por:* KAN-13
*   *Bloquea a:* KAN-19 (Comparativa general de espasticidad/marcha).`
  },
  "KAN-15": {
    description: `### 👤 Historia de Usuario
**Como** especialista en biomecánica,
**quiero** sincronizar las tramas de video de dos o más cámaras conectadas para capturar vistas de frente y perfil simultáneas,
**para** asegurar la alineación temporal de los landmarks durante el análisis biomecánico en movimiento.

### 🛠️ Especificaciones Técnicas
*   **Lógica:** Algoritmo de alineamiento al frame más cercano (Nearest Frame Matching) en base a marcas de tiempo locales del sistema con tolerancia máxima de desfase de 33ms.

### 📋 Criterios de Aceptación (Gherkin)
*   **Escenario: Captura sincronizada multifeed**
    *   **Dado** que se configuran dos cámaras en la pantalla de captura,
    *   **Cuando** se graba la prueba de marcha,
    *   **Entonces** el sistema compila y alinea ambas secuencias cuadro por cuadro asegurando que cada par de frames procesados correspondan exactamente al mismo instante temporal.

### 🔗 Dependencias
*   *Bloqueado por:* KAN-10
*   *Bloquea a:* KAN-16 (Análisis 3D).`
  },
  "KAN-16": {
    description: `### 👤 Historia de Usuario
**Como** bioingeniero / investigador,
**quiero** estimar las coordenadas físicas tridimensionales reales de los landmarks corporales combinando los feeds de frente y perfil sincronizados,
**para** evaluar trayectorias biomecánicas tridimensionales libres de distorsión de perspectiva 2D.

### 🛠️ Especificaciones Técnicas
*   **Lógica:** Triangulación lineal estéreo simplificada basándose en la configuración ortogonal (cámara frontal define X, Y; lateral define Z, Y) y promediado de la coordenada vertical común Y.

### 📋 Criterios de Aceptación (Gherkin)
*   **Escenario: Triangulación y coordenadas 3D**
    *   **Dado** que se dispone de las series 2D sincronizadas de frente y perfil,
    *   **Cuando** corre el módulo de reconstrucción 3D,
    *   **Entonces** el sistema triangula y devuelve la serie de coordenadas $(X, Y, Z)$ reales en metros.

### 🔗 Dependencias
*   *Bloqueado por:* KAN-15`
  },
  "KAN-17": {
    description: `### 👤 Historia de Usuario
**Como** terapeuta ocupacional / rehabilitador,
**quiero** seleccionar interactivamente qué articulaciones del tren superior analizar (Hombro, Codo, Muñeca) y medir en tiempo real sus rangos angulares bilaterales con MediaPipe Pose,
**para** cuantificar la rigidez, rango máximo y velocidad de movimiento durante las rutinas de rehabilitación.

### 🛠️ Especificaciones Técnicas
*   **UI (Nuevo Requerimiento):** Panel de selección de articulaciones en [CaptureView.tsx](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/vistas/CaptureView.tsx) permitiendo activar/desactivar hombros, codos y muñecas de ambos lados.
*   **Landmarks Corporales (MediaPipe Pose):**
    *   Hombros (11, 12), Codos (13, 14), Muñecas (15, 16).
*   **Cálculo:** Ángulo en grados 3D entre vectores óseos en [angles.ts](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/biblioteca/math/angles.ts).

### 📋 Criterios de Aceptación (Gherkin)
*   **Escenario: Selección y medición de Codo Izquierdo**
    *   **Dado** que el terapeuta selecciona en la pantalla de configuración únicamente "Codo Izquierdo",
    *   **Cuando** el paciente realiza ejercicios frente a la cámara,
    *   **Entonces** el HUD en tiempo real calcula y grafica el ángulo de flexión (0° a 180°) de esa articulación en particular, omitiendo el renderizado analítico de las demás.

### 🔗 Dependencias
*   *Bloqueado por:* KAN-10
*   *Bloquea a:* KAN-19 (Comparación de espasticidad).`
  },
  "KAN-18": {
    description: `### 👤 Historia de Usuario
**Como** kinesiólogo / rehabilitador físico,
**quiero** seleccionar las articulaciones del tren inferior a analizar (Cadera, Rodilla, Tobillo) y registrar en tiempo real sus rangos angulares bilaterales con MediaPipe Pose,
**para** cuantificar la rigidez articular, el ROM y la velocidad angular durante la marcha o flexoextensión.

### 🛠️ Especificaciones Técnicas
*   **UI (Nuevo Requerimiento):** Panel de selección en [CaptureView.tsx](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/vistas/CaptureView.tsx) permitiendo activar/desactivar cadera, rodilla y tobillo bilateralmente.
*   **Landmarks Corporales:** Cadera (23, 24), Rodilla (25, 26), Tobillo (27, 28), Talón (29, 30).
*   **Algoritmo:** Ángulo dinámico en [angles.ts](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/biblioteca/math/angles.ts) y velocidades en [kinematics.ts](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/biblioteca/math/kinematics.ts).

### 📋 Criterios de Aceptación (Gherkin)
*   **Escenario: Medición y registro de Rodilla Derecha**
    *   **Dado** que se selecciona "Rodilla Derecha" en la pantalla de preparación,
    *   **Cuando** el paciente realiza sentadillas,
    *   **Entonces** el sistema calcula en tiempo real el ángulo interno de la rodilla derecha y reporta el Rango de Movimiento (ROM) total (extensión máxima menos flexión máxima) al final del estudio.

### 🔗 Dependencias
*   *Bloqueado por:* KAN-10
*   *Bloquea a:* KAN-19 (Comparativa longitudinal).`
  },
  "KAN-19": {
    description: `### 👤 Historia de Usuario
**Como** médico fisiatra / rehabilitador,
**quiero** graficar y comparar las curvas de ROM articular registrando marcas de hitos o eventos terapéuticos (ej. inyección de toxina botulínica o inicio de fisioterapia intensiva),
**para** evaluar cuantitativamente el cambio neto en grados en el Rango de Movimiento del paciente.

### 🛠️ Especificaciones Técnicas
*   **Base de datos:** Soportar la adición de marcas de tiempo de hitos terapéuticos del paciente.
*   **UI:** Renderizado en [TrendsView.tsx](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/vistas/TrendsView.tsx) dibujando líneas de tendencia longitudinales con líneas verticales de referencia para los hitos terapéuticos.

### 📋 Criterios de Aceptación (Gherkin)
*   **Escenario: Comparación longitudinal de espasticidad**
    *   **Dado** que el paciente tiene registradas sesiones de ROM de codo previas y posteriores a una infiltración con toxina botulínica,
    *   **Cuando** el clínico accede al gráfico histórico,
    *   **Entonces** el sistema muestra la tendencia angular, destaca la fecha de inyección en el eje temporal y calcula la ganancia neta en grados de extensión lograda tras el tratamiento.

### 🔗 Dependencias
*   *Bloqueado por:* KAN-14, KAN-17, KAN-18
*   *Bloquea a:* KAN-24 (Visualización Gráfica Longitudinal).`
  },
  "KAN-20": {
    description: `### 👤 Historia de Usuario
**Como** desarrollador de sistemas de Neuro Vision,
**quiero** habilitar un canal de comunicación WebSockets para capturar datos en tiempo real de acelerómetros y giroscopios desde celulares y relojes inteligentes,
**para** obtener la señal cinemática directa de alta frecuencia requerida para el análisis objetivo de temblores.

### 🛠️ Especificaciones Técnicas
*   **Conexión:** WebSocket Server en el backend capaz de recibir flujos a 50Hz-100Hz.
*   **Métricas:** Datos de aceleración lineal ($m/s^2$) y velocidad angular ($rad/s$) en ejes cartesianos $X, Y, Z$.

### 📋 Criterios de Aceptación (Gherkin)
*   **Escenario: Streaming inercial activo**
    *   **Dado** que la aplicación wearable está conectada al servidor WebSockets,
    *   **Cuando** se inicia la grabación de la sesión,
    *   **Entonces** el sistema recibe, alinea temporalmente y almacena los flujos inerciales cartesianos cuadro por cuadro junto con el identificador del paciente.

### 🔗 Dependencias
*   *Bloquea a:* KAN-21 (Algoritmo de cuantificación del temblor).`
  },
  "KAN-21": {
    description: `### 👤 Historia de Usuario
**Como** neurólogo especialista,
**quiero** procesar la serie de tiempo inercial mediante la Transformada Rápida de Fourier (FFT) para estimar la frecuencia pico y la amplitud del temblor alineado a las pruebas de la escala UPDRS III,
**para** catalogar objetivamente el tipo y la severidad del temblor (temblor en reposo 3.17 y temblor postural 3.15) del paciente con enfermedad de Parkinson.

### 🛠️ Especificaciones Técnicas
*   **Módulo:** [fft.ts](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/biblioteca/math/fft.ts).
*   **Frecuencia:** Aislamiento de señales en el espectro parkinsoniano típico (**3.5 Hz a 12 Hz**).
*   **Clasificación UPDRS III (Nuevo Requerimiento):** Clasificar la severidad estimada según rangos de amplitud del temblor calculados (Normal, Leve, Moderado, Severo).

### 📋 Criterios de Aceptación (Gherkin)
*   **Escenario: Cuantificación de temblor en reposo**
    *   **Dado** que el paciente realiza la prueba de temblor en reposo (UPDRS III item 3.17) y finaliza el registro de 10 segundos,
    *   **Cuando** se ejecuta la FFT,
    *   **Entonces** el sistema reporta la frecuencia dominante (en Hz), la amplitud física promedio en grados o $m/s^2$, y clasifica la severidad estimada del temblor en el HUD.

### 🔗 Dependencias
*   *Bloqueado por:* KAN-20
*   *Bloquea a:* KAN-22 (DBS), KAN-24 (Visualización longitudinal).`
  },
  "KAN-22": {
    description: `### 👤 Historia de Usuario
**Como** neurólogo programador de DBS,
**quiero** registrar los parámetros eléctricos activos de la Estimulación Cerebral Profunda (voltaje, frecuencia, ancho de pulso, electrodo) y cruzarlos contra la severidad medida del temblor, bradicinesia y movimiento facial (UPDRS III),
**para** calibrar de forma óptima el neuroestimulador y maximizar el control sintomático del paciente.

### 🛠️ Especificaciones Técnicas
*   **Base de datos:** Registro de parámetros de DBS (voltaje V, ancho de pulso $\\mu s$, frecuencia Hz, y contactos) asociados a la sesión.
*   **Lógica de correlación (Nuevo Requerimiento):** Cruzar los voltajes e intensidades de estimulación con las métricas cuantitativas resultantes (frecuencia/amplitud del temblor, velocidad de tapping/bradicinesia, y asimetría facial) para identificar la ventana terapéutica idónea.

### 📋 Criterios de Aceptación (Gherkin)
*   **Escenario: Gráfico correlacional DBS vs Síntomas**
    *   **Dado** que el paciente tiene registradas sesiones con diferentes voltajes de DBS (ej. 1.5V, 2.0V, 2.5V, 3.0V),
    *   **Cuando** el neurólogo consulta las tendencias DBS,
    *   **Entonces** el sistema dibuja un Scatter Plot correlacionando el Voltaje DBS (eje X) con la Amplitud del Temblor y Bradicinesia medida (eje Y) para identificar el punto óptimo de alivio clínico.

### 🔗 Dependencias
*   *Bloqueado por:* KAN-21.`
  },
  "KAN-23": {
    description: `### 👤 Historia de Usuario
**Como** investigador o bioingeniero,
**quiero** exportar todas las series de tiempo detalladas cuadro por cuadro (ángulos, velocidades, coordenadas) en formato de archivo de Excel (.xlsx),
**para** realizar análisis cuantitativos o estadísticas en programas externos.

### 🛠️ Especificaciones Técnicas
*   **Implementación:** Biblioteca \`xlsx\` en el cliente.
*   **Estructura del Archivo:**
    *   *Pestaña 1 (Resumen):* Datos del paciente, fecha del estudio, métricas consolidadas (ROM máximo, promedio de asimetría, frecuencia de temblor).
    *   *Pestaña 2 (Detalle temporal):* Columnas para: Frame, Marca de tiempo (ms), Ángulo de landmarks/articulaciones activas, velocidad instantánea, estado farmacológico.

### 📋 Criterios de Aceptación (Gherkin)
*   **Escenario: Descarga limpia de datos**
    *   **Dado** que el usuario visualiza los resultados de una sesión clínica,
    *   **Cuando** presiona "Exportar a Excel",
    *   **Entonces** el navegador genera y descarga un archivo \`.xlsx\` estructurado cuya cantidad de registros temporales coincide con el total de frames de la sesión.

### 🔗 Dependencias
*   *Bloqueado por:* KAN-11, KAN-17, KAN-18`
  },
  "KAN-24": {
    description: `### 👤 Historia de Usuario
**Como** especialista clínico,
**quiero** visualizar gráficos de líneas y barras que consoliden las amplitudes máximas y la evolución temporal de las variables medidas en múltiples consultas,
**para** identificar de forma inmediata la respuesta al tratamiento a largo plazo o el deterioro progresivo.

### 🛠️ Especificaciones Técnicas
*   **Diseño Premium:** Componentes dinámicos en [TrendsView.tsx](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/vistas/TrendsView.tsx) con transiciones suaves basadas en HSL.
*   **Funcionalidad:** Filtros por tipo de estudio (Facial, Marcha, Articular), rango de fechas y estado terapéutico/farmacológico.

### 📋 Criterios de Aceptación (Gherkin)
*   **Escenario: Visualización longitudinal**
    *   **Dado** que el paciente tiene registradas múltiples sesiones de Rango de Movimiento (ROM) en el último año,
    *   **Cuando** el médico abre la pestaña de tendencias,
    *   **Entonces** se dibuja un gráfico de líneas que une los valores máximos de ROM de cada sesión, ordenados cronológicamente y marcando los hitos del tratamiento.

### 🔗 Dependencias
*   *Bloqueado por:* KAN-12, KAN-19, KAN-21
*   *Bloquea a:* KAN-25 (Informes con IA).`
  },
  "KAN-25": {
    description: `### 👤 Historia de Usuario
**Como** neurólogo / rehabilitador físico,
**quiero** generar un informe clínico interpretativo estructurado en formato PDF que integre las métricas medidas y una sugerencia de interpretación automática generada por un modelo de lenguaje (LLM),
**para** simplificar y agilizar la redacción y entrega del reporte formal al paciente.

### 🛠️ Especificaciones Técnicas
*   **Servicio:** Endpoint API \`/api/informe\` en Next.js.
*   **Generador:** Renderizado y descarga de PDF con membrete clínico formal, estructurando las variables cuantitativas (ROM, temblor, marcha) seguidas de la sección interpretativa redactada por el LLM.

### 📋 Criterios de Aceptación (Gherkin)
*   **Escenario: Descarga de informe formal con IA**
    *   **Dado** que se completa la evaluación clínica y se guardan los datos,
    *   **Cuando** se presiona "Generar Informe con IA",
    *   **Entonces** el sistema envía las métricas al LLM, ensambla el informe en PDF con diseño profesional, y descarga el archivo con firmas y membrete de Neuro Vision de inmediato.

### 🔗 Dependencias
*   *Bloqueado por:* KAN-24`
  }
};

async function updateIssue(key, description) {
  const url = `https://${host}/rest/api/2/issue/${key}`;
  const response = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      fields: {
        description: description
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Jira API failed for ${key}: ${response.status} - ${errText}`);
  }
  
  // Jira returns 204 No Content on successful PUT update
  console.log(`[OK] ${key} actualizado con éxito.`);
}

async function run() {
  console.log("Iniciando actualización de historias de Jira...");
  for (const [key, data] of Object.entries(updatedDescriptions)) {
    try {
      console.log(`Actualizando ${key}...`);
      await updateIssue(key, data.description);
      // Wait a tiny bit between requests to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
      console.error(`[ERROR] Falló la actualización de ${key}:`, err.message);
    }
  }
  console.log("=== PROCESO DE ACTUALIZACIÓN FINALIZADO ===");
}

run().catch(err => {
  console.error("Fallo crítico en el script:", err.message);
});

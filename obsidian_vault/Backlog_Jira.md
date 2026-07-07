# Backlog Priorizado de Jira (Proyecto KAN) - Detallado

Este documento detalla el backlog oficial de historias de usuario en el tablero Kanban de **Jira** (`sciarramartin.atlassian.net`), priorizado según dependencias tecnológicas y criticidad de ingeniería de sistemas.

Cada historia de usuario ha sido enriquecida con especificaciones clínicas, detalles matemáticos del motor analítico y criterios de aceptación formales en formato Gherkin, alineada con los requerimientos de Google Drive.

---

## ⚡ Prioridades del Backlog y Historias Detalladas

### 🔥 1. Prioridad: Highest (Core e Infraestructura Facial)
*Landmarks faciales y simetría bilateral (Core del sistema).*

#### 📌 `KAN-9`: KAN-Story-1: Selección de Landmarks Faciales en UI
*   **Descripción:** Permitir al evaluador elegir qué regiones faciales específicas monitorear (Frente/Cejas, Ojos/Párpados, Labios/Boca, Nariz) mediante interruptores de selección en la pantalla de configuración.
*   **Como:** evaluador clínico / neurólogo.
*   **Quiero:** elegir qué regiones faciales específicas monitorear mediante la UI.
*   **Para:** focalizar el análisis en los síntomas específicos del paciente y optimizar el rendimiento de procesamiento del sistema.
*   **Especificaciones Técnicas:**
    *   *Vista:* [[Vistas_Usuario|CaptureView]] / Panel de configuración interactivo.
    *   *Landmarks:* Ceja Izquierda (70, 107), Ceja Derecha (300, 336), Ojo Izquierdo (33, 133), Ojo Derecho (263, 362), Boca (61, 291, 0, 17), Nariz (4, 98, 327).
    *   *Estado:* Guardado en el [[Controladores_Negocio|contexto global]] para el filtrado en el bucle de renderizado.
*   **Criterios de Aceptación:**
    *   *Dado* que el clínico ingresa a la pantalla de preparación, *Cuando* activa únicamente "Ojos/Párpados" y "Labios/Boca", *Entonces* el canvas de visualización y el motor analítico solo renderizan y calculan coordenadas para esos grupos de puntos durante la sesión activa.

---

#### 📌 `KAN-10`: KAN-Story-2: Extracción de Landmarks en Tiempo Real
*   **Descripción:** Integrar la biblioteca MediaPipe Face Mesh para extraer las coordenadas espaciales tridimensionales $X, Y, Z$ de la malla facial en tiempo real a partir del feed de video.
*   **Como:** motor de procesamiento de visión de Neuro Vision.
*   **Quiero:** integrar MediaPipe Face Mesh para extraer las coordenadas tridimensionales de la cara del paciente en tiempo real.
*   **Para:** generar la serie de tiempo espacial cruda requerida por el módulo de cálculos cinemáticos.
*   **Especificaciones Técnicas:**
    *   *Código:* Hook de MediaPipe integrado con el componente Webcam en [[Vistas_Usuario|CaptureView]].
    *   *Rendimiento:* Procesamiento estable de frames a un mínimo de 30 FPS.
    *   *Fallback:* Lógica de tolerancia a pérdidas temporales de tracking facial.
*   **Criterios de Aceptación:**
    *   *Dado* que la cámara o el simulador están encendidos, *Cuando* el paciente se ubica frente a la cámara, *Entonces* la malla de MediaPipe Face Mesh se dibuja superpuesta sobre su rostro y extrae las coordenadas 3D sin latencias perceptibles.

---

#### 📌 `KAN-11`: KAN-Story-3: Cálculo de Rango de Movimiento (ROM) y Asimetría
*   **Descripción:** Desarrollar los módulos para calcular amplitudes angulares y el porcentaje de asimetría bilateral en reposo y en sonrisa.
*   **Como:** evaluador clínico.
*   **Quiero:** calcular el Rango de Movimiento (ROM) angular y el porcentaje de asimetría bilateral de las cejas/comisuras en reposo y sonrisa.
*   **Para:** cuantificar con métricas exactas la gravedad de la paresia o parálisis facial del paciente.
*   **Especificaciones Técnicas:**
    *   *Código:* Funciones de soporte en [[Algoritmos_Analisis|angles.ts]] y [[Algoritmos_Analisis|kinematics.ts]].
    *   *Ángulo articular 3D:* $\theta = \arccos\left(\frac{\vec{v}_1 \cdot \vec{v}_2}{\|\vec{v}_1\| \|\vec{v}_2\|}\right) \times \frac{180}{\pi}$
    *   *Fórmula de Asimetría:* $Asimetria = \frac{|Val_{izq} - Val_{der}|}{\max(Val_{izq}, Val_{der})} \times 100$
*   **Criterios de Aceptación:**
    *   *Dado* que el paciente realiza una sonrisa máxima y termina la sesión, *Cuando* se procesan los datos, *Entonces* se calcula la asimetría labial bilateral y se muestra en el HUD con precisión de dos decimales.

---

#### 📌 `KAN-12`: KAN-Story-4: Comparativa Pre vs Post-L-Dopa Facial
*   **Descripción:** Comparar automáticamente las curvas de ROM de una sesión previa a la medicación contra una posterior para medir la eficacia farmacológica.
*   **Como:** neurólogo tratante.
*   **Quiero:** comparar gráficamente las curvas de ROM facial PRE vs POST Levodopa del mismo paciente.
*   **Para:** evaluar cuantitativamente la respuesta y la eficacia farmacológica del tratamiento en los músculos faciales.
*   **Especificaciones Técnicas:**
    *   *Vista:* [[Vistas_Usuario|TrendsView]].
    *   *Controlador:* Consulta y filtrado de sesiones por estado farmacológico (`PRE` vs `POST` L-Dopa) en [[Controladores_Negocio|SessionController]].
*   **Criterios de Aceptación:**
    *   *Dado* que el paciente posee una sesión "PRE" y otra "POST" registradas el mismo día, *Cuando* se carga la vista de tendencias, *Entonces* el sistema superpone ambas series de ROM (PRE en coral y POST en cian) y calcula la diferencia porcentual de mejora motora.

---

### 📈 2. Prioridad: High (Tren Superior e Interfaz)
*Rastreo corporal de miembros superiores e interfaz gráfica inicial.*

#### 📌 `KAN-17`: KAN-Story-9: Medición Articular de Tren Superior (Con Selección Activa)
*   **Descripción:** Calcular rangos angulares bilaterales en tiempo real para Hombro, Codo y Muñeca con MediaPipe Pose, permitiendo al usuario seleccionar qué articulaciones evaluar.
*   **Como:** terapeuta ocupacional / rehabilitador.
*   **Quiero:** seleccionar interactivamente qué articulaciones del tren superior analizar (Hombro, Codo, Muñeca) y medir en tiempo real sus ángulos con MediaPipe Pose.
*   **Para:** evaluar la rigidez, extensión y velocidad del movimiento durante las rutinas de terapia.
*   **Especificaciones Técnicas:**
    *   *UI:* Panel de configuración de articulaciones en [[Vistas_Usuario|CaptureView]] (bilateral).
    *   *Landmarks Pose:* Hombro (11, 12), Codo (13, 14), Muñeca (15, 16).
    *   *Lógica:* Reutilización de cálculos vectoriales 3D en [[Algoritmos_Analisis|angles.ts]].
*   **Criterios de Aceptación:**
    *   *Dado* que el clínico selecciona "Codo Izquierdo" en la pantalla de preparación, *Cuando* el paciente realiza el ejercicio, *Entonces* el HUD en tiempo real calcula y grafica el ángulo de flexión (0° a 180°), ignorando las demás articulaciones.

---

#### 📌 `KAN-24`: KAN-Story-16: Visualización Gráfica Longitudinal
*   **Descripción:** Mostrar gráficos de barras comparativas y líneas de evolución en la web que consoliden múltiples sesiones y métricas.
*   **Como:** especialista clínico.
*   **Quiero:** visualizar gráficos longitudinales de barras y líneas que representen las amplitudes máximas y evolución temporal del paciente.
*   **Para:** identificar a golpe de vista si el paciente responde positivamente al tratamiento o si muestra un deterioro clínico progresivo.
*   **Especificaciones Técnicas:**
    *   *Diseño:* Componente gráfico premium animado en [[Vistas_Usuario|TrendsView]] con soporte HSL y transiciones fluidas.
    *   *Filtros:* Por tipo de evaluación (Facial, Marcha, Articular), rango de fechas y estado farmacológico/terapéutico.
*   **Criterios de Aceptación:**
    *   *Dado* que el paciente tiene múltiples sesiones a lo largo de meses, *Cuando* se carga el panel de tendencias, *Entonces* se genera un gráfico de líneas longitudinal que une los valores máximos de ROM de forma cronológica.

---

#### 📌 `KAN-23`: KAN-Story-15: Exportación de Datos Crudos a Excel
*   **Descripción:** Descargar la serie de tiempo de ángulos y velocidades en formato `.xlsx`.
*   **Como:** investigador o bioingeniero clínico.
*   **Quiero:** exportar toda la serie de tiempo detallada cuadro por cuadro de la sesión activa en un archivo Excel.
*   **Para:** realizar análisis cuantitativos o modelados biomecánicos en programas estadísticos externos.
*   **Especificaciones Técnicas:**
    *   *Librería:* Uso de la biblioteca cliente `xlsx`.
    *   *Libro:* Pestaña 1 con metadatos del paciente y métricas agregadas (ROM máx, asimetría promedio), y Pestaña 2 con la serie temporal frame a frame (Frame, Tiempo ms, Ángulos de articulaciones activas).
*   **Criterios de Aceptación:**
    *   *Dado* que el usuario finaliza y visualiza los resultados de la sesión, *Cuando* presiona "Exportar a Excel", *Entonces* se descarga de inmediato el archivo `.xlsx` estructurado sin errores de sintaxis.

---

### 🚶 3. Prioridad: Medium (Tren Inferior y Marcha Monocámara)
*Medición del paso, historial de marcha lateral y extremidades inferiores.*

#### 📌 `KAN-13`: KAN-Story-5: Medición Lateral de Amplitud de Paso
*   **Descripción:** Detectar landmarks de talones en vista lateral con MediaPipe Pose y estimar la amplitud máxima del paso en marcha.
*   **Como:** rehabilitador físico / kinesiólogo.
*   **Quiero:** medir la amplitud máxima del paso usando landmarks de talones mediante una toma lateral de cámara de cuerpo completo con MediaPipe Pose.
*   **Para:** estimar de manera objetiva la longitud de zancada en el plano horizontal y detectar anomalías en la marcha.
*   **Especificaciones Técnicas:**
    *   *Landmarks:* Tobillo (27, 28) y Talón (29, 30) de MediaPipe Pose.
    *   *Algoritmo:* Distancia euclidiana máxima en el eje X durante el ciclo de zancada.
    *   *Calibración:* Conversión de píxeles a metros en base a la altura informada del paciente.
*   **Criterios de Aceptación:**
    *   *Dado* que el paciente camina de perfil respecto a la cámara, *Cuando* se detecta la máxima apertura horizontal de las piernas, *Entonces* el sistema calcula y reporta la amplitud del paso en centímetros.

---

#### 📌 `KAN-14`: KAN-Story-6: Historial Comparativo de Amplitud de Paso (Con Cálculo de Deltas)
*   **Descripción:** Guardar la amplitud de paso del paciente para evaluaciones clínicas de Hidrocefalia Normotensiva (HNT), comparando automáticamente los cambios porcentuales.
*   **Como:** neurólogo o neurocirujano.
*   **Quiero:** registrar las amplitudes de paso calculadas e historizarlas, calculando la diferencia porcentual entre las sesiones del paciente.
*   **Para:** monitorear de forma longitudinal la evolución y la respuesta motora a procedimientos terapéuticos (ej. punción lumbar evacuadora).
*   **Especificaciones Técnicas:**
    *   *Base de datos:* Campo `step_amplitude` persistido en el [[Modelos_Datos|modelo Session]].
    *   *Lógica:* Cálculo de la diferencia porcentual ($\Delta\%$) de la amplitud de paso entre dos sesiones elegidas por el médico.
*   **Criterios de Aceptación:**
    *   *Dado* que el médico selecciona una sesión de marcha "PRE punción" y otra "POST punción", *Cuando* solicita la comparativa, *Entonces* el sistema grafica ambas y reporta la ganancia o pérdida porcentual ($\Delta\%$) del paso.

---

#### 📌 `KAN-18`: KAN-Story-10: Medición Articular de Tren Inferior (Con Selección Activa)
*   **Descripción:** Calcular rangos angulares bilaterales para Cadera, Rodilla y Tobillo usando MediaPipe Pose, permitiendo la activación selectiva en la UI.
*   **Como:** kinesiólogo / rehabilitador físico.
*   **Quiero:** seleccionar las articulaciones del tren inferior a evaluar (Cadera, Rodilla, Tobillo) y registrar en tiempo real sus ángulos con MediaPipe Pose.
*   **Para:** cuantificar la rigidez, la flexoextensión y asimetrías de soporte durante la marcha o sentadillas.
*   **Especificaciones Técnicas:**
    *   *UI:* Panel de selección en [[Vistas_Usuario|CaptureView]] (bilateral).
    *   *Landmarks:* Cadera (23, 24), Rodilla (25, 26), Tobillo (27, 28), Talón (29, 30).
    *   *Cálculos:* Álgebra vectorial 3D integrada en [[Algoritmos_Analisis|angles.ts]] y velocidades en [[Algoritmos_Analisis|kinematics.ts]].
*   **Criterios de Aceptación:**
    *   *Dado* que se marca únicamente "Rodilla Derecha" en la configuración, *Cuando* el paciente hace sentadillas, *Entonces* se calcula en tiempo real el ángulo interno y se reporta el ROM total (extensión máxima menos flexión máxima) al final.

---

#### 📌 `KAN-19`: KAN-Story-11: Comparativa Longitudinal para Espasticidad (Con Hitos Terapéuticos)
*   **Descripción:** Graficar la evolución de los rangos de movimiento antes y después de intervenciones terapéuticas (ej. toxina botulínica) para cuantificar la rigidez articular.
*   **Como:** médico fisiatra.
*   **Quiero:** graficar y comparar las curvas de ROM articular registrando marcas temporales de hitos terapéuticos.
*   **Para:** valorar la reducción de la espasticidad y rigidez, estimando el cambio neto en grados logrado.
*   **Especificaciones Técnicas:**
    *   *Base de datos:* Registro de hitos terapéuticos del paciente (ej. inyección botulínica).
    *   *UI:* Renderizado en [[Vistas_Usuario|TrendsView]] con líneas de tendencia longitudinales e indicadores verticales de eventos terapéuticos.
*   **Criterios de Aceptación:**
    *   *Dado* que el paciente cuenta con sesiones de codo antes y después de una infiltración con toxina botulínica, *Cuando* se carga el panel de tendencias, *Entonces* el sistema muestra la fecha de inyección en el eje temporal y calcula la ganancia neta en grados de extensión lograda.

---

### ⌚ 4. Prioridad: Low (Integración de Wearables e IoT)
*Integración de sensores externos de teléfonos y relojes inteligentes.*

#### 📌 `KAN-20`: KAN-Story-12: Captura de Datos Inerciales de Wearables
*   **Descripción:** Escuchar y registrar datos en tiempo real (acelerómetro y giroscopio) desde celular y reloj inteligente a través de WebSockets.
*   **Como:** desarrollador de sistemas de Neuro Vision.
*   **Quiero:** conectar e integrar un canal de comunicación WebSockets para recibir datos inerciales de wearables a alta frecuencia.
*   **Para:** obtener lecturas cinemáticas directas que permitan caracterizar de forma cuantitativa y objetiva el temblor.
*   **Especificaciones Técnicas:**
    *   *Backend:* Servidor WebSockets en Next.js capaz de procesar flujos a 50Hz-100Hz.
    *   *Variables:* Ejes de aceleración lineal ($m/s^2$) y velocidad angular ($rad/s$) en ejes cartesianos $X, Y, Z$.
*   **Criterios de Aceptación:**
    *   *Dado* que el wearable del paciente está conectado al WebSocket, *Cuando* comienza la sesión de temblor, *Entonces* el sistema encola e integra las lecturas cartesianas cuadro por cuadro junto con la marca de tiempo Unix.

---

#### 📌 `KAN-21`: KAN-Story-13: Algoritmo de Cuantificación del Temblor (UPDRS III)
*   **Descripción:** Procesar la señal del acelerómetro con FFT para estimar la frecuencia dominante (3.5 a 12 Hz) y catalogar la severidad según UPDRS III.
*   **Como:** neurólogo especialista en movimientos anormales.
*   **Quiero:** procesar la serie de tiempo inercial mediante FFT para calcular la frecuencia pico y clasificar la severidad del temblor (temblor postural 3.15 y reposo 3.17) según los criterios UPDRS III.
*   **Para:** aislar e identificar cuantitativamente el temblor patológico parkinsoniano de temblores fisiológicos normales.
*   **Especificaciones Técnicas:**
    *   *Módulo:* [[Algoritmos_Analisis|fft.ts]] aplicando detrending y filtro pasa banda.
    *   *Clasificación:* Mapear amplitud física estimada en escalas UPDRS III (Normal, Leve, Moderado, Severo).
*   **Criterios de Aceptación:**
    *   *Dado* que se procesan 10s de aceleración de reposo, *Cuando* finaliza la FFT, *Entonces* se reporta la frecuencia pico exacta (en Hz) y se clasifica la severidad estimada del temblor en el HUD clínico.

---

#### 📌 `KAN-22`: KAN-Story-14: Registro de Parámetros DBS y Cruzado Clínico (UPDRS III)
*   **Descripción:** Registrar los voltajes e intensidades del DBS del paciente y cruzarlos contra la severidad medida de temblores, bradicinesia y movimiento facial.
*   **Como:** neurólogo programador de DBS.
*   **Quiero:** registrar parámetros del neuroestimulador del paciente (voltaje, frecuencia, ancho de pulso, electrodo) y correlacionarlos con los síntomas cuantificados (temblor, tapping/bradicinesia, asimetría facial).
*   **Para:** determinar la configuración eléctrica óptima del DBS que minimice los síntomas motores disminuyendo efectos adversos.
*   **Especificaciones Técnicas:**
    *   *Base de datos:* Campos DBS en el [[Modelos_Datos|modelo Session]] asociados a la sesión del paciente.
    *   *Correlación:* Cruzar datos cinemáticos objetivos con el voltaje de estimulación.
*   **Criterios de Aceptación:**
    *   *Dado* que el paciente posee sesiones registradas con diferentes voltajes de estimulación (ej. 1.5V, 2.0V, 2.5V, 3.0V), *Cuando* se consulta el panel DBS, *Entonces* el sistema despliega un Scatter Plot correlacionando el Voltaje DBS (eje X) contra la amplitud del temblor medida (eje Y) para identificar el punto óptimo.

---

### 🧊 5. Prioridad: Lowest (Sistemas Multicámara e IA Generativa)
*Geometría 3D multicámara compleja y reportes automáticos con LLM.*

#### 📌 `KAN-15`: KAN-Story-7: Sincronización Temporal Multicámara
*   **Descripción:** Sincronizar la adquisición de video de dos o más cámaras conectadas para capturar vistas simultáneas de frente y perfil.
*   **Como:** especialista en biomecánica.
*   **Quiero:** sincronizar los flujos de video de múltiples cámaras (frente y perfil) basándose en marcas de tiempo UNIX de adquisición de frames.
*   **Para:** asegurar que los fotogramas representen exactamente el mismo instante físico en ambas perspectivas.
*   **Especificaciones Técnicas:**
    *   *Algoritmo:* Alineación temporal al frame más cercano (Nearest Frame Matching) con tolerancia máxima de desfase de 33ms (1 frame a 30 FPS).
*   **Criterios de Aceptación:**
    *   *Dado* que se graban videos desde dos ángulos simultáneamente, *Cuando* termina la grabación, *Entonces* el sistema alinea los flujos fotograma por fotograma según su marca de tiempo del sistema de captura.

---

#### 📌 `KAN-16`: KAN-Story-8: Análisis Biomecánico Tridimensional (3D)
*   **Descripción:** Estimar las coordenadas espaciales tridimensionales de landmarks corporales combinando los feeds de cámaras sincronizadas.
*   **Como:** bioingeniero / investigador.
*   **Quiero:** estimar las coordenadas físicas tridimensionales reales combinando los flujos 2D de cámaras de frente y perfil sincronizadas.
*   **Para:** evaluar trayectorias biomecánicas volumétricas tridimensionales libres de distorsión de perspectiva 2D.
*   **Especificaciones Técnicas:**
    *   *Lógica:* Triangulación geométrica stéreo ortogonal (X, Y de frente; Z, Y de perfil) con alineación y promediado del eje Y común.
*   **Criterios de Aceptación:**
    *   *Dado* que los feeds 2D están sincronizados y calibrados, *Cuando* corre el módulo de reconstrucción 3D, *Entonces* el sistema triangula y calcula las posiciones espaciales tridimensionales $(X, Y, Z)$ reales en metros.

---

#### 📌 `KAN-25`: KAN-Story-17: Generación de Informes Clínicos con IA
*   **Descripción:** Enviar las métricas objetivas a un LLM para redactar un informe clínico interpretativo estructurado en formato PDF.
*   **Como:** neurólogo / rehabilitador.
*   **Quiero:** generar automáticamente un informe clínico en PDF que integre las métricas medidas (ROM, temblor, marcha) y una interpretación automática redactada por un modelo de lenguaje (LLM).
*   **Para:** acelerar el flujo administrativo médico y entregar un reporte profesional y estructurado al paciente.
*   **Especificaciones Técnicas:**
    *   *API:* Endpoint `/api/informe` en Next.js.
    *   *Generador:* Envío de métricas consolidadas al LLM, formato de texto sugerido e integración con biblioteca de PDF para descarga.
*   **Criterios de Aceptación:**
    *   *Dado* que finaliza una evaluación y se guardan los datos, *Cuando* el médico presiona "Generar Informe con IA", *Entonces* el sistema llama al LLM, compila un PDF formal con membrete clínico, resultados y sección interpretativa, y descarga el archivo de inmediato.

---

## 🔗 Nodos Relacionados
*   [[Inicio]]: Volver al panel principal.
*   [[Arquitectura_MVC]]: Arquitectura general.
*   [[Modelos_Datos]]: Detalle de las entidades de base de datos.
*   [[Algoritmos_Analisis]]: Biblioteca matemática del sistema.

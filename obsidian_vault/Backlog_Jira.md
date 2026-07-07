# Backlog Priorizado de Jira (Proyecto KAN)

Este documento detalla el backlog oficial de historias de usuario en el tablero Kanban de **Jira** (`sciarramartin.atlassian.net`), priorizado según dependencias tecnológicas y criticidad de ingeniería de sistemas.

Las 5 épicas organizativas originales han sido eliminadas para evitar ruido visual, dejando únicamente las **historias de usuario granulares** en el backlog.

---

## ⚡ Prioridades del Backlog

### 🔥 1. Prioridad: Highest (Core e Infraestructura Facial)
*Landmarks faciales y simetría bilateral (Core del sistema).*
*   `KAN-9`: **KAN-Story-1: Selección de Landmarks Faciales en UI**
    *   *Descripción:* Permitir al evaluador elegir qué regiones faciales monitorear (Frente/Cejas, Ojos/Párpados, Labios/Boca, Nariz) mediante interruptores.
*   `KAN-10`: **KAN-Story-2: Detección y Extracción de Landmarks**
    *   *Descripción:* Integrar MediaPipe Face Mesh para obtener las coordenadas espaciales $X, Y, Z$ de los puntos faciales.
*   `KAN-11`: **KAN-Story-3: Cálculo de Rango de Movimiento (ROM) y Asimetría**
    *   *Descripción:* Calcular amplitudes angulares y el porcentaje de asimetría bilateral en sonrisa.
*   `KAN-12`: **KAN-Story-4: Comparativa Pre vs Post-L-Dopa Facial**
    *   *Descripción:* Comparar las curvas de ROM de una sesión previa a la medicación contra una posterior para medir eficacia farmacológica.

---

### 📈 2. Prioridad: High (Tren Superior e Interfaz)
*Rastreo corporal de miembros superiores e interfaz gráfica inicial.*
*   `KAN-17`: **KAN-Story-9: Medición Articular de Tren Superior**
    *   *Descripción:* Calcular rangos angulares bilaterales en tiempo real para Hombro, Codo y Muñeca con MediaPipe Pose.
*   `KAN-24`: **KAN-Story-16: Visualización Gráfica Longitudinal**
    *   *Descripción:* Mostrar gráficos de barras comparativas y líneas de evolución en la web.
*   `KAN-23`: **KAN-Story-15: Exportación de Datos Crudos a Excel**
    *   *Descripción:* Descargar la serie de tiempo de ángulos y velocidades en formato `.xlsx`.

---

### 🚶 3. Prioridad: Medium (Tren Inferior y Marcha Monocámara)
*Medición del paso, historial de marcha lateral y extremidades inferiores.*
*   `KAN-13`: **KAN-Story-5: Medición Lateral de Amplitud de Paso**
    *   *Descripción:* Detectar landmarks de talones en vista lateral y estimar la amplitud del paso en marcha.
*   `KAN-14`: **KAN-Story-6: Historial Comparativo de Amplitud de Paso**
    *   *Descripción:* Guardar la amplitud de paso del paciente para evaluaciones de Hidrocefalia Normotensiva.
*   `KAN-18`: **KAN-Story-10: Medición Articular de Tren Inferior**
    *   *Descripción:* Calcular rangos angulares bilaterales para Cadera, Rodilla y Tobillo.
*   `KAN-19`: **KAN-Story-11: Comparativa Longitudinal para Espasticidad**
    *   *Descripción:* Graficar la evolución de los rangos de movimiento antes y después de intervenciones terapéuticas.

---

### ⌚ 4. Prioridad: Low (Integración de Wearables e IoT)
*Integración de sensores externos de teléfonos y relojes inteligentes.*
*   `KAN-20`: **KAN-Story-12: Captura de Datos Inerciales de Wearables**
    *   *Descripción:* Escuchar datos en tiempo real (acelerómetro y giroscopio) desde celular y reloj inteligente.
*   `KAN-21`: **KAN-Story-13: Algoritmo de Cuantificación del Temblor**
    *   *Descripción:* Procesar la señal del acelerómetro con FFT para esitmar la frecuencia y amplitud del temblor parkinsoniano.
*   `KAN-22`: **KAN-Story-14: Registro de Parámetros de Estimulación Cerebral (DBS)**
    *   *Descripción:* Permitir registrar voltajes del DBS del paciente y cruzarlos contra la severidad medida del temblor.

---

### 🧊 5. Prioridad: Lowest (Sistemas Multicámara e IA Generativa)
*Geometría 3D multicámara compleja y reportes automáticos con LLM.*
*   `KAN-15`: **KAN-Story-7: Sincronización Temporal Multicámara**
    *   *Descripción:* Sincronizar la adquisición de video de dos o más cámaras para capturar vistas simultáneas de frente y perfil.
*   `KAN-16`: **KAN-Story-8: Análisis Biomecánico Tridimensional (3D)**
    *   *Descripción:* Estimar las coordenadas espaciales 3D combinando los feeds de cámaras sincronizadas.
*   `KAN-25`: **KAN-Story-17: Generación de Informes Clínicos con IA**
    *   *Descripción:* Enviar métricas a un LLM para redactar un informe clínico interpretativo estructurado en formato PDF.

---

## 🔗 Nodos Relacionados
*   [[Inicio]]: Volver al panel principal.
*   [[Arquitectura_MVC]]: Arquitectura general.

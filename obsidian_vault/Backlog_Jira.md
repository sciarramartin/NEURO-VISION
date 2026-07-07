# Backlog del Tablero Jira (Proyecto KAN)

Este documento detalla el backlog oficial del proyecto cargado e integrado de forma automática en el tablero Kanban de **Jira** (`sciarramartin.atlassian.net`) bajo el identificador de proyecto `KAN`.

---

## 🏛️ Épicas y Tareas en Jira

### 🎥 [[Vistas_Usuario|ÉPICA KAN-4: Módulo de Análisis Facial Clínico]]
*   `KAN-9`: **KAN-Story-1: Selección de Landmarks Faciales en UI**
    *   *Descripción:* Permitir al evaluador elegir qué regiones faciales monitorear (Frente/Cejas, Ojos/Párpados, Labios/Boca, Nariz) mediante interruptores en la pantalla de configuración.
*   `KAN-10`: **KAN-Story-2: Detección y Extracción de Landmarks**
    *   *Descripción:* Integrar MediaPipe Face Mesh para obtener las coordenadas espaciales $X, Y, Z$ de los puntos faciales seleccionados.
*   `KAN-11`: **KAN-Story-3: Cálculo de Rango de Movimiento (ROM) y Asimetría**
    *   *Descripción:* Desarrollar los módulos para calcular amplitudes angulares y el porcentaje de asimetría bilateral en reposo y en sonrisa.
*   `KAN-12`: **KAN-Story-4: Comparativa Pre vs Post-L-Dopa Facial**
    *   *Descripción:* Comparar automáticamente las curvas de ROM de una sesión previa a la medicación contra una posterior para medir la eficacia farmacológica.

---

### 🚶 [[Algoritmos_Analisis|ÉPICA KAN-5: Análisis Clínico de la Marcha]]
*   `KAN-13`: **KAN-Story-5: Medición Lateral de Amplitud de Paso**
    *   *Descripción:* Detectar landmarks de ambos talones con MediaPipe Pose y estimar la distancia máxima (paso) en vista lateral.
*   `KAN-14`: **KAN-Story-6: Historial Comparativo de Amplitud de Paso**
    *   *Descripción:* Guardar e historizar la amplitud de paso del paciente para evaluaciones clínicas de Hidrocefalia Normotensiva.
*   `KAN-15`: **KAN-Story-7: Sincronización Temporal Multicámara**
    *   *Descripción:* Sincronizar la adquisición de video de dos o más cámaras conectadas para capturar vistas simultáneas de frente y perfil.
*   `KAN-16`: **KAN-Story-8: Análisis Biomecánico Tridimensional (3D)**
    *   *Descripción:* Estimar las coordenadas espaciales tridimensionales de landmarks corporales combinando los feeds de cámaras sincronizadas.

---

### 📐 [[Algoritmos_Analisis|ÉPICA KAN-6: Rangos Articulares Bilaterales]]
*   `KAN-17`: **KAN-Story-9: Medición Articular de Tren Superior**
    *   *Descripción:* Calcular rangos angulares bilaterales en tiempo real para Hombro, Codo y Muñeca.
*   `KAN-18`: **KAN-Story-10: Medición Articular de Tren Inferior**
    *   *Descripción:* Calcular rangos angulares bilaterales para Cadera, Rodilla y Tobillo.
*   `KAN-19`: **KAN-Story-11: Comparativa Longitudinal para Espasticidad**
    *   *Descripción:* Graficar la evolución de los rangos de movimiento articulares antes y después de intervenciones terapéuticas contra la espasticidad.

---

### ⌚ [[Algoritmos_Analisis|ÉPICA KAN-7: UPDRS III & Integración IoT (Parkinson)]]
*   `KAN-20`: **KAN-Story-12: Captura de Datos Inerciales de Wearables**
    *   *Descripción:* Conectar un canal de escucha de datos en tiempo real (acelerómetro y giroscopio) desde celular y reloj inteligente.
*   `KAN-21`: **KAN-Story-13: Algoritmo de Cuantificación del Temblor**
    *   *Descripción:* Procesar la señal del acelerómetro con FFT para esitmar la frecuencia dominante (en Hz) y la amplitud del temblor parkinsoniano.
*   `KAN-22`: **KAN-Story-14: Registro de Parámetros de Estimulación Cerebral (DBS)**
    *   *Descripción:* Permitir registrar los voltajes e intensidades del DBS del paciente y cruzarlos contra la severidad medida del temblor.

---

### 📊 [[Vistas_Usuario|ÉPICA KAN-8: Exportación e Informes con Inteligencia Artificial]]
*   `KAN-23`: **KAN-Story-15: Exportación de Datos Crudos a Excel**
    *   *Descripción:* Descargar la serie de tiempo de ángulos y velocidades en formato `.xlsx`.
*   `KAN-24`: **KAN-Story-16: Visualización Gráfica Longitudinal**
    *   *Descripción:* Mostrar gráficos de barras comparativas y líneas de evolución en la web.
*   `KAN-25`: **KAN-Story-17: Generación de Informes Clínicos con IA**
    *   *Descripción:* Enviar las métricas objetivas a un LLM para redactar un informe clínico interpretativo estructurado en formato PDF.

---

## 🔗 Nodos Relacionados
*   [[Inicio]]: Volver al panel principal.
*   [[Arquitectura_MVC]]: Arquitectura general.

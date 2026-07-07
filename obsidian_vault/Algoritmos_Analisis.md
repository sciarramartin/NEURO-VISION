# Módulos Analíticos y Algoritmos Matemáticos

El sistema cuenta con un motor matemático y físico escrito en TypeScript dentro de `src/biblioteca/math/` para analizar el comportamiento muscular y los temblores faciales en tiempo real.

---

## 📐 1. Cálculo de Ángulos Faciales (angles.ts)
Ubicación del archivo: [angles.ts](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/biblioteca/math/angles.ts)

*   **Puntos de Medición (Landmarks):** Utiliza los índices de landmarks de la malla facial (Face Mesh) de MediaPipe para rastrear áreas clave:
    *   `CEJA`: Rango de movimiento de cejas (frente).
    *   `PARPADO`: Apertura y parpadeo de ojos.
    *   `BOCA`: Simetría labial (sonrisa).
    *   `NARIZ`: Movilidad del labio superior y nariz.
*   **Fórmula del Ángulo:** Calcula en grados el ángulo entre tres puntos $P_1$, $P_2$ (vértice) y $P_3$, aplicando el producto punto de vectores:
    $$\theta = \arccos\left(\frac{\vec{v}_1 \cdot \vec{v}_2}{\|\vec{v}_1\| \|\vec{v}_2\|}\right) \times \frac{180}{\pi}$$
*   **`encontrarLandmarkMasCercano(clickX, clickY, landmarks, canvasW, canvasH, umbral?)`:** Implementa el hit-test del Enfoque C de KAN-9. Itera sobre los 468 landmarks, calcula la distancia euclidiana al click (corregido por el espejo CSS `scale-x-[-1]`) y devuelve el índice del punto más cercano dentro del umbral de 15px. Retorna `null` si ningún landmark queda dentro del umbral.
*   **`calcularCalidadTracking(landmarks, indices)`:** KAN-10 M5. Promedia los scores de `visibility` de los landmarks activos y clasifica: `excelente` (≥ 0.80), `degradado` (≥ 0.50) o `perdido` (< 0.50).
*   **Tipo `LandmarkRaw`:** Interface tipada que espeja la salida de MediaPipe (`x, y, z?, visibility?`) para habilitar el filtro de visibilidad M2.

---

## ⚡ 2. Análisis de Temblores por FFT (fft.ts)
Ubicación del archivo: [fft.ts](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/biblioteca/math/fft.ts)

*   **Transformada Rápida de Fourier (FFT):** Convierte las oscilaciones de los ángulos registrados (tiempo) al dominio de la frecuencia para aislar la vibración involuntaria.
*   **Frecuencia Dominante:** Encuentra la frecuencia pico en el espectro entre **3.5 Hz y 12 Hz** (rango característico de los temblores parkinsonianos).
*   **Amplitud del Temblor:** Calcula la desviación estándar de la señal filtrada para determinar la magnitud o intensidad física del temblor en grados orbitales.

---

## 🏃 3. Cinemática y Asimetría (kinematics.ts)
Ubicación del archivo: [kinematics.ts](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/biblioteca/math/kinematics.ts)

*   **Velocidad Instantánea:** Deriva la velocidad angular del movimiento a través de diferencias temporales finitas entre fotogramas consecutivos.
*   **Índice de Asimetría:** Evalúa el balance motor bilateral de la cara (comparando el lado Izquierdo contra el Derecho) mediante la fórmula de diferencia porcentual:
    $$Asimetria = \frac{|Val_{izq} - Val_{der}|}{\max(Val_{izq}, Val_{der})} \times 100$$

---

## 🔗 Nodos Relacionados
*   [[Inicio]]: Volver al panel principal.
*   [[Vistas_Usuario]]: Dónde se muestran y recogen estos datos.

# Especificación Técnica: Análisis de Flexión y Extensión Articular (Fase 3)

Esta especificación detalla el diseño e implementación del análisis articular de flexión y extensión para extremidades superiores e inferiores (codo, muñeca, hombro, rodilla, cadera y tobillo) con el fin de cuantificar la espasticidad, la rigidez muscular y el rango de movimiento (ROM) articular de forma bilateral.

---

## 🎯 1. Requerimientos Clínicos y de Negocio

1.  **Medición Articular de Tren Superior (`KAN-39`):** Calcular en tiempo real y de forma bilateral (izquierdo/derecho) los ángulos articulares en 3D para hombros, codos y muñecas.
2.  **Medición Articular de Tren Inferior (`KAN-40`):** Calcular en tiempo real y de forma bilateral los ángulos articulares en 3D para caderas, rodillas y tobillos utilizando MediaPipe Pose.
3.  **Comparativa Longitudinal de Espasticidad (`KAN-41`):** Graficar la evolución de los rangos de movimiento articulares antes y después de tratamientos clínicos (ej. inyección de toxina botulínica o fisioterapia) para valorar la efectividad del tratamiento.

---

## 📐 2. Fórmulas Matemáticas y Algoritmos

### 2.1. Puntos de Articulación y Vectores
Cada articulación está definida por 3 puntos de referencia ($P_1, V, P_3$), donde $V$ es el vértice (la articulación en evaluación).
El ángulo en 3D $\theta$ se calcula mediante el producto escalar de los vectores $\vec{v}_1 = P_1 - V$ y $\vec{v}_2 = P_3 - V$:

$$\cos(\theta) = \frac{\vec{v}_1 \cdot \vec{v}_2}{\|\vec{v}_1\| \|\vec{v}_2\|}$$

$$\theta = \arccos\left(\frac{\vec{v}_1 \cdot \vec{v}_2}{\|\vec{v}_1\| \|\vec{v}_2\|}\right) \times \frac{180}{\pi}$$

### 2.2. Landmarks de MediaPipe Pose
*   **Codo:** [Hombro, Codo, Muñeca]
    *   Izquierda: `[11, 13, 15]`
    *   Derecha: `[12, 14, 16]`
*   **Muñeca:** [Codo, Muñeca, Dedo Índice]
    *   Izquierda: `[13, 15, 19]`
    *   Derecha: `[14, 16, 20]`
*   **Hombro:** [Hombro Contralateral, Hombro Homolateral, Cadera Homolateral]
    *   Izquierda: `[12, 11, 23]`
    *   Derecha: `[11, 12, 24]`
*   **Rodilla:** [Cadera, Rodilla, Tobillo]
    *   Izquierda: `[23, 25, 27]`
    *   Derecha: `[24, 26, 28]`
*   **Cadera:** [Hombro, Cadera, Rodilla]
    *   Izquierda: `[11, 23, 25]`
    *   Derecha: `[12, 24, 26]`
*   **Tobillo:** [Rodilla, Tobillo, Punta del Pie]
    *   Izquierda: `[25, 27, 31]`
    *   Derecha: `[26, 28, 32]`

---

## 💾 3. Integración en UI y Persistencia

*   **Puntos de Medición:** Se incorporarán `RODILLA`, `CADERA` y `TOBILLO` a la constante global `PUNTOS_MEDICION` en `angles.ts`.
*   **Registro Clínico:** Se agregarán los correspondientes botones de selección rápida en `RegistroClinicoForm.tsx` y opciones de visualización en `TrendsView.tsx`.
*   **Gráficos:** El panel longitudinal mostrará la evolución del ROM articular a lo largo del tiempo, facilitando la comparación de los efectos de tratamientos clínicos contra la espasticidad.

---

## 🧪 4. Criterios de Aceptación y Pruebas (Gherkin)

### 4.1. Medición Bilateral de Tren Inferior
*   **Dado** que el motor de MediaPipe Pose está activo.
*   **Cuando** el paciente realiza una flexión de rodilla frente a la cámara.
*   **Entonces** el sistema calcula el ángulo 3D usando los landmarks de Cadera, Rodilla y Tobillo de forma bilateral.

### 4.2. Gráfico Longitudinal de Espasticidad
*   **Dado** que el médico selecciona una articulación (ej. Rodilla) y un lado (ej. Izquierda).
*   **Cuando** accede al panel de tendencias.
*   **Entonces** el sistema grafica las curvas de ROM pre y post tratamiento, permitiendo valorar la evolución de la rigidez/espasticidad muscular.

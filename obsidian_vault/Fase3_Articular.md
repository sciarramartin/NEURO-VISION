# Análisis Articular: Rangos Bilaterales de Flexión/Extensión

Esta nota documenta la especificación e implementación de la **Fase 3: Análisis Articular** en el Segundo Cerebro.

## 📐 Articulaciones y Fórmulas
- **Cálculo de Ángulo 3D:** Se utiliza el producto escalar de los vectores que unen la articulación vértice con los dos extremos.
- **Definiciones de Puntos (MediaPipe Pose):**
  - **Codo:** `[Hombro, Codo, Muñeca]`
  - **Muñeca:** `[Codo, Muñeca, Dedo Índice]`
  - **Hombro:** `[Hombro Contra, Hombro Homo, Cadera Homo]`
  - **Rodilla:** `[Cadera, Rodilla, Tobillo]`
  - **Cadera:** `[Hombro, Cadera, Rodilla]`
  - **Tobillo:** `[Rodilla, Tobillo, Punta del Pie]`

## 📄 Criterios de Aceptación
- **KAN-39:** Medir en tiempo real hombros, codos y muñecas.
- **KAN-40:** Medir caderas, rodillas y tobillos.
- **KAN-41:** Comparativa longitudinal de ROM pre y post-intervención para valorar espasticidad.

---

## 🔗 Nodos Relacionados
*   [[Inicio]]: Volver al panel principal.
*   [[Algoritmos_Analisis]]: Biblioteca matemática.
*   [[Fase2_Marcha]]: Análisis de la Marcha.

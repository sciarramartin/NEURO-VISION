# Análisis de la Marcha: Zancada y Deltas HNT

Esta nota documenta la especificación e implementación de la **Fase 2: Análisis de la Marcha** en el Segundo Cerebro.

## 📐 Algoritmos Matemáticos
- **Amplitud en Píxeles:** Se calcula como la distancia horizontal absoluta entre los talones izquierdo y derecho:
  $$d = |X_{\text{talón\_izq}} - X_{\text{talón\_der}}|$$
- **Calibración a Centímetros:** Basado en la relación entre la altura real del paciente ($H_{\text{cm}}$) y su altura en píxeles ($H_{\text{px}}$) medida desde la nariz hasta la base del tobillo.
- **Delta Comparativo (HNT):**
  $$\Delta\% = \frac{\text{Amplitud}_{\text{POST}} - \text{Amplitud}_{\text{PRE}}}{\text{Amplitud}_{\text{PRE}}} \times 100$$

## 📄 Criterios de Aceptación
- **KAN-13:** Estimar la zancada lateral en centímetros.
- **KAN-14:** Comparar longitudinalmente las amplitudes de paso y calcular el delta de mejora post-punción lumbar.

---

## 🔗 Nodos Relacionados
*   [[Inicio]]: Volver al panel principal.
*   [[Algoritmos_Analisis]]: Biblioteca matemática detallada.
*   [[Fase1_Facial]]: Motor Facial Clínico.

# Motor Facial Clínico: ROM y Comparativa PRE/POST

Esta nota documenta la especificación e implementación de la **Fase 1: Motor Facial Clínico** en el Segundo Cerebro.

## 📐 Algoritmos Matemáticos
- **Cálculo de Ángulo 3D:** Se proyecta el vector tridimensional de landmarks de MediaPipe para obtener la flexoextensión angular.
- **Índice de Asimetría Bilateral:**
  $$\text{Asimetria} = \frac{|\text{ROM}_{\text{izq}} - \text{ROM}_{\text{der}}|}{\max(\text{ROM}_{\text{izq}}, \text{ROM}_{\text{der}})} \times 100$$
- **Delta de Eficacia (PRE/POST L-Dopa):**
  $$\Delta\% = \frac{\text{ROM}_{\text{POST}} - \text{ROM}_{\text{PRE}}}{\text{ROM}_{\text{PRE}}} \times 100$$

## 📄 Criterios de Aceptación
- **KAN-11:** Se debe poder visualizar el HUD interactivo con índices bilaterales y calcular el Rango de Movimiento (ROM).
- **KAN-12:** Comparar curvas PRE (Medicamento Previo) vs POST (Medicamento Posterior) superpuestas en el visualizador.

---

## 🔗 Nodos Relacionados
*   [[Inicio]]: Volver al panel principal.
*   [[Algoritmos_Analisis]]: Biblioteca matemática detallada.
*   [[Constitucion]]: Reglas y principios de desarrollo.

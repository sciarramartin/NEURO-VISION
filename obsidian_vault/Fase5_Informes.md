# Exportación y Reportes Clínicos

Esta nota documenta la especificación e implementación de la **Fase 5: Exportación e Informes** en el Segundo Cerebro.

## 📐 Lógica del Generador
- **jsPDF e xlsx:** Se utilizan estas bibliotecas cliente para compilar los reportes de manera autónoma y segura en el navegador sin dependencias ni APIs externas de IA.
- **Formateo Dinámico:**
  - *Facial/Articular:* Grados (`°`) y velocidades angulares (`°/s`).
  - *Marcha:* Centímetros (`cm`) de paso y zancada.
  - *Temblor:* Frecuencia dominante (Hz), aceleración RMS (`m/s²`) y parámetros DBS parsed.

## 📄 Criterios de Aceptación
- **KAN-45:** Descarga en Excel multihoja con la serie temporal limpia de metadatos.
- **KAN-46:** Gráficos de tendencias evolutivas por región.
- **KAN-47:** Reporte PDF estructurado y clínico descargable de forma instantánea.

---

## 🔗 Nodos Relacionados
*   [[Inicio]]: Volver al panel principal.
*   [[Algoritmos_Analisis]]: Módulo matemático.
*   [[Fase4_Temblor]]: Temblor e integración DBS.

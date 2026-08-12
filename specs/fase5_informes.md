# Especificación Técnica: Exportación e Informes Clínicos (Fase 5)

Esta especificación detalla el diseño e implementación del módulo de exportación de datos crudos (Excel) y generación de reportes clínicos estructurados (PDF) adaptándose dinámicamente a las diferentes regiones del sistema (Facial, Marcha, Articular y Temblor con DBS).

---

## 🎯 1. Requerimientos Clínicos y de Negocio

1.  **Exportación a Excel (`KAN-45`):** Exportar los resúmenes clínicos de las sesiones y la serie temporal cruda de coordenadas/ángulos en un archivo `.xlsx` multihoja.
2.  **Visualización Gráfica Longitudinal (`KAN-46`):** Renderizar paneles y gráficos longitudinales que comparen visualmente el estado del paciente a lo largo del tiempo.
3.  **Generación de Informes Clínicos (`KAN-47`):** Permitir al clínico descargar un informe estructurado en PDF con todas las métricas objetivas del paciente (ROM, asimetría, marcha, temblor y DBS).

---

## 📐 2. Lógica de Formateo y Estructura del Reporte

El generador de PDF (`exportarPDF`) y Excel (`exportarExcel`) adapta dinámicamente las unidades y métricas según la región de la sesión:
*   **Regiones Angulares (CEJA, BOCA, PARPADO, CODO, etc.):** Muestra los ángulos en grados (`°`), el Rango de Movimiento (ROM), la velocidad angular máxima (`°/s`) y la frecuencia del temblor con su amplitud.
*   **Marcha (MARCHA):** Muestra el promedio de paso en centímetros (`cm`), la zancada máxima (`cm`) y el paso mínimo (`cm`).
*   **Temblor (TEMBLOR):** Muestra la frecuencia dominante del temblor en Hz, la amplitud RMS de la aceleración dinámica en `m/s²`, y los parámetros del DBS asociados (Voltaje V, Frecuencia Hz).

---

## 📄 3. Criterios de Aceptación (Gherkin)

### 3.1. Reporte Clínico en PDF Completo
*   **Dado** que el médico tiene sesiones registradas de Marcha y Temblor para un paciente.
*   **Cuando** presiona el botón "Exportar PDF" en el panel de tendencias.
*   **Entonces** el sistema genera un reporte PDF profesional que detalla las métricas en centímetros (`cm`) para marcha, en `m/s²` para temblor y muestra la configuración del neuroestimulador DBS.

### 3.2. Exportación a Excel Limpia
*   **Dado** que el paciente tiene sesiones registradas con parámetros DBS en `datos_angulos`.
*   **Cuando** presiona el botón "Exportar Excel".
*   **Entonces** el sistema limpia los prefijos de metadata `#DBS:` antes de volcar la serie temporal en las pestañas de coordenadas para evitar corrupción de datos.

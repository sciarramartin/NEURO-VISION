# Base de Conocimiento - Neuro Vision

Bienvenido al baúl de conocimiento de **Neuro Vision**. Este baúl ha sido estructurado en formato Markdown enlazado para que puedas abrirlo interactivamente en **Obsidian** y explorar la arquitectura, algoritmos y documentación del proyecto en forma de grafo.

---

## 🗺️ Mapa de Nodos

### 🏛️ Arquitectura del Sistema (MVC)
*   [[Arquitectura_General]]: Especificación técnica global e integración de base de datos.
*   [[Arquitectura_MVC]]: Resumen de la separación de responsabilidades y flujo del sistema.
*   [[Modelos_Datos]]: Detalle de las entidades de base de datos (`Patient`, `Session`).
*   [[Controladores_Negocio]]: Lógica de validación, orquestación y fallbacks.
*   [[Vistas_Usuario]]: Explicación de los componentes de presentación y pantallas.

### 📐 Módulos Analíticos y Algoritmos
*   [[Algoritmos_Analisis]]: Detalle de los cálculos matemáticos para el análisis de temblores (FFT), ángulos y cinemática facial.
*   [[Fase1_Facial]]: Motor Facial Clínico (ROM, asimetría labial/cejas y PRE/POST L-Dopa).
*   [[Fase2_Marcha]]: Análisis de la Marcha (Zancada lateral, calibración a cm y deltas HNT).
*   [[Fase3_Articular]]: Rangos Articulares Bilaterales (Hombro, codo, muñeca, cadera, rodilla, tobillo y curvas de espasticidad).
*   [[Fase4_Temblor]]: Análisis de Temblor por Acelerometría (FFT con acelerómetros de wearables e integración con parámetros DBS).
*   [[Fase5_Informes]]: Exportación e Informes Clínicos (Generación cliente de PDFs estructurados y Excel multihoja adaptada a cada región).

### 🧩 Componentes del Sistema
*   [[TooltipAyuda]]: Componente de ayuda visual con tooltips informativos.
*   [[Vistas_Usuario]]: Detalle de las vistas y componentes de presentación.

### 📄 Documentación del Repositorio
*   [[Constitucion]]: Constitución técnica, reglas del proyecto y de la IA.
*   [[Backlog_Jira]]: Backlog del tablero Kanban oficial en Jira Cloud (`KAN-4` a `KAN-25`).
*   [[Estructura_Proyecto]]: Ubicación y propósito de cada archivo del proyecto.
*   [[Plan_de_Implementacion]]: Historial del plan de desarrollo aprobado.
*   [[Walkthrough]]: Historial de compilaciones y control de calidad (QA).

---

> [!TIP]
> **Cómo abrir este baúl en Obsidian:**
> 1. Abre la aplicación de Obsidian.
> 2. Haz clic en "Abrir carpeta como baúl" (Open folder as vault).
> 3. Selecciona la carpeta `obsidian_vault` en la raíz de este proyecto.

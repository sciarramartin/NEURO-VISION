# Vistas de Usuario (Views)

La capa de vistas define las interfaces de usuario (UI) en React. Están desacopladas del framework Next.js, facilitando la legibilidad del diseño visual y la interacción.

---

## 🏗️ DashboardView
Ubicación del archivo: [DashboardView.tsx](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/vistas/DashboardView.tsx)
*   **Vistas Clínicas:** Permite buscar y listar pacientes, visualizar estadísticas rápidas (total de pacientes, total de mediciones), y registrar nuevos perfiles.
*   **Heurística de Nielsen (Deshacer/Undo):** Implementa borrado optimista de sesiones clínicas. Al borrar una sesión, muestra un banner "Deshacer" durante 5 segundos antes de impactar el borrado real en la base de datos de producción.
*   **Badge de sesiones:** Los pacientes con 0 sesiones muestran un badge “Sin sesiones” en ámbar (Nielsen #5 Error Prevention); los evaluados muestran el conteo en índigo.
*   **Registros Recientes mejorados:** Cada tarjeta de sesión muestra el badge PRE/POST coloreado separado del nombre del área, y el botón eliminar incluye tooltip "se puede deshacer" (Nielsen #3 User Control).
*   **TooltipAyuda:** Iconos de ayuda en tarjetas de métricas, encabezados de tabla y registros recientes (Nielsen #10 Help & Documentation).
*   **Portal de Paciente:** Muestra las últimas evaluaciones de forma amigable (rango de movimiento, lado facial y temblores detectados).

---

## 📷 CaptureView
Ubicación del archivo: [CaptureView.tsx](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/vistas/CaptureView.tsx)
*   **Diseño Robusto y Simplificado:** Se eliminó el Step Wizard superior y el banner de resumen de configuración actual (anteriormente redundantes) para optimizar el espacio vertical y alinearse con la estética limpia del panel Kanban.
*   **Controles Segmentados (Pills) Premium:** Los selectores de L-DOPA ("PRE/POST"), Lado Facial ("Derecha/Izquierda") y Modo de Ejecución ("Simulado/Cámara Real") se transformaron en interruptores segmentados cohesivos y fluidos con contenedores de fondo adaptativos (`bg-zinc-100 dark:bg-zinc-950`).
*   **Grilla Simétrica de Regiones:** La selección de áreas anatómicas se reestructuró a una grilla balanceada de 3 columnas (3 + 3), con la opción de "Hombro" expandida horizontalmente a ancho completo (`col-span-3`) para un equilibrio visual perfecto.
*   **Estado idle premium de cámara:** Cuando la cámara está apagada, se muestra un placeholder SVG de silueta facial con guías de posicionamiento (iluminación, distancia, encuadre) en lugar de un área negra vacía (Nielsen #1 + #6 Recognition).
*   **Panel Ajuste Fino (Enfoque C) mejorado:** Modo click-sobre-canvas para reasignar P1/Vértice/P3 manualmente, con fuentes de tamaño aumentado para mejor legibilidad. Hit-test en [[Algoritmos_Analisis|angles.ts]].
*   **HUD de tracking (M5):** Badge en tiempo real sobre el canvas (🟢/🟡/🔴) indicando calidad del tracking.
*   **TooltipAyuda robusto:** Todos los campos del Registro Clínico y las métricas de resultados tienen iconos de ayuda de tamaño aumentado (18px) con explicaciones clínicas más grandes al hover (Nielsen #10).
*   **Tarjetas Modulares de Resultados:** Cada métrica de resultados clínicos se encapsuló en un contenedor individual moderno (`bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-150/40 dark:border-zinc-800/50`) con colores reactivos de alto contraste (`text-zinc-800 dark:text-zinc-200`) garantizando legibilidad en ambos temas (Nielsen #1).

---

## 📈 TrendsView
Ubicación del archivo: [TrendsView.tsx](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/vistas/TrendsView.tsx)
*   **Evolución Longitudinal:** Grafica la evolución en el tiempo del Rango de Movimiento (ROM), la velocidad y la intensidad del temblor, dividiendo las curvas por estado farmacológico (**PRE** vs **POST** L-Dopa).
*   **Exportación de Reportes:** Permite exportar informes completos en formato **PDF** y **Excel** de manera profesional.

---

## 🔗 Nodos Relacionados
*   [[Inicio]]: Volver al panel principal.
*   [[Arquitectura_MVC]]: Arquitectura MVC.

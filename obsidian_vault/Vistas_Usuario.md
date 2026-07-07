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
*   **Step Wizard (3 pasos):** Barra de progreso visual (Configurar Sesión → Activar Cámara → Grabar y Guardar) que refleja el estado actual del flujo reactivamente (Nielsen #1 Visibility of System Status). Cada paso se colorea en esmeralda cuando se completa, en índigo cuando está activo.
*   **Estado idle premium de cámara:** Cuando la cámara está apagada, se muestra un placeholder SVG de silueta facial con guías de posicionamiento (iluminación, distancia, encuadre) en lugar de un área negra vacía (Nielsen #1 + #6 Recognition).
*   **Resumen pre-grabación:** Cuando la cámara está activa pero no grabando, se muestra una barra de confirmación con la configuración actual: Paciente, PRE/POST, Región/Lado, y si hay puntos personalizados activos. Previene grabaciones con configuración incorrecta (Nielsen #6 Recognition rather than recall).
*   **Botones de región M1:** Grilla de 7 botones visuales con íconos por región anatómica (reemplazan el dropdown).
*   **Panel Ajuste Fino (Enfoque C):** Modo click-sobre-canvas para reasignar P1/Vértice/P3 manualmente. Hit-test en [[Algoritmos_Analisis|angles.ts]].
*   **HUD de tracking (M5):** Badge en tiempo real sobre el canvas (🟢/🟡/🔴) indicando calidad del tracking.
*   **TooltipAyuda:** Todos los campos del Registro Clínico y las métricas de resultados tienen iconos de ayuda con explicación clínica (Nielsen #10).

---

## 📈 TrendsView
Ubicación del archivo: [TrendsView.tsx](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/vistas/TrendsView.tsx)
*   **Evolución Longitudinal:** Grafica la evolución en el tiempo del Rango de Movimiento (ROM), la velocidad y la intensidad del temblor, dividiendo las curvas por estado farmacológico (**PRE** vs **POST** L-Dopa).
*   **Exportación de Reportes:** Permite exportar informes completos en formato **PDF** y **Excel** de manera profesional.

---

## 🔗 Nodos Relacionados
*   [[Inicio]]: Volver al panel principal.
*   [[Arquitectura_MVC]]: Arquitectura MVC.

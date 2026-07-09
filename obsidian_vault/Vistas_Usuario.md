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
*   **Reestructuración y Desacoplamiento Modular:** Se eliminó el código espagueti de `CaptureView` y `WebcamCapture` dividiéndolos en subcomponentes atómicos de presentación:
    - [RegistroClinicoForm.tsx](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/vistas/componentes/RegistroClinicoForm.tsx) (Perfil clínico y selectores).
    - [ResultadosCard.tsx](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/vistas/componentes/ResultadosCard.tsx) (Grilla tabular con columna de Valores Normales).
    - [NuevoPacienteModal.tsx](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/vistas/componentes/NuevoPacienteModal.tsx) (Diálogo modal simplificado).
*   **Separación de Lógica en Hooks Reactivos (ViewModels):**
    - [useRecordingState.ts](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/vistas/hooks/useRecordingState.ts) (Ciclo de vida de la grabación y cronómetro).
    - [useCaptureData.ts](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/vistas/hooks/useCaptureData.ts) (Acceso a endpoints y persistencia de base de datos).
    - [useMediaPipe.ts](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/componentes_visuales/hooks/useMediaPipe.ts) (Ciclo de la cámara web, hit-testing y MediaPipe).
*   **Pintado 2D Desacoplado (Strategy/Adapter):** Se extrajo todo el pintado en canvas a [canvasDraw.ts](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/biblioteca/rendering/canvasDraw.ts), aislando las funciones puras de trazado de ángulos, skeleton y landmarks.
*   **Valores de Referencia Fisiológicos (Comparación Directa):** La tabla de resultados incorpora una nueva columna dedicada para "Valor de Referencia (Normal)", permitiendo contrastar el ROM, la velocidad y temblores del paciente de manera inmediata.
*   **Resolución de Dimensiones de Cámara Real:** Se solucionó el bug del elemento `<video>` en `WebcamCapture` fijando un estilo off-screen absoluto de `640x480` de resolución lógica. Esto previene que Chrome detenga el buffer de decodificación y garantiza mediciones consistentes en producción.
*   **Ergonomía, Márgenes y Paddings (Anti-Text-to-Border):** Todos los contenedores de tarjetas, botones y celdas tabulares aplican espaciados ergonómicos amplios. Ningún texto o control físico rosa los bordes de su contenedor.
*   **Diseño Responsivo Móvil:** La disposición de las cámaras se amplió en pantallas anchas para llenar el espacio de trabajo disponible, reorganizándose de manera fluida en una única columna adaptable para teléfonos inteligentes.
*   **Patrones de Diseño Implementados:** Se aplicaron de forma rigurosa 10 patrones de ingeniería (MVC, Container-Presenter, Repository, Strategy, Factory, Facade, Singleton, Adapter, Observer y Composite), detallados en la skill [[system-architecture-patterns]].

---

## 📈 TrendsView
Ubicación del archivo: [TrendsView.tsx](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/vistas/TrendsView.tsx)
*   **Evolución Longitudinal:** Grafica la evolución en el tiempo del Rango de Movimiento (ROM), la velocidad y la intensidad del temblor, dividiendo las curvas por estado farmacológico (**PRE** vs **POST** L-Dopa).
*   **Exportación de Reportes:** Permite exportar informes completos en formato **PDF** y **Excel** de manera profesional.

---

---

### ⚙️ TooltipAyuda — Sistema de Ayuda Interactiva

El componente [[TooltipAyuda]] proporciona tooltips informativos con ícono `?` en toda la interfaz. Se encuentra en 5 vistas del sistema con más de **30 usos totales** para guiar al evaluador clínico.

**Correcciones aplicadas (Julio 2026):**
1. Se implementó el uso real de la prop `posicion` para anclar tooltips en dirección fija.
2. Se reemplazaron 4 íconos `HelpCircle` decorativos en `RegistroClinicoForm` por `TooltipAyuda` funcionales.
3. Se agregaron 11 nuevos tooltips en `TrendsView` (que no tenía ninguno).
4. Se agregaron tooltips en controles de `CaptureView` (zoom, ajuste fino, modo ejecución).
5. Se agregaron tooltips adicionales en `DashboardView` (listado de pacientes, portal, formularios).

---

## 🔗 Nodos Relacionados
*   [[Inicio]]: Volver al panel principal.
*   [[Arquitectura_MVC]]: Arquitectura MVC.
*   [[TooltipAyuda]]: Componente de ayuda visual del sistema.

# Vistas de Usuario (Views)

La capa de vistas define las interfaces de usuario (UI) en React. Están desacopladas del framework Next.js, facilitando la legibilidad del diseño visual y la interacción.

---

## 🏛️ DashboardView
Ubicación del archivo: [DashboardView.tsx](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/vistas/DashboardView.tsx)
*   **Vistas Clínicas:** Permite buscar y listar pacientes, visualizar estadísticas rápidas (total de pacientes, total de mediciones), y registrar nuevos perfiles.
*   **Heurística de Nielsen (Deshacer/Undo):** Implementa borrado optimista de sesiones clínicas. Al borrar una sesión, muestra un banner "Deshacer" durante 5 segundos antes de impactar el borrado real en la base de datos de producción, mitigando errores del usuario.
*   **Portal de Paciente:** Muestra las últimas evaluaciones de forma amigable (rango de movimiento, lado facial y temblores detectados).

---

## 📷 CaptureView
Ubicación del archivo: [CaptureView.tsx](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/vistas/CaptureView.tsx)
*   **Control del Sensor de Cámara:** Enlaza dinámicamente con `<WebcamCapture />` para inicializar sensores.
*   **Modo Simulado / Real:** Permite a los evaluadores conmutar entre un flujo simulado pregrabado (para entornos de pruebas rápidas sin cámara) y el modelo de Visión de Computadora real que rastrea landmarks faciales.
*   **Resultados Clínicos:** Expone un HUD analítico que muestra instantáneamente los resultados de amplitud, velocidad y frecuencia del temblor al finalizar la grabación, con opciones para guardar o descartar.

---

## 📈 TrendsView
Ubicación del archivo: [TrendsView.tsx](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/vistas/TrendsView.tsx)
*   **Evolución Longitudinal:** Grafica la evolución en el tiempo del Rango de Movimiento (ROM), la velocidad y la intensidad del temblor, dividiendo las curvas por estado farmacológico (**PRE** vs **POST** L-Dopa).
*   **Exportación de Reportes:** Permite exportar informes completos en formato **PDF** y **Excel** de manera profesional.

---

## 🔗 Nodos Relacionados
*   [[Inicio]]: Volver al panel principal.
*   [[Arquitectura_MVC]]: Arquitectura MVC.

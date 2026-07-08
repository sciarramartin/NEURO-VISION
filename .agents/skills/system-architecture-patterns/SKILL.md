---
name: system-architecture-patterns
description: Guía y catálogo oficial de patrones de diseño de software y arquitectura implementados en el sistema de Neuro Vision.
---

# Patrones de Diseño y Arquitectura en Neuro Vision

Este documento actúa como la referencia autoritativa de ingeniería de software para el espacio de trabajo de Neuro Vision, asegurando que cualquier desarrollo posterior mantenga la integridad conceptual y respete los patrones arquitectónicos implementados en la reestructuración modular.

---

## 1. Patrones Arquitectónicos y Estructurales

### 1.1 Modelo-Vista-Controlador / Modelo-Vista-ViewModel (MVC / MVVM)
* **Propósito:** Separar la lógica de negocio y cálculo cinemático, de la presentación del DOM y los estados reactivos.
* **Implementación:**
  - **Modelos:** Definidos en [angles.ts](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/biblioteca/math/angles.ts) (interfaces de tipo para landmarks, calidad y cálculos cinemáticos puros).
  - **ViewModels / Controladores:** Encapsulados en hooks de React como [useRecordingState.ts](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/vistas/hooks/useRecordingState.ts), [useCaptureData.ts](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/vistas/hooks/useCaptureData.ts) y [useMediaPipe.ts](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/componentes_visuales/hooks/useMediaPipe.ts).
  - **Vistas:** Componentes puramente visuales como [CaptureView.tsx](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/vistas/CaptureView.tsx) y sus subcomponentes atómicos.

### 1.2 Patrón Contenedor-Presentador (Container-Presenter)
* **Propósito:** Desacoplar el renderizado del DOM de los ciclos de actualización del estado clínico.
* **Implementación:** El componente orquestador [CaptureView.tsx](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/vistas/CaptureView.tsx) actúa como contenedor, orquestando el flujo de estados, mientras delega la presentación a los presentadores puros [RegistroClinicoForm.tsx](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/vistas/componentes/RegistroClinicoForm.tsx), [ResultadosCard.tsx](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/vistas/componentes/ResultadosCard.tsx), [NuevoPacienteModal.tsx](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/vistas/componentes/NuevoPacienteModal.tsx) y [WebcamCapture.tsx](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/componentes_visuales/WebcamCapture.tsx).

---

## 2. Patrones de Comportamiento y Acceso a Datos

### 2.1 Patrón Repositorio (Repository Pattern)
* **Propósito:** Abstraer el acceso a la base de datos (Prisma API endpoints) y persistencia, aislando al frontend de cambios en la capa de datos.
* **Implementación:** El hook [useCaptureData.ts](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/vistas/hooks/useCaptureData.ts) implementa métodos unificados como `createPatient` y `saveSession` que manejan de forma transparente la sincronización remota e incorporan un fallback local amortiguado de simulación cuando la base de datos está desconectada.

### 2.2 Patrón Strategy (Estrategias de Captura)
* **Propósito:** Permitir el intercambio dinámico de la fuente de captura de fotogramas sin alterar el render loop ni la lógica de cálculo angular.
* **Implementación:** En el bucle de dibujado de [useMediaPipe.ts](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/componentes_visuales/hooks/useMediaPipe.ts), se bifurca el render loop aplicando dos estrategias:
  - **Simulación (MockProcessor):** Dibuja coordenadas generadas por funciones trigonométricas y armónicos sinusoidales de temblor parkinsoniano mediante [drawMockLandmarks](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/biblioteca/rendering/canvasDraw.ts).
  - **Procesamiento de Cámara (RealWebcamProcessor):** Dibuja la entrada de video y las mallas del hardware utilizando los modelos de detección de MediaPipe WASM.

### 2.3 Patrón Observer (Estados Reactivos Globales)
* **Propósito:** Suscripción reactiva de estados compartidos en tiempo real.
* **Implementación:** Implementado a través de los contextos nativos de React como [ThemeContext.tsx](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/contexto_global/ThemeContext.tsx) para notificar cambios de tema claro/oscuro e invalidar estilos selectivos del DOM.

---

## 3. Patrones de Creación y Adaptación

### 3.1 Patrón Facade (Fachada)
* **Propósito:** Proporcionar una interfaz simplificada para subsistemas complejos (como el hardware de video y la carga del motor WebAssembly de MediaPipe).
* **Implementación:** El hook [useMediaPipe.ts](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%2520NEURO%2520VISION/src/componentes_visuales/hooks/useMediaPipe.ts) actúa como una Fachada, ocultando los cargadores de modelos de tareas de visión y la asignación del elemento `<video>` en el DOM off-screen, exponiendo únicamente métodos simples como `startWebcam`, `stopStreams`, `fps` y los refs de los canvas.

### 3.2 Patrón Factory (Fábrica de Modelos)
* **Propósito:** Instanciar el detector biomecánico adecuado según la anatomía corporal de la medición.
* **Implementación:** En la inicialización asíncrona dentro de [useMediaPipe.ts](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%2520NEURO%2520VISION/src/componentes_visuales/hooks/useMediaPipe.ts), se crea e inyecta dinámicamente un `FaceLandmarker` para regiones de tipo rostro (`CEJA`, `PARPADO`, `BOCA`, `NARIZ`) o un `PoseLandmarker` para regiones corporales (`CODO`, `MUÑECA`, `HOMBRO`).

### 3.3 Patrón Adapter (Adaptador de Coordenadas)
* **Propósito:** Traducir coordenadas espaciales normalizadas de MediaPipe (0.0 a 1.0) en coordenadas del pixelado nativo del Canvas 2D escalado por el zoom.
* **Implementación:** La función pura `getCanvasCoords` en [useMediaPipe.ts](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%2520NEURO%2520VISION/src/componentes_visuales/hooks/useMediaPipe.ts) mapea e invierte los ejes de la cámara (efecto espejo) y aplica transformaciones lineales según el nivel de ampliación activa.

### 3.4 Patrón Singleton (Cliente y Caché de Modelos)
* **Propósito:** Garantizar que los pesos del modelo de MediaPipe WASM se carguen una única vez en memoria para evitar fugas de GPU.
* **Implementación:** El archivo de conexión Prisma (`src/lib/prisma.ts`) e inicializadores globales conservan referencias estáticas unificadas.

---

## 🛠️ Reglas de Oro para Desarrolladores y Agentes

1. **Mantener Separación de Capas:** No incluir llamadas HTTP directas (`fetch`) ni lógica de inicialización de la webcam dentro de los componentes de presentación visual (`RegistroClinicoForm.tsx` o `ResultadosCard.tsx`).
2. **Uso de Librería de Dibujo Desacoplada:** Toda lógica de pintado 2D debe residir en [canvasDraw.ts](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/biblioteca/rendering/canvasDraw.ts) como funciones puras y sin efectos secundarios sobre el renderizado de React.
3. **Cámara Off-screen Ininterrumpida:** Mantener el elemento `<video>` en WebcamCapture con dimensiones lógicas estáticas a `640x480` y fuera de pantalla (`-left-[9999px]`) para evitar la congelación de texturas en entornos de producción (Vercel).

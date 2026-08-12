# Constitución del Proyecto: Neuro Vision

Esta Constitución define las pautas fundamentales de diseño de producto, estándares de arquitectura técnica y reglas éticas y operativas que rigen el desarrollo de **Neuro Vision**. Tanto los programadores humanos como los agentes de Inteligencia Artificial deben respetar y hacer cumplir esta Constitución sin excepciones.

---

## 🎯 1. Filosofía de Producto (Product Thinking)

*   **El Problema Real:** El diagnóstico y seguimiento de la enfermedad de Parkinson, espasticidad y otras condiciones neurológicas carece hoy en día de métricas cuantitativas portátiles y objetivas de bajo costo en consultorios médicos.
*   **La Solución:** Una aplicación web clínica que extrae métricas biomecánicas en tiempo real (ROM facial, amplitud del paso, rangos de movimiento articular, cuantificación del temblor por FFT) usando cámaras estándar (webcam) y sensores inerciales de dispositivos móviles cotidianos.
*   **Usuarios Clave:**
    *   **Neurólogo/Especialista:** Necesita precisión matemática, comparativas longitudinales PRE/POST fármaco, y visualización clara para ajustar tratamientos (ej. Levodopa, DBS).
    *   **Kinesiólogo/Fisiatra:** Evalúa la espasticidad, zancada y rango de flexoextensión articular para pautar rehabilitación.
    *   **Bioingeniero/Investigador:** Requiere exportar series de tiempo crudas frame a frame en Excel.
*   **Límites del Producto:**
    *   **No es un dispositivo médico certificado:** Es una herramienta de soporte analítico de apoyo.
    *   **Tolerancia a ruido:** Debe detectar y alertar cuando las condiciones lumínicas o la visibilidad de landmarks degraden la calidad del tracking clínico.

---

## 🏛️ 2. Arquitectura de Software (MVC en Español)

La base del código sigue estrictamente el patrón **Modelo-Vista-Controlador (MVC)**, con nombres de directorios completamente traducidos al español para maximizar su legibilidad:

1.  **Modelos (`src/modelos/`):** Definen la estructura formal de los datos clínicos e interactúan con la capa de persistencia (ej. `Patient.ts`, `Session.ts`).
2.  **Vistas (`src/vistas/`):** Componentes visuales y pantallas completas de presentación (`DashboardView.tsx`, `CaptureView.tsx`, `TrendsView.tsx`). No contienen lógica compleja de negocio o de base de datos directa.
3.  **Controladores (`src/controladores/`):** Orquestan el flujo de datos, validaciones y orquestación de llamadas API (`PatientController.ts`, `SessionController.ts`).
4.  **Biblioteca (`src/biblioteca/`):** Contiene la lógica analítica reutilizable, utilidades de persistencia (`db.ts`, `prisma.ts`) y módulos matemáticos (`math/`).

---

## 💾 3. Persistencia y Base de Datos (Offline-First)

*   **Modo Local (Offline):** El sistema debe funcionar en un entorno de consultorio sin internet persistente, utilizando una base de datos **SQLite local** (`base_de_datos/parkinson.db`).
*   **Modo Producción (Cloud):** Cuando se detecte conexión en entornos Vercel, se conectará de forma transparente a **Neon PostgreSQL** o **Supabase** usando variables de entorno.
*   **ORM de Acceso:** Se utiliza **Prisma ORM** como el puente de base de datos unificado.

---

## 🎨 4. Estándares de Diseño y UI Premium

Para asegurar una experiencia excepcional y profesional que inspire confianza médica:

*   **Estética:** Diseño premium, moderno y dinámico (estilo Dark Mode / Glassmorphism de alta gama).
*   **Tipografía:** Utilizar Google Fonts (**Inter** u **Outfit**) para textos y visualizaciones de datos, evitando fuentes genéricas del navegador.
*   **Gama de Colores:** Queda prohibido usar colores básicos planos (como rojo puro, azul puro). Se utilizará una paleta HSL curada:
    *   *Fondo:* HSL oscuro suave (`220 25% 10%`).
    *   *Acentos clínicos:* Cian/Esmeralda suave para estados saludables, Coral/Ámbar para alertas o PRE-medicación.
*   **Interacciones:** Hover suave, transiciones fluidas de 200ms en los botones e interactividad en gráficos.
*   **Sin placeholders vacíos:** Cualquier elemento visual de prueba debe renderizar datos simulados de alta calidad clínica o imágenes generadas profesionalmente.

---

## 📐 5. Reglas de Calidad y Desarrollo de IA

*   **Paso 1: Especificar antes de Codificar (SDD):** Nunca se modificará código sin que exista una especificación técnica de la funcionalidad en `specs/` validada previamente.
*   **Paso 2: Código Limpio y Tipado Duro:** TypeScript estricto. Todas las variables y parámetros del motor matemático deben contar con sus respectivos tipos (evitar el uso de `any` a menos que sea estrictamente necesario).
*   **Paso 3: Preservación de Comentarios:** Respetar los comentarios existentes y docstrings que no afecten los cambios de código.
*   **Paso 4: Verificación Continua:** Ejecutar compilaciones (`npm run build`) para verificar la resolución de importaciones e integridad del enrutador de Next.js.

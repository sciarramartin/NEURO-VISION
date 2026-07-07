# Plan de Implementación: Traducción y Reorganización de Carpetas (Español Amigable)

Este plan propone renombrar los directorios y archivos personalizados a términos en español más intuitivos y legibles para personas que no entienden de desarrollo de software, conservando la compatibilidad de compilación exigida por el framework Next.js para su correcto despliegue en **Vercel**.

---

## 1. Reglas de Compatibilidad Obligatoria de Next.js

Para que la aplicación continúe funcionando y compilando en **Vercel**, existen archivos y carpetas técnicas que **no pueden ser renombrados bajo ninguna circunstancia** (son palabras clave del compilador):

*   `src/app/`: Carpeta del enrutador de la aplicación.
*   `page.tsx`: Nombre de archivo requerido por Next.js para representar una página visual.
*   `layout.tsx`: Nombre de archivo requerido para definir el diseño o plantilla base.
*   `route.ts`: Nombre de archivo requerido para definir un endpoint o conexión de API.
*   Archivos de configuración de raíz (`package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `next-env.d.ts`).

---

## 2. Propuesta de Renombrado de Carpetas

Renombraremos los directorios de código personalizado a nombres autoexplicativos en español:

| Directorio Actual | Nuevo Directorio Propuesto | Propósito / Legibilidad Amigable |
| :--- | :--- | :--- |
| `src/views/` | `src/vistas/` | Contiene los diseños visuales de las pantallas (Dashboard, Captura, Tendencias). |
| `src/controllers/` | `src/controladores/` | Contiene la lógica que procesa y controla las peticiones de datos. |
| `src/models/` | `src/modelos/` | Contiene la definición formal de los datos de Pacientes y Sesiones. |
| `src/components/` | `src/componentes_visuales/` | Bloques visuales individuales y reutilizables (Cámara, Gráficos). |
| `src/lib/` | `src/biblioteca/` | Funciones de soporte técnico, cálculos de ángulos y matemáticas. |
| `src/context/` | `src/contexto_global/` | Estado y configuraciones de sesión compartidas por toda la aplicación. |
| `tools/` | `herramientas/` | Utilidades y scripts que se ejecutan fuera de la web (Python, tests). |
| `database/` | `base_de_datos/` | Almacenamiento físico de la base de datos y scripts SQL. |
| `temp/` | `temporales/` | Archivo de descargas y zips temporales. |

---

## 3. Actualización de Alias en TypeScript (`tsconfig.json`)

Para que el compilador entienda las nuevas ubicaciones, actualizaremos los alias de importación en `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/vistas/*": ["./src/vistas/*"],
      "@/controladores/*": ["./src/controladores/*"],
      "@/modelos/*": ["./src/modelos/*"],
      "@/componentes_visuales/*": ["./src/componentes_visuales/*"],
      "@/biblioteca/*": ["./src/biblioteca/*"],
      "@/contexto_global/*": ["./src/contexto_global/*"]
    }
  }
}
```

---

## 4. Plan de Verificación

*   **Compilación y Typechecking:** Ejecutar `npm run build` localmente para asegurar que todas las referencias e importaciones de TypeScript apunten a los nuevos directorios en español y no existan errores de compilación.

---

## 🔗 Nodos Relacionados
*   [[Inicio]]: Volver al panel principal.
*   [[Walkthrough]]: Historial de verificación.

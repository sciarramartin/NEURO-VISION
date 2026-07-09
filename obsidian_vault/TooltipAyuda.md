# TooltipAyuda — Componente de Ayuda Visual

El componente `TooltipAyuda` es un ícono de signo de interrogación (`HelpCircle` de lucide-react) que despliega un tooltip informativo al hacer hover o focus. Implementa el principio de usabilidad **#10 (Help & Documentation)** de Nielsen.

Ubicación: [TooltipAyuda.tsx](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/componentes_visuales/TooltipAyuda.tsx)

---

## 📐 Interfaz del Componente

| Prop | Tipo | Default | Descripción |
| :--- | :--- | :--- | :--- |
| `texto` | `string \| React.ReactNode` | — | Contenido del tooltip informativo |
| `posicion` | `'top' \| 'bottom' \| 'left' \| 'right'` | `undefined` | Dirección de anclaje relativa al ícono |
| `iconoSize` | `number` | `14` | Tamaño del ícono en píxeles |
| `className` | `string` | `''` | Clases CSS adicionales |

---

## 🧠 Comportamiento

- **Mouse:** Se muestra al hacer hover sobre el ícono y sigue el cursor si no se especifica `posicion`.
- **Teclado:** Accesible vía `focusin`/`focusout` con `tabIndex={0}`, `role="button"` y `aria-label="Más información"`.
- **Posicionamiento fijo:** Si se especifica `posicion`, el tooltip se ancla en esa dirección relativa al contenedor del ícono (ej. `top` aparece arriba, `right` a la derecha). Se recalcula automáticamente en scroll y resize.
- **Renderizado:** Usa `createPortal` a `document.body` para evitar desbordamiento de contenedores padres.
- **Estilo:** Ancho fijo de 256px, animación `fadeIn` (0.12s), sombra flotante.

---

## 🔧 Correcciones Realizadas (Julio 2026)

### Problema Original
La prop `posicion` estaba declarada en la interfaz pero **nunca se utilizaba** en la lógica de renderizado. Todos los tooltips seguían la posición del mouse independientemente del valor de `posicion`.

### Solución
Se implementó un sistema de posicionamiento dual:
- **Sin `posicion`**: Comportamiento heredado — el tooltip sigue la posición del mouse.
- **Con `posicion`**: El tooltip se ancla en la dirección indicada relativa al contenedor del ícono, usando `getBoundingClientRect()` y recalculando en eventos de scroll/resize.

---

## 📍 Uso en el Sistema

| Vista / Componente | Cantidad de usos | Propósito |
| :--- | :--- | :--- |
| [[Vistas_Usuario\|DashboardView]] | 6 | Navegación del listado de pacientes, portal del paciente |
| [[Vistas_Usuario\|CaptureView]] | 4 | Zoom, ajuste fino de landmarks, modo selección, modo ejecución |
| [[Vistas_Usuario\|RegistroClinicoForm]] | 5 | Campos del formulario clínico (reemplaza `HelpCircle` estáticos) |
| [[Vistas_Usuario\|ResultadosCard]] | 6 | Explicación de cada métrica clínica en la tabla de resultados |
| [[Vistas_Usuario\|TrendsView]] | 11 | Parámetros del gráfico, estadísticas comparativas, métricas clínicas |

---

## 🔗 Nodos Relacionados
- [[Inicio]]: Volver al panel principal.
- [[Vistas_Usuario]]: Vistas que consumen el componente.
- [[Estructura_Proyecto]]: Ubicación en el árbol del proyecto.

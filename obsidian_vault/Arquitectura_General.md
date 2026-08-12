# Arquitectura General del Sistema: Neuro Vision

Esta nota describe la **Arquitectura General del Sistema** como el nodo central técnico en el Segundo Cerebro.

La arquitectura de Neuro Vision se basa en un enfoque modular y robusto de desarrollo guiado por especificaciones (SDD):
- **Framework Principal:** Next.js v16 (App Router).
- **Procesamiento Facial:** MediaPipe en el navegador del cliente para cálculo en tiempo real sin latencias de servidor.
- **Base de Datos Unificada:** Prisma ORM, con un cliente local SQLite (`database/parkinson.db`) y conectores listos para PostgreSQL/Supabase en producción en Vercel.
- **Algoritmos y Matemáticas:** Localizados en `src/biblioteca/math/` para cálculos vectoriales de ángulos, Rango de Movimiento (ROM) y análisis espectral por FFT.

---

## 🔗 Nodos Relacionados
*   [[Inicio]]: Volver al panel principal.
*   [[Arquitectura_MVC]]: Resumen del patrón de diseño MVC aplicado.
*   [[Estructura_Proyecto]]: Ubicación de archivos físicos.

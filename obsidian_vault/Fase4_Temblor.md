# Análisis de Temblor por Acelerometría (FFT) y DBS

Esta nota documenta la especificación e implementación de la **Fase 4: Análisis de Temblor e Integración DBS** en el Segundo Cerebro.

## 📐 Algoritmo FFT
- **Aceleración Dinámica:**
  $$a_{\text{din}}(t) = \|a(t)\| - \mu_{\text{magnitud}}$$
- **Espectro de Potencia:** Se aplica la Transformada Rápida de Fourier (FFT) sobre la señal dinámica:
  $$P(f) = |FFT(a_{\text{din}})|^2$$
- **Frecuencia Dominante (Parkinson):** Rango clásico de reposo:
  $$f_{\text{dom}} \in [3.5, 6.5]\text{ Hz}$$
- **Amplitud RMS:** Cuantificación física del temblor.

## 📄 Criterios de Aceptación
- **KAN-42:** Capturar datos tridimensionales de aceleración desde el acelerómetro.
- **KAN-43:** Calcular espectros FFT para determinar frecuencia dominante y amplitud.
- **KAN-44:** Registrar y almacenar los parámetros de Estimulación Cerebral Profunda (DBS) asociados.

---

## 🔗 Nodos Relacionados
*   [[Inicio]]: Volver al panel principal.
*   [[Algoritmos_Analisis]]: Biblioteca matemática y FFT.
*   [[Fase3_Articular]]: Rangos Articulares Bilaterales.

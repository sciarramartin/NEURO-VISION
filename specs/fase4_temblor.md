# Especificación Técnica: Análisis de Temblor por Acelerometría (Fase 4)

Esta especificación detalla el diseño e implementación del análisis objetivo de temblor parkinsoniano utilizando acelerómetros inerciales (de wearables) y procesamiento de señales por FFT, junto con la correlación de severidad frente a parámetros de Estimulación Cerebral Profunda (DBS).

---

## 🎯 1. Requerimientos Clínicos y de Negocio

1.  **Captura de Datos Inerciales (`KAN-42`):** Escuchar e integrar el flujo de datos del acelerómetro tridimensional (ejes X, Y, Z) en tiempo real desde un sensor móvil o reloj inteligente (wearable).
2.  **Algoritmo de FFT y Cuantificación (`KAN-43`):** Procesar la serie temporal de aceleración mediante la Transformada Rápida de Fourier (FFT) para identificar la frecuencia dominante (en Hz) y la amplitud del temblor clínico.
3.  **Registro de Parámetros DBS (`KAN-44`):** Permitir registrar y asociar los parámetros activos del DBS del paciente (Voltaje en V, Frecuencia en Hz, Ancho de Pulso en $\mu$s) a la sesión de medición de temblor para correlacionar la respuesta clínica.

---

## 📐 2. Fórmulas Matemáticas y Algoritmos

### 2.1. Vector de Aceleración y Remoción de Gravedad
Dado el flujo de aceleración tridimensional $a(t) = [a_x(t), a_y(t), a_z(t)]$, se calcula la magnitud total de la aceleración:

$$\|a(t)\| = \sqrt{a_x(t)^2 + a_y(t)^2 + a_z(t)^2}$$

Para remover la componente de gravedad (aceleración estática), se calcula la aceleración dinámica centrando la señal (restando la media):

$$a_{\text{din}}(t) = \|a(t)\| - \mu_{\text{magnitud}}$$

### 2.2. Transformada Rápida de Fourier (FFT) y Frecuencia Dominante
Se aplica la FFT sobre la señal filtrada $a_{\text{din}}(t)$ para obtener los coeficientes en el dominio de la frecuencia $A(f) = \text{FFT}(a_{\text{din}}(t))$. El espectro de potencia es:

$$P(f) = |A(f)|^2$$

La frecuencia dominante del temblor $f_{\text{dom}}$ es aquella con mayor potencia dentro del rango clínico del Parkinson ($3.0\text{ Hz}$ a $7.0\text{ Hz}$):

$$f_{\text{dom}} = \arg\max_{f \in [3.0, 7.0]} P(f)$$

### 2.3. Amplitud del Temblor
La amplitud se estima mediante el valor eficaz (RMS) de la aceleración dinámica en el espectro:

$$\text{Amplitud}_{\text{temblor}} = \sqrt{\frac{1}{N} \sum_{i=1}^{N} a_{\text{din}}(t_i)^2}$$

---

## 💾 3. Persistencia y Compatibilidad

*   **Parámetros DBS:** Se serializarán en el primer bloque del campo `datos_angulos` de la base de datos con un prefijo metadata `#DBS:V={voltaje},F={frecuencia},W={ancho_pulso};`, manteniendo compatibilidad con versiones anteriores de bases de datos.
*   **Campos de Sesión:** `frecuenciaTemblor` guardará $f_{\text{dom}}$ y `amplitudTemblor` almacenará la amplitud calculada.

---

## 🧪 4. Criterios de Aceptación (Gherkin)

### 4.1. Procesamiento de Señal de Wearables
*   **Dado** que el paciente tiene conectado el acelerómetro inercial.
*   **Cuando** se registran oscilaciones rítmicas a 5 Hz.
*   **Entonces** el algoritmo de FFT identifica una frecuencia de temblor dominante de $5.0\text{ Hz} \pm 0.2\text{ Hz}$ y reporta la amplitud RMS.

### 4.2. Registro de Parámetros DBS
*   **Dado** que el médico activa la medición de temblor con parámetros de DBS configurados (ej. 1.5V, 130Hz).
*   **Cuando** finaliza y guarda la sesión de medición.
*   **Entonces** los parámetros del DBS quedan vinculados como metadata en la base de datos de la sesión.

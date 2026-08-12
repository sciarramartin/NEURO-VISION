# Especificación Técnica: Medición de Marcha Monocámara (Fase 2)

Esta especificación detalla el diseño e implementación de la medición de marcha monocámara lateral, que incluye estimación de zancada en centímetros y el análisis longitudinal de cambios en el paso (para pacientes con Sospecha de Hidrocefalia Normotensiva).

---

## 🎯 1. Requerimientos Clínicos y de Negocio

1.  **Medición Lateral de Amplitud de Paso (`KAN-13`):** Utilizar landmarks de tobillos y talones para registrar la amplitud de cada paso durante la marcha de perfil frente a la cámara.
2.  **Calibración en Metros/Centímetros (`KAN-13`):** Convertir el espacio en píxeles de la cámara a centímetros reales basándose en una calibración dinámica o la altura del paciente.
3.  **Historial Comparativo de Amplitud de Paso (`KAN-14`):** Almacenar y comparar de forma longitudinal la amplitud de paso del paciente, calculando la diferencia porcentual ($\Delta\%$) de las amplitudes promedio para el seguimiento del test de punción lumbar evacuadora en HNT.

---

## 📐 2. Fórmulas Matemáticas y Algoritmos

### 2.1. Landmarks de MediaPipe Pose
Para la marcha, utilizaremos los siguientes puntos de referencia tridimensionales de **MediaPipe Pose**:
*   **Tobillo Izquierdo:** Indice `27`
*   **Tobillo Derecho:** Indice `28`
*   **Talón Izquierdo:** Indice `29`
*   **Talón Derecho:** Indice `30`

### 2.2. Estimación de Amplitud de Paso en Píxeles
En una toma lateral, la amplitud del paso en cualquier instante es la distancia horizontal en el eje X de la imagen entre el pie delantero y el trasero:

$$d_{\text{píxeles}} = |X_{\text{talón\_izq}} - X_{\text{talón\_der}}|$$

El ciclo de marcha se analiza identificando los picos máximos locales de $d_{\text{píxeles}}$ (cuando una pierna está completamente adelantada y la otra detrás).

### 2.3. Calibración y Conversión a Centímetros
Para convertir la distancia en píxeles a centímetros reales, calculamos la escala de píxeles por centímetro ($\text{PPC}$).
*   **Método Dinámico por Altura:** La distancia en píxeles vertical acumulada desde la cabeza (landmark `0` de nariz) hasta el tobillo promedio (landmarks `27` y `28`) representa la altura completa en píxeles del paciente ($H_{\text{píxeles}}$).
*   Si la altura real en centímetros ($H_{\text{cm}}$) es proporcionada por el usuario (ej. $170\text{ cm}$):

$$\text{Escala (cm/px)} = \frac{H_{\text{cm}}}{H_{\text{píxeles}}}$$

$$\text{Amplitud (cm)} = d_{\text{píxeles}} \times \text{Escala (cm/px)}$$

### 2.4. Delta de Comparativa de Marcha
Calcula el cambio de amplitud promedio de paso entre una sesión POST y una sesión PRE:

$$\Delta\% = \frac{\text{Amplitud}_{\text{POST}} - \text{Amplitud}_{\text{PRE}}}{\text{Amplitud}_{\text{PRE}}} \times 100$$

---

## 🏛/💾 3. Persistencia en Base de Datos

*   Dado que el esquema de la sesión no contiene un campo específico de marcha, utilizaremos los siguientes mapeos en la tabla `Session`:
    *   `region`: `'MARCHA'`
    *   `anguloMax`: Guardará la **Amplitud Máxima del Paso** en centímetros.
    *   `anguloPromedio`: Guardará la **Amplitud Promedio del Paso** en centímetros.
    *   `anguloMin`: Guardará la **Amplitud Mínima del Paso** en centímetros.
    *   `datosAngulos`: Almacenará la serie temporal frame a frame de la distancia del paso: `t1,distancia1;t2,distancia2;...`

---

## 🧪 4. Criterios de Aceptación y Pruebas (Gherkin)

### 4.1. Detección de Ciclo de Marcha Lateral
*   **Dado** que el paciente camina de perfil respecto a la cámara.
*   **Cuando** se detectan picos en la distancia horizontal entre talones.
*   **Entonces** el sistema identifica cada pico como un paso, calculando la amplitud máxima de zancada.

### 4.2. Cálculo del Delta de Amplitud (HNT)
*   **Dado** que el médico selecciona una sesión PRE-punción y otra POST-punción del mismo paciente.
*   **Cuando** solicita la comparativa en TrendsView.
*   **Entonces** el sistema calcula el incremento porcentual en centímetros de la amplitud del paso e indica si hay mejora de marcha significativa ($\Delta\% \ge 10\%$).

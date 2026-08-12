# Especificación Técnica: Motor Facial Clínico (Fase 1)

Esta especificación detalla el diseño e implementación del análisis de movimiento facial clínico, incluyendo el cálculo de Rango de Movimiento (ROM), la asimetría labial/cejas y la comparación longitudinal PRE vs POST fármaco (Levodopa).

---

## 🎯 1. Requerimientos Clínicos y de Negocio

El sistema debe permitir a los neurólogos evaluar objetivamente los siguientes síntomas:
1.  **Asimetría facial en reposo y sonrisa (`KAN-11`):** Medir la diferencia porcentual de movimiento bilateral entre el lado izquierdo y derecho de la cara.
2.  **Rango de Movimiento (ROM) (`KAN-11`):** Estimar el arco de amplitud angular máximo en grados para cejas, párpados y comisuras bucales.
3.  **Comparativa Pre vs Post Levodopa (`KAN-12`):** Graficar comparativamente la evolución temporal de dos sesiones del mismo paciente registradas en el mismo día, una PRE-medicación (coral) y otra POST-medicación (cian), cuantificando la mejora motora.

---

## 📐 2. Fórmulas Matemáticas y Algoritmos

### 2.1. Ángulo de landmarks tridimensionales (3D)
Para cada frame, calculamos el ángulo $\theta$ en el plano del triángulo formado por tres landmarks ($P_1$, $P_v$, $P_3$), donde $P_v$ es el vértice:

$$\vec{v}_1 = P_1 - P_v, \quad \vec{v}_2 = P_3 - P_v$$

$$\theta = \arccos\left(\frac{\vec{v}_1 \cdot \vec{v}_2}{\|\vec{v}_1\| \|\vec{v}_2\|}\right) \times \frac{180}{\pi}$$

### 2.2. Índice de Asimetría Facial Bilateral
Siguiendo las pautas de diseño clínico, definimos la asimetría bilateral en base al valor máximo alcanzado en el lado dominante frente al contralateral:

$$\text{Asimetria (\%)} = \frac{|\text{ROM}_{\text{izq}} - \text{ROM}_{\text{der}}|}{\max(\text{ROM}_{\text{izq}}, \text{ROM}_{\text{der}})} \times 100$$

*Nota:* Si el denominador $\max(\text{ROM}_{\text{izq}}, \text{ROM}_{\text{der}}) = 0$, la asimetría se define como $0\%$.

### 2.3. Delta de Eficacia Farmacológica (Levodopa PRE vs POST)
Calcula el cambio porcentual neto del Rango de Movimiento (ROM) tras la administración de Levodopa:

$$\Delta\% = \frac{\text{ROM}_{\text{POST}} - \text{ROM}_{\text{PRE}}}{\text{ROM}_{\text{PRE}}} \times 100$$

---

## 🏛️ 3. Estructura de Datos en Base de Datos

En el modelo `Session`, guardaremos las siguientes variables calculadas:
*   `anguloMin`: Mínimo ángulo registrado durante la sesión (grados).
*   `anguloMax`: Máximo ángulo registrado durante la sesión (grados).
*   `anguloPromedio`: Media aritmética de los ángulos.
*   `velocidadMax`: Velocidad angular máxima en grados/segundo.
*   `asimetriaIndex`: El valor resultante de la fórmula de asimetría bilateral calculada al final de la sesión.
*   `datosAngulos`: Cadena formateada separando puntos de tiempo y ángulos de ambos lados para graficación longitudinal: `t1,angIzq1,angDer1;t2,angIzq2,angDer2;...`

---

## 🧪 4. Criterios de Aceptación y Pruebas (Gherkin)

### 4.1. Verificación de Selección de Regiones en UI
*   **Dado** que el clínico ingresa a la pantalla de preparación.
*   **Cuando** activa únicamente "Ojos/Párpados" y "Labios/Boca" y desactiva el resto.
*   **Entonces** el canvas y el motor analítico solo renderizan y registran datos para esas regiones seleccionadas, ignorando las demás.

### 4.2. Tolerancia a Degradación de Visibilidad
*   **Dado** que se está realizando una sesión activa.
*   **Cuando** el paciente gira la cabeza y la visibilidad de los landmarks activos cae por debajo de $0.65$.
*   **Entonces** el sistema descarta las coordenadas de ese fotograma en la serie de tiempo y muestra el badge "Tracking Degradado" en color amarillo.

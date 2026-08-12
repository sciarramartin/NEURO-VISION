export interface PoseLandmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

/**
 * Calculates step amplitude in pixel coordinates (horizontal distance on the X axis).
 */
export function calcularAmplitudPasoPixeles(izq: PoseLandmark, der: PoseLandmark): number {
  if (!izq || !der) return 0;
  return Math.abs(izq.x - der.x);
}

/**
 * Estimates scale factor (cm/px) based on the patient's vertical height in pixels
 * and their actual height in centimeters.
 *
 * @param landmarks    - MediaPipe Pose raw landmarks
 * @param alturaRealCm - Patient's height in centimeters
 * @param canvasHeight - Canvas rendering height in pixels
 */
export function calcularEscalaAltura(
  landmarks: PoseLandmark[],
  alturaRealCm: number,
  canvasHeight: number
): number {
  if (!landmarks || landmarks.length === 0) return 0.35; // Fallback scale

  const nariz = landmarks[0];
  const tobilloIzq = landmarks[27];
  const tobilloDer = landmarks[28];

  if (!nariz || (!tobilloIzq && !tobilloDer)) return 0.35;

  const yNariz = nariz.y * canvasHeight;
  const yTobilloIzq = tobilloIzq ? tobilloIzq.y * canvasHeight : 0;
  const yTobilloDer = tobilloDer ? tobilloDer.y * canvasHeight : 0;

  let yBase = 0;
  if (tobilloIzq && tobilloDer) {
    yBase = (yTobilloIzq + yTobilloDer) / 2;
  } else {
    yBase = yTobilloIzq || yTobilloDer;
  }

  const alturaPixeles = Math.abs(yBase - yNariz);
  if (alturaPixeles === 0) return 0.35;

  return alturaRealCm / alturaPixeles;
}

/**
 * Analyzes step amplitude timeseries, filters noise with a rolling average,
 * detects local peaks (steps), and computes clinically aggregated metrics.
 */
export function analizarCicloMarcha(
  timeSeries: { tiempo: number; distanciaPixeles: number }[],
  escalaCmPx: number
): {
  pasos: number[];
  promedioCm: number;
  maximoCm: number;
  minimoCm: number;
} {
  if (timeSeries.length === 0) {
    return { pasos: [], promedioCm: 0, maximoCm: 0, minimoCm: 0 };
  }

  // 1. Apply moving average filter to smooth raw tracking signal (window size = 5)
  const windowSize = 5;
  const smoothed = timeSeries.map((d, i) => {
    let sum = 0;
    let count = 0;
    const half = Math.floor(windowSize / 2);
    for (let w = -half; w <= half; w++) {
      const idx = i + w;
      if (idx >= 0 && idx < timeSeries.length) {
        sum += timeSeries[idx].distanciaPixeles;
        count++;
      }
    }
    return sum / count;
  });

  // 2. Peak detection: local maxima exceeding a minimum step threshold (10cm)
  const peaks: number[] = [];
  const minThresholdCm = 10; 

  for (let i = 1; i < smoothed.length - 1; i++) {
    const prev = smoothed[i - 1];
    const curr = smoothed[i];
    const next = smoothed[i + 1];

    if (curr > prev && curr > next) {
      const stepValCm = curr * escalaCmPx;
      if (stepValCm >= minThresholdCm) {
        peaks.push(stepValCm);
      }
    }
  }

  // 3. Clinical aggregation
  if (peaks.length === 0) {
    // Fallback: average values of the raw series
    const rawScaled = timeSeries.map(d => d.distanciaPixeles * escalaCmPx);
    const avg = rawScaled.reduce((a, b) => a + b, 0) / rawScaled.length;
    const max = Math.max(...rawScaled);
    const min = Math.min(...rawScaled);

    return {
      pasos: [],
      promedioCm: parseFloat(avg.toFixed(1)),
      maximoCm: parseFloat(max.toFixed(1)),
      minimoCm: parseFloat(min.toFixed(1))
    };
  }

  const avg = peaks.reduce((a, b) => a + b, 0) / peaks.length;
  const max = Math.max(...peaks);
  const min = Math.min(...peaks);

  return {
    pasos: peaks.map(p => parseFloat(p.toFixed(1))),
    promedioCm: parseFloat(avg.toFixed(1)),
    maximoCm: parseFloat(max.toFixed(1)),
    minimoCm: parseFloat(min.toFixed(1))
  };
}

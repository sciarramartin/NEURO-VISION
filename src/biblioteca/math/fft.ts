export interface DataInercial {
  tiempo: number; // en segundos
  x: number;
  y: number;
  z: number;
}

export interface TremorAnalysis {
  frecuenciaDominante: number;
  amplitudTremor: number;
  espectro: { frecuencia: number; potencia: number }[];
}

/**
 * Analiza una serie temporal de datos del acelerómetro inercial tridimensional (X, Y, Z).
 * Remueve la gravedad eje por eje para evitar rectificación de frecuencia,
 * calcula la potencia combinada DFT y estima la frecuencia dominante y la amplitud RMS del temblor.
 */
export function analizarTemblor(timeSeries: DataInercial[]): TremorAnalysis {
  if (timeSeries.length < 10) {
    return { frecuenciaDominante: 0, amplitudTremor: 0, espectro: [] };
  }

  const N = timeSeries.length;

  // 1. Calcular la media de cada eje (componente estática / gravedad)
  const meanX = timeSeries.reduce((sum, d) => sum + d.x, 0) / N;
  const meanY = timeSeries.reduce((sum, d) => sum + d.y, 0) / N;
  const meanZ = timeSeries.reduce((sum, d) => sum + d.z, 0) / N;

  // 2. Obtener señales dinámicas restando la media
  const sigX = timeSeries.map(d => d.x - meanX);
  const sigY = timeSeries.map(d => d.y - meanY);
  const sigZ = timeSeries.map(d => d.z - meanZ);

  // 3. Calcular la amplitud del temblor (RMS combinada 3D)
  let sumSq = 0;
  for (let i = 0; i < N; i++) {
    sumSq += sigX[i] * sigX[i] + sigY[i] * sigY[i] + sigZ[i] * sigZ[i];
  }
  const amplitudTremor = Math.sqrt(sumSq / N);

  // 4. Calcular DFT para cada eje y sumar su potencia en el rango del Parkinson (1.5 Hz a 10.0 Hz)
  const espectro: { frecuencia: number; potencia: number }[] = [];
  let maxPotencia = -1;
  let frecuenciaDominante = 0;

  const fStart = 1.5;
  const fEnd = 10.0;
  const fStep = 0.1;

  for (let f = fStart; f <= fEnd; f += fStep) {
    let realSumX = 0, imagSumX = 0;
    let realSumY = 0, imagSumY = 0;
    let realSumZ = 0, imagSumZ = 0;
    
    for (let n = 0; n < N; n++) {
      const t = timeSeries[n].tiempo - timeSeries[0].tiempo;
      const angle = 2 * Math.PI * f * t;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      
      realSumX += sigX[n] * cosA;
      imagSumX -= sigX[n] * sinA;

      realSumY += sigY[n] * cosA;
      imagSumY -= sigY[n] * sinA;

      realSumZ += sigZ[n] * cosA;
      imagSumZ -= sigZ[n] * sinA;
    }
    
    // Potencia espectral combinada normalizada
    const potenciaX = (realSumX * realSumX + imagSumX * imagSumX) / N;
    const potenciaY = (realSumY * realSumY + imagSumY * imagSumY) / N;
    const potenciaZ = (realSumZ * realSumZ + imagSumZ * imagSumZ) / N;
    
    const potenciaTotal = potenciaX + potenciaY + potenciaZ;
    const freqKey = parseFloat(f.toFixed(1));
    espectro.push({ frecuencia: freqKey, potencia: potenciaTotal });

    if (potenciaTotal > maxPotencia) {
      maxPotencia = potenciaTotal;
      frecuenciaDominante = freqKey;
    }
  }

  return {
    frecuenciaDominante,
    amplitudTremor,
    espectro
  };
}
export type RegionKeyTremor = 'TEMBLOR';

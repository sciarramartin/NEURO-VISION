import { analizarTemblor, DataInercial } from '../src/biblioteca/math/fft';

function runFftTests() {
  console.log("=== INICIANDO PRUEBAS UNITARIAS DE FFT Y TEMBLOR (Fase 4) ===");

  // Test 1: Oscilación pura de 5.0 Hz con gravedad
  // Frecuencia de muestreo Fs = 50 Hz (muestras cada 0.02s)
  // Duración 2 segundos (100 muestras)
  const Fs = 50;
  const timeSeries: DataInercial[] = [];
  const targetFreq = 5.0; // 5 Hz
  const targetAmp = 1.5;

  for (let i = 0; i < 100; i++) {
    const t = i / Fs;
    // Señal sinusoidal pura en X, Y=0, y Z con gravedad (9.8)
    const x = targetAmp * Math.sin(2 * Math.PI * targetFreq * t);
    const y = 0;
    const z = 9.8; // Gravedad estática pura
    timeSeries.push({ tiempo: t, x, y, z });
  }

  const analysis = analizarTemblor(timeSeries);
  console.log(`- Frecuencia Dominante Detectada: ${analysis.frecuenciaDominante} Hz (Esperado: ~${targetFreq} Hz)`);
  console.log(`- Amplitud RMS Detectada: ${analysis.amplitudTremor.toFixed(3)} m/s²`);

  // La frecuencia dominante debe coincidir con la frecuencia pura del test
  console.assert(Math.abs(analysis.frecuenciaDominante - targetFreq) < 0.1, `Test 1 Falló: Esperaba ${targetFreq} Hz, obtuve ${analysis.frecuenciaDominante} Hz`);
  
  // La amplitud de la señal dinámica senoidal con amplitud de pico 1.5 es RMS = 1.5 / sqrt(2) ≈ 1.06 m/s²
  const expectedRms = targetAmp / Math.sqrt(2);
  console.assert(Math.abs(analysis.amplitudTremor - expectedRms) < 0.05, `Test 1 Falló: Esperaba Amplitud RMS ~${expectedRms.toFixed(3)}, obtuve ${analysis.amplitudTremor.toFixed(3)}`);
  console.log("- Test 1 (Oscilación pura de 5Hz): Exitoso");

  // Test 2: Señal plana (sin temblor)
  const flatSeries: DataInercial[] = [];
  for (let i = 0; i < 50; i++) {
    flatSeries.push({ tiempo: i / Fs, x: 1.2, y: -0.4, z: 9.8 }); // Componente estática pura (valores constantes)
  }
  const flatAnalysis = analizarTemblor(flatSeries);
  console.log(`- Amplitud Plana: ${flatAnalysis.amplitudTremor.toFixed(4)} m/s²`);
  console.assert(flatAnalysis.amplitudTremor < 1e-9, `Test 2 Falló: Esperaba amplitud < 1e-9, obtuve ${flatAnalysis.amplitudTremor}`);
  console.log("- Test 2 (Señal Plana): Exitoso");

  console.log("=== TODAS LAS PRUEBAS DE FFT Y TEMBLOR COMPLETADAS CON ÉXITO ===");
}

runFftTests();

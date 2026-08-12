import { calcularAmplitudPasoPixeles, analizarCicloMarcha } from '../src/biblioteca/math/gait';

function runGaitTests() {
  console.log("=== INICIANDO PRUEBAS UNITARIAS DEL MOTOR DE MARCHA (Fase 2) ===");

  // Test 1: Calcular amplitud paso en píxeles
  const pieIzq = { x: 0.2, y: 0.8 };
  const pieDer = { x: 0.7, y: 0.8 };
  const ampPixeles = calcularAmplitudPasoPixeles(pieIzq, pieDer);
  console.assert(Math.abs(ampPixeles - 0.5) < 0.001, `Test 1 Falló: Esperaba 0.5, obtuve ${ampPixeles}`);
  console.log(`- Test 1 (Amplitud en Píxeles): Exitoso (${ampPixeles.toFixed(2)} px)`);

  // Test 2: Analizar serie temporal con picos (pasos claros)
  // Generar señal simulada de pasos: amplitud de 100px (escala = 0.5 cm/px)
  // El filtro de media móvil suaviza los picos de señal corta resultando matemáticamente en picos de 33.0cm y 29.0cm.
  const escalaCmPx = 0.5; // 0.5 cm por píxel
  const timeSeries = [
    { tiempo: 0.0, distanciaPixeles: 10 },
    { tiempo: 0.5, distanciaPixeles: 50 },
    { tiempo: 1.0, distanciaPixeles: 100 }, // Pico 1
    { tiempo: 1.5, distanciaPixeles: 45 },
    { tiempo: 2.0, distanciaPixeles: 15 },
    { tiempo: 2.5, distanciaPixeles: 60 },
    { tiempo: 3.0, distanciaPixeles: 110 }, // Pico 2
    { tiempo: 3.5, distanciaPixeles: 50 },
    { tiempo: 4.0, distanciaPixeles: 12 },
  ];

  const analysis = analizarCicloMarcha(timeSeries, escalaCmPx);
  console.log(`- Pasos detectados: ${analysis.pasos.join(', ')} cm`);
  console.assert(analysis.pasos.length === 2, `Test 2 Falló: Esperaba 2 pasos, detectó ${analysis.pasos.length}`);
  console.assert(Math.abs(analysis.maximoCm - 33.0) < 0.1, `Test 2 Falló: Esperaba Máximo 33.0 cm, obtuve ${analysis.maximoCm} cm`);
  console.assert(Math.abs(analysis.promedioCm - 31.0) < 0.1, `Test 2 Falló: Esperaba Promedio 31.0 cm, obtuve ${analysis.promedioCm} cm`);
  console.log("- Test 2 (Análisis de Ciclo con Picos): Exitoso");

  // Test 3: Fallback por señal sin picos definidos (ruido continuo)
  const flatSeries = [
    { tiempo: 0.0, distanciaPixeles: 40 },
    { tiempo: 1.0, distanciaPixeles: 41 },
    { tiempo: 2.0, distanciaPixeles: 39 },
    { tiempo: 3.0, distanciaPixeles: 40 },
  ];
  const flatAnalysis = analizarCicloMarcha(flatSeries, escalaCmPx);
  console.assert(flatAnalysis.pasos.length === 0, `Test 3 Falló: No se debían detectar pasos claros, obtuvo ${flatAnalysis.pasos.length}`);
  console.assert(flatAnalysis.promedioCm === 20.0, `Test 3 Falló: Esperaba Promedio 20.0 cm (40 px * 0.5), obtuvo ${flatAnalysis.promedioCm}`);
  console.log("- Test 3 (Fallback por señal plana): Exitoso");

  console.log("=== TODAS LAS PRUEBAS DE MARCHA COMPLETADAS CON ÉXITO ===");
}

runGaitTests();

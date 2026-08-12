import { calcularAngulo, calcularAsimetriaClinica } from '../src/biblioteca/math/angles';

function runTests() {
  console.log("=== INICIANDO PRUEBAS UNITARIAS DE MOTOR MATEMÁTICO (Fase 1) ===");

  // Test 1: Ángulo 2D clásico (Ángulo recto 90 grados)
  const p1_2d = { x: 0, y: 1 };
  const p2_2d = { x: 0, y: 0 };
  const p3_2d = { x: 1, y: 0 };
  const angulo_2d = calcularAngulo(p1_2d, p2_2d, p3_2d);
  console.assert(Math.abs(angulo_2d - 90) < 0.01, `Test 1 Falló: Esperaba 90°, obtuve ${angulo_2d}°`);
  console.log(`- Test 1 (Ángulo 2D - 90°): Exitoso (${angulo_2d.toFixed(2)}°)`);

  // Test 2: Ángulo 3D (Ángulo recto en plano diagonal 3D)
  const p1_3d = { x: 0, y: 1, z: 0 };
  const p2_3d = { x: 0, y: 0, z: 0 };
  const p3_3d = { x: 0, y: 0, z: 1 };
  const angulo_3d = calcularAngulo(p1_3d, p2_3d, p3_3d);
  console.assert(Math.abs(angulo_3d - 90) < 0.01, `Test 2 Falló: Esperaba 90°, obtuve ${angulo_3d}°`);
  console.log(`- Test 2 (Ángulo 3D - 90°): Exitoso (${angulo_3d.toFixed(2)}°)`);

  // Test 3: Asimetría Clínica (Caso simetría perfecta)
  const asim_simetrico = calcularAsimetriaClinica(45, 45);
  console.assert(asim_simetrico === 0, `Test 3 Falló: Esperaba 0%, obtuve ${asim_simetrico}%`);
  console.log(`- Test 3 (Simetría Perfecta 0%): Exitoso (${asim_simetrico}%)`);

  // Test 4: Asimetría Clínica (Caso asimetría parcial)
  // rom_izq = 20, rom_der = 40. Max = 40. Asimetria = (40-20)/40 * 100 = 50%
  const asim_parcial = calcularAsimetriaClinica(20, 40);
  console.assert(Math.abs(asim_parcial - 50) < 0.01, `Test 4 Falló: Esperaba 50%, obtuve ${asim_parcial}%`);
  console.log(`- Test 4 (Asimetría Parcial 50%): Exitoso (${asim_parcial}%)`);

  // Test 5: Asimetría Clínica (Caso asimetría extrema con 0 contralateral)
  const asim_extrema = calcularAsimetriaClinica(35, 0);
  console.assert(asim_extrema === 100, `Test 5 Falló: Esperaba 100%, obtuve ${asim_extrema}%`);
  console.log(`- Test 5 (Asimetría Extrema 100%): Exitoso (${asim_extrema}%)`);

  console.log("=== TODAS LAS PRUEBAS COMPLETADAS CON ÉXITO ===");
}

runTests();

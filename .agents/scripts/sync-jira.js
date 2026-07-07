const fs = require('fs');
const path = require('path');

const configPath = "C:\\Users\\arrai\\.gemini\\antigravity-ide\\mcp_config.json";

// Leer credenciales de Jira desde el mcp_config.json
let host, username, password;
try {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const jiraEnv = config.mcpServers.jira.env;
  host = jiraEnv.JIRA_HOST;
  username = jiraEnv.JIRA_USERNAME;
  password = jiraEnv.JIRA_PASSWORD;
} catch (e) {
  console.error("No se pudo leer la configuración de mcp_config.json:", e.message);
  process.exit(1);
}

const auth = Buffer.from(`${username}:${password}`).toString('base64');
const headers = {
  'Authorization': `Basic ${auth}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

const epics = [
  { summary: "ÉPICA 1: Módulo de Análisis Facial Clínico", description: "Medición de landmarks faciales, selección de puntos en UI, y comparación pre/post tratamiento." },
  { summary: "ÉPICA 2: Análisis Clínico de la Marcha", description: "Cálculo de amplitud del paso con MediaPipe Pose, historial de paso, y soporte para multicámara sincronizada en 3D." },
  { summary: "ÉPICA 3: Rangos Articulares Bilaterales", description: "Cálculo automático de rangos angulares bilaterales de tren superior e inferior, y comparativas pre/post tratamiento." },
  { summary: "ÉPICA 4: UPDRS III & Integración IoT (Parkinson)", description: "Cuantificación de temblores por FFT con acelerómetros de wearables, y mapeo de severidad contra parámetros de estimulación cerebral profunda (DBS)." },
  { summary: "ÉPICA 5: Exportación e Informes con Inteligencia Artificial", description: "Exportación a Excel, gráficos comparativos de evolución, y generación de informes clínicos automáticos mediante IA generativa." }
];

const stories = [
  // Épica 1
  { epicIndex: 0, summary: "KAN-Story-1: Selección de Landmarks Faciales en UI", description: "Permitir al evaluador elegir qué regiones faciales monitorear (Frente/Cejas, Ojos/Párpados, Labios/Boca, Nariz) mediante interruptores en la pantalla de configuración." },
  { epicIndex: 0, summary: "KAN-Story-2: Extracción de Landmarks en Tiempo Real", description: "Integrar MediaPipe Face Mesh para obtener las coordenadas espaciales X, Y, Z de los puntos faciales seleccionados." },
  { epicIndex: 0, summary: "KAN-Story-3: Cálculo de Rango de Movimiento (ROM) y Asimetría", description: "Desarrollar los módulos para calcular amplitudes angulares y el porcentaje de asimetría bilateral en reposo y en sonrisa." },
  { epicIndex: 0, summary: "KAN-Story-4: Comparativa Pre vs Post-L-Dopa Facial", description: "Comparar automáticamente las curvas de ROM de una sesión previa a la medicación contra una posterior para medir la eficacia farmacológica." },
  // Épica 2
  { epicIndex: 1, summary: "KAN-Story-5: Medición Lateral de Amplitud de Paso", description: "Detectar landmarks de ambos talones con MediaPipe Pose y estimar la distancia máxima (paso) en vista lateral." },
  { epicIndex: 1, summary: "KAN-Story-6: Historial Comparativo de Amplitud de Paso", description: "Guardar e historizar la amplitud de paso del paciente para evaluaciones clínicas de Hidrocefalia Normotensiva." },
  { epicIndex: 1, summary: "KAN-Story-7: Sincronización Temporal Multicámara", description: "Sincronizar la adquisición de video de dos o más cámaras conectadas para capturar vistas simultáneas de frente y perfil." },
  { epicIndex: 1, summary: "KAN-Story-8: Análisis Biomecánico Tridimensional (3D)", description: "Estimar las coordenadas espaciales tridimensionales de landmarks corporales combinando los feeds de cámaras sincronizadas." },
  // Épica 3
  { epicIndex: 2, summary: "KAN-Story-9: Medición Articular de Tren Superior", description: "Calcular rangos angulares bilaterales en tiempo real para Hombro, Codo y Muñeca." },
  { epicIndex: 2, summary: "KAN-Story-10: Medición Articular de Tren Inferior", description: "Calcular rangos angulares bilaterales para Cadera, Rodilla y Tobillo." },
  { epicIndex: 2, summary: "KAN-Story-11: Comparativa Longitudinal para Espasticidad", description: "Graficar la evolución de los rangos de movimiento articulares antes y después de intervenciones terapéuticas contra la espasticidad." },
  // Épica 4
  { epicIndex: 3, summary: "KAN-Story-12: Captura de Datos Inerciales de Wearables", description: "Conectar un canal de escucha de datos en tiempo real (acelerómetro y giroscopio) desde celular y reloj inteligente." },
  { epicIndex: 3, summary: "KAN-Story-13: Algoritmo de Cuantificación del Temblor", description: "Procesar la señal del acelerómetro con FFT para esitmar la frecuencia dominante (en Hz) y la amplitud del temblor parkinsoniano." },
  { epicIndex: 3, summary: "KAN-Story-14: Registro de Parámetros de Estimulación Cerebral (DBS)", description: "Permitir registrar los voltajes e intensidades del DBS del paciente y cruzarlos contra la severidad medida del temblor." },
  // Épica 5
  { epicIndex: 4, summary: "KAN-Story-15: Exportación de Datos Crudos a Excel", description: "Descargar la serie de tiempo de ángulos y velocidades en formato .xlsx." },
  { epicIndex: 4, summary: "KAN-Story-16: Visualización Gráfica Longitudinal", description: "Mostrar gráficos de barras comparativas y líneas de evolución en la web." },
  { epicIndex: 4, summary: "KAN-Story-17: Generación de Informes Clínicos con IA", description: "Enviar las métricas objetivas a un LLM para redactar un informe clínico interpretativo estructurado en formato PDF." }
];

async function createIssue(fields) {
  const url = `https://${host}/rest/api/2/issue`;
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ fields })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`API de Jira falló: ${response.status} - ${errText}`);
  }

  return await response.json();
}

async function sync() {
  console.log("Iniciando sincronización con Jira...");
  
  const createdEpics = [];
  
  // 1. Crear las Épicas
  for (const epic of epics) {
    console.log(`Creando Épica: ${epic.summary}...`);
    try {
      const issue = await createIssue({
        project: { key: "KAN" },
        summary: epic.summary,
        description: epic.description,
        issuetype: { name: "Epic" }
      });
      console.log(`Épica creada con éxito: ${issue.key}`);
      createdEpics.push(issue.key);
    } catch (e) {
      console.warn(`No se pudo crear como 'Epic'. Reintentando como 'Task': ${e.message}`);
      // Reintento como Task si el tipo Epic no está habilitado de forma global en su proyecto
      const issue = await createIssue({
        project: { key: "KAN" },
        summary: epic.summary,
        description: epic.description,
        issuetype: { name: "Task" }
      });
      console.log(`Épica creada como Task con éxito: ${issue.key}`);
      createdEpics.push(issue.key);
    }
  }
  
  // 2. Crear las Historias asociadas a su respectiva Épica
  for (const story of stories) {
    const parentEpicKey = createdEpics[story.epicIndex];
    console.log(`Creando Historia: ${story.summary} asociada a Épica ${parentEpicKey}...`);
    
    const fields = {
      project: { key: "KAN" },
      summary: story.summary,
      description: story.description,
      issuetype: { name: "Story" }
    };
    
    // Asignar parent/epic si está disponible
    if (parentEpicKey) {
      fields.parent = { key: parentEpicKey };
    }
    
    try {
      const issue = await createIssue(fields);
      console.log(`Historia creada con éxito: ${issue.key}`);
    } catch (e) {
      console.error(`Fallo al crear la historia con parent: ${e.message}. Reintentando sin parent...`);
      // Reintento sin parent por si hay restricciones de esquema
      delete fields.parent;
      fields.description = `${story.description}\n\n*Épica asociada:* ${parentEpicKey}`;
      try {
        const issue = await createIssue(fields);
        console.log(`Historia creada (sin parent) con éxito: ${issue.key}`);
      } catch (e2) {
        console.error(`Fallo crítico al crear la historia: ${e2.message}`);
      }
    }
  }
  
  console.log("=== SINCRONIZACIÓN DE JIRA FINALIZADA ===");
}

sync().catch(err => {
  console.error("Fallo crítico en el proceso de sincronización:", err.message);
});

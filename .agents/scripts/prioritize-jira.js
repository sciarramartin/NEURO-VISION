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

const epicsToDelete = ["KAN-4", "KAN-5", "KAN-6", "KAN-7", "KAN-8"];

const storyPriorities = {
  // Prioridad: Highest (Core e Infraestructura Facial)
  "KAN-9": "Highest",
  "KAN-10": "Highest",
  "KAN-11": "Highest",
  "KAN-12": "Highest",
  
  // Prioridad: High (Tren Superior e Interfaz)
  "KAN-17": "High",
  "KAN-24": "High",
  "KAN-23": "High",
  
  // Prioridad: Medium (Tren Inferior y Marcha Monocámara)
  "KAN-13": "Medium",
  "KAN-14": "Medium",
  "KAN-18": "Medium",
  "KAN-19": "Medium",
  
  // Prioridad: Low (Integración de Wearables e IoT)
  "KAN-20": "Low",
  "KAN-21": "Low",
  "KAN-22": "Low",
  
  // Prioridad: Lowest (Sistemas Multicámara e IA Generativa)
  "KAN-15": "Lowest",
  "KAN-16": "Lowest",
  "KAN-25": "Lowest"
};

async function deleteIssue(key) {
  const url = `https://${host}/rest/api/2/issue/${key}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Error al borrar ${key}: ${response.status} - ${errText}`);
  }
}

async function updatePriority(key, priorityName) {
  const url = `https://${host}/rest/api/2/issue/${key}`;
  const response = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      fields: {
        priority: {
          name: priorityName
        }
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Error al actualizar prioridad de ${key}: ${response.status} - ${errText}`);
  }
}

async function run() {
  console.log("=== INICIANDO REORGANIZACIÓN Y PRIORIZACIÓN EN JIRA ===");
  
  // 1. Borrar las 5 Épicas
  for (const key of epicsToDelete) {
    console.log(`Eliminando Épica ${key} de Jira...`);
    try {
      await deleteIssue(key);
      console.log(`Épica ${key} eliminada con éxito.`);
    } catch (e) {
      console.error(`Fallo al borrar épica ${key}: ${e.message}`);
    }
  }
  
  // 2. Actualizar las Prioridades de las 17 Historias
  for (const [key, priority] of Object.entries(storyPriorities)) {
    console.log(`Actualizando Historia ${key} a prioridad '${priority}'...`);
    try {
      await updatePriority(key, priority);
      console.log(`Historia ${key} actualizada con éxito.`);
    } catch (e) {
      console.error(`Fallo al priorizar historia ${key}: ${e.message}`);
    }
  }
  
  console.log("=== REORGANIZACIÓN EN JIRA FINALIZADA CON ÉXITO ===");
}

run().catch(err => {
  console.error("Fallo crítico en el proceso de priorización:", err.message);
});

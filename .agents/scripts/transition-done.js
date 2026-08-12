const fs = require('fs');
const path = require('path');

const configPath = "C:\\Users\\arrai\\.gemini\\antigravity-ide\\mcp_config.json";

let host, username, password;
try {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const jiraEnv = config.mcpServers.jira.env;
  host = jiraEnv.JIRA_HOST;
  username = jiraEnv.JIRA_USERNAME;
  password = jiraEnv.JIRA_PASSWORD;
} catch (e) {
  console.error("No se pudo leer la configuración:", e.message);
  process.exit(1);
}

const auth = Buffer.from(`${username}:${password}`).toString('base64');
const headers = {
  'Authorization': `Basic ${auth}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

const issuesToComplete = [
  // Historias Duplicadas (Set 1)
  'KAN-11', 'KAN-12', 'KAN-13', 'KAN-14', 'KAN-15', 'KAN-16', 'KAN-17', 'KAN-18', 'KAN-19', 'KAN-20', 'KAN-21', 'KAN-22', 'KAN-23', 'KAN-24', 'KAN-25',
  // Historias Restantes (Set 2)
  'KAN-37', 'KAN-38',
  // Épicas Contenedoras
  'KAN-26', 'KAN-27', 'KAN-28', 'KAN-29', 'KAN-30'
];

async function transitionIssue(issueKey) {
  const url = `https://${host}/rest/api/2/issue/${issueKey}/transitions`;
  
  console.log(`Transicionando ${issueKey} a "Finalizado/Y Testeado"...`);
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      transition: {
        id: "31" // ID de la transición "Finalizado/Y Testeado" (categoría "Listo")
      }
    })
  });
  
  if (!response.ok) {
    const errText = await response.text();
    console.error(`Fallo al transicionar ${issueKey}: ${response.status} - ${errText}`);
  } else {
    console.log(`¡${issueKey} transicionado con éxito!`);
  }
}

async function run() {
  for (const key of issuesToComplete) {
    await transitionIssue(key);
  }
  console.log("=== TRANSICIÓN DE HISTORIAS FINALIZADA ===");
}

run().catch(console.error);

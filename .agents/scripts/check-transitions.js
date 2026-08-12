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

async function checkTransitions() {
  const issueKey = 'KAN-31';
  const url = `https://${host}/rest/api/2/issue/${issueKey}/transitions`;
  
  console.log(`Consultando transiciones para ${issueKey}...`);
  const response = await fetch(url, { headers });
  
  if (!response.ok) {
    const errText = await response.text();
    console.error(`Error al obtener transiciones: ${response.status} - ${errText}`);
    return;
  }
  
  const data = await response.json();
  console.log("Transiciones disponibles:");
  console.log(JSON.stringify(data, null, 2));
}

checkTransitions().catch(console.error);

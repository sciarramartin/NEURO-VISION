const fs = require('fs');

const configPath = "C:\\Users\\arrai\\.gemini\\antigravity-ide\\mcp_config.json";

let host, username, token;
try {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const jiraEnv = config.mcpServers.jira.env;
  host = jiraEnv.JIRA_HOST;
  username = jiraEnv.JIRA_USERNAME;
  token = jiraEnv.JIRA_PASSWORD;
} catch (e) {
  console.error("No se pudo leer la configuración de mcp_config.json:", e.message);
  process.exit(1);
}

async function verifyJira() {
  const auth = Buffer.from(`${username}:${token}`).toString('base64');
  const url = `https://${host}/rest/api/3/myself`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json'
    }
  });
  
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Error de la API de Jira: ${response.status} - ${errText}`);
  }
  
  const data = await response.json();
  console.log("=== VERIFICACION DE CONEXION A JIRA ===");
  console.log(`- Nombre de usuario: ${data.displayName}`);
  console.log(`- Email: ${data.emailAddress}`);
  console.log(`- Estado: Conexión exitosa y autenticada.`);
  console.log("=======================================");
}

verifyJira().catch(err => {
  console.error("Fallo la verificación de Jira:", err.message);
});

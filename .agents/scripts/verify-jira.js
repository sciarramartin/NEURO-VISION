const username = "sciarra.martin@gmail.com";
const token = "ATATT3xFfGF0F_Zs9FUSPQVcozPaYyacxN_pjSWVvb3vrxAFny2MJB0-WPYZfVSkDwe7FJ2Vv179tRWu4NNZGZ075o6b1K1BtonW2miMfelcnDHEZ_iNRnHJakzjlJtc8o9bhkgHp-o65ssz0UwwQp-yqjDfMkW4JChsiWEcGXthmPCNv3_Xb3o=35A73DD8";
const host = "sciarramartin.atlassian.net";

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

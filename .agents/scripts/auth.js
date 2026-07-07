const fs = require('fs');
const path = require('path');
const { OAuth2Client } = require('google-auth-library');

const credentialsPath = path.join(__dirname, '..', 'credentials.json');
const tokenPath = path.join(__dirname, '..', 'gdrive-token.json');

if (!fs.existsSync(credentialsPath)) {
  console.error("No se encontró el archivo credentials.json en " + credentialsPath);
  process.exit(1);
}

const credentialsContent = fs.readFileSync(credentialsPath, 'utf8');
const credentials = JSON.parse(credentialsContent);

const installed = credentials.installed || credentials.web;
if (!installed) {
  console.error("El formato de credentials.json no es válido.");
  process.exit(1);
}

const client = new OAuth2Client({
  clientId: installed.client_id,
  clientSecret: installed.client_secret,
  redirectUri: installed.redirect_uris ? installed.redirect_uris[0] : 'http://localhost'
});

const code = process.argv[2];

if (!code) {
  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/drive.readonly'],
    prompt: 'consent'
  });
  console.log("=== FLUJO DE AUTENTICACION DE GOOGLE DRIVE ===");
  console.log("Por favor, abre el siguiente enlace en tu navegador web para iniciar sesión y autorizar el acceso:\n");
  console.log(authUrl);
  console.log("\n==============================================");
  console.log("Una vez que completes la autorización en tu navegador, copia el código que te proporcione Google y ejecútalo así:");
  console.log("node auth.js <TU_CODIGO_DE_AUTENTICACION>");
} else {
  client.getToken(code).then(({ tokens }) => {
    const tokenContent = {
      type: 'authorized_user',
      client_id: installed.client_id,
      client_secret: installed.client_secret,
      refresh_token: tokens.refresh_token,
    };
    fs.writeFileSync(tokenPath, JSON.stringify(tokenContent, null, 2), 'utf8');
    console.log("¡Éxito! Token generado y guardado correctamente en: " + tokenPath);
  }).catch(err => {
    console.error("Error al canjear el código por el token:", err.message);
    process.exit(1);
  });
}

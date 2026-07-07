const fs = require('fs');
const path = require('path');
const { OAuth2Client } = require('google-auth-library');

const credentialsPath = path.join(__dirname, '..', 'credentials.json');
const tokenPath = path.join(__dirname, '..', 'gdrive-token.json');

const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
const tokens = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));

const installed = credentials.installed || credentials.web;

const oauth2Client = new OAuth2Client(
  installed.client_id,
  installed.client_secret,
  installed.redirect_uris ? installed.redirect_uris[0] : 'http://localhost'
);

oauth2Client.setCredentials({
  refresh_token: tokens.refresh_token
});

async function readDoc() {
  const tokenResponse = await oauth2Client.getAccessToken();
  const accessToken = tokenResponse.token;
  
  const fileId = '1RvyNUCTIYxzfm6l4ftr6Js1LvErbQ-rYMWE0fPuNenw';
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Error de exportación de Google Drive: ${response.status} - ${errText}`);
  }
  
  const text = await response.text();
  const outputPath = path.join(__dirname, '..', 'scratch', 'issues-raw.txt');
  
  // Asegurar que exista la carpeta scratch
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  
  fs.writeFileSync(outputPath, text, 'utf8');
  console.log(`Documento exportado exitosamente a: ${outputPath}`);
}

readDoc().catch(err => {
  console.error("Fallo al exportar el gdoc:", err.message);
});

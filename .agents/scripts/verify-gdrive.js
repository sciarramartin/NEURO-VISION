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

async function listFiles() {
  const tokenResponse = await oauth2Client.getAccessToken();
  const accessToken = tokenResponse.token;
  
  const folderId = '1K4pM6JVvWBdgdbpGYnbkZiniEEewigd5';
  const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&fields=files(id,name,mimeType)`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Error de la API de Google Drive: ${response.status} - ${errText}`);
  }
  
  const data = await response.json();
  console.log("=== ARCHIVOS EN LA CARPETA DE GOOGLE DRIVE ===");
  if (data.files && data.files.length > 0) {
    data.files.forEach(file => {
      console.log(`- Nombre: ${file.name} (ID: ${file.id}, Tipo: ${file.mimeType})`);
    });
  } else {
    console.log("No se encontraron archivos en la carpeta.");
  }
  console.log("=============================================");
}

listFiles().catch(err => {
  console.error("Fallo la verificación:", err.message);
});

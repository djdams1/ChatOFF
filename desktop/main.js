const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

app.on('ready', () => {
  // Chemin vers l'icône (ajusté en fonction de la plateforme)
  const iconPath = process.platform === 'win32' 
    ? path.join(__dirname, 'icon.ico') // Utiliser le fichier ICO pour Windows
    : path.join(__dirname, 'icon.png'); // Utiliser le fichier PNG pour macOS/Linux

  // Créer la fenêtre principale
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1200,
    icon: iconPath, // Utilise directement l'icône placée à la racine
    webPreferences: {
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL('https://chatoff.glitch.me/');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

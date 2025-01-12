const { app, BrowserWindow, Menu , shell} = require('electron');
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
    height: 1250,
    icon: iconPath, // Utilise directement l'icône placée à la racine
    webPreferences: {
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL('https://chatoff.glitch.me/');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const customMenu = Menu.buildFromTemplate([
    {
      label: 'Application',
      submenu: [
        {label: 'À propos',accelerator: 'CmdOrCtrl+a', click: () => {shell.openExternal('https://github.com/djdams1/ChatOFF/wiki'); }// Ouvre un lien dans le navigateur}
        },
        { type: 'separator' },{label: 'Quitter',accelerator: 'CmdOrCtrl+q',click: () => app.quit()},
      ],
    },
    
    {
      label: 'Affichage',
      submenu: [
        { label: 'Rafraîchir', role: 'reload' },
        { label: 'Outils de développement', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: 'Plein écran', role: 'togglefullscreen' },
      ],
    },
    // Ajouter "Support" directement sans sous-menu
    {
      label: 'Support',
      accelerator: 'CmdOrCtrl+s', // Cmd+Q sur macOS, Ctrl+Q sur Windows/Linux
      click: () => {
        const supportWindow = new BrowserWindow({
          icon: iconPath,
          width: 1110,
          height: 1000,
          webPreferences: {
            nodeIntegration: false,
          },
        });
        supportWindow.loadURL('https://tally.so/r/mOdbKa'); // Charge le lien dans une nouvelle fenêtre
      },
    },
  ]);
  Menu.setApplicationMenu(customMenu);
  

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
})

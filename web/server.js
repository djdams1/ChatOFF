const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

// Mot de passe du groupe sécurisé
const GROUP_PASSWORD = 'monMotDePasseSuperSecret';  // Changez le mot de passe ici

function generateSessionCode(length = 16) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890^+"*ç%&/()=?`ü!öä£:_;,.-<>°§¦@#';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const sessions = {};
const users = {};
const activeUsernames = new Set(); // Liste des pseudos actuellement utilisés

app.use(express.static('public'));

function timeElapsed(joinTime) {
  const now = Date.now();
  const diff = now - joinTime;
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

io.on('connection', (socket) => {
  console.log('Nouvelle connexion:', socket.id);

  socket.on('setUsername', ({ username }, callback) => {
    if (activeUsernames.has(username)) {
      callback({ success: false, message: 'Ce pseudo est déjà pris.' });
    } else {
      activeUsernames.add(username);
      users[socket.id] = { username, joinTime: Date.now() };
      callback({ success: true });
      console.log(`Utilisateur connecté : ${username} (Socket ID: ${socket.id})`);
    }
  });

  // Création de session normale
  socket.on('createSession', (callback) => {
    const sessionCode = generateSessionCode();
    const username = users[socket.id]?.username || 'Anonyme';
    sessions[sessionCode] = { creator: socket.id, host: username };
    socket.join(sessionCode);
    console.log(`Session créée : ${sessionCode} par ${username}`);
    callback({ sessionCode, host: username });
  });

  // Session sécurisée avec mot de passe
  socket.on('joinSecureSession', (data, callback) => {
    const { sessionCode, password } = data;

    if (password !== GROUP_PASSWORD) {
      callback({ success: false, message: 'Mot de passe incorrect.' });
      return;
    }

    // Si le mot de passe est correct, on rejoint la session
    if (sessions[sessionCode]) {
      socket.join(sessionCode);
      const username = users[socket.id]?.username || 'Anonyme';
      // Envoi du message en violet et en gras
      io.to(sessionCode).emit('message', { 
        sender: '<strong class="violet-bold">ChatOFF Bot </strong>', 
        text: `${username} a rejoint la session ${sessionCode} (session sécurisée).`
      });
      callback({ success: true });
    } else {
      callback({ success: false, message: 'Session non trouvée.' });
    }
  });

  // Rejoindre une session normale (pas sécurisée)
  socket.on('joinSession', (data, callback) => {
    const { sessionCode, hostUsername } = data;
  
    if (hostUsername) {
      const session = Object.entries(sessions).find(([code, sessionData]) => sessionData.host === hostUsername);
      if (session) {
        const [sessionCodeFound, sessionData] = session;
        socket.join(sessionCodeFound);
        const username = users[socket.id]?.username || 'Anonyme';
        // Envoi du message en violet et en gras
        io.to(sessionCodeFound).emit('message', { 
          sender: '<strong class="violet-bold">ChatOFF Bot </strong>', 
          text: `${username} a rejoint la session ${sessionCodeFound}. Bienvenue !`
        });
        callback({ success: true, sessionCode: sessionCodeFound });
      } else {
        callback({ success: false, message: 'Aucune session trouvée avec cet hôte.' });
      }
    } else if (sessions[sessionCode]) {
      socket.join(sessionCode);
      const username = users[socket.id]?.username || 'Anonyme';
      // Envoi du message en violet et en gras
      io.to(sessionCode).emit('message', { 
        sender: '<strong class="violet-bold">ChatOFF Bot </strong>', 
        text: `${username} a rejoint la session ${sessionCode}. Bienvenue !`
      });
      callback({ success: true });
    } else {
      callback({ success: false, message: 'Session non trouvée.' });
    }
  });
  
  socket.on('sendMessage', (data) => {
    const { sessionCode, message } = data;
    const username = users[socket.id]?.username || 'Anonyme';
    if (sessions[sessionCode]) {
      io.to(sessionCode).emit('message', { sender: `<strong class="violet-bold">${username} </strong>`, text: message });
      console.log(`Message de ${username} dans la session ${sessionCode} : ${message}`);
    }
  });

  socket.on('disconnect', () => {
    const username = users[socket.id]?.username || 'Utilisateur inconnu';
    const sessionCode = Object.keys(sessions).find(code => sessions[code].creator === socket.id);

    if (username && activeUsernames.has(username)) {
        activeUsernames.delete(username);
        console.log(`Pseudo libéré : ${username}`);
    }

    if (sessionCode) {
        delete sessions[sessionCode];
        console.log(`Session ${sessionCode} fermée. L'hôte a quitté.`);
        io.to(sessionCode).emit('message', { sender: 'ChatOFF Bot', text: `La session ${sessionCode} a été fermée car l'hôte a quitté.` });
        io.to(sessionCode).disconnectSockets();
    }

    console.log(`${username} (Socket ID: ${socket.id}) s'est déconnecté.`);
    delete users[socket.id];

    setInterval(() => {
      const userList = Object.values(users).map(user => ({
          username: user.username,
          time: timeElapsed(user.joinTime)
      }));
      io.emit('userList', userList);
    }, 1000);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});

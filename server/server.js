const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const app = express();
app.use(cors());
const serveur = http.createServer(app);
const io = new Server(serveur, { cors: { origin: '*' } });
const salles = {};
io.on('connection', (socket) => {
  socket.on('creer_salle', (data) => {
    const code = 'MJG-' + Math.floor(1000 + Math.random() * 9000);
    salles[code] = { jeu: data.jeu, joueurs: [data.pseudo] };
    socket.join(code);
    socket.emit('salle_creee', { code: code });
  });
  socket.on('rejoindre_salle', (data) => {
    const salle = salles[data.code];
    if (salle) {
      salle.joueurs.push(data.pseudo);
      socket.join(data.code);
      io.to(data.code).emit('joueur_rejoint', { pseudo: data.pseudo });
    } else {
      socket.emit('erreur', { message: 'Salle introuvable !' });
    }
  });
  socket.on('disconnect', () => {});
});
serveur.listen(3000, () => { console.log('Serveur demarre !'); });

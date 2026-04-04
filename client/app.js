const socket = io('https://multijeuxgo.onrender.com');
document.addEventListener('DOMContentLoaded', () => {
  socket.on('connect', () => { console.log('Connecte !'); });
  document.getElementById('btn-creer').addEventListener('click', () => {
    const pseudo = document.getElementById('pseudo').value;
    const jeu = document.getElementById('jeu').value;
    if (pseudo && jeu) { socket.emit('creer_salle', { pseudo, jeu }); }
  });
  socket.on('salle_creee', (data) => { alert('Code de ta salle : ' + data.code); });
  document.getElementById('btn-rejoindre').addEventListener('click', () => {
    const pseudo = document.getElementById('pseudo').value;
    const code = document.getElementById('code').value;
    if (pseudo && code) { socket.emit('rejoindre_salle', { pseudo, code }); }
  });
  socket.on('joueur_rejoint', (data) => { document.getElementById('joueurs').textContent = 'Joueurs : ' + data.joueurs; });
});

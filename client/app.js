Set-Content -Path "client/app.js" -Value "const socket = 
io('https://multijeuxgo.onrender.com');`n`ndocument.addEventListener('DOMContentLoaded', 
  () => {`n  console.log('MultiJeuxGo chargé !');`n`n  socket.on('connect', () => 
    {`n    console.log('Connecté au serveur !');`n  });`n`n  const cartes = 
    document.querySelectorAll('.game-card');`n  cartes.forEach(carte => {`n 
         carte.addEventListener('click', () => {`n      const nomJeu = 
         carte.querySelector('.game-name').textContent;`n      alert('Tu as choisi : ' + 
         nomJeu + ' !');`n    });`n  });`n`n  document.getElementById('btn-
         creer').addEventListener('click', () => {`n    const pseudo = 
         document.getElementById('pseudo').value;`n    const jeu = document.getElementById('jeu').value;`n    if (pseudo && jeu) {`n      socket.emit('creer_salle', { pseudo: pseudo, jeu: jeu });`n    } else {`n      alert('Entre ton pseudo et choisis un jeu !');`n    }`n  });`n`n  socket.on('salle_creee', (data) => {`n    alert('Salle créée ! Ton code est : ' + data.code);`n    document.getElementById('code-salle').textContent = 'Code : ' + data.code;`n  });`n`n  document.getElementById('btn-rejoindre').addEventListener('click', () => {`n    const pseudo = document.getElementById('pseudo').value;`n    const code = document.getElementById('code').value;`n    if (pseudo && code) {`n      socket.emit('rejoindre_salle', { pseudo: pseudo, code: code });`n    } else {`n      alert('Entre ton pseudo et le code de la salle !');`n    }`n  });`n`n  socket.on('joueur_rejoint', (data) => {`n    document.getElementById('joueurs').textContent = 'Joueurs : ' + data.joueurs.join(', ');`n  });`n});"
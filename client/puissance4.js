const socket = io('https://multijeuxgo.onrender.com');
const COLS = 7; const ROWS = 6;
let plateau = []; let monTour = false; let maCouleur = '';
let codePartie = new URLSearchParams(window.location.search).get('code');
function creerGrille() {
  const grille = document.getElementById('grille');
  grille.innerHTML = '';
  plateau = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const div = document.createElement('div');
      div.classList.add('case');
      div.dataset.col = c;
      div.addEventListener('click', () => jouerColonne(c));
      grille.appendChild(div);
    }
  }
}
function jouerColonne(col) {
  if (!monTour) return;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (!plateau[r][col]) {
      socket.emit('jouer_coup', { code: codePartie, coup: { row: r, col: col }, pseudo: '' });
      monTour = false;
      break;
    }
  }
}
function placerPiece(row, col, couleur) {
  plateau[row][col] = couleur;
  const cases = document.querySelectorAll('.case');
  cases[row * COLS + col].classList.add(couleur);
}
socket.on('coup_recu', (data) => {
  placerPiece(data.coup.row, data.coup.col, maCouleur === 'rouge' ? 'jaune' : 'rouge');
  monTour = true;
  document.getElementById('tour-actuel').textContent = 'Ton tour !';
});
socket.on('joueur_rejoint', (data) => {
  document.getElementById('joueur2').textContent = data.joueurs[1] || '?';
  document.getElementById('tour-actuel').textContent = 'La partie commence ! Ton tour !';
  monTour = maCouleur === 'rouge';
});
socket.on('connect', () => {
  if (codePartie) {
    const pseudo = localStorage.getItem('pseudo') || 'Joueur2';
    maCouleur = 'jaune';
    socket.emit('rejoindre_salle', { pseudo: pseudo, code: codePartie });
    document.getElementById('joueur2').textContent = pseudo;
  }
});
creerGrille();

// Quand la page est chargée
document.addEventListener('DOMContentLoaded', () => {

  // Afficher un message de bienvenue
  console.log('MultiJeuxGo chargé !');

  // Animer les cartes de jeux au survol
  const cartes = document.querySelectorAll('.game-card');
  
  cartes.forEach(carte => {
    carte.addEventListener('click', () => {
      const nomJeu = carte.querySelector('.game-name').textContent;
      alert('Tu as choisi : ' + nomJeu + ' ! 🎮');
    });
  });

});
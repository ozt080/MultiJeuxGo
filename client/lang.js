// Système de langues MultiJeuxGo
const LANGUES = {
  fr: {
    nom: 'Français', drapeau: '🇫🇷', dir: 'ltr',
    // Navigation
    jeux: 'Jeux', classement: 'Classement', tournois: 'Tournois',
    chat: 'Chat', profil: 'Profil',
    // Accueil
    titre: 'Joue avec tes amis partout !',
    sousTitre: 'Des dizaines de jeux multijoueur gratuits !',
    nosJeux: 'Nos jeux',
    // Connexion
    connexion: 'Connexion', inscription: 'Créer un compte',
    email: 'Ton email', motDePasse: 'Mot de passe',
    pseudo: 'Ton pseudo', seConnecter: 'Se connecter',
    creerCompte: 'Créer mon compte', dejàCompte: 'Déjà un compte ?',
    pasCompte: 'Pas de compte ?',
    // Jeux
    creerPartie: 'Créer une partie', rejoindre: 'Rejoindre',
    codeSalle: 'Code de la salle', tonTour: 'Ton tour !',
    tourAdversaire: 'Tour de l\'adversaire...', enAttente: 'En attente...',
    rejouer: 'Rejouer', retour: 'Retour',
    // Chat
    ecrireMessage: 'Écris un message...', envoyer: 'Envoyer',
    chatGlobal: 'Chat Global',
    // Profil
    mesAmis: 'Mes amis', ajouterAmi: 'Ajouter un ami',
    emailAmi: 'Email de ton ami', seDeconnecter: 'Se déconnecter',
    // Classement
    victoires: 'Victoires', parties: 'Parties', points: 'Points',
    // Tournois
    creerTournoi: 'Créer un tournoi', sInscrire: 'S\'inscrire',
    nomTournoi: 'Nom du tournoi', inscrit: 'Inscrit !',
    complet: 'Complet', ouvert: 'Ouvert',
  },
  en: {
    nom: 'English', drapeau: '🇬🇧', dir: 'ltr',
    jeux: 'Games', classement: 'Ranking', tournois: 'Tournaments',
    chat: 'Chat', profil: 'Profile',
    titre: 'Play with your friends anywhere!',
    sousTitre: 'Dozens of free multiplayer games!',
    nosJeux: 'Our Games',
    connexion: 'Login', inscription: 'Create Account',
    email: 'Your email', motDePasse: 'Password',
    pseudo: 'Your username', seConnecter: 'Sign In',
    creerCompte: 'Create Account', dejàCompte: 'Already have an account?',
    pasCompte: 'No account?',
    creerPartie: 'Create Game', rejoindre: 'Join',
    codeSalle: 'Room Code', tonTour: 'Your turn!',
    tourAdversaire: 'Opponent\'s turn...', enAttente: 'Waiting...',
    rejouer: 'Play Again', retour: 'Back',
    ecrireMessage: 'Write a message...', envoyer: 'Send',
    chatGlobal: 'Global Chat',
    mesAmis: 'My Friends', ajouterAmi: 'Add a friend',
    emailAmi: 'Friend\'s email', seDeconnecter: 'Sign Out',
    victoires: 'Wins', parties: 'Games', points: 'Points',
    creerTournoi: 'Create Tournament', sInscrire: 'Register',
    nomTournoi: 'Tournament name', inscrit: 'Registered!',
    complet: 'Full', ouvert: 'Open',
  },
  tr: {
    nom: 'Türkçe', drapeau: '🇹🇷', dir: 'ltr',
    jeux: 'Oyunlar', classement: 'Sıralama', tournois: 'Turnuvalar',
    chat: 'Sohbet', profil: 'Profil',
    titre: 'Arkadaşlarınla her yerde oyna!',
    sousTitre: 'Onlarca ücretsiz çok oyunculu oyun!',
    nosJeux: 'Oyunlarımız',
    connexion: 'Giriş', inscription: 'Hesap Oluştur',
    email: 'E-posta', motDePasse: 'Şifre',
    pseudo: 'Kullanıcı adı', seConnecter: 'Giriş Yap',
    creerCompte: 'Hesap Oluştur', dejàCompte: 'Zaten hesabın var mı?',
    pasCompte: 'Hesabın yok mu?',
    creerPartie: 'Oyun Oluştur', rejoindre: 'Katıl',
    codeSalle: 'Oda Kodu', tonTour: 'Senin sıran!',
    tourAdversaire: 'Rakibin sırası...', enAttente: 'Bekleniyor...',
    rejouer: 'Tekrar Oyna', retour: 'Geri',
    ecrireMessage: 'Mesaj yaz...', envoyer: 'Gönder',
    chatGlobal: 'Genel Sohbet',
    mesAmis: 'Arkadaşlarım', ajouterAmi: 'Arkadaş ekle',
    emailAmi: 'Arkadaşının e-postası', seDeconnecter: 'Çıkış Yap',
    victoires: 'Galibiyet', parties: 'Oyunlar', points: 'Puan',
    creerTournoi: 'Turnuva Oluştur', sInscrire: 'Kayıt Ol',
    nomTournoi: 'Turnuva adı', inscrit: 'Kayıtlı!',
    complet: 'Dolu', ouvert: 'Açık',
  },
  ar: {
    nom: 'العربية', drapeau: '🇸🇦', dir: 'rtl',
    jeux: 'الألعاب', classement: 'الترتيب', tournois: 'البطولات',
    chat: 'الدردشة', profil: 'الملف الشخصي',
    titre: 'العب مع أصدقائك في أي مكان!',
    sousTitre: 'عشرات الألعاب الجماعية المجانية!',
    nosJeux: 'ألعابنا',
    connexion: 'تسجيل الدخول', inscription: 'إنشاء حساب',
    email: 'بريدك الإلكتروني', motDePasse: 'كلمة المرور',
    pseudo: 'اسم المستخدم', seConnecter: 'دخول',
    creerCompte: 'إنشاء حساب', dejàCompte: 'لديك حساب؟',
    pasCompte: 'ليس لديك حساب؟',
    creerPartie: 'إنشاء لعبة', rejoindre: 'انضم',
    codeSalle: 'رمز الغرفة', tonTour: 'دورك!',
    tourAdversaire: 'دور الخصم...', enAttente: 'انتظار...',
    rejouer: 'العب مجدداً', retour: 'رجوع',
    ecrireMessage: 'اكتب رسالة...', envoyer: 'إرسال',
    chatGlobal: 'الدردشة العامة',
    mesAmis: 'أصدقائي', ajouterAmi: 'إضافة صديق',
    emailAmi: 'بريد صديقك', seDeconnecter: 'تسجيل الخروج',
    victoires: 'انتصارات', parties: 'مباريات', points: 'نقاط',
    creerTournoi: 'إنشاء بطولة', sInscrire: 'تسجيل',
    nomTournoi: 'اسم البطولة', inscrit: 'مسجل!',
    complet: 'مكتمل', ouvert: 'مفتوح',
  },
  es: {
    nom: 'Español', drapeau: '🇪🇸', dir: 'ltr',
    jeux: 'Juegos', classement: 'Clasificación', tournois: 'Torneos',
    chat: 'Chat', profil: 'Perfil',
    titre: '¡Juega con tus amigos en cualquier lugar!',
    sousTitre: '¡Docenas de juegos multijugador gratuitos!',
    nosJeux: 'Nuestros juegos',
    connexion: 'Iniciar sesión', inscription: 'Crear cuenta',
    email: 'Tu email', motDePasse: 'Contraseña',
    pseudo: 'Tu usuario', seConnecter: 'Entrar',
    creerCompte: 'Crear cuenta', dejàCompte: '¿Ya tienes cuenta?',
    pasCompte: '¿No tienes cuenta?',
    creerPartie: 'Crear partida', rejoindre: 'Unirse',
    codeSalle: 'Código de sala', tonTour: '¡Tu turno!',
    tourAdversaire: 'Turno del rival...', enAttente: 'Esperando...',
    rejouer: 'Jugar de nuevo', retour: 'Volver',
    ecrireMessage: 'Escribe un mensaje...', envoyer: 'Enviar',
    chatGlobal: 'Chat Global',
    mesAmis: 'Mis amigos', ajouterAmi: 'Añadir amigo',
    emailAmi: 'Email de tu amigo', seDeconnecter: 'Cerrar sesión',
    victoires: 'Victorias', parties: 'Partidas', points: 'Puntos',
    creerTournoi: 'Crear torneo', sInscrire: 'Inscribirse',
    nomTournoi: 'Nombre del torneo', inscrit: '¡Inscrito!',
    complet: 'Completo', ouvert: 'Abierto',
  }
};

// Langue actuelle
let langueActuelle = localStorage.getItem('langue') || 'fr';

// Obtenir une traduction
function t(cle) {
  return LANGUES[langueActuelle][cle] || LANGUES['fr'][cle] || cle;
}

// Changer de langue
function changerLangue(code) {
  langueActuelle = code;
  localStorage.setItem('langue', code);
  document.documentElement.lang = code;
  document.documentElement.dir = LANGUES[code].dir;
  appliquerTraductions();
}

// Appliquer les traductions à la page
function appliquerTraductions() {
  document.querySelectorAll('[data-lang]').forEach(el => {
    const cle = el.getAttribute('data-lang');
    if (el.tagName === 'INPUT') {
      el.placeholder = t(cle);
    } else {
      el.textContent = t(cle);
    }
  });
}

// Créer le sélecteur de langue
function creerSélecteurLangue() {
  const sel = document.createElement('div');
  sel.id = 'lang-selector';
  sel.style.cssText = `
    position: fixed; bottom: 70px; right: 16px; z-index: 999;
    display: flex; flex-direction: column; gap: 4px; align-items: flex-end;
  `;

  const btn = document.createElement('button');
  btn.id = 'lang-btn';
  btn.style.cssText = `
    padding: 8px 12px; border-radius: 50px; border: 1px solid #7c5cbf;
    background: #1a1828; color: white; font-size: 14px; cursor: pointer;
    font-family: 'Nunito', sans-serif; font-weight: 700;
  `;
  btn.textContent = LANGUES[langueActuelle].drapeau + ' ' + LANGUES[langueActuelle].nom;
  btn.onclick = () => {
    const menu = document.getElementById('lang-menu');
    menu.style.display = menu.style.display === 'none' ? 'flex' : 'none';
  };

  const menu = document.createElement('div');
  menu.id = 'lang-menu';
  menu.style.cssText = `
    display: none; flex-direction: column; gap: 4px;
    background: #1a1828; border: 1px solid #7c5cbf; border-radius: 12px;
    padding: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  `;

  Object.entries(LANGUES).forEach(([code, lang]) => {
    const item = document.createElement('button');
    item.style.cssText = `
      padding: 8px 16px; border-radius: 8px; border: none;
      background: ${code === langueActuelle ? '#7c5cbf' : 'transparent'};
      color: white; font-family: 'Nunito', sans-serif; font-weight: 700;
      font-size: 13px; cursor: pointer; text-align: left; white-space: nowrap;
    `;
    item.textContent = lang.drapeau + ' ' + lang.nom;
    item.onclick = () => {
      changerLangue(code);
      btn.textContent = lang.drapeau + ' ' + lang.nom;
      menu.style.display = 'none';
      document.querySelectorAll('#lang-menu button').forEach(b => b.style.background = 'transparent');
      item.style.background = '#7c5cbf';
    };
    menu.appendChild(item);
  });

  sel.appendChild(menu);
  sel.appendChild(btn);
  document.body.appendChild(sel);
}

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', () => {
  creerSélecteurLangue();
  appliquerTraductions();
  document.documentElement.dir = LANGUES[langueActuelle].dir;
});
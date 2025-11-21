function launchGame(game) {
  window.location.href = game + ".html";
}
<script type="module"></script>
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "TA_CLE_API",
  authDomain: "multi-jeuxgo.firebaseapp.com",
  projectId: "multi-jeuxgo",
  storageBucket: "multi-jeuxgo.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Affiche le nom de l’utilisateur connecté
onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById("welcome").textContent = `Bienvenue 👋 ${user.email}`;
  } else {
    document.getElementById("welcome").textContent = "Bienvenue sur MultiJeuxGo !";
  }
});

<?php
session_start();
require_once __DIR__ . '/config/db.php';
$erreur = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $mdp   = $_POST['mot_de_passe'] ?? '';
    $stmt  = $pdo->prepare("SELECT id, pseudo, mot_de_passe FROM joueurs WHERE email = ?");
    $stmt->execute([$email]);
    $joueur = $stmt->fetch();

    if ($joueur && password_verify($mdp, $joueur['mot_de_passe'])) {
        $_SESSION['joueur_id']     = $joueur['id'];
        $_SESSION['joueur_pseudo'] = $joueur['pseudo'];
        header('Location: index.php');
        exit;
    }
    $erreur = "Email ou mot de passe incorrect.";
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Connexion - MultiJeuxGo</title>
    <link rel="stylesheet" href="assets/css/plato.css">
</head>
<body>
    <div class="auth-card">
        <h1>Bon retour 👋</h1>
        <p class="sub">Connecte-toi pour sauvegarder tes victoires et tes points.</p>
        <?php if (isset($_GET['inscrit'])): ?><div class="alert alert-ok">Compte créé avec succès !</div><?php endif; ?>
        <?php if ($erreur): ?><div class="alert alert-err"><?= htmlspecialchars($erreur) ?></div><?php endif; ?>
        <form method="post">
            <div class="form-group">
                <label>Adresse email</label>
                <input class="form-control" type="email" name="email" required>
            </div>
            <div class="form-group">
                <label>Mot de passe</label>
                <input class="form-control" type="password" name="mot_de_passe" required>
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%;margin-top:8px;">Se connecter</button>
        </form>
        <p style="margin-top:16px;font-size:0.88rem;color:var(--text-muted);text-align:center;">
            Pas encore de compte ? <a href="register.php" style="color:#818cf8;font-weight:700;">S'inscrire</a> · <a href="index.php">Lobby</a>
        </p>
    </div>
</body>
</html>
<?php
session_start();
require_once __DIR__ . '/config/db.php';
$erreur = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $pseudo = trim($_POST['pseudo'] ?? '');
    $email  = trim($_POST['email'] ?? '');
    $mdp    = $_POST['mot_de_passe'] ?? '';

    if ($pseudo === '' || $email === '' || strlen($mdp) < 6) {
        $erreur = "Tous les champs sont obligatoires (6 caractères minimum).";
    } else {
        $verif = $pdo->prepare("SELECT id FROM joueurs WHERE email = ? OR pseudo = ?");
        $verif->execute([$email, $pseudo]);
        if ($verif->fetch()) {
            $erreur = "Ce pseudo ou cet email est déjà utilisé.";
        } else {
            $hash = password_hash($mdp, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("INSERT INTO joueurs (pseudo, email, mot_de_passe) VALUES (?, ?, ?)");
            $stmt->execute([$pseudo, $email, $hash]);
            header('Location: login.php?inscrit=1');
            exit;
        }
    }
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Inscription - MultiJeuxGo</title>
    <link rel="stylesheet" href="assets/css/plato.css">
</head>
<body>
    <div class="auth-card">
        <h1>Rejoins l'arène 🚀</h1>
        <p class="sub">Crée ton profil joueur sur MultiJeuxGo.</p>
        <?php if ($erreur): ?><div class="alert alert-err"><?= htmlspecialchars($erreur) ?></div><?php endif; ?>
        <form method="post">
            <div class="form-group">
                <label>Pseudo joueur</label>
                <input class="form-control" type="text" name="pseudo" required>
            </div>
            <div class="form-group">
                <label>Adresse email</label>
                <input class="form-control" type="email" name="email" required>
            </div>
            <div class="form-group">
                <label>Mot de passe (6 car. min)</label>
                <input class="form-control" type="password" name="mot_de_passe" required>
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%;margin-top:8px;">Créer mon compte</button>
        </form>
        <p style="margin-top:16px;font-size:0.88rem;color:var(--text-muted);text-align:center;">
            Déjà inscrit ? <a href="login.php" style="color:#818cf8;font-weight:700;">Connexion</a> · <a href="index.php">Lobby</a>
        </p>
    </div>
</body>
</html>
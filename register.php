<?php
session_start();
require_once __DIR__ . '/config/db.php';

$erreur = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $pseudo = trim($_POST['pseudo'] ?? '');
    $email  = trim($_POST['email'] ?? '');
    $mdp    = $_POST['mot_de_passe'] ?? '';

    if ($pseudo === '' || $email === '' || strlen($mdp) < 6) {
        $erreur = "Tous les champs sont obligatoires (6 caractères minimum pour le mot de passe).";
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
    <style>
        body { font-family: Arial, sans-serif; max-width: 420px; margin: 40px auto; padding: 0 15px; }
        input, button { width: 100%; padding: 10px; margin: 8px 0; box-sizing: border-box; }
        button { background: #2563eb; color: #fff; border: none; cursor: pointer; }
        .err { color: #dc2626; }
    </style>
</head>
<body>
    <h1>Créer un compte</h1>
    <?php if ($erreur): ?><p class="err"><?= htmlspecialchars($erreur) ?></p><?php endif; ?>
    <form method="post">
        <input type="text" name="pseudo" placeholder="Pseudo" required>
        <input type="email" name="email" placeholder="Adresse email" required>
        <input type="password" name="mot_de_passe" placeholder="Mot de passe (6 car. min)" required>
        <button type="submit">S'inscrire</button>
    </form>
    <p><a href="login.php">Déjà inscrit ? Se connecter</a> | <a href="index.php">Accueil</a></p>
</body>
</html>
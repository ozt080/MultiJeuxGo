<?php
session_start();
require_once __DIR__ . '/config/db.php';

$erreur = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $mdp   = $_POST['mot_de_passe'] ?? '';

    $stmt = $pdo->prepare("SELECT id, pseudo, mot_de_passe FROM joueurs WHERE email = ?");
    $stmt->execute([$email]);
    $joueur = $stmt->fetch();

    if ($joueur && password_verify($mdp, $joueur['mot_de_passe'])) {
        $_SESSION['joueur_id']     = $joueur['id'];
        $_SESSION['joueur_pseudo'] = $joueur['pseudo'];
        header('Location: index.php');
        exit;
    } else {
        $erreur = "Email ou mot de passe incorrect.";
    }
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Connexion - MultiJeuxGo</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 420px; margin: 40px auto; padding: 0 15px; }
        input, button { width: 100%; padding: 10px; margin: 8px 0; box-sizing: border-box; }
        button { background: #16a34a; color: #fff; border: none; cursor: pointer; }
        .err { color: #dc2626; }
        .ok { color: #16a34a; }
    </style>
</head>
<body>
    <h1>Connexion</h1>
    <?php if (isset($_GET['inscrit'])): ?><p class="ok">Compte créé ! Tu peux te connecter.</p><?php endif; ?>
    <?php if ($erreur): ?><p class="err"><?= htmlspecialchars($erreur) ?></p><?php endif; ?>
    <form method="post">
        <input type="email" name="email" placeholder="Adresse email" required>
        <input type="password" name="mot_de_passe" placeholder="Mot de passe" required>
        <button type="submit">Se connecter</button>
    </form>
    <p><a href="register.php">Créer un compte</a> | <a href="index.php">Accueil</a></p>
</body>
</html>
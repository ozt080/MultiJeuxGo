<?php
session_start();
require_once __DIR__ . '/../config/db.php';

if (!isset($_SESSION['joueur_id'])) {
    header('Location: ../login.php');
    exit;
}

if (isset($_GET['nouvelle']) || !isset($_SESSION['pom_nombre'])) {
    $_SESSION['pom_nombre'] = random_int(1, 100);
    $_SESSION['pom_essais'] = 0;
}

$message = '';
$gagne   = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['proposition'])) {
    $prop = (int) $_POST['proposition'];
    $_SESSION['pom_essais']++;

    if ($prop < $_SESSION['pom_nombre']) {
        $message = "C'est plus ! (Essai n°" . $_SESSION['pom_essais'] . ")";
    } elseif ($prop > $_SESSION['pom_nombre']) {
        $message = "C'est moins ! (Essai n°" . $_SESSION['pom_essais'] . ")";
    } else {
        $essais = $_SESSION['pom_essais'];
        $points = max(10, 110 - ($essais * 10));
        $gagne  = true;

        $stmtJeu = $pdo->prepare("SELECT id FROM jeux WHERE slug = ?");
        $stmtJeu->execute(['plus-ou-moins']);
        $jeu = $stmtJeu->fetch();

        if ($jeu) {
            $ins = $pdo->prepare("INSERT INTO parties (id_joueur, id_jeu, score_obtenu) VALUES (?, ?, ?)");
            $ins->execute([$_SESSION['joueur_id'], $jeu['id'], $points]);

            $upd = $pdo->prepare("UPDATE joueurs SET score = score + ? WHERE id = ?");
            $upd->execute([$points, $_SESSION['joueur_id']]);
        }

        $message = "Bravo ! Nombre trouvé en $essais essai(s). Tu gagnes +$points points !";
        unset($_SESSION['pom_nombre'], $_SESSION['pom_essais']);
    }
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Plus ou Moins - MultiJeuxGo</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 480px; margin: 40px auto; padding: 0 15px; }
        input, button { width: 100%; padding: 10px; margin: 8px 0; box-sizing: border-box; }
        button { background: #2563eb; color: #fff; border: none; cursor: pointer; }
        .msg { padding: 12px; background: #f1f5f9; border-radius: 6px; margin: 15px 0; }
    </style>
</head>
<body>
    <h1>Plus ou Moins</h1>
    <p>Devine le nombre mystère compris entre <strong>1</strong> et <strong>100</strong>.</p>

    <?php if ($message): ?>
        <div class="msg"><strong><?= htmlspecialchars($message) ?></strong></div>
    <?php endif; ?>

    <?php if (!$gagne): ?>
        <form method="post">
            <input type="number" name="proposition" min="1" max="100" placeholder="Entre un nombre (1-100)" required autofocus>
            <button type="submit">Proposer</button>
        </form>
    <?php else: ?>
        <p><a href="plus-ou-moins.php?nouvelle=1">Rejouer une partie</a></p>
    <?php endif; ?>

    <p><a href="../index.php">Retour à l'accueil</a></p>
</body>
</html>
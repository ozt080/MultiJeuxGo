<?php
session_start();
require_once __DIR__ . '/config/db.php';

$jeux = $pdo->query("SELECT * FROM jeux ORDER BY nom ASC")->fetchAll();
$classement = $pdo->query("SELECT pseudo, score FROM joueurs ORDER BY score DESC LIMIT 5")->fetchAll();
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>MultiJeuxGo - Accueil</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 30px auto; padding: 0 15px; }
        nav { display: flex; justify-content: space-between; padding: 12px; background: #f1f5f9; border-radius: 6px; margin-bottom: 24px; }
        .carte { border: 1px solid #cbd5e1; padding: 15px; border-radius: 6px; margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
    </style>
</head>
<body>
    <nav>
        <strong>MultiJeuxGo</strong>
        <div>
            <?php if (isset($_SESSION['joueur_id'])): ?>
                Connecté : <strong><?= htmlspecialchars($_SESSION['joueur_pseudo']) ?></strong> |
                <a href="logout.php">Déconnexion</a>
            <?php else: ?>
                <a href="login.php">Connexion</a> |
                <a href="register.php">Inscription</a>
            <?php endif; ?>
        </div>
    </nav>

    <h2>Jeux disponibles</h2>
    <?php foreach ($jeux as $jeu): ?>
    <div class="carte">
        <h3><?= htmlspecialchars($jeu['nom']) ?></h3>
        <p><?= htmlspecialchars($jeu['description']) ?></p>
        <?php if (file_exists(__DIR__ . '/jeux/' . $jeu['slug'] . '.php')): ?>
            <a href="jeux/<?= htmlspecialchars($jeu['slug']) ?>.php">Jouer</a>
        <?php else: ?>
            <em>Bientôt disponible</em>
        <?php endif; ?>
    </div>
<?php endforeach; ?>

    <h2>Top 5 des joueurs</h2>
    <table>
        <tr><th>Pseudo</th><th>Score total</th></tr>
        <?php foreach ($classement as $j): ?>
            <tr>
                <td><?= htmlspecialchars($j['pseudo']) ?></td>
                <td><?= (int)$j['score'] ?> pts</td>
            </tr>
        <?php endforeach; ?>
    </table>
</body>
</html>
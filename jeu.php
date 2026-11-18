<?php
session_start();
require_once __DIR__ . '/config/db.php';

if (!isset($_SESSION['joueur_id'])) {
    header('Location: login.php');
    exit;
}

$slug = trim($_GET['slug'] ?? '');
$stmt = $pdo->prepare("SELECT * FROM jeux WHERE slug = ?");
$stmt->execute([$slug]);
$jeu = $stmt->fetch();

if (!$jeu) {
    header('Location: index.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($jeu['nom']) ?> - MultiJeuxGo</title>
    <link rel="stylesheet" href="assets/css/plato.css">
</head>
<body>
    <div class="arena-wrapper">
        <div class="arena-header">
            <div style="display:flex;align-items:center;gap:12px;">
                <span style="font-size:2rem;"><?= htmlspecialchars($jeu['icone']) ?></span>
                <div>
                    <h1 style="font-size:1.3rem;"><?= htmlspecialchars($jeu['nom']) ?></h1>
                    <span style="font-size:0.82rem;color:var(--text-muted);"><?= htmlspecialchars($jeu['categorie']) ?></span>
                </div>
            </div>
            <div style="display:flex;gap:10px;">
                <button onclick="location.reload()" class="btn btn-ghost">↻ Rejouer</button>
                <a href="index.php" class="btn btn-primary">← Lobby</a>
            </div>
        </div>

        <div class="arena-stage">
            <canvas id="gameCanvas" width="760" height="440"></canvas>
            <div id="domGameArea" class="dom-arena" style="display:none;"></div>
            <p id="controlsHint" class="controls-hint"></p>
            <div id="victoryBox" class="victory-banner" style="display:none;"></div>
        </div>
    </div>

    <script>
        window.GAME_CONFIG = {
            slug: <?= json_encode($jeu['slug']) ?>,
            nom: <?= json_encode($jeu['nom']) ?>,
            couleur: <?= json_encode($jeu['couleur']) ?>
        };
    </script>
    <script src="assets/js/games.js"></script>
</body>
</html>
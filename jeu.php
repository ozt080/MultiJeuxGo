<?php
session_start();
require_once __DIR__ . '/config/db.php';

if (!isset($_SESSION['joueur_id'])) {
    header('Location: login.php');
    exit;
}

$slug = trim($_GET['slug'] ?? '');
$salonCode = strtoupper(trim($_GET['salon'] ?? ''));

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
                    <span style="font-size:0.82rem;color:var(--text-muted);"><?= $salonCode ? 'Salon privé multijoueur' : htmlspecialchars($jeu['categorie']) ?></span>
                </div>
            </div>
            <div style="display:flex;gap:10px;">
                <?php if (!$salonCode): ?>
                    <button onclick="location.reload()" class="btn btn-ghost">↻ Rejouer</button>
                <?php endif; ?>
                <a href="index.php" class="btn btn-primary">← Lobby</a>
            </div>
        </div>

        <?php if ($salonCode): ?>
            <div class="salon-hud" id="salonHud">
                <div style="display:flex;align-items:center;gap:12px;">
                    <span>Code d'invitation :</span>
                    <span class="invite-code-badge" id="codeText"><?= htmlspecialchars($salonCode) ?></span>
                    <button type="button" class="btn btn-ghost" onclick="copierCode()">📋 Copier</button>
                </div>
                <div id="playersStatus" style="font-size:0.9rem;font-weight:700;">
                    Connexion au salon...
                </div>
            </div>
        <?php endif; ?>

        <div class="arena-stage">
            <div id="waitingRoom" class="dom-arena" style="display:none;">
                <h2>⏳ En attente de ton ami...</h2>
                <p style="color:var(--text-muted);max-width:460px;">
                    Envoie le code <strong style="color:#fbbf24;font-size:1.1rem;"><?= htmlspecialchars($salonCode) ?></strong> à ton ami. Dès qu'il l'entre sur la page d'accueil, la partie démarre automatiquement !
                </p>
            </div>
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
            couleur: <?= json_encode($jeu['couleur']) ?>,
            salon: <?= json_encode($salonCode ?: null) ?>
        };

        function copierCode() {
            const code = document.getElementById('codeText').textContent;
            navigator.clipboard.writeText(code);
            alert('Code ' + code + ' copié ! Envoie-le à ton ami.');
        }
    </script>
    <script src="assets/js/games.js"></script>
</body>
</html>
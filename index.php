<?php
session_start();
require_once __DIR__ . '/config/db.php';

$jeux = $pdo->query("SELECT * FROM jeux ORDER BY FIELD(categorie, 'Sport', 'Plateau & Cartes', 'Arcade', 'Réflexion'), nom ASC")->fetchAll();
$classement = $pdo->query("SELECT pseudo, score FROM joueurs ORDER BY score DESC LIMIT 8")->fetchAll();
$activite = $pdo->query("
    SELECT j.pseudo, g.nom AS jeu_nom, g.icone, p.score_obtenu
    FROM parties p
    JOIN joueurs j ON p.id_joueur = j.id
    JOIN jeux g ON p.id_jeu = g.id
    ORDER BY p.joue_le DESC
    LIMIT 6
")->fetchAll();

$monScore = 0;
$mesParties = 0;
if (isset($_SESSION['joueur_id'])) {
    $st = $pdo->prepare("SELECT score FROM joueurs WHERE id = ?");
    $st->execute([$_SESSION['joueur_id']]);
    $monScore = (int)$st->fetchColumn();

    $stp = $pdo->prepare("SELECT COUNT(*) FROM parties WHERE id_joueur = ?");
    $stp->execute([$_SESSION['joueur_id']]);
    $mesParties = (int)$stp->fetchColumn();
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MultiJeuxGo - Lobby Arcade & Social</title>
    <link rel="stylesheet" href="assets/css/plato.css">
</head>
<body>
    <nav class="navbar">
        <a href="index.php" class="brand">
            <span class="brand-badge">🎮</span>
            <span>MultiJeux<span style="color:#818cf8;">Go</span></span>
        </a>
        <div class="nav-actions">
            <?php if (isset($_SESSION['joueur_id'])): ?>
                <div class="player-pill">
                    <span class="avatar-circle"><?= htmlspecialchars(substr($_SESSION['joueur_pseudo'], 0, 2)) ?></span>
                    <strong><?= htmlspecialchars($_SESSION['joueur_pseudo']) ?></strong>
                    <span class="score-chip">⭐ <?= $monScore ?> pts</span>
                </div>
                <a href="logout.php" class="btn btn-danger">Quitter</a>
            <?php else: ?>
                <a href="login.php" class="btn btn-ghost">Connexion</a>
                <a href="register.php" class="btn btn-primary">Créer un compte</a>
            <?php endif; ?>
        </div>
    </nav>

    <div class="container">
        <section class="hero-banner">
            <div>
                <h1>Joue. Défie tes amis. Grimpe au classement.</h1>
                <p>Crée un salon privé sur n'importe quel jeu, partage ton code à 6 caractères à tes amis et affrontez-vous en direct !</p>
            </div>
            <div class="hero-stats">
                <div class="stat-box">
                    <strong><?= count($jeux) ?></strong>
                    <span>Jeux actifs</span>
                </div>
                <?php if (isset($_SESSION['joueur_id'])): ?>
                    <div class="stat-box">
                        <strong><?= $mesParties ?></strong>
                        <span>Tes parties</span>
                    </div>
                    <div class="stat-box">
                        <strong style="color:#fbbf24;">Niv. <?= max(1, (int)floor($monScore / 200) + 1) ?></strong>
                        <span>Ton rang</span>
                    </div>
                <?php endif; ?>
            </div>
        </section>

        <section class="room-bar">
            <div>
                <strong>👥 Jouer entre amis</strong>
                <p style="font-size:0.85rem;color:var(--text-muted);">Ton ami t'a envoyé un code ? Entre-le ici pour rejoindre sa partie :</p>
            </div>
            <form id="joinRoomForm" class="room-join-form">
                <input type="text" id="roomCodeInput" class="form-control code-input" maxlength="6" placeholder="CODE" required>
                <button type="submit" class="btn btn-primary">Rejoindre</button>
            </form>
        </section>

        <div class="filter-bar">
            <button class="filter-pill active" data-cat="ALL">Tous les jeux (<?= count($jeux) ?>)</button>
            <button class="filter-pill" data-cat="Sport">⚽ Sport</button>
            <button class="filter-pill" data-cat="Plateau & Cartes">🎲 Plateau & Cartes</button>
            <button class="filter-pill" data-cat="Arcade">🕹️ Arcade</button>
            <button class="filter-pill" data-cat="Réflexion">🧠 Réflexion</button>
        </div>

        <div class="lobby-grid">
            <main class="games-grid" id="gamesGrid">
                <?php foreach ($jeux as $jeu): ?>
                    <article class="game-card" data-cat="<?= htmlspecialchars($jeu['categorie']) ?>">
                        <div class="game-banner" style="background: linear-gradient(135deg, <?= htmlspecialchars($jeu['couleur']) ?>, #0f172a);">
                            <span class="game-cat-tag"><?= htmlspecialchars($jeu['categorie']) ?></span>
                            <span><?= htmlspecialchars($jeu['icone']) ?></span>
                        </div>
                        <div class="game-body">
                            <h3><?= htmlspecialchars($jeu['nom']) ?></h3>
                            <p><?= htmlspecialchars($jeu['description']) ?></p>
                            <div class="card-actions">
                                <a href="jeu.php?slug=<?= urlencode($jeu['slug']) ?>" class="btn-play" style="background: <?= htmlspecialchars($jeu['couleur']) ?>; flex:1;">
                                    Solo
                                </a>
                                <button type="button" class="btn-room" onclick="creerSalon('<?= htmlspecialchars($jeu['slug']) ?>')" title="Créer un salon avec code ami">
                                    👥 Amis
                                </button>
                            </div>
                        </div>
                    </article>
                <?php endforeach; ?>
            </main>

            <aside>
                <div class="side-panel">
                    <h2>🏆 Classement Général</h2>
                    <?php foreach ($classement as $i => $j): ?>
                        <div class="leader-row">
                            <div class="leader-left">
                                <span class="rank-badge rank-<?= $i + 1 ?>"><?= $i + 1 ?></span>
                                <span><?= htmlspecialchars($j['pseudo']) ?></span>
                            </div>
                            <span class="score-chip"><?= (int)$j['score'] ?> pts</span>
                        </div>
                    <?php endforeach; ?>
                </div>

                <div class="side-panel">
                    <h2>⚡ Dernières parties</h2>
                    <?php if (empty($activite)): ?>
                        <p class="feed-item">Aucune partie jouée pour l'instant. Lance le premier défi !</p>
                    <?php else: ?>
                        <?php foreach ($activite as $act): ?>
                            <div class="feed-item">
                                <?= htmlspecialchars($act['icone']) ?>
                                <strong><?= htmlspecialchars($act['pseudo']) ?></strong> a gagné
                                <strong>+<?= (int)$act['score_obtenu'] ?> pts</strong> sur
                                <em><?= htmlspecialchars($act['jeu_nom']) ?></em>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
            </aside>
        </div>
    </div>

    <script>
        document.querySelectorAll('.filter-pill').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const cat = btn.dataset.cat;
                document.querySelectorAll('.game-card').forEach(card => {
                    card.style.display = (cat === 'ALL' || card.dataset.cat === cat) ? 'flex' : 'none';
                });
            });
        });

        async function creerSalon(slug) {
            const res = await fetch('api/salon.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'creer', slug })
            });
            if (res.status === 401) { window.location.href = 'login.php'; return; }
            const data = await res.json();
            if (data.ok) {
                window.location.href = `jeu.php?slug=${encodeURIComponent(data.slug)}&salon=${encodeURIComponent(data.code)}`;
            } else {
                alert(data.erreur || 'Impossible de créer le salon.');
            }
        }

        document.getElementById('joinRoomForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const code = document.getElementById('roomCodeInput').value.trim().toUpperCase();
            const res = await fetch('api/salon.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'rejoindre', code })
            });
            if (res.status === 401) { window.location.href = 'login.php'; return; }
            const data = await res.json();
            if (data.ok) {
                window.location.href = `jeu.php?slug=${encodeURIComponent(data.slug)}&salon=${encodeURIComponent(data.code)}`;
            } else {
                alert(data.erreur || 'Code invalide.');
            }
        });
    </script>
</body>
</html>
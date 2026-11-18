<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/db.php';

if (!isset($_SESSION['joueur_id'])) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'erreur' => 'Tu dois être connecté pour jouer en ligne.']);
    exit;
}

$userId = (int)$_SESSION['joueur_id'];
$action = $_GET['action'] ?? ($_POST['action'] ?? '');
$input  = json_decode(file_get_contents('php://input'), true) ?? [];
if (!$action && isset($input['action'])) {
    $action = $input['action'];
}

function genererCodeSalon(PDO $pdo): string {
    $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    do {
        $code = '';
        for ($i = 0; $i < 6; $i++) {
            $code .= $chars[random_int(0, strlen($chars) - 1)];
        }
        $check = $pdo->prepare("SELECT id FROM salons WHERE code = ?");
        $check->execute([$code]);
    } while ($check->fetch());
    return $code;
}

function etatInitial(string $slug): array {
    return match ($slug) {
        'morpion'     => ['board' => array_fill(0, 9, ''), 'tour' => 'hote', 'gagnant' => null],
        'puissance-4' => ['grid' => array_fill(0, 6, array_fill(0, 7, 0)), 'tour' => 'hote', 'gagnant' => null],
        'pfc'         => ['choix_hote' => null, 'choix_invite' => null, 'manche' => 1, 'info' => 'Choisissez votre coup !', 'gagnant' => null],
        'ludo'        => ['pos_hote' => 0, 'pos_invite' => 0, 'tour' => 'hote', 'de' => '-', 'gagnant' => null],
        default       => ['mode' => 'duel', 'hote_fini' => false, 'invite_fini' => false, 'gagnant' => null],
    };
}

if ($action === 'creer') {
    $slug = trim($input['slug'] ?? ($_POST['slug'] ?? ''));
    $stmt = $pdo->prepare("SELECT id, slug FROM jeux WHERE slug = ?");
    $stmt->execute([$slug]);
    $jeu = $stmt->fetch();

    if (!$jeu) {
        echo json_encode(['ok' => false, 'erreur' => 'Jeu introuvable.']);
        exit;
    }

    $code = genererCodeSalon($pdo);
    $etat = json_encode(etatInitial($jeu['slug']));

    $ins = $pdo->prepare("INSERT INTO salons (code, id_jeu, id_hote, statut, etat_jeu) VALUES (?, ?, ?, 'attente', ?)");
    $ins->execute([$code, $jeu['id'], $userId, $etat]);

    echo json_encode(['ok' => true, 'code' => $code, 'slug' => $jeu['slug']]);
    exit;
}

if ($action === 'rejoindre') {
    $code = strtoupper(trim($input['code'] ?? ($_POST['code'] ?? '')));
    $stmt = $pdo->prepare("
        SELECT s.*, g.slug
        FROM salons s
        JOIN jeux g ON s.id_jeu = g.id
        WHERE s.code = ?
    ");
    $stmt->execute([$code]);
    $salon = $stmt->fetch();

    if (!$salon) {
        echo json_encode(['ok' => false, 'erreur' => 'Code de salon invalide ou expiré.']);
        exit;
    }

    if ((int)$salon['id_hote'] !== $userId) {
        if ($salon['id_invite'] !== null && (int)$salon['id_invite'] !== $userId) {
            echo json_encode(['ok' => false, 'erreur' => 'Ce salon est déjà complet (2/2 joueurs).']);
            exit;
        }
        if ($salon['id_invite'] === null) {
            $upd = $pdo->prepare("UPDATE salons SET id_invite = ?, statut = 'en_cours' WHERE id = ?");
            $upd->execute([$userId, $salon['id']]);
        }
    }

    echo json_encode(['ok' => true, 'code' => $salon['code'], 'slug' => $salon['slug']]);
    exit;
}

if ($action === 'etat') {
    $code = strtoupper(trim($_GET['code'] ?? ''));
    $stmt = $pdo->prepare("
        SELECT s.*, g.slug, g.nom AS jeu_nom, h.pseudo AS hote_pseudo, i.pseudo AS invite_pseudo
        FROM salons s
        JOIN jeux g ON s.id_jeu = g.id
        JOIN joueurs h ON s.id_hote = h.id
        LEFT JOIN joueurs i ON s.id_invite = i.id
        WHERE s.code = ?
    ");
    $stmt->execute([$code]);
    $salon = $stmt->fetch();

    if (!$salon) {
        echo json_encode(['ok' => false, 'erreur' => 'Salon introuvable.']);
        exit;
    }

    $role = ((int)$salon['id_hote'] === $userId) ? 'hote' : (((int)$salon['id_invite'] === $userId) ? 'invite' : 'spectateur');

    echo json_encode([
        'ok'            => true,
        'code'          => $salon['code'],
        'statut'        => $salon['statut'],
        'role'          => $role,
        'hote_pseudo'   => $salon['hote_pseudo'],
        'invite_pseudo' => $salon['invite_pseudo'],
        'score_hote'    => (int)$salon['score_hote'],
        'score_invite'  => (int)$salon['score_invite'],
        'etat_jeu'      => json_decode($salon['etat_jeu'] ?: '{}', true),
    ]);
    exit;
}

if ($action === 'jouer') {
    $code = strtoupper(trim($input['code'] ?? ''));
    $stmt = $pdo->prepare("SELECT * FROM salons WHERE code = ?");
    $stmt->execute([$code]);
    $salon = $stmt->fetch();

    if (!$salon || $salon['statut'] === 'termine') {
        echo json_encode(['ok' => false, 'erreur' => 'Partie indisponible ou déjà terminée.']);
        exit;
    }

    $role = ((int)$salon['id_hote'] === $userId) ? 'hote' : 'invite';
    $etat = json_decode($salon['etat_jeu'] ?: '{}', true);
    $nouveauStatut = $salon['statut'];
    $scoreHote = (int)$salon['score_hote'];
    $scoreInvite = (int)$salon['score_invite'];

    if (isset($input['etat_jeu'])) {
        $etat = $input['etat_jeu'];
    }
    if (isset($input['score'])) {
        if ($role === 'hote') {
            $scoreHote = (int)$input['score'];
        } else {
            $scoreInvite = (int)$input['score'];
        }
    }
    if (!empty($input['termine'])) {
        $nouveauStatut = 'termine';
        $ptsHote   = !empty($input['pts_hote']) ? (int)$input['pts_hote'] : 50;
        $ptsInvite = !empty($input['pts_invite']) ? (int)$input['pts_invite'] : 50;

        $ins = $pdo->prepare("INSERT INTO parties (id_joueur, id_jeu, score_obtenu) VALUES (?, ?, ?)");
        $upd = $pdo->prepare("UPDATE joueurs SET score = score + ? WHERE id = ?");

        $ins->execute([(int)$salon['id_hote'], (int)$salon['id_jeu'], $ptsHote]);
        $upd->execute([$ptsHote, (int)$salon['id_hote']]);

        if ($salon['id_invite']) {
            $ins->execute([(int)$salon['id_invite'], (int)$salon['id_jeu'], $ptsInvite]);
            $upd->execute([$ptsInvite, (int)$salon['id_invite']]);
        }
    }

    $save = $pdo->prepare("UPDATE salons SET etat_jeu = ?, score_hote = ?, score_invite = ?, statut = ? WHERE id = ?");
    $save->execute([json_encode($etat), $scoreHote, $scoreInvite, $nouveauStatut, $salon['id']]);

    echo json_encode(['ok' => true]);
    exit;
}

echo json_encode(['ok' => false, 'erreur' => 'Action inconnue.']);
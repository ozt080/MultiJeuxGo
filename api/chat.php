<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/db.php';

if (!isset($_SESSION['joueur_id'])) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'erreur' => 'Non connecté']);
    exit;
}

$userId = (int)$_SESSION['joueur_id'];
$action = $_GET['action'] ?? '';
$input  = json_decode(file_get_contents('php://input'), true) ?? [];
if (!$action && isset($input['action'])) {
    $action = $input['action'];
}

if ($action === 'joueurs') {
    $stmt = $pdo->prepare("SELECT id, pseudo, score FROM joueurs WHERE id != ? ORDER BY pseudo ASC");
    $stmt->execute([$userId]);
    echo json_encode(['ok' => true, 'joueurs' => $stmt->fetchAll()]);
    exit;
}

if ($action === 'lire') {
    $mode  = $_GET['mode'] ?? 'general';
    $salon = strtoupper(trim($_GET['salon'] ?? ''));
    $avec  = (int)($_GET['avec'] ?? 0);

    if ($mode === 'salon' && $salon !== '') {
        $stmt = $pdo->prepare("
            SELECT m.id, m.id_expediteur, j.pseudo, m.contenu, DATE_FORMAT(m.envoye_le, '%H:%i') AS heure
            FROM messages m
            JOIN joueurs j ON m.id_expediteur = j.id
            WHERE m.code_salon = ?
            ORDER BY m.id DESC
            LIMIT 50
        ");
        $stmt->execute([$salon]);
    } elseif ($mode === 'prive' && $avec > 0) {
        $stmt = $pdo->prepare("
            SELECT m.id, m.id_expediteur, j.pseudo, m.contenu, DATE_FORMAT(m.envoye_le, '%H:%i') AS heure
            FROM messages m
            JOIN joueurs j ON m.id_expediteur = j.id
            WHERE m.code_salon IS NULL
              AND ((m.id_expediteur = ? AND m.id_destinataire = ?) OR (m.id_expediteur = ? AND m.id_destinataire = ?))
            ORDER BY m.id DESC
            LIMIT 50
        ");
        $stmt->execute([$userId, $avec, $avec, $userId]);
    } else {
        $stmt = $pdo->query("
            SELECT m.id, m.id_expediteur, j.pseudo, m.contenu, DATE_FORMAT(m.envoye_le, '%H:%i') AS heure
            FROM messages m
            JOIN joueurs j ON m.id_expediteur = j.id
            WHERE m.code_salon IS NULL AND m.id_destinataire IS NULL
            ORDER BY m.id DESC
            LIMIT 50
        ");
    }

    $messages = array_reverse($stmt->fetchAll());
    echo json_encode(['ok' => true, 'messages' => $messages]);
    exit;
}

if ($action === 'envoyer') {
    $mode    = $input['mode'] ?? 'general';
    $salon   = strtoupper(trim($input['salon'] ?? ''));
    $avec    = (int)($input['avec'] ?? 0);
    $contenu = mb_substr(trim($input['contenu'] ?? ''), 0, 500);

    if ($contenu === '') {
        echo json_encode(['ok' => false, 'erreur' => 'Message vide']);
        exit;
    }

    if ($mode === 'salon' && $salon !== '') {
        $ins = $pdo->prepare("INSERT INTO messages (id_expediteur, code_salon, contenu) VALUES (?, ?, ?)");
        $ins->execute([$userId, $salon, $contenu]);
    } elseif ($mode === 'prive' && $avec > 0) {
        $ins = $pdo->prepare("INSERT INTO messages (id_expediteur, id_destinataire, contenu) VALUES (?, ?, ?)");
        $ins->execute([$userId, $avec, $contenu]);
    } else {
        $ins = $pdo->prepare("INSERT INTO messages (id_expediteur, contenu) VALUES (?, ?)");
        $ins->execute([$userId, $contenu]);
    }

    echo json_encode(['ok' => true]);
    exit;
}

echo json_encode(['ok' => false, 'erreur' => 'Action invalide']);
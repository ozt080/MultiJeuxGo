<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/db.php';

if (!isset($_SESSION['joueur_id'])) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'erreur' => 'Non connecté']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$slug   = trim($data['slug'] ?? '');
$points = max(0, min(2000, (int)($data['points'] ?? 0)));

$stmt = $pdo->prepare("SELECT id FROM jeux WHERE slug = ?");
$stmt->execute([$slug]);
$jeu = $stmt->fetch();

if (!$jeu) {
    http_response_code(404);
    echo json_encode(['ok' => false, 'erreur' => 'Jeu introuvable']);
    exit;
}

$ins = $pdo->prepare("INSERT INTO parties (id_joueur, id_jeu, score_obtenu) VALUES (?, ?, ?)");
$ins->execute([$_SESSION['joueur_id'], $jeu['id'], $points]);

$upd = $pdo->prepare("UPDATE joueurs SET score = score + ? WHERE id = ?");
$upd->execute([$points, $_SESSION['joueur_id']]);

$tot = $pdo->prepare("SELECT score FROM joueurs WHERE id = ?");
$tot->execute([$_SESSION['joueur_id']]);
$nouveauScore = (int)$tot->fetchColumn();

echo json_encode(['ok' => true, 'points' => $points, 'nouveau_total' => $nouveauScore]);
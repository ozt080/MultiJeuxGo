<?php
require_once __DIR__ . '/config/db.php';

$stmt = $pdo->query("SELECT * FROM joueurs");
$joueurs = $stmt->fetchAll();

echo "Serveur MultiJeuxGo en ligne ! Connexion MySQL OK (base : " . htmlspecialchars($db) . ")<br>";
echo "Nombre de joueurs inscrits : " . count($joueurs);
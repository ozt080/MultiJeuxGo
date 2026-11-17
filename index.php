<?php
require_once __DIR__ . '/config/db.php';
echo "Serveur MultiJeuxGo en ligne ! Connexion MySQL OK (base : " . htmlspecialchars($db) . ")";
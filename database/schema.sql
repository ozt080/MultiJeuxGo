ALTER TABLE jeux
    ADD COLUMN categorie VARCHAR(40) NOT NULL DEFAULT 'Arcade' AFTER slug,
    ADD COLUMN icone VARCHAR(16) NOT NULL DEFAULT '🎮' AFTER categorie,
    ADD COLUMN couleur VARCHAR(20) NOT NULL DEFAULT '#6366f1' AFTER icone;

INSERT INTO jeux (nom, slug, categorie, icone, couleur, description) VALUES
    ('Mini-Golf', 'mini-golf', 'Sport', '⛳', '#10b981', 'Vise le trou en évitant les obstacles en un minimum de coups.'),
    ('Foot Penalty', 'foot-soccer', 'Sport', '⚽', '#059669', 'Trompe le gardien sur 5 tirs au but décisifs.'),
    ('Basket Shoot', 'basket', 'Sport', '🏀', '#f97316', 'Enchaîne les paniers en ajustant l''angle et la puissance.'),
    ('Bowling Strike', 'bowling', 'Sport', '🎳', '#3b82f6', 'Place ton lancer et fais tomber les 10 quilles.'),
    ('Ping-Pong', 'ping-pong', 'Sport', '🏓', '#06b6d4', 'Duel rapide contre l''IA : premier à 5 points gagne.'),
    ('Badminton Smash', 'badminton', 'Sport', '🏸', '#14b8a6', 'Renvoie le volant au-dessus du filet et place des smashs.'),
    ('Billard 8-Ball', 'billard', 'Sport', '🎱', '#0d9488', 'Empoche toutes les billes sur le tapis vert.'),
    ('Uno Express', 'uno', 'Plateau & Cartes', '🃏', '#ef4444', 'Débarrasse-toi de toutes tes cartes avant ton adversaire.'),
    ('Ludo Royal', 'ludo', 'Plateau & Cartes', '🎲', '#eab308', 'Lance le dé, capture les pions adverses et atteins l''arrivée.'),
    ('Puissance 4', 'puissance-4', 'Plateau & Cartes', '🔴', '#f43f5e', 'Aligne 4 jetons horizontalement, verticalement ou en diagonale.'),
    ('Morpion Neon', 'morpion', 'Plateau & Cartes', '❌', '#ec4899', 'Manche éclair en 3x3 contre l''ordinateur.'),
    ('Pinball Arcade', 'pinball', 'Arcade', '🕹️', '#8b5cf6', 'Actionne les flippers et fais exploser le score sur les bumpers.'),
    ('Course Turbo', 'course-voiture', 'Arcade', '🏎️', '#e11d48', 'Évite le trafic à pleine vitesse sur l''autoroute.'),
    ('Snake Neon', 'snake-neon', 'Arcade', '🐍', '#22c55e', 'Avale les orbes lumineux sans toucher les murs ni ta queue.'),
    ('Casse-Briques', 'casse-briques', 'Arcade', '🧱', '#a855f7', 'Détruis tous les blocs néon avec ta raquette.'),
    ('Plus ou Moins', 'plus-ou-moins', 'Réflexion', '🔢', '#6366f1', 'Trouve le nombre mystère entre 1 et 100.'),
    ('Pierre Feuille Ciseaux', 'pfc', 'Réflexion', '✂️', '#f59e0b', 'Affronte l''IA en 3 manches gagnantes.'),
    ('Quiz Culture Geek', 'quiz-geek', 'Réflexion', '🧠', '#3b82f6', '8 questions sur le code, le hardware et les jeux vidéo.')
ON DUPLICATE KEY UPDATE
    nom = VALUES(nom),
    categorie = VALUES(categorie),
    icone = VALUES(icone),
    couleur = VALUES(couleur),
    description = VALUES(description);
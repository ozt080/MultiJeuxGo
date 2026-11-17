ALTER TABLE joueurs
    ADD COLUMN email VARCHAR(100) NOT NULL UNIQUE AFTER pseudo,
    ADD COLUMN mot_de_passe VARCHAR(255) NOT NULL AFTER email,
    ADD COLUMN date_inscription DATETIME DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS jeux (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(80) NOT NULL,
    slug VARCHAR(80) NOT NULL UNIQUE,
    description VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS parties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_joueur INT NOT NULL,
    id_jeu INT NOT NULL,
    score_obtenu INT NOT NULL DEFAULT 0,
    joue_le DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_joueur) REFERENCES joueurs(id) ON DELETE CASCADE,
    FOREIGN KEY (id_jeu) REFERENCES jeux(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO jeux (nom, slug, description) VALUES
    ('Plus ou Moins', 'plus-ou-moins', 'Devinez le nombre mystère en un minimum de coups.'),
    ('Pierre Feuille Ciseaux', 'pfc', 'Affrontez l''ordinateur en 3 manches gagnantes.'),
    ('Quiz Culture Geek', 'quiz-geek', 'Testez vos connaissances en informatique et jeux vidéo.');
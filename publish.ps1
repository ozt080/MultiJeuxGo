# Sauvegarde Git
git add .
git commit -m "Publication automatique MultiJeuxGo"
git push origin main

# Attendre quelques secondes pour le déploiement GitHub Pages
Start-Sleep -Seconds 3

# Ouvrir le site dans le navigateur
Start-Process "https://ozt080.github.io/MultiJeuxGo/"

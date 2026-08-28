# CutTrack — version iPhone (PWA)

Cette version peut fonctionner comme une app plein écran sur iPhone, sans passer par l’App Store.

## Important
Pour que “Ajouter à l’écran d’accueil” fonctionne comme une vraie web-app, les fichiers doivent être hébergés sur une adresse HTTPS.
Un fichier HTML ouvert localement sur l’iPhone ne suffit pas pour le mode PWA complet.

## Option gratuite recommandée : GitHub Pages
1. Crée un compte gratuit GitHub si tu n’en as pas.
2. Crée un nouveau dépôt, par exemple `cuttrack`.
3. Téléverse tous les fichiers contenus dans ce dossier à la racine du dépôt.
4. Dans GitHub : Settings → Pages.
5. Sous “Build and deployment”, choisis “Deploy from a branch”.
6. Sélectionne la branche `main` et le dossier `/root`, puis sauvegarde.
7. GitHub te donnera une adresse HTTPS du type `https://TON-NOM.github.io/cuttrack/`.
8. Ouvre cette adresse dans Safari sur ton iPhone.
9. Appuie sur Partager → Ajouter à l’écran d’accueil.
10. Lance CutTrack depuis son icône.

## Alternative gratuite
Netlify / Vercel / Cloudflare Pages peuvent aussi héberger ces fichiers gratuitement.

## Données
Les repas, poids et réglages sont stockés localement dans Safari sur ton iPhone.
Utilise “Exporter mes données” régulièrement pour garder une sauvegarde JSON.

## Limite actuelle
Cette V1 n’a pas encore de base de données nutritionnelle, scan de code-barres ou synchronisation cloud.

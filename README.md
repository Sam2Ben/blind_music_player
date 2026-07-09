# Blind-Test Player · AI Crafters × SGTM

Jeu blind-test musical pour bootcamp (devine le **titre** ou l'**artiste**).  
8 extraits MP3 · Mondial 2026 · Travis Scott · TikTok/Instagram.

## Structure

```
blind-test-player/
├── index.html      ← page principale
├── player.css
├── player.js
├── tracks.js       ← playlist + métadonnées
├── audio/          ← 8 MP3 (extraits ~25 s)
├── assets/         ← logos AI Crafters + SGTM
├── scripts/        ← télécharger / mettre à jour les MP3
└── vercel.json
```

## Local

```bash
python -m http.server 8765
```

Ouvre : **http://localhost:8765/**

## Nouveau repo GitHub

```bash
cd blind-test-player
git init
git add .
git commit -m "Blind-test player AI Crafters × SGTM"
git branch -M main
git remote add origin https://github.com/TON-USER/blind-test-player.git
git push -u origin main
```

## Vercel

1. [vercel.com](https://vercel.com) → **Import Git Repository**
2. Choisis le repo `blind-test-player`
3. **Root Directory** : `.` (racine)
4. Framework : **Other** — pas de build
5. **Deploy**

URL prod : `https://blind-test-player.vercel.app/`

Ou en CLI :

```bash
npx vercel --prod
```

## Mettre à jour les MP3

```bash
pip install yt-dlp
# ffmpeg requis (winget install ffmpeg)
python scripts/download_audio.py
```

## Usage en classe

1. Mode **titre** ou **artiste**
2. **▶ Jouer** (3 s / 10 s / entier)
3. Équipes devinent
4. **Révéler** → +1 / +2 points
5. Scores sauvegardés dans le navigateur (localStorage)

---

© AI Crafters 2026 · Usage pédagogique privé

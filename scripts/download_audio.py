#!/usr/bin/env python3
"""Télécharge les extraits MP3 (25 s) pour le Blind-Test Player."""

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AUDIO = ROOT / "audio"
AUDIO.mkdir(exist_ok=True)

MANIFEST = [
    ("01-dai-dai.mp3", "https://www.youtube.com/watch?v=fcnDmrtj6Sk"),
    ("02-lighter.mp3", "ytsearch1:Jelly Roll Carin Leon Lighter FIFA World Cup 2026 official"),
    ("03-how-you-like-me-now.mp3", "ytsearch1:The Heavy How You Like Me Now official video"),
    ("04-travis-dumbo.mp3", "ytsearch1:Travis Scott Dumbo JackBoys 2 official"),
    ("05-travis-fein.mp3", "ytsearch1:Travis Scott FEIN Playboi Carti official"),
    ("06-riize-do-your-dance.mp3", "ytsearch1:RIIZE Do Your Dance official"),
    ("07-gut-genug.mp3", "ytsearch1:Blumengarten Gut Genug Kitschkrieg official"),
    ("08-morocco-wc2026.mp3", "ytsearch1:Morocco World Cup 2026 Michi official"),
    ("09-espresso.mp3", "ytsearch1:Sabrina Carpenter Espresso official video"),
    ("10-blinding-lights.mp3", "ytsearch1:The Weeknd Blinding Lights official video"),
    ("11-flowers.mp3", "ytsearch1:Miley Cyrus Flowers official video"),
    ("12-chaabi-ai-maroc.mp3", "ytsearch1:Moroccan chaabi AI generated Suno music"),
    ("13-suno-chaabi-maroc.mp3", "ytsearch1:Suno AI Moroccan chaabi nayda"),
    ("14-rai-ai-maroc.mp3", "ytsearch1:raï AI cover marocain generated"),
]

FORCE = {
    "09-espresso.mp3", "10-blinding-lights.mp3", "11-flowers.mp3",
    "12-chaabi-ai-maroc.mp3", "13-suno-chaabi-maroc.mp3", "14-rai-ai-maroc.mp3",
}


def has_ffmpeg() -> bool:
    try:
        subprocess.run(["ffmpeg", "-version"], capture_output=True, check=True)
        return True
    except (FileNotFoundError, subprocess.CalledProcessError):
        return False


def download_one(filename: str, source: str, force: bool = False) -> bool:
    out = AUDIO / filename
    if not force and out.exists() and out.stat().st_size > 5000:
        print(f"  skip (exists): {filename}")
        return True
    stem = out.with_suffix("")
    cmd = [
        sys.executable, "-m", "yt_dlp",
        "-x", "--audio-format", "mp3", "--audio-quality", "5",
        "--download-sections", "*0:00-0:25",
        "--force-keyframes-at-cuts",
        "-o", str(stem) + ".%(ext)s",
        "--no-playlist",
        source,
    ]
    print(f"  -> {filename}")
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(f"     FAIL: {(r.stderr or r.stdout)[:300]}")
        return False
    return out.exists() or stem.with_suffix(".mp3").exists()


def main():
    if not has_ffmpeg():
        print("ERREUR: ffmpeg requis. Installe: winget install ffmpeg")
        sys.exit(1)

    ok = 0
    for name, src in MANIFEST:
        if download_one(name, src, force=name in FORCE):
            ok += 1
    print(f"\nTerminé: {ok}/{len(MANIFEST)} pistes")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Sincronizează ultimele N imagini dintr-un profil Instagram *public* în site.

Cum funcționează
----------------
Instagram nu oferă un „conectează contul” simplu pentru site-uri statice. Variante:

1) Acest script (fără login): folosește același endpoint JSON pe care îl încarcă
   web-ul public. Merge pentru profiluri publice; poate să se schimbe sau să fie
   limitat de Instagram fără notificare. Rulează-l manual sau cu cron (ex. zilnic).

2) Oficial — Instagram Graph API: cont Instagram Business/Creatori legat de o Pagină
   Facebook, aplicație în developers.facebook.com, token cu drepturi instagram_basic
   + reîmprospătare. Apoi înlocuiești fetch-ul din acest script cu apeluri Graph API.

Recenzii / highlights
---------------------
Highlights-urile (story-uri salvate pe profil) nu sunt disponibile prin API fără autentificare
(login_required). Secțiunea „Recenzii” citește data/reviews.json — actualizează acel fișier
cu textele copiate din highlight-ul tău de recenzii (manual, după fiecare set nou de story-uri).

Utilizare
---------
  cd Website && python3 scripts/sync_instagram_gallery.py

Opțional: INSTAGRAM_USERNAME=ralu_nailtechnician PHOTO_COUNT=7 python3 scripts/...
"""

from __future__ import annotations

import json
import os
import ssl
import sys
from pathlib import Path
from urllib.request import Request, urlopen

INSTAGRAM_USER_AGENT = "Instagram 219.0.0.12.117 Android"
API_URL = "https://i.instagram.com/api/v1/users/web_profile_info/?username={username}"

SITE_ROOT = Path(__file__).resolve().parent.parent
GALLERY_DIR = SITE_ROOT / "images" / "gallery"
MANIFEST_PATH = GALLERY_DIR / "manifest.json"


def env_int(name: str, default: int) -> int:
    v = os.environ.get(name, "").strip()
    if not v:
        return default
    try:
        return max(1, min(50, int(v)))
    except ValueError:
        return default


def fetch_profile(username: str) -> dict:
    url = API_URL.format(username=username)
    req = Request(url, headers={"User-Agent": INSTAGRAM_USER_AGENT})
    ctx = ssl.create_default_context()
    with urlopen(req, context=ctx, timeout=45) as resp:
        raw = resp.read().decode("utf-8")
    return json.loads(raw)


def collect_media_items(user: dict) -> list[tuple[str, str]]:
    """Liste de (display_url, shortcode) în ordinea cronologică din feed (cel mai nou primul)."""
    edges = user["edge_owner_to_timeline_media"]["edges"]
    out: list[tuple[str, str]] = []
    for e in edges:
        node = e["node"]
        sc = node.get("shortcode") or ""
        u = (node.get("display_url") or "").replace("\\u0026", "&")
        if u:
            out.append((u, sc))
        side = node.get("edge_sidecar_to_children")
        if side:
            for ce in side.get("edges", []):
                n = ce["node"]
                u = (n.get("display_url") or "").replace("\\u0026", "&")
                if u:
                    out.append((u, sc))
    seen: set[str] = set()
    unique: list[tuple[str, str]] = []
    for u, sc in out:
        if u not in seen:
            seen.add(u)
            unique.append((u, sc))
    return unique


def download(url: str, dest: Path) -> None:
    req = Request(url, headers={"User-Agent": INSTAGRAM_USER_AGENT})
    ctx = ssl.create_default_context()
    with urlopen(req, context=ctx, timeout=90) as resp:
        data = resp.read()
    dest.write_bytes(data)


def prune_old_files(keep: int) -> None:
    if not GALLERY_DIR.is_dir():
        return
    for p in sorted(GALLERY_DIR.glob("ralu-*.jpg")):
        try:
            n = int(p.stem.split("-")[1])
        except (IndexError, ValueError):
            continue
        if n > keep:
            p.unlink(missing_ok=True)


def main() -> int:
    username = os.environ.get("INSTAGRAM_USERNAME", "ralu_nailtechnician").strip()
    count = env_int("PHOTO_COUNT", 7)

    GALLERY_DIR.mkdir(parents=True, exist_ok=True)

    try:
        payload = fetch_profile(username)
    except Exception as exc:
        print(f"Eroare la descărcarea profilului: {exc}", file=sys.stderr)
        return 1

    if payload.get("status") == "fail":
        print(payload.get("message", "Instagram API fail"), file=sys.stderr)
        return 1

    user = payload.get("data", {}).get("user")
    if not user:
        print("Răspuns neașteptat: lipsește user.", file=sys.stderr)
        return 1

    items = collect_media_items(user)[:count]
    if not items:
        print("Nu s-au găsit imagini în feed.", file=sys.stderr)
        return 1

    manifest_items = []
    for i, (url, shortcode) in enumerate(items, start=1):
        fname = f"ralu-{i:02d}.jpg"
        dest = GALLERY_DIR / fname
        print(f"Descarc {i}/{len(items)} -> {fname}")
        try:
            download(url, dest)
        except Exception as exc:
            print(f"Eroare la {fname}: {exc}", file=sys.stderr)
            return 1
        post_url = f"https://www.instagram.com/p/{shortcode}/" if shortcode else ""
        manifest_items.append(
            {
                "file": fname,
                "postUrl": post_url,
                "alt": "Manichiură și design unghii — Ralu Nail Technician",
            }
        )

    prune_old_files(len(items))

    manifest = {
        "username": username,
        "photoCount": len(manifest_items),
        "profileUrl": f"https://www.instagram.com/{username}/",
        "updated": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
        "items": manifest_items,
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Scrie {MANIFEST_PATH.relative_to(SITE_ROOT)} ({len(manifest_items)} poze).")
    print(
        "Recenzii: highlights Instagram → editează manual data/reviews.json (API fără login)."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())

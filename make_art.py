#!/usr/bin/env python3
"""
작가의 그림과 소리 목록을 만든다. ./start.sh 가 켤 때마다 대신 돌려 준다.

  python3 make_art.py

web/art/ 안의 그림(png·jpg·webp)과 소리(mp3·wav·ogg·m4a)를 파일 이름 순서대로 모아
web/art/art.json 에 적는다. 브라우저는 폴더 안을 들여다볼 수 없어서 이 목록이 필요하다.

파일 이름 앞에 번호를 붙이면 그 순서대로 쌓인다. 01-나무.png, 02-새.png 처럼.
이름이 alien 으로 시작하는 그림은 외계인의 그림으로 따로 모은다.
"""

from __future__ import annotations

import json
from pathlib import Path

ART = Path(__file__).parent / "web" / "art"
PICTURES = {".png", ".jpg", ".jpeg", ".webp", ".gif"}
SOUNDS = {".mp3", ".wav", ".ogg", ".m4a", ".flac"}


def main() -> None:
    ART.mkdir(parents=True, exist_ok=True)
    files = sorted(f for f in ART.iterdir() if f.is_file())
    drawings = [f.name for f in files if f.suffix.lower() in PICTURES and not f.name.startswith("alien")]
    aliens = [f.name for f in files if f.suffix.lower() in PICTURES and f.name.startswith("alien")]
    sounds = [f.name for f in files if f.suffix.lower() in SOUNDS]

    out = {"drawings": drawings, "aliens": aliens, "sounds": sounds}
    (ART / "art.json").write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"그림 {len(drawings)}장 · 외계인 그림 {len(aliens)}장 · 소리 {len(sounds)}개를 적었습니다.")
    if not drawings:
        print("web/art/ 에 그림을 넣고 다시 실행하면 그 그림이 쌓입니다. 없으면 자리표시자 도형이 나옵니다.")


if __name__ == "__main__":
    main()

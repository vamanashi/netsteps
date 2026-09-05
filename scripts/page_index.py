#!/usr/bin/env python3
"""問題冊子PDFの各ページ上端だけを切り出して1枚に並べる(コンタクトシート)。
「問1」「問2」「問3」「設問」がどのページから始まるかを目視で一度に判別するための道具。
使い方: python scripts/page_index.py data/ipa/2025r07h/2025r07h_nw_pm1_qs.pdf out.png
"""
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw


def main():
    pdf, out = sys.argv[1], sys.argv[2]
    with tempfile.TemporaryDirectory() as td:
        subprocess.run(["pdftoppm", "-r", "70", "-png", pdf, f"{td}/p"], check=True)
        files = sorted(Path(td).glob("p-*.png"))
        strips = []
        for f in files:
            im = Image.open(f)
            # 上端18%(問番号と見出しが出る帯)
            strips.append(im.crop((0, 0, im.width, int(im.height * 0.18))))
        if not strips:
            print("no pages", file=sys.stderr)
            return
        w = strips[0].width
        # 2列に並べて縦を抑える
        cols = 2
        rows = (len(strips) + cols - 1) // cols
        h = strips[0].height
        sheet = Image.new("RGB", (w * cols + 60, (h + 4) * rows), "white")
        d = ImageDraw.Draw(sheet)
        for i, s in enumerate(strips):
            c, r = i % cols, i // cols
            x = c * (w + 30) + 30
            y = r * (h + 4)
            sheet.paste(s, (x, y))
            d.text((4 + c * (w + 30), y + h // 2), f"p{i+1}", fill="black")
        sheet.save(out, optimize=True)
        print(f"{len(strips)} pages -> {out} ({Path(out).stat().st_size//1024} KB)")


if __name__ == "__main__":
    main()

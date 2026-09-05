#!/usr/bin/env python3
"""IPA NW試験 過去問データベース構築
data/ipa/<slug>/*.pdf から:
- 午後Ⅰ/Ⅱ 解答例PDF → 問ごとの出題趣旨・解答例テキスト
- 午前Ⅱ 解答例PDF → 正解記号表
- IPA公式ページ → 各PDFの公式URL
を抽出し、data/db/nw-db.json(全文) と src/content/pastdb.json(アプリ用スリム版) を出力する。
"""
import glob
import json
import os
import re
import sys
import urllib.request

from pdfminer.high_level import extract_text

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IPA_DIR = os.path.join(ROOT, "data", "ipa")

# 試験ID → (表示ラベル, IPA年度ページ)
EXAMS = {
    "2025r07h": ("令和7年度 春期", "2025r07"),
    "2024r06h": ("令和6年度 春期", "2024r06"),
    "2023r05h": ("令和5年度 春期", "2023r05"),
    "2022r04h": ("令和4年度 春期", "2022r04"),
    "2021r03h": ("令和3年度 春期", "2021r03"),
    "2019r01a": ("令和元年度 秋期", "2019h31"),
    "2018h30a": ("平成30年度 秋期", "2018h30"),
    "2017h29a": ("平成29年度 秋期", "2017h29"),
    "2016h28a": ("平成28年度 秋期", "2016h28"),
    "2015h27a": ("平成27年度 秋期", "2015h27"),
}
BASE = "https://www.ipa.go.jp"


def fetch_pdf_urls(page_slug):
    url = f"{BASE}/shiken/mondai-kaiotu/{page_slug}.html"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    html = urllib.request.urlopen(req).read().decode("utf-8", "ignore")
    hrefs = re.findall(r'href="([^"]*_nw_[^"]*\.pdf)"', html)
    return {os.path.basename(h): BASE + h for h in sorted(set(hrefs))}


def norm(t):
    return t.replace("\x0c", "\n")


def parse_pm_ans(path):
    """解答例PDF → [{q, shushi, gist, answer_text}]"""
    text = norm(extract_text(path))
    # 問の先頭で分割: 「問１」等の直後に出題趣旨が続く
    marks = [(m.start(), m.group(1)) for m in re.finditer(r"問\s*([１２３123])\s*\n?\s*出題趣旨", text)]
    out = []
    for i, (pos, qn) in enumerate(marks):
        end = marks[i + 1][0] if i + 1 < len(marks) else len(text)
        seg = text[pos:end]
        q = "１２３".find(qn) + 1 if qn in "１２３" else int(qn)
        # 出題趣旨: 「出題趣旨」から「設問」表の始まりまで
        m = re.search(r"出題趣旨\s*(.*?)\s*(?:設\s*問|解答例・解答の要点)", seg, re.S)
        shushi = re.sub(r"\s+", " ", m.group(1)).strip() if m else ""
        gm = re.search(r"本問では[^。]*。", shushi)
        gist = gm.group(0) if gm else shushi[:80]
        out.append({
            "q": q,
            "shushi": shushi,
            "gist": gist,
            "answer_text": re.sub(r"[ \t]+", " ", seg).strip(),
        })
    return out


def parse_am2_ans(path):
    """列分離レイアウト: 問番号の列挙と正解記号の列挙が交互のブロックで並ぶ"""
    text = norm(extract_text(path))
    nums = [int(n) for n in re.findall(r"問\s*(\d+)\s*\n", text)]
    kanas = re.findall(r"^\s*([アイウエ])\s*$", text, re.M)
    if len(nums) != len(kanas):
        print(f"  WARN am2 mismatch {path}: {len(nums)} nums vs {len(kanas)} answers", file=sys.stderr)
    return dict(zip(nums, kanas))


def main():
    db = {"exams": []}
    slim = {"exams": [], "questions": [], "am2": []}
    for exam_id, (label, page) in EXAMS.items():
        d = os.path.join(IPA_DIR, exam_id)
        if not os.path.isdir(d):
            print(f"skip {exam_id}: no dir", file=sys.stderr)
            continue
        urls = fetch_pdf_urls(page)
        files = {}
        for f in sorted(os.listdir(d)):
            key = re.sub(r"^.*_nw_", "", f).replace(".pdf", "")  # am2_qs など
            files[key] = {"local": f"data/ipa/{exam_id}/{f}", "url": urls.get(f, "")}
        exam = {"id": exam_id, "label": label,
                "page": f"{BASE}/shiken/mondai-kaiotu/{page}.html", "files": files}
        # 午前Ⅱ 正解表
        am2_path = os.path.join(d, f"{exam_id}_nw_am2_ans.pdf")
        if os.path.exists(am2_path):
            exam["am2Answers"] = parse_am2_ans(am2_path)
        # 午後Ⅰ/Ⅱ
        for div in ("pm1", "pm2"):
            p = os.path.join(d, f"{exam_id}_nw_{div}_ans.pdf")
            if os.path.exists(p):
                exam[div] = parse_pm_ans(p)
        db["exams"].append(exam)
        slim["exams"].append({"id": exam_id, "label": label, "page": exam["page"]})
        for div in ("pm1", "pm2"):
            for qq in exam.get(div, []):
                slim["questions"].append({
                    "exam": exam_id, "label": label, "div": div, "q": qq["q"],
                    "gist": qq["gist"],
                    "urlQs": files.get(f"{div}_qs", {}).get("url", ""),
                    "urlAns": files.get(f"{div}_ans", {}).get("url", ""),
                })
        slim["am2"].append({
            "exam": exam_id, "label": label,
            "count": len(exam.get("am2Answers", {})),
            "urlQs": files.get("am2_qs", {}).get("url", ""),
            "urlAns": files.get("am2_ans", {}).get("url", ""),
        })
        print(f"{exam_id}: pm1={len(exam.get('pm1', []))}問 pm2={len(exam.get('pm2', []))}問 am2={len(exam.get('am2Answers', {}))}問")

    os.makedirs(os.path.join(ROOT, "data", "db"), exist_ok=True)
    with open(os.path.join(ROOT, "data", "db", "nw-db.json"), "w") as f:
        json.dump(db, f, ensure_ascii=False, indent=1)
    with open(os.path.join(ROOT, "src", "content", "pastdb.json"), "w") as f:
        json.dump(slim, f, ensure_ascii=False, indent=1)
    print("wrote data/db/nw-db.json and src/content/pastdb.json")


if __name__ == "__main__":
    main()

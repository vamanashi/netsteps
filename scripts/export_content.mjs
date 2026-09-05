/* 既存のTSコンテンツを src/content/courses/*.json へ書き出す一回性スクリプト
   - 午前Ⅱ実物: intro内の「出典: …」を source フィールドへ構造化(+nw-siken URL)
   - 冗談まじりの誤答選択肢を、もっともらしい技術的誤答へ差し替え */
import { build } from "esbuild";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const entryFile = path.join(root, "scripts/_entry.ts");
const bundleFile = path.join(root, "scripts/_bundle.mjs");
writeFileSync(entryFile, `
export { BASICS_POOL } from "../src/content/ospfBasics";
export { POOL as R7Q1_POOL } from "../src/content/r7q1";
`);
await build({ entryPoints: [entryFile], bundle: true, format: "esm", platform: "node", outfile: bundleFile, logLevel: "silent" });
const m = await import(pathToFileURL(bundleFile).href);

const SIKEN_URLS = {
  s17: "https://www.nw-siken.com/kakomon/29_aki/am2_3.html",
  s18: "https://www.nw-siken.com/kakomon/27_aki/am2_4.html",
  s40: "https://www.nw-siken.com/kakomon/24_aki/am2_7.html",
  s41: "https://www.nw-siken.com/kakomon/05_haru/am2_3.html",
  s47: "https://www.nw-siken.com/kakomon/23_aki/am2_2.html",
  s52: "https://www.nw-siken.com/kakomon/25_aki/am2_6.html",
};

const DISTRACTOR_FIX = [
  // [旧テキストの一部, 新テキスト, 新explain]
  ["ルータを金庫にしまう", "OSPFのエリアを分割して影響範囲を狭める",
    "エリア分割はLSDBの肥大化(計算負荷)への対策で、不正な隣接の防止にはなりません。入口で防ぐのはネイバー認証です。"],
  ["バックアップ側の機嫌を損ねないため", "VRRPの仮想IPアドレスが変わるのを防ぐため",
    "仮想IPアドレスはマスターが交代しても変わりません(それがVRRPの価値)。待つ理由はOSPFの収束です。"],
  ["電気代を節約するため", "閉塞するとMACアドレステーブルが引き継がれるから",
    "MACアドレステーブルの引き継ぎとは無関係です。理由は復旧速度——「素早く切り戻せる」が採点キーワードです。"],
  ["閉塞しないとケーブルが抜けない仕様だから", "電源オフでは隣接ルータが障害を検知できないから",
    "電源オフでもリンクダウンとして検知はされます。違いは戻すときの速さ——閉塞解除は即座、電源オンは起動時間ぶん待たされます。"],
];

function transform(steps) {
  return steps.map((s) => {
    const step = JSON.parse(JSON.stringify(s));
    if (step.format === "午前Ⅱ" && step.intro) {
      const m2 = step.intro.match(/出典:\s*([^。]+)/);
      if (m2) {
        step.source = { label: m2[1].replace(/\(IPA\)$/, "(IPA)").trim() };
        if (SIKEN_URLS[step.id]) step.source.url = SIKEN_URLS[step.id];
        step.intro = step.intro.replace(/出典:\s*[^。]+。?/, "").trim() || undefined;
        if (!step.intro) delete step.intro;
      }
    }
    if (step.choices) {
      for (const c of step.choices) {
        const fix = DISTRACTOR_FIX.find(([old]) => c.text.includes(old));
        if (fix) { c.text = fix[1]; c.explain = fix[2]; }
      }
    }
    return step;
  });
}

const outDir = path.join(root, "src/content/courses");
mkdirSync(outDir, { recursive: true });

const courses = [
  {
    id: "ospf-basics", theme: "ospf-routing", chip: "基礎コース", kind: "basics", order: 10,
    title: "OSPF総合 — 用語ゼロから",
    desc: "ルータの仕事から、Hello・LSA・コスト・エリア・DR/BDRまで。全部タップだけで積み上げて、途中で本物の午前Ⅱ過去問6問に挑戦します。",
    done: {
      tag: "+ solved · OSPF総合 修了",
      title: "用語ゼロから、本物の午前Ⅱまで解けました",
      sub: "OSPFの全体地図が手に入りました。つぎは過去問コースへ——このコースで見た言葉ばかりです。",
      showCounter: false,
    },
    steps: transform(m.BASICS_POOL),
  },
  {
    id: "r7q1", theme: "ospf-routing", chip: "過去問コース", kind: "exam", order: 11,
    title: "R7 午後Ⅰ 問1 · ルータの更改",
    desc: "去年の午後Ⅰ問1を、逆算した問題で段階的に攻略。基礎コースの言葉だけで読めるように作ってあります。",
    done: {
      tag: "+ solved · 設問1(1)〜設問2(5) 完答",
      title: "冒頭では解けなかった1問が、解けました",
      sub: "仕上げは IPA公式の令和7年度 午後Ⅰ 問1(ルータの更改)を本番の時間で。事例文の見え方が、もう違うはずです。",
      showCounter: true,
      pdfHref: "/ipa/2025r07h_nw_pm1_qs.pdf",
    },
    steps: transform(m.R7Q1_POOL),
  },
];

for (const c of courses) {
  writeFileSync(path.join(outDir, `${c.id}.json`), JSON.stringify(c, null, 1));
  console.log(`wrote courses/${c.id}.json (${c.steps.length} steps)`);
}
rmSync(entryFile); rmSync(bundleFile);

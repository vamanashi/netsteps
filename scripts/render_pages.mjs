/* 公式問題冊子PDFの指定ページを画像化して public/ipa/pages/ に置く。
   IPAは過去問題の使用を許諾不要・使用料不要で認めている(出典明記が条件)。
   使い方: node scripts/render_pages.mjs <試験ID> <div> <問番号> <開始p> <終了p>
   例:     node scripts/render_pages.mjs 2025r07h pm1 2 8 14            */
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, renameSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const [examId, div, q, from, to] = process.argv.slice(2);
if (!examId || !div || !q || !from || !to) {
  console.error("usage: node scripts/render_pages.mjs <examId> <pm1|pm2> <q> <fromPage> <toPage>");
  process.exit(1);
}

const pdf = path.join(root, "data", "ipa", examId, `${examId}_nw_${div}_qs.pdf`);
if (!existsSync(pdf)) { console.error("no pdf:", pdf); process.exit(1); }

const outDir = path.join(root, "public", "ipa", "pages");
mkdirSync(outDir, { recursive: true });
const prefix = `${examId}_${div}_q${q}`;
const tmp = path.join(outDir, `_tmp_${prefix}`);

execFileSync("pdftoppm", ["-f", from, "-l", to, "-r", "130", "-png", pdf, tmp], { stdio: "inherit" });

const made = readdirSync(outDir).filter((f) => f.startsWith(`_tmp_${prefix}`)).sort();
const paths = [];
let bytes = 0;
made.forEach((f, i) => {
  const dest = `${prefix}_p${String(i + 1).padStart(2, "0")}.png`;
  renameSync(path.join(outDir, f), path.join(outDir, dest));
  bytes += statSync(path.join(outDir, dest)).size;
  paths.push(`/ipa/pages/${dest}`);
});
console.log(JSON.stringify(paths, null, 1));
console.log(`${paths.length} pages, ${(bytes / 1024 / 1024).toFixed(1)} MB`);

/* 公式問題冊子の該当ページを画像化し、過去問コースJSONの exam.official に紐付ける。
   IPAは公表済み過去問題の使用を許諾不要・使用料不要で認めている(出典明記が条件)。
   使い方: node scripts/attach_official.mjs <courseId> <examId> <pm1|pm2> <問> <開始p> <終了p> "<出典ラベル>" */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const [courseId, examId, div, q, from, to, label] = process.argv.slice(2);
if (!label) { console.error("usage: node scripts/attach_official.mjs <courseId> <examId> <pm1|pm2> <q> <from> <to> <label>"); process.exit(1); }

/* IPA公式PDFのURLは pastdb.json が持っている */
const past = JSON.parse(readFileSync(path.join(root, "src/content/pastdb.json"), "utf8"));
const rec = past.questions.find((x) => x.exam === examId && x.div === div && String(x.q) === String(q));
if (!rec) { console.error("not in pastdb:", examId, div, q); process.exit(1); }

const out = execFileSync("node", [path.join(root, "scripts/render_pages.mjs"), examId, div, q, from, to], { encoding: "utf8" });
const pages = JSON.parse(out.slice(0, out.lastIndexOf("]") + 1));

const p = path.join(root, "src/content/courses", `${courseId}.json`);
const c = JSON.parse(readFileSync(p, "utf8"));
if (!c.exam) { console.error("course has no exam:", courseId); process.exit(1); }
c.exam.official = { label, pages, url: rec.urlQs, answerUrl: rec.urlAns };
writeFileSync(p, JSON.stringify(c, null, 1));
console.log(`${courseId}: ${pages.length} pages attached / ${label}`);

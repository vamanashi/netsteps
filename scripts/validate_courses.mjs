/* コースJSONのバリデータ
   使い方: node scripts/validate_courses.mjs [対象.json ...]  (無指定なら全コース) */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const coursesDir = path.join(root, "src/content/courses");
const themes = JSON.parse(readFileSync(path.join(root, "src/content/themes.json"), "utf8"));
const THEME_IDS = new Set(themes.themes.map((t) => t.id));
const FIG_IDS = new Set([
  "route-table", "next-hop", "default-route", "static-dynamic", "rip-count", "dv-vs-ls",
  "ospf-steps", "lsa-flood", "cost-formula", "cost-path", "area", "dr-lan",
  "passive-if", "redistribute", "as-igp-egp",
]);
const STEP_TYPES = new Set(["goal", "info", "viz", "quiz", "parsons", "blank", "calc", "write"]);

/* ---- 文体チェック(docs/WRITING_STYLE.md) ---- */
const BANNED = [
  // 煽り・情緒
  "もったいない", "大したもの", "怖くありません", "悔しい", "ド真ん中", "鵜呑み",
  "痛い目", "泣きを見", "おいしい", "うれしい悲鳴",
  // 芝居がかった比喩・造語
  "主役", "の正体", "急所", "肝です", "ミソ", "通奏低音", "背骨", "学級委員",
  "噂話", "バケツリレー", "名刺を配", "名刺交換", "洪水のよう", "地図方式", "噂話方式",
  // 顔文字・記号・過剰強調
  "(笑)", "（笑）", "!!", "！！", "!?", "！？",
  // 冗長・馴れ合い
  "というわけです", "なんですね", "でしょう!", "ですよね",
];
const MAX_SENTENCE = 70;   // 1文の上限(句点区切り・記号除去後)
const WARN_SENTENCE = 58;

function textFieldsOf(step) {
  const out = [];
  const push = (label, v) => { if (typeof v === "string" && v.trim()) out.push([label, v]); };
  push("title", step.title);
  push("intro", step.intro);
  push("lead", step.lead);
  push("body", step.body);
  push("okExplain", step.okExplain);
  push("ngExplain", step.ngExplain);
  push("success", step.success);
  push("fail", step.fail);
  push("question", step.question);
  (step.choices ?? []).forEach((c, i) => { push(`choices[${i}].text`, c.text); push(`choices[${i}].explain`, c.explain); });
  (step.blanks ?? []).forEach((b) => push(`blank ${b.key}.why`, b.why));
  (step.dialog ?? []).forEach((d, i) => { push(`dialog[${i}].q`, d.q); push(`dialog[${i}].a`, d.a); });
  if (step.kijutsu) { push("kijutsu.lead", step.kijutsu.lead); push("kijutsu.alt", step.kijutsu.alt); }
  (step.excerpt?.lines ?? []).forEach((l, i) => push(`excerpt[${i}]`, l));
  return out;
}

/** 事例文の引用や本試験の原文はチェック対象外にする */
const isQuoted = (label, step) =>
  label.startsWith("excerpt") || (!!step.source && (label === "title" || label.startsWith("choices")));

function checkStyle(f, step, sid, err, warn) {
  for (const [label, text] of textFieldsOf(step)) {
    for (const w of BANNED) {
      if (text.includes(w) && !isQuoted(label, step)) err(f, `${sid}.${label}: 禁止表現「${w}」(docs/WRITING_STYLE.md)`);
    }
    if (isQuoted(label, step)) continue;
    for (const raw of text.split(/(?<=[。？])/)) {
      const s = raw.replace(/\s/g, "");
      if (!s) continue;
      if (s.length > MAX_SENTENCE) err(f, `${sid}.${label}: 一文が${s.length}字(上限${MAX_SENTENCE})「${s.slice(0, 32)}…」`);
      else if (s.length > WARN_SENTENCE) warn(f, `${sid}.${label}: 一文が${s.length}字。切れないか検討「${s.slice(0, 28)}…」`);
    }
  }
}

const targets = process.argv.slice(2).length
  ? process.argv.slice(2).map((p) => path.resolve(p))
  : readdirSync(coursesDir).filter((f) => f.endsWith(".json")).map((f) => path.join(coursesDir, f));

let errors = 0, warnings = 0;
const err = (f, m) => { console.log(`ERROR ${path.basename(f)}: ${m}`); errors++; };
const warn = (f, m) => { console.log(`warn  ${path.basename(f)}: ${m}`); warnings++; };

const allCourseIds = new Set();

function checkFig(f, fig, sid) {
  const list = Array.isArray(fig) ? fig : [fig];
  for (const g of list) {
    if (typeof g === "string") {
      if (!FIG_IDS.has(g)) err(f, `${sid}: 不明な図ID "${g}" (レジストリ: ${[...FIG_IDS].join(",")})`);
    } else if (g && typeof g === "object") {
      if (g.kind === "flow") {
        if (!Array.isArray(g.steps) || g.steps.length < 2) err(f, `${sid}: flow図はsteps 2つ以上`);
        else g.steps.forEach((s, i) => { if (!s.t) err(f, `${sid}: flow steps[${i}].t 必須`); });
      } else if (g.kind === "net") {
        if (!Array.isArray(g.nodes) || g.nodes.length < 2) err(f, `${sid}: net図はnodes 2つ以上`);
        const ids = new Set((g.nodes ?? []).map((n) => n.id));
        (g.nodes ?? []).forEach((n) => {
          if (n.x == null || n.y == null || !n.label) err(f, `${sid}: net node要素は id,x,y,label 必須`);
          if (n.x < 20 || n.x > 320) warn(f, `${sid}: net node "${n.id}" xは20-320推奨(見切れ防止)`);
        });
        (g.links ?? []).forEach((l) => {
          if (!ids.has(l.from) || !ids.has(l.to)) err(f, `${sid}: net link ${l.from}->${l.to} が未定義ノードを参照`);
        });
      } else if (g.kind === "table") {
        if (!Array.isArray(g.head) || !Array.isArray(g.rows)) err(f, `${sid}: table図は head/rows 必須`);
      } else if (g.kind === "encap") {
        if (!Array.isArray(g.layers) || g.layers.length < 2) err(f, `${sid}: encap図はlayers 2つ以上`);
        (g.layers ?? []).forEach((L, i) => {
          if (!L.label || !Array.isArray(L.parts) || L.parts.length === 0) err(f, `${sid}: encap layers[${i}]は label/parts 必須`);
          (L.parts ?? []).forEach((p) => { if (!p.t || typeof p.w !== "number") err(f, `${sid}: encap partは t/w(数値) 必須`); });
        });
      } else if (g.kind === "bits") {
        if (!Array.isArray(g.cells) || g.cells.length < 2) err(f, `${sid}: bits図はcells 2つ以上`);
        (g.cells ?? []).forEach((c, i) => { if (!c.top || !Array.isArray(c.steps)) err(f, `${sid}: bits cells[${i}]は top/steps 必須`); });
      } else if (g.kind === "header") {
        const unit = g.unit ?? 32;
        if (!Array.isArray(g.rows) || g.rows.length === 0) err(f, `${sid}: header図はrows 必須`);
        (g.rows ?? []).forEach((r, i) => {
          const sum = (r.fields ?? []).reduce((s, x) => s + (x.bits ?? 0), 0);
          if (sum !== unit) err(f, `${sid}: header rows[${i}] のbits合計が${sum}(=${unit}にする)`);
        });
      } else if (g.kind === "console") {
        if (!Array.isArray(g.lines) || g.lines.length === 0) err(f, `${sid}: console図はlines 必須`);
        (g.highlight ?? []).forEach((h) => { if (h < 0 || h >= (g.lines ?? []).length) err(f, `${sid}: console highlight ${h} が範囲外`); });
      } else if (g.kind === "topo") {
        if (!Array.isArray(g.nodes) || g.nodes.length < 2) err(f, `${sid}: topo図はnodes 2つ以上`);
        const ICONS = new Set(["pc", "server", "router", "l2sw", "l3sw", "fw", "cloud", "internet", "ap", "phone"]);
        const ids = new Set((g.nodes ?? []).map((n) => n.id));
        const H = g.height ?? 170;
        (g.nodes ?? []).forEach((n) => {
          if (!n.id || !n.label || n.x == null || n.y == null) err(f, `${sid}: topo nodeは id/label/x/y 必須`);
          if (!ICONS.has(n.icon)) err(f, `${sid}: topo icon "${n.icon}" は未定義(${[...ICONS].join("|")})`);
          if (n.x < 24 || n.x > 316) warn(f, `${sid}: topo node "${n.id}" xは24-316推奨`);
          if (n.y < 16 || n.y > H - 34) warn(f, `${sid}: topo node "${n.id}" yは16-${H - 34}推奨(ラベル用の余白)`);
        });
        (g.links ?? []).forEach((l) => {
          if (!ids.has(l.from) || !ids.has(l.to)) err(f, `${sid}: topo link ${l.from}->${l.to} が未定義ノードを参照`);
        });
      } else err(f, `${sid}: fig.kindは flow|net|table|encap|bits|header|console|topo`);
    } else err(f, `${sid}: figが不正`);
  }
}

for (const f of targets) {
  let c;
  try { c = JSON.parse(readFileSync(f, "utf8")); } catch (e) { err(f, `JSONパース失敗: ${e.message}`); continue; }
  for (const k of ["id", "theme", "chip", "title", "desc", "kind", "order", "steps"]) {
    if (c[k] === undefined) err(f, `トップレベル "${k}" がない`);
  }
  if (allCourseIds.has(c.id)) err(f, `コースID重複: ${c.id}`);
  allCourseIds.add(c.id);
  if (!THEME_IDS.has(c.theme)) err(f, `不明なテーマ "${c.theme}"`);
  if (!["basics", "exam"].includes(c.kind)) err(f, `kindは basics|exam`);
  if (!Array.isArray(c.steps) || c.steps.length < 10) err(f, `stepsは10以上必要(現在 ${c.steps?.length ?? 0})`);

  const ids = new Set();
  let finals = 0, quizzes = 0, sources = 0;
  for (const s of c.steps ?? []) {
    const sid = s.id ?? "(no id)";
    if (!s.id) err(f, `idのないステップ`);
    else if (ids.has(s.id)) err(f, `ステップID重複: ${s.id}`);
    ids.add(s.id);
    if (!STEP_TYPES.has(s.type)) { err(f, `${sid}: 不明なtype "${s.type}"`); continue; }
    if (typeof s.scaffold !== "number" || s.scaffold < 0 || s.scaffold > 5) err(f, `${sid}: scaffoldは0-5の数値`);
    if (!s.format) err(f, `${sid}: format(表示ラベル)必須`);
    if (!s.theme) err(f, `${sid}: theme(チップ表示)必須`);
    if (s.fig) checkFig(f, s.fig, sid);
    checkStyle(f, s, sid, err, warn);
    if (s.dialog && (!Array.isArray(s.dialog) || s.dialog.some((d) => !d.q || !d.a))) {
      err(f, `${sid}: dialogは {q, a} の配列`);
    }

    if (s.type === "quiz") {
      quizzes++;
      if (!s.title) err(f, `${sid}: quiz title必須`);
      if (!Array.isArray(s.choices) || s.choices.length < 2 || s.choices.length > 6) err(f, `${sid}: choicesは2-6個`);
      else {
        const oks = s.choices.filter((x) => x.ok).length;
        if (oks !== 1) err(f, `${sid}: okの選択肢はちょうど1つ(現在${oks})`);
        s.choices.forEach((x, i) => {
          if (!x.text) err(f, `${sid}: choices[${i}].text必須`);
          if (!x.explain) warn(f, `${sid}: choices[${i}] にexplainがない(全選択肢に解説を)`);
        });
      }
      if (s.format === "午前Ⅱ") {
        sources++;
        if (!s.source?.label) err(f, `${sid}: 午前Ⅱは source.label(出典)必須`);
        if (!s.source?.url || !/nw-siken\.com|ipa\.go\.jp|ap-siken\.com/.test(s.source.url)) {
          err(f, `${sid}: 午前Ⅱは source.url(裏取りに使ったnw-siken等のURL)必須`);
        }
      }
    }
    if (s.type === "info" && !s.body) err(f, `${sid}: info body必須`);
    if (s.type === "blank") {
      if (!s.template || !Array.isArray(s.blanks)) err(f, `${sid}: blankは template/blanks 必須`);
      else for (const b of s.blanks) {
        if (!s.template.includes(`{${b.key}}`)) err(f, `${sid}: templateに{${b.key}}がない`);
        const oks = (b.choices ?? []).filter((x) => x.ok).length;
        if (oks !== 1) err(f, `${sid}: blank ${b.key} のokはちょうど1つ`);
        if (!b.why) warn(f, `${sid}: blank ${b.key} にwhy(解説)がない`);
      }
    }
    if (s.type === "parsons") {
      const n = (s.lines ?? []).length;
      const isPerm = (a) => Array.isArray(a) && a.length === n && [...a].sort((x, y) => x - y).every((v, i) => v === i);
      if (n < 3) err(f, `${sid}: parsonsはlines3つ以上`);
      if (!isPerm(s.shuffled)) err(f, `${sid}: shuffledは0..${n - 1}の並べ替えであること`);
      if (!Array.isArray(s.okOrders) || !s.okOrders.every(isPerm)) err(f, `${sid}: okOrdersの各要素は0..${n - 1}の並べ替え`);
      if (!s.okExplain || !s.ngExplain) warn(f, `${sid}: okExplain/ngExplain推奨`);
      if (JSON.stringify(s.shuffled) === JSON.stringify(s.okOrders?.[0])) err(f, `${sid}: shuffledが正解順と同じ`);
    }
    if (s.type === "calc" && typeof s.answer !== "number") err(f, `${sid}: calc answerは数値`);
    if (s.type === "write") {
      if (s.final) finals++;
      const K = s.kijutsu;
      if (!K?.limit || !K?.model || !Array.isArray(K?.rubric)) err(f, `${sid}: writeは kijutsu.limit/model/rubric 必須`);
      else for (const r of K.rubric) {
        try { new RegExp(r.pattern); } catch { err(f, `${sid}: rubric正規表現が不正: ${r.pattern}`); }
      }
    }
  }
  if (c.kind === "exam" && finals !== 1) err(f, `examコースは final:true のwriteがちょうど1つ必要(現在${finals})`);
  if (c.kind === "exam") {
    const E = c.exam;
    if (!E) err(f, `examコースは exam(ゴール模擬問題)必須`);
    else {
      for (const k of ["label", "title", "questions", "note"]) if (E[k] === undefined) err(f, `exam.${k} がない`);
      if (!Array.isArray(E.body) || E.body.length < 2) err(f, `exam.body は段落2つ以上`);
      if (!Array.isArray(E.questions) || E.questions.length < 2) err(f, `exam.questions は2つ以上`);
      const segOk = (s) => ("t" in s) || ("blank" in s) || ("u" in s && "mark" in s);
      (E.body ?? []).forEach((p, i) => {
        if (!Array.isArray(p) || !p.every(segOk)) err(f, `exam.body[${i}] のセグメントは {t} / {blank} / {u,mark}`);
      });
      (E.procedure ?? []).forEach((r, i) => {
        if (!r.no || !Array.isArray(r.segs) || !r.segs.every(segOk)) err(f, `exam.procedure[${i}] は no/segs 必須`);
      });
      if (E.figure && !("src" in E.figure)) checkFig(f, E.figure, "exam.figure");
      if (!/出典|IPA/.test(E.note ?? "")) err(f, `exam.note に出典(どの試験のどの問を基にしたか)を書く`);
      /* 事例文の空欄・下線が、設問と対応しているか */
      const marks = new Set();
      const blanks = new Set();
      const scan = (segs) => segs.forEach((s) => { if ("blank" in s) blanks.add(s.blank); if ("mark" in s) marks.add(s.mark); });
      (E.body ?? []).forEach(scan);
      (E.procedure ?? []).forEach((r) => scan(r.segs));
      let qtext = (E.questions ?? []).join("");
      /* 「( a )〜( c )」のような範囲指定を展開してから照合する */
      for (const m of qtext.matchAll(/[(（]\s*([a-z])\s*[)）]\s*[〜～~-]\s*[(（]\s*([a-z])\s*[)）]/g)) {
        for (let i = m[1].charCodeAt(0); i <= m[2].charCodeAt(0); i++) qtext += String.fromCharCode(i);
      }
      for (const b of blanks) if (!qtext.includes(b)) warn(f, `exam: 空欄( ${b} )に対応する設問が見当たらない`);
      for (const m of marks) if (!qtext.includes(m)) warn(f, `exam: 下線${m}に対応する設問が見当たらない`);
      /* goalTag は設問番号に 1対1 対応させる */
      const tags = (c.steps ?? []).filter((s) => s.goalTag).map((s) => s.goalTag);
      if (tags.length < 2) warn(f, `examコースは goalTag(実際の設問番号)付きのステップを2つ以上置く`);
    }
  }
  if (c.kind !== "exam" && c.exam) err(f, `exam は examコースにだけ置く`);
  if (c.kind === "basics" && finals > 0) err(f, `basicsコースに final write は置かない`);
  if (c.kind === "basics" && sources < 2) warn(f, `午前Ⅱ実物が${sources}問(2問以上推奨・ただし裏取りできた分だけ)`);
  console.log(`ok?   ${path.basename(f)}: ${c.steps?.length ?? 0} steps, quiz=${quizzes}, 午前Ⅱ=${sources}`);
}
console.log(`\n${errors} errors, ${warnings} warnings`);
process.exit(errors > 0 ? 1 : 0);

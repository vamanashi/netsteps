import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const originals = JSON.parse(fs.readFileSync("src/content/originals.json", "utf8"));
const directory = "src/content/readings";
assert.ok(fs.existsSync(directory), "原文読解教材がありません。");
const files = fs.readdirSync(directory).filter(file => file.endsWith(".json"));
assert.ok(files.length > 0, "原文読解教材がありません。");
const examKeys = new Set();
const transcriptDirectory = "src/content/reading-transcripts";
const transcripts = fs.readdirSync(transcriptDirectory).filter(file => file.endsWith(".json")).map(file => ({ file, ...JSON.parse(fs.readFileSync(path.join(transcriptDirectory, file), "utf8")) }));

function validatePassage(passage, exam, location) {
  assert.ok(Array.isArray(passage.blocks) && passage.blocks.length, `${location}: 原文ブロックが必要`);
  const validPage = page => Number.isInteger(page) && page >= exam.startPage && page <= exam.endPage;
  const validateParagraph = paragraph => {
    assert.ok(typeof paragraph.text === "string" && paragraph.text.trim(), `${location}: 原文テキストが必要`);
    assert.ok(Array.isArray(paragraph.pages) && paragraph.pages.length && paragraph.pages.every(validPage), `${location}: 原文の出典ページが必要`);
    assert.ok(!paragraph.text.includes("\ufffd"), `${location}: 文字化けあり`);
    assert.ok(paragraph.underlines === undefined || Array.isArray(paragraph.underlines), `${location}: 下線の形式が不正`);
    const ranges = (paragraph.underlines ?? []).map(text => {
      assert.ok(typeof text === "string" && text.length && paragraph.text.includes(text), `${location}: 下線が本文に一致しない`);
      return { start: paragraph.text.indexOf(text), end: paragraph.text.indexOf(text) + text.length };
    }).sort((left, right) => left.start - right.start);
    assert.ok(ranges.every((range, index) => !index || ranges[index-1].end <= range.start), `${location}: 下線範囲が重複`);
  };
  assert.ok(passage.context === undefined || Array.isArray(passage.context), `${location}: 再掲文脈の形式が不正`);
  for (const paragraph of passage.context ?? []) validateParagraph(paragraph);
  for (const block of passage.blocks) {
    assert.ok(["text", "figure"].includes(block.type), `${location}: 未対応ブロック`);
    if (block.type === "text") validateParagraph(block);
    else {
      assert.ok(validPage(block.page) && typeof block.caption === "string" && block.caption.trim(), `${location}: 原図のページ・見出しが必要`);
      assert.ok(Number.isFinite(block.top) && Number.isFinite(block.bottom) && block.top >= 0 && block.bottom <= 1 && block.top < block.bottom, `${location}: 原図の切り出し範囲が不正`);
      assert.ok(fs.existsSync(`public${exam.official.pages[block.page-exam.startPage]}`), `${location}: 原図なし`);
    }
  }
  assert.ok(passage.blocks.some(block => block.type === "text") || passage.context?.length, `${location}: 図だけでなく導入の原文が必要`);
}

for (const file of files) {
  const plan = JSON.parse(fs.readFileSync(path.join(directory, file), "utf8"));
  const exam = originals.find(exam => exam.key === plan.examKey);
  assert.ok(exam, `${file}: 未知の原問`);
  assert.ok(!examKeys.has(plan.examKey), `${file}: 原問の重複`);
  examKeys.add(plan.examKey);
  assert.ok(plan.title && plan.chapters.length, `${file}: タイトル・章が必要`);
  const chapterIds = new Set();
  const partIds = new Set();
  const targets = [];
  const parts = {};
  const questions = {};
  for (const transcript of transcripts.filter(transcript => transcript.examKey === plan.examKey)) {
    for (const [kind, entries] of [["parts", parts], ["questions", questions]]) {
      for (const [id, passage] of Object.entries(transcript[kind] ?? {})) {
        assert.ok(!entries[id], `${transcript.file}: ${kind}/${id} が重複`);
        validatePassage(passage, exam, `${transcript.file}/${id}`);
        entries[id] = passage;
      }
    }
  }
  let previousPage = exam.startPage;
  let previousTop = 0;
  for (const chapter of plan.chapters) {
    assert.ok(chapter.id && !chapterIds.has(chapter.id), `${file}: 章IDの重複`);
    chapterIds.add(chapter.id);
    assert.ok(chapter.title && chapter.lead && chapter.parts.length, `${file}: 章の本文が必要`);
    targets.push(...chapter.targets);
    for (const part of chapter.parts) {
      assert.ok(part.id && !partIds.has(part.id), `${file}: 読解IDの重複`);
      partIds.add(part.id);
      assert.ok(part.title && part.lead && part.regions.length, `${file}/${part.id}: 読解範囲が必要`);
      for (const region of part.regions) {
        assert.ok(Number.isInteger(region.page) && region.page >= exam.startPage && region.page <= exam.endPage, `${file}/${part.id}: 原ページが範囲外`);
        assert.ok(Number.isFinite(region.top) && Number.isFinite(region.bottom) && region.top >= 0 && region.bottom <= 1 && region.top < region.bottom, `${file}/${part.id}: 切り出し範囲が不正`);
        assert.ok(region.page > previousPage || region.page === previousPage && region.top >= previousTop, `${file}/${part.id}: 原文の読む順序が逆転`);
        previousPage = region.page;
        previousTop = region.top;
        assert.ok(fs.existsSync(`public${exam.official.pages[region.page-exam.startPage]}`), `${file}/${part.id}: 原画像なし`);
      }
      assert.ok(part.check?.prompt && part.check.choices.length >= 2, `${file}/${part.id}: 理解チェックが必要`);
      assert.equal(part.check.choices.filter(choice => choice.ok === true).length, 1, `${file}/${part.id}: 正解は一つ`);
      assert.equal(new Set(part.check.choices.map(choice => choice.text)).size, part.check.choices.length, `${file}/${part.id}: 選択肢が重複`);
      assert.ok(part.check.choices.every(choice => choice.text && choice.explain && typeof choice.ok === "boolean"), `${file}/${part.id}: 選択肢と理由が必要`);
    }
  }
  assert.deepEqual([...targets].sort(), exam.items.map(item => item.id).sort(), `${file}: 各原問を一度ずつ章末に配置する`);
  assert.deepEqual(Object.keys(parts).sort(), [...partIds].sort(), `${file}: 全区切りの原文テキストを用意する`);
  assert.deepEqual(Object.keys(questions).sort(), [...targets].sort(), `${file}: 全小問の原文テキストを用意する`);
  console.log(`${file}: ${plan.chapters.length} chapters, ${partIds.size} reading checks, ${targets.length} original answers`);
}
assert.ok(transcripts.every(transcript => examKeys.has(transcript.examKey)), "未知の読解教材に対する原文テキストがあります。");
console.log("Reading plans: transcripts, source references and answer coverage validated. Verbatim accuracy and context boundaries require visual review.");

import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const read = path => JSON.parse(readFileSync(path, "utf8"));
const checkUrl = value => {
  const url = new URL(value);
  assert.equal(url.protocol, "https:", `出典URLはHTTPSが必要: ${value}`);
  assert.ok(!url.username && !url.password, "出典URLに認証情報は使用できません");
};
let count = 0;
for (const file of readdirSync("src/content/courses").filter(file => file.endsWith(".json"))) {
  for (const step of read(`src/content/courses/${file}`).steps) {
    if (!step.source) continue;
    const label = step.source.label;
    for (const pattern of [/試験/, /平成|令和/, /春|秋/, /午前|午後/, /問\d+/, /IPA/]) {
      assert.match(label, pattern, `${file}/${step.id}: 出典の試験名・年度・区分・問番号が不足`);
    }
    checkUrl(step.source.url);
    count++;
  }
}
const originals = read("src/content/originals.json");
for (const exam of originals) {
  assert.match(exam.official.label, /IPA/);
  assert.ok(exam.official.label.includes(exam.title), `${exam.key}: 原典の識別情報が不足`);
  checkUrl(exam.official.url);
  checkUrl(exam.official.answerUrl);
}
for (const file of readdirSync("src/content/workshops").filter(file => file.endsWith(".json"))) {
  const workshop = read(`src/content/workshops/${file}`);
  const original = originals.find(exam => exam.key === workshop.examKey);
  assert.ok(original && workshop.verifiedSources.includes(original.official.url), `${file}: 原典の参照なし`);
  workshop.verifiedSources.forEach(checkUrl);
}
console.log(`Attribution: ${count} morning source records, ${originals.length} afternoon sources validated.`);

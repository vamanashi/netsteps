import fs from 'node:fs';
import assert from 'node:assert/strict';

const originals = JSON.parse(fs.readFileSync('src/content/originals.json', 'utf8'));
const plans = JSON.parse(fs.readFileSync('src/content/learning-paths.json', 'utf8')).paths;
const courses = fs.readdirSync('src/content/courses').filter(name => name.endsWith('.json')).map(name => JSON.parse(fs.readFileSync(`src/content/courses/${name}`, 'utf8')));
const workshops = new Set(fs.readdirSync('src/content/workshops').filter(name => name.endsWith('.json')).map(name => JSON.parse(fs.readFileSync(`src/content/workshops/${name}`, 'utf8')).examKey));
const keys = new Set();
let entries = 0;
for (const exam of originals) {
  assert(!keys.has(exam.key), `Duplicate question: ${exam.key}`);
  keys.add(exam.key);
  if (exam.coverage === 'individual') assert(workshops.has(exam.key) || courses.some(course => course.id === exam.courseId), `Missing authored course: ${exam.key}`);
  else {
    const plan = plans.find(plan => plan.key === exam.key);
    assert(plan, `Missing learning path: ${exam.key}`);
    for (const theme of plan.foundation) assert(courses.some(course => course.kind === 'basics' && course.theme === theme), `Missing prerequisite: ${theme}`);
  }
  assert(exam.items.length > 0, `No answer entries: ${exam.key}`);
  assert(exam.official.url.startsWith('https://www.ipa.go.jp/'), `Unofficial source: ${exam.key}`);
  assert(exam.official.pages.length === exam.endPage - exam.startPage + 1, `Page range: ${exam.key}`);
  for (const page of exam.official.pages) assert(fs.existsSync(`public${page}`), `Missing page: ${page}`);
  for (const page of exam.answerPages) assert(fs.existsSync(`public${page}`), `Missing answer page: ${page}`);
  const ids = new Set();
  for (const item of exam.items) {
    assert(!ids.has(item.id), `Duplicate subquestion: ${exam.key}/${item.id}`);
    ids.add(item.id);
    assert(item.answer.trim() || item.answerIsDiagram && exam.answerPages.length, `Empty answer: ${exam.key}/${item.id}`);
    assert(item.regions.length, `No source excerpt: ${exam.key}/${item.id}`);
    for (const region of item.regions) {
      assert(exam.official.pages.includes(region.src), `Foreign question page: ${exam.key}/${item.id}`);
      assert(region.top >= 0 && region.bottom <= 1 && region.top < region.bottom, `Invalid crop: ${exam.key}/${item.id}`);
    }
    entries++;
  }
}
assert.equal(originals.length, 50);
assert.equal(originals.filter(exam => exam.division === 'pm1').length, 30);
assert.equal(originals.filter(exam => exam.division === 'pm2').length, 20);
assert.equal(new Set(originals.map(exam => exam.exam)).size, 10);
assert.equal(new Set(plans.map(plan => plan.key)).size, 39);
console.log(`Original catalog: ${originals.length} questions, ${entries} answer entries, all assets present.`);

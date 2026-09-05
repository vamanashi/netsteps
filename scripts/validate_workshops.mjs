import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';

const originals = JSON.parse(fs.readFileSync('src/content/originals.json', 'utf8'));
const directory = 'src/content/workshops';
const argumentsList = process.argv.slice(2).filter(argument => argument !== '--complete');
const files = argumentsList.length ? argumentsList : fs.existsSync(directory) ? fs.readdirSync(directory).filter(file => file.endsWith('.json')).map(file => path.join(directory, file)) : [];
const examKeys = new Set();
let total = 0;
for (const file of files) {
  const workshop = JSON.parse(fs.readFileSync(file, 'utf8'));
  const exam = originals.find(exam => exam.key === workshop.examKey);
  assert(exam, `${file}: unknown exam`);
  assert(!examKeys.has(exam.key), `${file}: duplicate exam`);
  examKeys.add(exam.key);
  assert(workshop.title && workshop.verifiedSources?.includes(exam.official.url), `${file}: source verification missing`);
  assert(workshop.sections?.length >= 3, `${file}: at least three learning sections required`);
  const targets = new Set();
  const sections = new Set();
  const types = new Set();
  let questions = 0, steps = 0, excerpts = 0, figures = 0;
  for (const section of workshop.sections) {
    const label = `${file}/${section.id}`;
    assert(section.id && section.title && !sections.has(section.id), `${label}: section identity`);
    sections.add(section.id);
    assert(section.steps.length >= 4, `${label}: needs small preparatory steps`);
    assert(section.targets?.length, `${label}: no target`);
    section.targets.forEach(target => { assert(exam.items.some(item => item.id === target), `${label}: unknown target ${target}`); targets.add(target); });
    const ids = new Set();
    for (const step of section.steps) {
      assert(step.id && !ids.has(step.id) && step.title && step.format && step.theme, `${label}: step metadata`);
      ids.add(step.id);
      assert(['info', 'quiz', 'blank', 'parsons'].includes(step.type), `${label}/${step.id}: must work by tapping`);
      assert(['concept', 'check', 'apply', 'reason', 'assemble', 'transfer'].includes(step.stage), `${label}/${step.id}: learning stage`);
      assert(Number.isFinite(step.scaffold) && step.scaffold >= 0 && step.scaffold <= 5, `${label}/${step.id}: scaffold`);
      types.add(step.type);
      steps++;
      const choices = list => {
        assert(list?.length >= 2 && list.filter(choice => choice.ok).length === 1, `${label}/${step.id}: exactly one correct choice`);
        assert(new Set(list.map(choice => choice.text)).size === list.length, `${label}/${step.id}: duplicate choices`);
        assert(list.every(choice => choice.text && choice.explain), `${label}/${step.id}: explain every choice`);
      };
      if (step.type === 'info') assert(step.body, `${label}/${step.id}: missing explanation`);
      if (step.type === 'quiz') { choices(step.choices); questions++; }
      if (step.type === 'blank') {
        assert(step.blanks?.length && step.template, `${label}/${step.id}: blank format`);
        assert(new Set(step.blanks.map(blank => blank.key)).size === step.blanks.length, `${label}/${step.id}: duplicate blank key`);
        for (const blank of step.blanks) { assert(/^[a-z][a-z0-9_-]*$/i.test(blank.key) && blank.why && step.template.includes(`{${blank.key}}`), `${label}/${step.id}: blank mapping`); choices(blank.choices); }
        for (const match of step.template.matchAll(/\{([^{}]+)\}/g)) assert(step.blanks.some(blank => blank.key === match[1]), `${label}/${step.id}: undefined blank`);
      }
      if (step.type === 'parsons') {
        const valid = order => Array.isArray(order) && order.length === step.lines.length && new Set(order).size === order.length && order.every(index => Number.isInteger(index) && step.lines[index]);
        assert(step.lines?.length >= 2 && step.lines.every(line => line.code), `${label}/${step.id}: order lines`);
        assert(valid(step.shuffled) && step.okOrders?.length && step.okOrders.every(valid), `${label}/${step.id}: order permutation`);
        assert(step.okExplain && step.ngExplain && step.lead, `${label}/${step.id}: order explanation`);
      }
      if (step.originalExcerpt) {
        const excerpt = step.originalExcerpt;
        assert(excerpt.page >= exam.startPage && excerpt.page <= exam.endPage && excerpt.top >= 0 && excerpt.bottom <= 1 && excerpt.top < excerpt.bottom && excerpt.label, `${label}/${step.id}: invalid original excerpt`);
        const image = `public/ipa/originals/${exam.exam}_nw_${exam.division}_qs/${String(excerpt.page).padStart(2, '0')}.jpg`;
        assert(fs.existsSync(image), `${label}/${step.id}: original page image missing`);
        excerpts++;
      }
      for (const figure of step.fig ? (Array.isArray(step.fig) ? step.fig : [step.fig]) : []) {
        const figureLabel = `${label}/${step.id}: invalid figure`;
        assert(figure && typeof figure === 'object' && ['flow', 'net', 'table', 'encap', 'bits', 'header', 'console', 'topo'].includes(figure.kind), figureLabel);
        if (figure.kind === 'flow') assert(figure.steps?.length >= 2 && figure.steps.every(item => item.t), figureLabel);
        if (['net', 'topo'].includes(figure.kind)) {
          assert(figure.nodes?.length >= 2, figureLabel);
          const nodeIds = new Set(figure.nodes.map(node => node.id));
          assert(nodeIds.size === figure.nodes.length && figure.nodes.every(node => node.id && node.label && Number.isFinite(node.x) && Number.isFinite(node.y)), `${figureLabel}: node identity and position`);
          assert((figure.links ?? []).every(link => nodeIds.has(link.from) && nodeIds.has(link.to) && link.from !== link.to), `${figureLabel}: link endpoints`);
        }
        if (figure.kind === 'net') assert(Array.isArray(figure.links), figureLabel);
        if (figure.kind === 'table') assert(figure.head?.length && figure.rows?.length && figure.rows.every(row => row.length === figure.head.length), figureLabel);
        if (figure.kind === 'encap') assert(figure.layers?.length && figure.layers.every(layer => layer.label && layer.parts?.length && layer.parts.every(part => part.t && part.w > 0)), figureLabel);
        if (figure.kind === 'bits') assert(figure.cells?.length && figure.cells.every(cell => cell.top && cell.steps?.length), figureLabel);
        if (figure.kind === 'header') assert(figure.rows?.length && figure.rows.every(row => row.fields?.length && row.fields.every(field => field.t && field.bits > 0) && row.fields.reduce((sum, field) => sum + field.bits, 0) === (figure.unit ?? 32)), `${figureLabel}: header width`);
        if (figure.kind === 'console') assert(figure.lines?.length, figureLabel);
        if (figure.kind === 'topo') assert(figure.nodes.every(node => ['pc', 'server', 'router', 'l2sw', 'l3sw', 'fw', 'cloud', 'internet', 'ap', 'phone'].includes(node.icon)), `${figureLabel}: device icon`);
        figures++;
      }
    }
  }
  for (const item of exam.items) assert(targets.has(item.id), `${file}: missing preparation for ${item.id}`);
  for (const type of ['quiz', 'blank', 'parsons']) assert(types.has(type), `${file}: missing ${type}`);
  assert(steps >= 30 && questions >= 10 && excerpts >= 2 && figures >= 3, `${file}: insufficient small-step practice, figures, or original excerpts`);
  total += steps;
  console.log(`${path.basename(file)}: ${steps} steps, ${targets.size}/${exam.items.length} targets, ${excerpts} original excerpts`);
}
if (process.argv.includes('--complete')) assert.equal(examKeys.size, originals.length, 'Every afternoon question needs its own workshop');
console.log(`Workshops: ${files.length} exams, ${total} steps. Structural validation passed; pedagogy and source accuracy still require review.`);

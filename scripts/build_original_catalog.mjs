import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const read = filename => JSON.parse(fs.readFileSync(filename, 'utf8'));
const database = read('data/db/nw-db.json');
const ranges = read('src/content/exam-plans.json');
const themes = read('src/content/themes.json');
const paths = read('src/content/learning-paths.json').paths;
const courses = fs.readdirSync('src/content/courses').filter(name => name.endsWith('.json')).map(name => read(path.join('src/content/courses', name)));
const workshops = new Set(fs.readdirSync('src/content/workshops').filter(name => name.endsWith('.json')).map(name => read(path.join('src/content/workshops', name)).examKey));
const normalized = value => value.normalize('NFKC').replace(/\s/g, '');
const catalog = [];
for (const exam of database.exams) {
  for (const division of ['pm1', 'pm2']) {
    const pages = read(`data/original-index/${exam.id}_nw_${division}_qs.json`);
    const answerPages = read(`data/original-index/${exam.id}_nw_${division}_ans.json`).map(page => page.src);
    const answers = execFileSync('pdftotext', ['-layout', exam.files[`${division}_ans`].local, '-'], { encoding: 'utf8' }).replace(/^\s*\d+\/\d+\s*$/gm, '').replace(/^.*©.*$/gm, '').replace(/\f/g, '\n');
    const questionHeaders = [...answers.matchAll(/^\s*問([0-9０-９]+)\s*$/gm)];
    for (const question of exam[division]) {
      const key = `${exam.id}/${division}/${question.q}`;
      const start = ranges[exam.id][division][question.q - 1];
      const selected = pages.filter(page => page.page >= start && page.page < ranges[exam.id][division][question.q]);
      while (selected.length && selected.at(-1).lines.map(line => line.text).join('').length < 50) selected.pop();
      const end = selected.at(-1).page;
      const sectionStarts = selected.flatMap(page => page.lines.filter(line => /^設[問間][1-9]/.test(normalized(line.text))).map(line => ({ section: Number(normalized(line.text).match(/^設[問間](\d+)/)[1]), page: page.page, top: Math.max(0, line.y - .01) })));
      const headerIndex = questionHeaders.findIndex(header => Number(header[1].normalize('NFKC')) === question.q);
      if (headerIndex < 0) throw new Error(`Missing answer: ${key}`);
      const raw = answers.slice(questionHeaders[headerIndex].index, questionHeaders[headerIndex+1]?.index ?? answers.length);
      const sections = [...raw.matchAll(/設問\s*([0-9０-９]+)/g)];
      const items = [];
      for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
        const section = Number(sections[sectionIndex][1].normalize('NFKC'));
        const text = raw.slice(sections[sectionIndex].index + sections[sectionIndex][0].length, sections[sectionIndex+1]?.index ?? raw.length).trim();
        const parts = [...text.matchAll(/(?:^|\n)\s*[（(]([0-9０-９]+)[）)]/g)];
        const location = sectionStarts.find(item => item.section === section);
        const nextLocation = sectionStarts.find(item => item.section === section + 1);
        const regionPages = selected.filter(page => page.page >= (location?.page ?? end - 1) && page.page <= (nextLocation?.page ?? end));
        const regions = regionPages.map(page => ({ src: page.src, page: page.page, top: page.page === location?.page ? location.top : .03, bottom: page.page === nextLocation?.page ? nextLocation.top : .94 })).filter(region => region.bottom > region.top + .01);
        const append = (part, answer) => {
          const partLocations = regionPages.flatMap(page => page.lines.filter(line => {
            const withinStart = !location || page.page > location.page || line.y >= location.top;
            const withinEnd = !nextLocation || page.page < nextLocation.page || line.y < nextLocation.top;
            return withinStart && withinEnd && line.x < .25 && /^\(\d+\)/.test(normalized(line.text));
          }).map(line => ({ part: Number(normalized(line.text).match(/^\((\d+)\)/)[1]), page: page.page, top: Math.max(0, line.y - .007) })));
          const partStart = part ? partLocations.find(entry => entry.part === part) : null;
          const partEnd = partStart ? partLocations.find(entry => entry.part === part + 1 && (entry.page > partStart.page || entry.page === partStart.page && entry.top > partStart.top)) ?? nextLocation : null;
          const preciseRegions = partStart ? selected.filter(page => page.page >= partStart.page && page.page <= (partEnd?.page ?? end)).map(page => ({ src: page.src, page: page.page, top: page.page === partStart.page ? partStart.top : .03, bottom: page.page === partEnd?.page ? partEnd.top : .94 })).filter(region => region.bottom > region.top + .01) : regions;
          items.push({ id: `s${section}${part ? `-${part}` : ''}`, label: `設問${section}${part ? `(${part})` : ''}`, section, answer: answer.trim(), answerIsDiagram: !answer.trim(), regions: preciseRegions.length ? preciseRegions : regions, precise: preciseRegions.length > 0 && (!!partStart || !part) });
        };
        if (parts.length) parts.forEach((part, index) => append(Number(part[1].normalize('NFKC')), text.slice(part.index + part[0].length, parts[index+1]?.index ?? text.length)));
        else append(null, text);
      }
      if (!items.length || !selected.length) throw new Error(`Missing source: ${key}`);
      if (items.some(item => !item.regions.length)) throw new Error(`Missing question region: ${key}`);
      const excludedItems = key === '2024r06h/pm2/2' ? items.filter(item => item.section === 5) : [];
      const reiwa = Number(exam.id.slice(5,7));
      const courseId = reiwa === 7 && division === 'pm1' && question.q === 1 ? 'r7q1' : `r${reiwa}${division}q${question.q}`;
      const course = exam.id.includes('r') ? courses.find(item => item.id === courseId) : undefined;
      const theme = themes.map[key];
      const title = `${exam.label} ${division === 'pm1' ? '午後Ⅰ' : '午後Ⅱ'} 問${question.q}`;
      const plan = paths.find(path => path.key === key);
      if (!course && !plan) throw new Error(`Missing learning path: ${key}`);
      catalog.push({ key, exam: exam.id, division, q: question.q, title, theme, relatedThemes: plan?.foundation ?? [theme], courseId: course?.id ?? `guided-${exam.id}-${division}-q${question.q}`, coverage: course || workshops.has(key) ? 'individual' : 'foundation', gist: question.gist,
        official: { label: `出典：${title} ネットワークスペシャリスト試験（IPA）`, pages: selected.map(page => page.src), url: exam.files[`${division}_qs`].url, answerUrl: exam.files[`${division}_ans`].url },
        answerPages, startPage: start, endPage: end, items: items.filter(item => !excludedItems.includes(item)), excludedItems: excludedItems.map(item => ({ id: item.id, label: item.label, reason: 'IPAが不備により成立しないと公表した設問のため、学習進捗・自己採点の分母から除外。' })), introduction: { src: selected[0].src, page: start, top: .04, bottom: .40 }
      });
    }
  }
}
fs.writeFileSync('src/content/originals.json', JSON.stringify(catalog, null, 2) + '\n');
console.log(`${catalog.length} original questions, ${catalog.reduce((sum, exam) => sum + exam.items.length, 0)} answer entries`);

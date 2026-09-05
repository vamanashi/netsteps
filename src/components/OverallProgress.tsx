import { UNITS } from "../content/units";
import { ORIGINALS, examProgress } from "../content/catalog";
import { READINGS, readingProgress } from "../content/readings";
import { progress } from "../engine/progress";
import type { Persisted } from "../engine/storage";

export function overallProgress(data: Persisted) {
  const rows = [
    { label: "基礎問題", total: 0, answered: 0, correct: 0 },
    { label: "過去問の練習", total: 0, answered: 0, correct: 0 },
    { label: "読解チェック", total: 0, answered: 0, correct: 0 },
    { label: "過去問（小問）", total: 0, answered: 0, correct: 0 },
  ];
  for (const unit of UNITS) {
    const stats = progress(unit, data.units[unit.id]);
    const row = rows[unit.kind === "basics" ? 0 : 1];
    row.total += stats.questionTotal;
    row.answered += stats.answered;
    row.correct += stats.correct;
  }
  for (const plan of READINGS) {
    const stats = readingProgress(plan, data.readings?.[plan.examKey]);
    rows[2].total += stats.total;
    rows[2].answered += stats.answered;
    rows[2].correct += stats.correct;
  }
  for (const exam of ORIGINALS) {
    rows[3].total += exam.items.length;
    for (const item of exam.items) {
      const attempt = [...(data.exams[exam.key] ?? [])].reverse().find(entry => entry.answers[item.id]?.trim());
      if (!attempt) continue;
      rows[3].answered++;
      if (attempt.judgments[item.id] === "correct") rows[3].correct++;
    }
  }
  return {
    rows,
    total: rows.reduce((sum, row) => sum + row.total, 0),
    answered: rows.reduce((sum, row) => sum + row.answered, 0),
    correct: rows.reduce((sum, row) => sum + row.correct, 0),
    examsDone: ORIGINALS.filter(exam => examProgress(exam, data.exams[exam.key]).complete).length,
  };
}

const number = (value: number) => value.toLocaleString("ja-JP");
const percent = (answered: number, total: number) => total ? Math.min(answered < total ? 99.99 : 100, Math.round(answered / total * 10000) / 100) : 0;

export function OverallProgress({ data }: { data: Persisted }) {
  const stats = overallProgress(data);
  return <section className="overall-progress" aria-labelledby="overall-progress-title">
    <div className="overall-heading"><h2 id="overall-progress-title">全体の進み具合</h2><a href="#progress">詳細</a></div>
    <div className="overall-count"><span><strong>{number(stats.answered)}</strong> / {number(stats.total)} 問 回答済み</span><b>{percent(stats.answered, stats.total)}%</b></div>
    <progress aria-label="全問題の回答済み割合" value={stats.answered} max={stats.total || 1} />
    <div className="overall-status"><span>正解 {number(stats.correct)} 問</span><span>未回答 {number(stats.total - stats.answered)} 問</span></div>
    <div className="overall-breakdown">{stats.rows.filter(row => row.total > 0).map(row => <div className="overall-row" key={row.label}>
      <span>{row.label}</span><progress aria-label={`${row.label}の回答済み割合`} value={row.answered} max={row.total} /><span>{number(row.answered)} / {number(row.total)}</span>
    </div>)}</div>
    <div className="overall-exams"><span>全小問に解答した過去問</span><a href="#exams">{stats.examsDone} / {ORIGINALS.length} 問</a></div>
    <details className="overall-notes"><summary>数え方</summary><p>解説・図の操作は除外します。穴埋めや並べ替えは画面ごとに1問、過去問は小問ごとに1問です。同じ問題の解き直しは重複して数えません。</p><p>正解数は各問題の直近の回答で集計し、過去問の自己採点を含みます。過去問の再挑戦中も、まだ回答していない小問には前回の記録を使います。別コースの練習は別の問題として数えます。</p></details>
  </section>;
}

import { useRef, useState } from "react";
import { useSubmission } from "../engine/Submission";
import { T, SANS, MONO, EASE } from "../design/tokens";
import { Mono, Press, PrimaryButton, Judge, Note } from "../components/ui";
import { CasePeek } from "../components/ExamSheet";
import { QHeader, ExcerptCard, seededOrder } from "./StepParts";
import { Figs } from "../components/figures";
import { charCount } from "../engine/types";
import type { ParsonsStepT, BlankStepT, CalcStepT, WriteStepT, StepRecord } from "../engine/types";
import type { OnDone, RecordMistake } from "./BasicSteps";

/* ---------- ドラッグ&ドロップ並べ替え ---------- */
const GAP = 7;
const arrMove = (arr: number[], from: number, to: number) => {
  const a = [...arr]; const [x] = a.splice(from, 1); a.splice(to, 0, x); return a;
};

export function ParsonsStep({ step, again, record, onDone, recordMistake }: { step: ParsonsStepT; again?: boolean; record?: StepRecord; onDone: OnDone; recordMistake: RecordMistake }) {
  const persist = useSubmission();
  const correctOrder = step.okOrders[0].map((index, position) => `${position + 1}. ${step.lines[index].code}`).join("\n");
  const computeVec = (ord: number[]): boolean[] => {
    let best: boolean[] = [], bestCount = -1;
    step.okOrders.forEach((o) => {
      const vec = ord.map((id, i) => id === o[i]);
      const cnt = vec.filter(Boolean).length;
      if (cnt > bestCount) { bestCount = cnt; best = vec; }
    });
    return best;
  };
  const rec = record?.data as { order?: number[] } | undefined;
  const initOrder = rec?.order ?? step.shuffled;
  const [order, setOrder] = useState(initOrder);
  const [drag, setDrag] = useState<{ pos: number; startY: number } | null>(null);
  const [dy, setDy] = useState(0);
  const [submitted, setSubmitted] = useState(!!record);
  const [matchVec, setMatchVec] = useState<boolean[] | null>(record ? computeVec(initOrder) : null);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const onDown = (e: React.PointerEvent, pos: number) => {
    if (submitted) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({ pos, startY: e.clientY }); setDy(0);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag || submitted) return;
    const delta = e.clientY - drag.startY, pos = drag.pos;
    const cur = refs.current[pos]?.getBoundingClientRect();
    if (!cur) { setDy(delta); return; }
    const c = cur.top + (delta - dy) + cur.height / 2;
    if (pos < order.length - 1) {
      const nr = refs.current[pos + 1]?.getBoundingClientRect();
      if (nr && c > nr.top + nr.height / 2) { setOrder(arrMove(order, pos, pos + 1)); setDrag({ pos: pos + 1, startY: drag.startY + nr.height + GAP }); setDy(delta - nr.height - GAP); return; }
    }
    if (pos > 0) {
      const pr = refs.current[pos - 1]?.getBoundingClientRect();
      if (pr && c < pr.top + pr.height / 2) { setOrder(arrMove(order, pos, pos - 1)); setDrag({ pos: pos - 1, startY: drag.startY - pr.height - GAP }); setDy(delta + pr.height + GAP); return; }
    }
    setDy(delta);
  };
  const onUp = () => { setDrag(null); setDy(0); };
  const submit = () => {
    const best = computeVec(order);
    persist(best.every(Boolean), { order });
    setMatchVec(best); setSubmitted(true);
    if (!best.every(Boolean)) {
      recordMistake({ title: step.title, your: "並び順に誤りあり", correct: correctOrder, explain: step.ngExplain });
    }
  };
  const allOk = submitted && !!matchVec && matchVec.every(Boolean);
  return (
    <div>
      <QHeader title={step.title} format={step.format} again={again} goalTag={step.goalTag} theme={step.theme} />
      <div style={{ fontFamily: SANS, fontSize: 13, color: T.sub, marginBottom: 14, marginTop: -4, lineHeight: 1.7 }}>{step.lead}</div>
      <Figs fig={step.fig} />
      <div style={{ borderRadius: 14, border: "1.5px dashed #D6D6D2", padding: 8, background: "#FBFBFA" }}>
        {order.map((id, pos) => {
          const l = step.lines[id]; const isDrag = !!drag && drag.pos === pos;
          const state = submitted && matchVec ? (matchVec[pos] ? "ok" : "ng") : "idle";
          return (
            <div key={id} ref={(el) => (refs.current[pos] = el)} onPointerDown={(e) => onDown(e, pos)} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} className={state === "ng" ? "shake" : ""}
              style={{ display: "flex", alignItems: "flex-start", gap: 8, fontFamily: SANS, fontSize: 13, lineHeight: 1.55, fontWeight: 600, padding: "11px 12px", borderRadius: 10, marginBottom: pos < order.length - 1 ? GAP : 0, textAlign: "left", border: `1px solid ${isDrag ? T.ink : state === "ok" ? T.ok : state === "ng" ? T.ng : T.line}`, background: state === "ok" ? T.okBg : state === "ng" ? T.ngBg : T.card, color: state === "ok" ? T.ok : state === "ng" ? T.ng : T.ink, boxShadow: isDrag ? "0 8px 20px rgba(17,17,19,0.14)" : "none", transform: isDrag ? `translateY(${dy}px) scale(1.015)` : "none", transition: isDrag ? "none" : `transform 240ms ${EASE}, background 300ms, border 300ms, color 300ms`, position: "relative", zIndex: isDrag ? 5 : 1, touchAction: submitted ? "auto" : "none", cursor: submitted ? "default" : "grab", userSelect: "none" }}>
              <span style={{ fontFamily: MONO, opacity: state === "idle" ? 0.3 : 1, flexShrink: 0 }}>{state === "ok" ? "+" : state === "ng" ? "-" : "⠿"}</span>
              <span style={{ flex: 1 }}>{l.code}</span>
              {!submitted && <span className="order-buttons" onPointerDown={event => event.stopPropagation()}><button type="button" aria-label={`${l.code}を上へ`} disabled={pos === 0} onClick={() => setOrder(arrMove(order, pos, pos - 1))}>↑</button><button type="button" aria-label={`${l.code}を下へ`} disabled={pos === order.length - 1} onClick={() => setOrder(arrMove(order, pos, pos + 1))}>↓</button></span>}
            </div>
          );
        })}
      </div>
      {submitted && <Judge ok={allOk} />}
      {submitted && !allOk && <Note tag="correct" color={T.ok}><pre style={{ fontFamily: SANS, fontSize: 12.5, lineHeight: 1.9, background: T.card, border: `1px solid ${T.line}`, borderRadius: 10, padding: "10px 12px", margin: "6px 0 8px", whiteSpace: "pre-wrap", color: T.ink, fontWeight: 600 }}>{correctOrder}</pre>{step.ngExplain}</Note>}
      {submitted && allOk && <Note tag="note">{step.okExplain}</Note>}
      <div style={{ marginTop: 20 }}>{!submitted ? <PrimaryButton label="判定する" onClick={submit} /> : <PrimaryButton label="つぎへ" onClick={() => onDone(allOk, { order })} />}</div>
    </div>
  );
}

/* ---------- 午後形式: 事例文の空欄補充 ---------- */
export function BlankStep({ step, again, record, onDone, recordMistake }: { step: BlankStepT; again?: boolean; record?: StepRecord; onDone: OnDone; recordMistake: RecordMistake }) {
  const persist = useSubmission();
  const rec = record?.data as { sel?: (number | null)[]; orders?: number[][] } | undefined;
  const [sel, setSel] = useState<(number | null)[]>(rec?.sel ?? step.blanks.map(() => null));
  const [orders] = useState<number[][]>(() => rec?.orders ?? step.blanks.map((blank, index) => seededOrder(`${step.id}-${index}-${Math.random()}`, blank.choices.length)));
  const [submitted, setSubmitted] = useState(!!record);
  const allPicked = sel.every((s) => s !== null);
  const allOk = submitted && step.blanks.every((b, i) => b.choices[sel[i]!].ok);
  const submit = () => {
    persist(step.blanks.every((blank, index) => blank.choices[sel[index]!].ok), { sel, orders });
    setSubmitted(true);
    if (!step.blanks.every((b, i) => b.choices[sel[i]!].ok)) {
      recordMistake({
        title: step.title,
        your: step.blanks.map((b, i) => `${b.label}: ${b.choices[sel[i]!].text}`).join(" / "),
        correct: step.blanks.map((b) => `${b.label}: ${b.choices.find((c) => c.ok)!.text}`).join(" / "),
        explain: step.blanks.map((b) => b.why).join("\n"),
      });
    }
  };
  const parts = step.template.split(/(\{[a-z][a-z0-9_-]*\})/i);
  return (
    <div>
      <QHeader title={step.title} format={step.format} again={again} goalTag={step.goalTag} theme={step.theme} />
      <Figs fig={step.fig} />
      <ExcerptCard excerpt={step.excerpt} />
      {step.showCase && <CasePeek />}
      <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 16, padding: "16px 18px", fontFamily: SANS, fontSize: 14.5, lineHeight: 2.1, color: T.ink }}>
        {parts.map((p, i) => {
          const m = p.match(/^\{([a-z][a-z0-9_-]*)\}$/i);
          if (!m) return <span key={i}>{p}</span>;
          const bIdx = step.blanks.findIndex((b) => b.key === m[1]);
          const b = step.blanks[bIdx];
          const chosen = sel[bIdx] !== null ? b.choices[sel[bIdx]!].text : null;
          const ok = submitted && sel[bIdx] !== null ? !!b.choices[sel[bIdx]!].ok : null;
          return (
            <span key={i} className={submitted && !ok ? "shake" : ""} style={{ display: "inline-block", minWidth: 64, padding: "1px 12px", margin: "0 2px", borderRadius: 8, textAlign: "center", fontWeight: 700, border: `1.5px ${chosen === null ? "dashed" : "solid"} ${submitted ? (ok ? T.ok : T.ng) : chosen ? T.ink : "#C9C9C5"}`, background: submitted ? (ok ? T.okBg : T.ngBg) : chosen ? "#FBFBFA" : "transparent", color: submitted ? (ok ? T.ok : T.ng) : chosen ? T.ink : T.faint, transition: `all 300ms ${EASE}` }}>
              {chosen || b.label}{submitted && !ok && <span style={{ fontSize: 11, color: T.ok, fontWeight: 600 }}>(正: {b.choices.find((c) => c.ok)!.text})</span>}
            </span>
          );
        })}
      </div>
      {step.blanks.map((b, bi) => (
        <div key={bi} style={{ marginTop: 16 }}>
          <Mono color={T.faint}>空欄 {b.label}</Mono>
          <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
            {orders[bi].map((ci) => {
              const c = b.choices[ci];
              const chosen = sel[bi] === ci;
              let border = chosen ? T.ink : T.line, color = T.ink, bg = T.card;
              if (submitted) {
                if (c.ok) { border = T.ok; color = T.ok; bg = T.okBg; }
                else if (chosen) { border = T.ng; color = T.ng; bg = T.ngBg; }
                else color = T.faint;
              }
              return <Press key={ci} onClick={() => { if (!submitted) { const ns = [...sel]; ns[bi] = ci; setSel(ns); } }} disabled={submitted}><div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, padding: "12px 18px", borderRadius: 12, border: `1.5px solid ${border}`, background: bg, color, transition: `all 250ms ${EASE}` }}>{c.text}</div></Press>;
            })}
          </div>
        </div>
      ))}
      {submitted && <Judge ok={allOk} />}
      {submitted && <Note tag="note">{step.blanks.map((b, i) => {
        const selected = sel[i] === null ? null : b.choices[sel[i]!];
        return <div key={i} style={{ marginBottom: 8 }}>{selected && !selected.ok && selected.explain && <div style={{ color: T.ng, marginBottom: 3 }}>{b.label}: {selected.explain}</div>}<div>{b.why}</div></div>;
      })}</Note>}
      <div style={{ marginTop: 20 }}>{!submitted ? <PrimaryButton label="判定する" onClick={submit} disabled={!allPicked} /> : <PrimaryButton label="つぎへ" onClick={() => onDone(allOk, { sel, orders })} />}</div>
    </div>
  );
}

/* ---------- 計算(数値解答・スキップ可) ---------- */
export function CalcStep({ step, again, record, onDone, recordMistake }: { step: CalcStepT; again?: boolean; record?: StepRecord; onDone: OnDone; recordMistake: RecordMistake }) {
  const persist = useSubmission();
  const rec = record?.data as { val?: string } | undefined;
  const [val, setVal] = useState(rec?.val ?? "");
  const [submitted, setSubmitted] = useState(!!record);
  const parse = (value: string) => value.trim() && /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value.trim()) ? Number(value) : NaN;
  const isOk = submitted && Math.abs(parse(val) - step.answer) < 0.001;
  const submit = () => {
    persist(Math.abs(parse(val) - step.answer) < 0.001, { val });
    setSubmitted(true);
    if (!(Math.abs(parse(val) - step.answer) < 0.001)) {
      recordMistake({ title: step.title, your: val + step.unit, correct: `${step.answer}${step.unit}`, explain: step.fail });
    }
  };
  const skip = () => {
    recordMistake({ title: step.title, your: "(スキップ)", correct: `${step.answer}${step.unit}`, explain: "未解答として復習に記録しました。目次からこの問題に戻り、解き直せます。" });
    onDone(false, { val });
  };
  return (
    <div>
      <QHeader title={step.title} format={step.format} again={again} goalTag={step.goalTag} theme={step.theme} />
      <Figs fig={step.fig} />
      <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 16, padding: "16px 18px", marginBottom: 14 }}>
        {step.given.map((g, i) => <div key={i} style={{ fontFamily: MONO, fontSize: 12.5, lineHeight: 2, color: T.ink }}>· {g}</div>)}
        <div style={{ fontFamily: SANS, fontSize: 14.5, fontWeight: 600, color: T.ink, marginTop: 8, lineHeight: 1.7 }}>{step.question}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <input className={submitted && !isOk ? "shake" : ""} value={val} onChange={(e) => !submitted && setVal(e.target.value)} placeholder={step.placeholder} inputMode="decimal" readOnly={submitted} style={{ flex: 1, fontFamily: MONO, fontSize: 18, padding: "13px 16px", borderRadius: 12, border: `1.5px solid ${submitted ? (isOk ? T.ok : T.ng) : T.ink}`, background: T.card, color: submitted ? (isOk ? T.ok : T.ng) : T.ink, transition: `border 300ms ${EASE}` }} />
        <span style={{ fontFamily: MONO, fontSize: 14, color: T.sub }}>{step.unit}</span>
      </div>
      {submitted && <Judge ok={isOk} />}
      {submitted && !isOk && <Note tag="correct" color={T.ok}><span style={{ fontFamily: MONO, fontSize: 13, color: T.ink }}>{step.answer}{step.unit}</span> — {step.fail}</Note>}
      {submitted && isOk && <Note tag="note">{step.success}</Note>}
      <div style={{ marginTop: 20 }}>{!submitted ? <PrimaryButton label="判定する" onClick={submit} disabled={val.trim() === ""} /> : <PrimaryButton label="つぎへ" onClick={() => onDone(isOk, { val })} />}</div>
      {!submitted && <Press onClick={skip} style={{ width: "100%", marginTop: 4 }}><div style={{ fontFamily: MONO, fontSize: 11.5, color: T.faint, textAlign: "center", padding: "12px 0", letterSpacing: "0.06em" }}>- いまは計算できない · スキップ(不正解あつかい)</div></Press>}
    </div>
  );
}

/* ---------- 記述(〜n字で述べよ) ---------- */
export function WriteStep({ step, again, record, onDone, recordMistake }: { step: WriteStepT; again?: boolean; record?: StepRecord; onDone: OnDone; recordMistake: RecordMistake }) {
  const persist = useSubmission();
  const K = step.kijutsu;
  const rec = record?.data as { text?: string } | undefined;
  const [text, setText] = useState(rec?.text ?? "");
  const [submitted, setSubmitted] = useState(!!record);
  const [everWrong, setEverWrong] = useState(false);
  const [showModel, setShowModel] = useState(false);
  const count = charCount(text);
  const calc = (t: string) => [
    charCount(t) > 0 && charCount(t) <= K.limit,
    ...K.rubric.map((r) => new RegExp(r.pattern).test(t)),
  ];
  const results = submitted ? calc(text) : null;
  const allOk = !!results && results.every(Boolean);
  const rows = [{ label: `${K.limit}字以内に収まっている` }, ...K.rubric];
  const submit = () => {
    const res = calc(text); setSubmitted(true);
    persist(res.every(Boolean), { text });
    if (!res.every(Boolean) && !everWrong) {
      setEverWrong(true);
      recordMistake({ title: K.title, your: text || "(未記入)", correct: K.model, explain: "採点キーワードに不足がありました。" + K.alt });
    }
  };
  const skip = () => {
    recordMistake({ title: K.title, your: "(スキップ)", correct: K.model, explain: "目次からこの問題に戻り、解き直せます。 " + K.alt });
    onDone(false, { text });
  };
  return (
    <div>
      <QHeader title={K.title} format="記述" again={again} goalTag={step.goalTag} theme={step.theme} />
      <div style={{ fontFamily: SANS, fontSize: 13.5, color: T.sub, marginBottom: 14, marginTop: -4, lineHeight: 1.8 }}>{K.lead}</div>
      <ExcerptCard excerpt={step.excerpt} />
      {step.showCase && <CasePeek />}
      <textarea value={text} onChange={(e) => { setText(e.target.value); setSubmitted(false); }} rows={3} placeholder={`ここに解答(${K.limit}字以内)`} style={{ width: "100%", background: T.card, color: T.ink, border: `1.5px solid ${T.ink}`, fontFamily: SANS, fontSize: 15, lineHeight: 1.8, borderRadius: 14, padding: "14px 16px", resize: "none", fontWeight: 600 }} />
      <div style={{ fontFamily: MONO, fontSize: 11.5, color: count > K.limit ? T.ng : T.faint, textAlign: "right", marginTop: 6, letterSpacing: "0.06em" }}>{count} / {K.limit} 字</div>
      {submitted && results && (
        <div style={{ marginTop: 8 }}>
          <Mono color={T.faint}>練習用のキーワード確認（公式採点ではありません）</Mono>
          <div style={{ marginTop: 8 }}>
            {rows.map((r, i) => (
              <div key={i} className="riseIn" style={{ display: "flex", gap: 10, alignItems: "baseline", fontFamily: SANS, fontSize: 13.5, fontWeight: 500, padding: "9px 0", borderBottom: `1px solid ${T.line}`, color: results[i] ? T.ink : T.ng, animationDelay: `${i * 60}ms` }}>
                <span style={{ fontFamily: MONO, fontSize: 12, color: results[i] ? T.ok : T.ng, width: 12 }}>{results[i] ? "+" : "-"}</span>{r.label}
              </div>
            ))}
          </div>
        </div>
      )}
      {submitted && <Judge ok={allOk} />}
      {submitted && allOk && <Note tag="note">必要な語句を確認できました。文意や条件も解答例と照合してください。解答例: 「{K.model}」 {K.alt}</Note>}
      {submitted && !allOk && <Note tag="fix" color={T.ng}>「-」の要素を足して再判定を。模範解の骨格は「{K.rubric.map((r) => r.label.split("(")[0]).join("」+「")}」の組合せです。</Note>}
      {submitted && !allOk && <Press onClick={() => setShowModel(!showModel)} style={{ width: "100%", marginTop: 12 }}><div style={{ border: `1px solid ${T.line}`, background: T.card, color: T.sub, fontFamily: SANS, fontSize: 14, fontWeight: 600, padding: "13px 0", borderRadius: 12, textAlign: "center" }}>{showModel ? "模範解をとじる" : "模範解をみる"}</div></Press>}
      {showModel && <div className="riseIn" style={{ fontFamily: SANS, fontSize: 14.5, fontWeight: 700, lineHeight: 1.9, background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, padding: 16, margin: "12px 0 0", color: T.ink }}>{K.model}<div style={{ fontSize: 12, fontWeight: 500, color: T.sub, marginTop: 6 }}>{K.alt}</div></div>}
      <div style={{ marginTop: 20 }}>
        {submitted && allOk
          ? <PrimaryButton label={step.final ? "練習を終えて原問へ" : "つぎへ"} onClick={() => onDone(true, { text })} />
          : <PrimaryButton label={submitted ? "再判定する" : "判定する"} onClick={submit} disabled={count === 0} />}
      </div>
      {!(submitted && allOk) && <Press onClick={skip} style={{ width: "100%", marginTop: 4 }}><div style={{ fontFamily: MONO, fontSize: 11.5, color: T.faint, textAlign: "center", padding: "12px 0", letterSpacing: "0.06em" }}>- いまは書けない · スキップ(不正解あつかい{step.final ? " · きょうはここまで" : ""})</div></Press>}
    </div>
  );
}

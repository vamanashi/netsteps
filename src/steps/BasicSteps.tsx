import { useState } from "react";
import { useSubmission } from "../engine/Submission";
import { T, SANS, MONO, EASE } from "../design/tokens";
import { Mono, PatChip, Press, PrimaryButton, Judge, Note } from "../components/ui";
import { ExamSheet, CasePeek, ExamFigure, useExam } from "../components/ExamSheet";
import { OfficialExam, OfficialPeek } from "../components/OfficialExam";
import { VizDiagram } from "../components/NetDiagram";
import { useMemo } from "react";
import { QHeader, ExcerptCard, SourceBanner, Dialog, seededOrder } from "./StepParts";
import { Fig, Figs } from "../components/figures";
import type { GoalStepT, InfoStepT, QuizStepT, VizStepT, Mistake, StepRecord } from "../engine/types";

export type RecordMistake = (m: Omit<Mistake, "key" | "reviewed">) => void;
export type OnDone = (firstTryOk: boolean | null, data?: unknown) => void;

export function GoalStep({ step, record, onDone, onSelf }: { step: GoalStepT; record?: StepRecord; onDone: OnDone; onSelf: (s: string | null) => void }) {
  const [picked, setPicked] = useState<string | null>((record?.data as { self?: string } | undefined)?.self ?? null);
  const exam = useExam();
  const opts = ["さっぱり", "設問1くらいは", "解けそう"];
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Mono color={T.faint}>goal</Mono>
        <PatChip label={exam?.official?.label ?? step.theme} />
      </div>
      <h2 style={{ fontFamily: SANS, fontSize: 21, fontWeight: 700, letterSpacing: "-0.02em", color: T.ink, margin: "10px 0 10px", lineHeight: 1.5 }}>{step.title}</h2>
      <div style={{ fontFamily: SANS, fontSize: 13.5, color: T.sub, lineHeight: 1.8, marginBottom: 14 }}>{step.lead}</div>
      {exam?.official ? <OfficialExam official={exam.official} /> : <ExamSheet />}
      <div style={{ marginTop: 18 }}>
        <Mono color={T.faint}>正直なところ、いま解けそう？(採点しません)</Mono>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          {opts.map((o) => (
            <Press key={o} onClick={() => setPicked(o)} style={{ flex: 1 }}>
              <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, padding: "12px 0", borderRadius: 12, textAlign: "center", border: `1.5px solid ${picked === o ? T.ink : T.line}`, background: picked === o ? "#FBFBFA" : T.card, color: picked === o ? T.ink : T.sub, transition: `all 250ms ${EASE}` }}>{o}</div>
            </Press>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 20 }}>
        <PrimaryButton label="この問題を解けるようになる" onClick={() => { onSelf(picked); onDone(null, { self: picked }); }} disabled={false} />
      </div>
    </div>
  );
}

export function QuizStep({ step, again, record, onDone, recordMistake }: { step: QuizStepT; again?: boolean; record?: StepRecord; onDone: OnDone; recordMistake: RecordMistake }) {
  const persist = useSubmission();
  const rec = record?.data as { picked?: number; order?: number[] } | undefined;
  const [picked, setPicked] = useState<number | null>(rec?.picked ?? null);
  const [submitted, setSubmitted] = useState(!!record);
  const exam = useExam();
  /* 選択肢は決定的にシャッフルして表示(pickedは元のindexで記録) */
  const ord = useMemo(() => rec?.order ?? seededOrder(`${step.id}-${Math.random()}`, step.choices.length), [step.id, step.choices.length]);
  const KANA = "アイウエオカ";
  const okIdx = step.choices.findIndex((c) => c.ok);
  const isOk = submitted && picked === okIdx;
  const submit = (choice: number) => {
    if (submitted) return;
    setPicked(choice);
    persist(choice === okIdx, { picked: choice, order: ord });
    setSubmitted(true);
    if (choice !== okIdx) {
      recordMistake({ title: step.title, your: step.choices[choice].text, correct: step.choices[okIdx].text, explain: step.choices[okIdx].explain ?? "" });
    }
  };
  return (
    <div>
      <QHeader title={step.title} format={step.format} again={again} goalTag={step.goalTag} theme={step.theme} />
      <SourceBanner source={step.source} figures={!!step.fig} />
      {step.intro && <div style={{ fontFamily: SANS, fontSize: 13.5, color: T.sub, lineHeight: 1.7, marginBottom: 14, marginTop: -4 }}>{step.intro}</div>}
      <Figs fig={step.fig} />
      <ExcerptCard excerpt={step.excerpt} />
      {step.showCase && <CasePeek />}
      {step.showOfficial && exam?.official && <OfficialPeek official={exam.official} />}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {ord.map((oi, di) => {
          const c = step.choices[oi];
          const sel = picked === oi;
          let border = sel && !submitted ? T.ink : T.line, bg = T.card, color = T.ink, dim = false;
          if (submitted) {
            if (oi === okIdx) { border = T.ok; bg = T.okBg; color = T.ok; }
            else if (oi === picked) { border = T.ng; bg = T.ngBg; color = T.ng; }
            else dim = true;
          }
          return (
            <Press key={oi} onClick={() => submit(oi)} disabled={submitted} pressed={sel} style={{ width: "100%" }}>
              <div className={submitted && oi === picked && oi !== okIdx ? "shake" : ""} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "15px 16px", borderRadius: 14, fontFamily: SANS, fontSize: 15, fontWeight: 600, textAlign: "left", border: `1.5px solid ${border}`, background: bg, color: dim ? T.faint : color, transition: `all 300ms ${EASE}`, lineHeight: 1.5 }}>
                <span style={{ display: "flex", gap: 8 }}>
                  {step.source && <span style={{ fontFamily: MONO, fontSize: 12.5, flexShrink: 0, marginTop: 1 }}>{KANA[di]}</span>}
                  <span>{c.text}</span>
                </span>
                {submitted && oi === okIdx && <span style={{ fontSize: 12, flexShrink: 0 }}>✓ 正解</span>}
                {submitted && oi === picked && oi !== okIdx && <span style={{ fontSize: 12, flexShrink: 0 }}>選択</span>}
              </div>
            </Press>
          );
        })}
      </div>
      {submitted && <Judge ok={isOk} />}
      {submitted && !isOk && picked !== null && <Note tag="you picked" color={T.ng}>{step.choices[picked].explain}</Note>}
      {submitted && <Note tag="note">{step.choices[okIdx].explain}</Note>}
      <div style={{ marginTop: 20 }}>
        {submitted && <PrimaryButton label="つぎへ" onClick={() => onDone(isOk, { picked, order: ord })} />}
      </div>
    </div>
  );
}

export function InfoStep({ step, onDone }: { step: InfoStepT; onDone: OnDone }) {
  const exam = useExam();
  return (
    <div>
      <QHeader title={step.title} format={step.format} theme={step.theme} />
      {(() => {
        const figs = step.fig ? (Array.isArray(step.fig) ? step.fig : [step.fig]) : [];
        const paras = step.body.split("\n\n");
        return (
          <>
            {paras.map((p, i) => (
              <div key={i}>
                <p style={{ fontFamily: SANS, fontSize: 16, lineHeight: 1.95, color: T.ink, margin: "0 0 20px" }}>{p}</p>
                {figs[i] !== undefined && <Fig fig={figs[i]} />}
              </div>
            ))}
            {figs.slice(paras.length).map((f, i) => <Fig key={i} fig={f} />)}
          </>
        );
      })()}
      <Dialog dialog={step.dialog} />
      {step.showFigure && exam && <div className="riseIn"><ExamFigure exam={exam} radius={12} /></div>}
      {step.showOfficial && exam?.official && (
        <div className="riseIn" style={{ marginBottom: 14 }}><OfficialExam official={exam.official} /></div>
      )}
      {(step.showCase || step.showExam) && (
        <div className="riseIn" style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 16, padding: "16px 18px", marginBottom: 4 }}>
          <ExamSheet compact />
        </div>
      )}
      <div style={{ marginTop: 20 }}><PrimaryButton label="つぎへ" onClick={() => onDone(null)} /></div>
    </div>
  );
}

export function VizStep({ step, record, onDone }: { step: VizStepT; record?: StepRecord; onDone: OnDone }) {
  const [phase, setPhase] = useState<1 | 2>(record ? 2 : 1);
  const [idx, setIdx] = useState(record ? step.run2.length : 0);
  const run = phase === 1 ? step.run1 : step.run2;
  const doneRun = idx >= run.length;
  const cur = doneRun ? null : run[idx];
  const goal = phase === 2 && doneRun;
  const logs = [
    ...(phase === 2 ? step.run1.map((s) => ({ ...s, old: true })) : []),
    ...run.slice(0, idx).map((s) => ({ ...s, old: false })),
  ];
  return (
    <div>
      <QHeader title={step.title} format={step.format} theme={step.theme} />
      <div style={{ fontFamily: SANS, fontSize: 13.5, color: T.sub, lineHeight: 1.7, marginBottom: 16, marginTop: -4 }}>{step.lead}</div>
      <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 16, padding: "16px 14px" }}>
        <VizDiagram
          nodes={step.nodes}
          active={(cur ?? run[run.length - 1]).hl}
          cut={phase === 2}
        />
        <div style={{ marginTop: 12, background: T.codeBg, borderRadius: 12, padding: "12px 14px", minHeight: 128 }}>
          <Mono color="#6B6B72" size={10}>ospf log{phase === 2 ? ` · ${step.run2Label}` : ""}</Mono>
          <div style={{ marginTop: 6 }}>
            {logs.length === 0 && <div style={{ fontFamily: MONO, fontSize: 11.5, color: "#4A4A50", lineHeight: 2 }}>「1手すすめる」でルータが動きます</div>}
            {logs.map((l, i) => <div key={i} className={l.old ? "" : "riseIn"} style={{ fontFamily: MONO, fontSize: 11.5, lineHeight: 2, color: l.old ? "#4A4A50" : T.codeText, whiteSpace: "pre-wrap" }}>{l.log}</div>)}
            {goal && <div className="riseIn" style={{ fontFamily: MONO, fontSize: 11.5, lineHeight: 2, color: T.ok, marginTop: 4 }}>{step.goalNote}</div>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          {!doneRun && <Press onClick={() => setIdx(idx + 1)} style={{ flex: 1 }}><div style={{ background: T.ink, color: "#fff", fontFamily: SANS, fontSize: 14, fontWeight: 600, padding: "12px 0", borderRadius: 12, textAlign: "center" }}>1手すすめる</div></Press>}
          {doneRun && phase === 1 && <Press onClick={() => { setPhase(2); setIdx(0); }} style={{ flex: 1 }}><div style={{ background: T.ink, color: "#fff", fontFamily: SANS, fontSize: 14, fontWeight: 600, padding: "12px 0", borderRadius: 12, textAlign: "center" }}>{step.cutLabel}</div></Press>}
          {goal && <div style={{ flex: 1, fontFamily: MONO, fontSize: 11.5, color: T.ok, textAlign: "center", padding: "12px 0" }}>+ 切替まで見届けた</div>}
        </div>
      </div>
      <div style={{ marginTop: 20 }}><PrimaryButton label="つぎへ" onClick={() => onDone(null, { done: true })} disabled={!goal} /></div>
      {!goal && <div style={{ fontFamily: MONO, fontSize: 11, color: T.faint, textAlign: "center", marginTop: 12, letterSpacing: "0.06em" }}>障害切替まで見届けると次へ</div>}
    </div>
  );
}

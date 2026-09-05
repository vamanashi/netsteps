import { createContext, useContext, useState } from "react";
import { T, SANS, MONO } from "../design/tokens";
import { Mono, Press } from "./ui";
import { Fig } from "./figures";
import type { ExamDef, Seg } from "../engine/types";

const assetUrl = (path: string) => path.startsWith("/") ? `${import.meta.env.BASE_URL}${path.slice(1)}` : path;

/* いま挑戦しているコースの模擬問題。過去問コースだけが持つ */
export const ExamContext = createContext<ExamDef | undefined>(undefined);
export const useExam = () => useContext(ExamContext);

function Segs({ segs }: { segs: Seg[] }) {
  return (
    <>
      {segs.map((seg, j) => {
        if ("blank" in seg) {
          return (
            <span key={j} style={{
              display: "inline-block", minWidth: 52, margin: "0 3px", padding: "0 10px",
              border: "1.5px dashed #C9C9C5", borderRadius: 8, textAlign: "center",
              fontFamily: MONO, fontSize: 12, color: T.sub,
            }}>{seg.blank}</span>
          );
        }
        if ("u" in seg) {
          return (
            <span key={j}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: T.sub, marginRight: 2 }}>{seg.mark}</span>
              <span style={{ borderBottom: `1.5px solid ${T.ink}`, paddingBottom: 1 }}>{seg.u}</span>
            </span>
          );
        }
        return <span key={j}>{seg.t}</span>;
      })}
    </>
  );
}

export function ExamFigure({ exam, radius = 10 }: { exam: ExamDef; radius?: number }) {
  const f = exam.figure;
  if (!f) return null;
  if ("src" in f) {
    return (
      <figure style={{ margin: "8px 0 12px" }}>
        <img src={assetUrl(f.src)} alt={f.caption} style={{ display: "block", width: "100%", height: "auto", background: "#fff", border: `1px solid ${T.line}`, borderRadius: radius }} />
        <figcaption style={{ fontFamily: SANS, fontSize: 10.5, color: T.sub, marginTop: 6, lineHeight: 1.6 }}>{f.caption}</figcaption>
      </figure>
    );
  }
  return <div style={{ margin: "8px 0 12px" }}><Fig fig={f} /></div>;
}

export function ExamSheet({ compact, exam }: { compact?: boolean; exam?: ExamDef }) {
  const ctx = useExam();
  const E = exam ?? ctx;
  if (!E) return null;
  const fs = compact ? 13 : 14;
  return (
    <div>
      <div style={{ fontFamily: SANS, fontSize: fs, fontWeight: 700, color: T.ink, marginBottom: 10, lineHeight: 1.7 }}>{E.title}</div>
      {E.body.map((para, i) => (
        <p key={i} style={{ fontFamily: SANS, fontSize: fs, lineHeight: 2.1, color: T.ink, margin: "0 0 10px" }}>
          <Segs segs={para} />
        </p>
      ))}
      <ExamFigure exam={E} />
      {E.procedure && E.procedure.length > 0 && (
        <div style={{ border: `1px solid ${T.line}`, borderRadius: 10, overflow: "hidden", marginBottom: 12 }}>
          {E.procTitle && <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: T.ink, padding: "8px 12px", borderBottom: `1px solid ${T.line}`, background: "#FBFBFA" }}>{E.procTitle}</div>}
          {E.procedure.map((row) => (
            <div key={row.no} style={{ display: "flex", gap: 10, padding: "7px 12px", borderBottom: `1px solid ${T.line}`, fontFamily: SANS, fontSize: compact ? 12 : 12.5, lineHeight: 1.8, color: T.ink }}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: T.sub, flexShrink: 0, width: 26 }}>{row.no}</span>
              <span><Segs segs={row.segs} /></span>
            </div>
          ))}
        </div>
      )}
      <div style={{ borderTop: `1px solid ${T.line}`, paddingTop: 10 }}>
        {E.questions.map((q, i) => (
          <div key={i} style={{ fontFamily: SANS, fontSize: compact ? 12.5 : 13.5, fontWeight: 600, color: T.ink, lineHeight: 2 }}>{q}</div>
        ))}
      </div>
      <div style={{ fontFamily: SANS, fontSize: 10.5, color: T.faint, marginTop: 10, lineHeight: 1.6 }}>{E.note}</div>
    </div>
  );
}

export function CasePeek() {
  const E = useExam();
  const [open, setOpen] = useState(false);
  if (!E) return null;
  return (
    <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, overflow: "hidden", marginBottom: 16 }}>
      <Press onClick={() => setOpen(!open)} style={{ width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
          <Mono>{E.label}</Mono>
          <span style={{ fontFamily: MONO, fontSize: 12, color: T.faint }}>{open ? "−" : "+"}</span>
        </div>
      </Press>
      {open && (
        <div className="riseIn" style={{ padding: "0 16px 14px" }}>
          <ExamSheet compact />
        </div>
      )}
    </div>
  );
}

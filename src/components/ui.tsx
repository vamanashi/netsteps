import { useState, type CSSProperties, type ReactNode } from "react";
import { T, SANS, MONO, EASE } from "../design/tokens";
import { createPortal } from "react-dom";
import { useLessonAction } from "../engine/LessonAction";

export function RollDigit({ digit, height }: { digit: number; height: number }) {
  return (
    <span style={{ display: "inline-block", height, overflow: "hidden", verticalAlign: "top" }}>
      <span style={{ display: "block", transform: `translateY(${-digit * height}px)`, transition: `transform 900ms ${EASE}` }}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <span key={n} style={{ display: "block", height, lineHeight: `${height}px`, textAlign: "center" }}>{n}</span>
        ))}
      </span>
    </span>
  );
}

export function NumberFlow({ value, size = 64, color = T.ink }: { value: number; size?: number; color?: string }) {
  return (
    <span style={{ fontFamily: MONO, fontSize: size, fontWeight: 500, letterSpacing: "-0.04em", color, fontVariantNumeric: "tabular-nums", display: "inline-flex" }}>
      {String(value).split("").map((d, i) => <RollDigit key={i} digit={+d} height={size * 1.05} />)}
    </span>
  );
}

export function Press({ children, onClick, style, disabled, pressed }: { children: ReactNode; onClick?: () => void; style?: CSSProperties; disabled?: boolean; pressed?: boolean }) {
  const [down, setDown] = useState(false);
  return (
    <button
      onClick={onClick} disabled={disabled} aria-pressed={pressed}
      onPointerDown={() => setDown(true)} onPointerUp={() => setDown(false)} onPointerLeave={() => setDown(false)}
      style={{
        border: "none", background: "none", padding: 0,
        cursor: disabled ? "default" : "pointer",
        transform: down && !disabled ? "scale(0.965)" : "scale(1)",
        transition: `transform 260ms ${EASE}`, ...style,
      }}
    >{children}</button>
  );
}

export function PrimaryButton({ label, onClick, disabled }: { label: string; onClick?: () => void; disabled?: boolean }) {
  const target = useLessonAction();
  const text = label === "つぎへ" ? "次へ" : label === "判定する" ? "解答する" : label;
  const button = <button className="lesson-primary" onClick={onClick} disabled={disabled}>{text}</button>;
  return target ? createPortal(button, target) : button;
}

export function Mono({ children, color = T.sub, size = 11 }: { children: ReactNode; color?: string; size?: number }) {
  return <span style={{ fontFamily: MONO, fontSize: size, letterSpacing: "0.08em", color, textTransform: "uppercase" }}>{children}</span>;
}

export function PatChip({ label }: { label: string }) {
  return <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.06em", color: T.sub, border: `1px solid ${T.line}`, borderRadius: 999, padding: "4px 10px", background: T.card }}>{label}</span>;
}

export function Judge({ ok }: { ok: boolean }) {
  return (
    <div className={`riseIn lesson-judgment ${ok ? "is-correct" : "needs-review"}`} role="status">
      {ok ? "正解" : "不正解"}
    </div>
  );
}

export function Note({ tag = "note", color = T.ok, children }: { tag?: string; color?: string; children: ReactNode }) {
  return (
    <div className="riseIn lesson-explanation" style={{ marginTop: 12, fontFamily: SANS, fontSize: 15, color: T.sub, lineHeight: 1.9 }}>
      <strong style={{ color, display: "block", fontSize: 12, marginBottom: 6 }}>{tag === "note" ? "解説" : tag === "you picked" ? "選んだ答えについて" : tag}</strong>
      {children}
    </div>
  );
}

export function Scaffold({ amount, h = 12 }: { amount: number; h?: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 2.5, alignItems: "flex-end" }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} style={{ width: 4, height: h, borderRadius: 1.5, background: i < amount ? T.ink : T.line, transition: `background 500ms ${EASE}` }} />
      ))}
    </span>
  );
}

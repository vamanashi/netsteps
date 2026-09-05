import { T, SANS, MONO } from "../design/tokens";
import { Mono, PatChip } from "../components/ui";
import { Attribution } from "../components/Attribution";

/** 選択肢シャッフル用の決定的な並び(ステップIDから生成、リロードしても同じ) */
export function seededOrder(seed: string, n: number): number[] {
  let h = 2166136261;
  for (const c of seed) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  h >>>= 0;
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0;
    const j = h % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 学習者の素朴な疑問と回答(吹き出し) */
export function Dialog({ dialog }: { dialog?: { q: string; a: string }[] }) {
  if (!dialog || dialog.length === 0) return null;
  return (
    <>
      {dialog.map((d, i) => (
        <div key={i} style={{ margin: "0 0 16px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <span style={{ width: 24, height: 24, borderRadius: 999, border: `1.5px solid ${T.line}`, background: T.card, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: 10, color: T.sub }}>?</span>
            <div style={{ background: "#EFEFEC", borderRadius: "4px 14px 14px 14px", padding: "10px 14px", fontFamily: SANS, fontSize: 13.5, fontWeight: 600, color: T.ink, lineHeight: 1.7 }}>{d.q}</div>
          </div>
          <div style={{ fontFamily: SANS, fontSize: 14, color: T.sub, lineHeight: 2, marginTop: 10, paddingLeft: 32 }}>{d.a}</div>
        </div>
      ))}
    </>
  );
}

/** IPA過去問バナー — 本試験の問題であることを示し、身構えさせる */
export function SourceBanner({ source, figures }: { source?: { label: string; url?: string }; figures?: boolean }) {
  if (!source) return null;
  return <Attribution {...source} mode="past" figures={figures} />;
}

/** 事例文の抜粋カード — 全文を読ませない、ここだけ読めば解ける */
export function ExcerptCard({ excerpt }: { excerpt?: { label?: string; lines: string[] } }) {
  if (!excerpt) return null;
  return (
    <div style={{ background: T.card, border: `1px solid ${T.line}`, borderLeft: `3px solid ${T.ink}`, borderRadius: 12, padding: "12px 16px", marginBottom: 14 }}>
      <Mono color={T.faint} size={10}>{excerpt.label ?? "事例文より · ここだけ読めばOK"}</Mono>
      {excerpt.lines.map((l, i) => (
        <p key={i} style={{ fontFamily: SANS, fontSize: 13.5, lineHeight: 2, color: T.ink, margin: "6px 0 0" }}>{l}</p>
      ))}
    </div>
  );
}

export function QHeader({ title }: {
  title: string; format: string; again?: boolean; goalTag?: string; theme?: string;
}) {
  return (
    <>
      <h2 style={{ fontFamily: SANS, fontSize: 21, fontWeight: 700, letterSpacing: "-0.02em", color: T.ink, margin: "10px 0 14px", lineHeight: 1.5 }}>{title}</h2>
    </>
  );
}

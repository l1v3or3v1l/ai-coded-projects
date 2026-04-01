import { useState, useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalcResult {
  error?: string;
  monthlyInterest?: number;
  morInterest: number;
  effectivePrincipal: number;
  repaymentInterest: number;
  lifetimeInterest: number;
  months: number;
  years: number;
  remMonths: number;
  yearRows: YearRow[];
  morMonthlyInterest: number;
}

interface YearRow {
  year: number;
  open: number;
  princPaid: number;
  intPaid: number;
  close: number;
}

interface LegendItem {
  label: string;
  value: number;
  color: string;
  pct: string;
}

// ─── Design Tokens ────────────────────────────────────────────────────────────

const C = {
  bg:         "#0d1117",
  card:       "#1c2330",
  border:     "#30363d",
  accent:     "#f0a500",
  accentSoft: "rgba(240,165,0,0.12)",
  teal:       "#2dd4bf",
  tealSoft:   "rgba(45,212,191,0.12)",
  red:        "#f87171",
  redSoft:    "rgba(248,113,113,0.12)",
  amberSoft:  "rgba(245,158,11,0.10)",
  amber:      "#f59e0b",
  muted:      "#8b949e",
  text:       "#e6edf3",
  textSub:    "#c9d1d9",
  principal:  "#3b82f6",
  morInt:     "#f59e0b",
  repInt:     "#10b981",
} as const;

// ─── Formatters ───────────────────────────────────────────────────────────────

const fmt = (n: number): string =>
  "₹" + Math.round(n).toLocaleString("en-IN");

const fmtShort = (n: number): string => {
  if (n >= 1e7) return "₹" + (n / 1e7).toFixed(2) + " Cr";
  if (n >= 1e5) return "₹" + (n / 1e5).toFixed(2) + " L";
  return fmt(n);
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ marginBottom: 6, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
    color: C.muted, textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif" }}>
    {children}
  </div>
);

interface NumInputProps {
  value: number | string;
  onChange: (v: string) => void;
  prefix?: string;
  suffix?: string;
  step?: string;
  min?: number;
}

const NumInput = ({ value, onChange, prefix, suffix, step = "any", min = 0 }: NumInputProps) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      background: C.bg, border: `1.5px solid ${focused ? C.accent : C.border}`,
      borderRadius: 10, padding: "10px 13px", transition: "border-color 0.2s",
    }}>
      {prefix && (
        <span style={{ color: C.accent, fontWeight: 700, fontSize: 15,
          fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>{prefix}</span>
      )}
      <input
        type="number" value={value} min={min} step={step}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none",
          color: C.text, fontSize: 15, fontFamily: "'DM Mono', monospace", fontWeight: 500,
        }}
      />
      {suffix && (
        <span style={{ color: C.muted, fontSize: 12, flexShrink: 0 }}>{suffix}</span>
      )}
    </div>
  );
};

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  sub?: string;
}

const Toggle = ({ checked, onChange, label, sub }: ToggleProps) => (
  <div onClick={() => onChange(!checked)} style={{
    display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
    background: checked ? C.tealSoft : C.card,
    border: `1.5px solid ${checked ? C.teal : C.border}`,
    borderRadius: 10, padding: "12px 14px", transition: "all 0.25s", userSelect: "none",
  }}>
    <div style={{
      width: 38, height: 21, borderRadius: 11, flexShrink: 0,
      background: checked ? C.teal : C.border, position: "relative", transition: "background 0.25s",
    }}>
      <div style={{
        width: 15, height: 15, borderRadius: "50%", background: "#fff",
        position: "absolute", top: 3, left: checked ? 19 : 4, transition: "left 0.25s",
        boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
      }} />
    </div>
    <div>
      <div style={{ color: C.textSub, fontSize: 13, fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>{sub}</div>}
    </div>
  </div>
);

interface StatProps { label: string; value: string; color?: string; sub?: string; }

const Stat = ({ label, value, color, sub }: StatProps) => (
  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
    <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase",
      letterSpacing: "0.08em", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, marginBottom: 6 }}>
      {label}
    </div>
    <div style={{ fontSize: 20, fontWeight: 700, color: color ?? C.text,
      fontFamily: "'DM Mono', monospace", letterSpacing: "-0.02em", wordBreak: "break-word" }}>
      {value}
    </div>
    {sub && <div style={{ fontSize: 10, color: C.muted, marginTop: 4, lineHeight: 1.4 }}>{sub}</div>}
  </div>
);

interface StackedBarProps { principal: number; morInt: number; repInt: number; }

const StackedBar = ({ principal, morInt, repInt }: StackedBarProps) => {
  const total = principal + morInt + repInt;
  if (total === 0) return null;
  const pctOf = (v: number) => ((v / total) * 100).toFixed(1);
  const segments: LegendItem[] = [
    { label: "Principal",           value: principal, color: C.principal, pct: pctOf(principal) },
    { label: "Moratorium Interest", value: morInt,    color: C.morInt,    pct: pctOf(morInt) },
    { label: "Repayment Interest",  value: repInt,    color: C.repInt,    pct: pctOf(repInt) },
  ].filter((s) => s.value > 0);

  return (
    <div>
      <div style={{ display: "flex", height: 26, borderRadius: 8, overflow: "hidden", gap: 2 }}>
        {segments.map((s) => (
          <div key={s.label} title={`${s.label}: ${fmt(s.value)} (${s.pct}%)`} style={{
            width: `${s.pct}%`, background: s.color, transition: "width 0.5s ease",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 700, color: "#000", overflow: "hidden", flexShrink: 0,
          }}>
            {parseFloat(s.pct) > 12 ? `${s.pct}%` : ""}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
        {segments.map((s) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 9, height: 9, borderRadius: 3, background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: C.muted }}>{s.label}</span>
            <span style={{ fontSize: 11, color: C.textSub, fontFamily: "'DM Mono', monospace" }}>
              {fmtShort(s.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const YearTable = ({ rows }: { rows: YearRow[] }) => {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? rows : rows.slice(0, 5);
  const th: React.CSSProperties = {
    padding: "9px 10px", textAlign: "right", borderBottom: `1px solid ${C.border}`,
    color: C.muted, fontWeight: 600, fontSize: 10, letterSpacing: "0.04em",
    textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap",
  };
  const tdBase: React.CSSProperties = {
    padding: "8px 10px", textAlign: "right", fontSize: 12,
    fontFamily: "'DM Mono', monospace", whiteSpace: "nowrap",
  };
  return (
    <div>
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" as any }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 380 }}>
          <thead>
            <tr>
              {["Year","Opening","Principal","Interest","Closing"].map((h) => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => (
              <tr key={i} style={{ background: i % 2 !== 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                <td style={{ ...tdBase, color: C.accent, fontWeight: 700 }}>{r.year}</td>
                <td style={{ ...tdBase, color: C.textSub }}>{fmt(r.open)}</td>
                <td style={{ ...tdBase, color: C.principal }}>{fmt(r.princPaid)}</td>
                <td style={{ ...tdBase, color: C.repInt }}>{fmt(r.intPaid)}</td>
                <td style={{ ...tdBase, color: r.close < 1 ? C.teal : C.textSub, fontWeight: r.close < 1 ? 700 : 400 }}>
                  {r.close < 1 ? "Paid Off ✓" : fmt(r.close)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            marginTop: 10, background: "transparent", border: `1px solid ${C.border}`,
            color: C.muted, borderRadius: 8, padding: "8px 16px",
            cursor: "pointer", fontSize: 12, width: "100%", transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = C.accent;
            (e.currentTarget as HTMLButtonElement).style.color = C.accent;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = C.border;
            (e.currentTarget as HTMLButtonElement).style.color = C.muted;
          }}
        >
          {expanded ? "▲ Show less" : `▼ Show all ${rows.length} years`}
        </button>
      )}
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{
    background: C.card, border: `1px solid ${C.border}`,
    borderRadius: 14, padding: "18px 16px", marginBottom: 14,
  }}>
    <div style={{
      fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: C.accent,
      textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif",
      marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${C.border}`,
    }}>
      {title}
    </div>
    {children}
  </div>
);

interface AlertBannerProps { color: string; bg: string; icon: string; title: string; sub: string; }

const AlertBanner = ({ color, bg, icon, title, sub }: AlertBannerProps) => (
  <div style={{
    background: bg, border: `1.5px solid ${color}`, borderRadius: 12,
    padding: "13px 15px", marginBottom: 14,
    display: "flex", alignItems: "flex-start", gap: 10,
  }}>
    <span style={{ fontSize: 17, flexShrink: 0 }}>{icon}</span>
    <div>
      <div style={{ color, fontWeight: 600, fontSize: 13 }}>{title}</div>
      <div style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>{sub}</div>
    </div>
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function LoanCalculator() {
  const [principal,  setPrincipal]  = useState<number | string>(1500000);
  const [rate,       setRate]       = useState<number | string>(9.5);
  const [moratorium, setMoratorium] = useState<number | string>(48);
  const [serviced,   setServiced]   = useState<boolean>(false);
  const [emi,        setEmi]        = useState<number | string>(20000);

  const calc = useMemo<CalcResult | null>(() => {
    const P   = parseFloat(String(principal))  || 0;
    const ann = parseFloat(String(rate))       || 0;
    const mor = parseInt(String(moratorium))   || 0;
    const EMI = parseFloat(String(emi))        || 0;
    const r   = ann / 12 / 100;

    if (P <= 0 || ann <= 0 || EMI <= 0) return null;

    let morInterest = 0, effP = P;
    if (mor > 0) {
      if (serviced) {
        morInterest = P * r * mor;
      } else {
        effP = P * Math.pow(1 + r, mor);
        morInterest = effP - P;
      }
    }

    const monthlyInterest = effP * r;
    if (EMI <= monthlyInterest) {
      return {
        error: `EMI must exceed monthly interest of ${fmt(monthlyInterest)}.`,
        monthlyInterest, morInterest, effectivePrincipal: effP,
        repaymentInterest: 0, lifetimeInterest: 0,
        months: 0, years: 0, remMonths: 0, yearRows: [], morMonthlyInterest: P * r,
      };
    }

    const n      = -Math.log(1 - (effP * r) / EMI) / Math.log(1 + r);
    const months = Math.ceil(n);
    const years  = Math.floor(months / 12);
    const remM   = months % 12;

    interface M { intCharge: number; princPay: number; balance: number; }
    let balance = effP, totalInt = 0;
    const monthly: M[] = [];
    for (let i = 0; i < months; i++) {
      const intCharge = balance * r;
      const princPay  = Math.min(EMI - intCharge, balance);
      totalInt += intCharge;
      balance   = Math.max(balance - princPay, 0);
      monthly.push({ intCharge, princPay, balance });
      if (balance < 0.01) break;
    }

    const yearRows: YearRow[] = [];
    let mIdx = 0, yr = 1;
    while (mIdx < monthly.length) {
      const open = yr === 1 ? effP : yearRows[yr - 2].close;
      let princPaid = 0, intPaid = 0;
      for (let m = 0; m < 12 && mIdx < monthly.length; m++, mIdx++) {
        princPaid += monthly[mIdx].princPay;
        intPaid   += monthly[mIdx].intCharge;
      }
      yearRows.push({ year: yr, open, princPaid, intPaid, close: Math.max(open - princPaid, 0) });
      yr++;
    }

    return {
      morInterest, effectivePrincipal: effP,
      repaymentInterest: totalInt, lifetimeInterest: morInterest + totalInt,
      months, years, remMonths: remM, yearRows, morMonthlyInterest: P * r,
    };
  }, [principal, rate, moratorium, serviced, emi]);

  const P   = parseFloat(String(principal)) || 0;
  const mor = parseInt(String(moratorium))  || 0;

  return (
    <div style={{
      minHeight: "100vh", background: C.bg, color: C.text,
      fontFamily: "'DM Sans', sans-serif",
      padding: "20px 20px 60px", boxSizing: "border-box",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { opacity: 0.3; }

        /* ── Layout: side-by-side on wide screens ── */
        .lc-layout {
          display: grid;
          grid-template-columns: minmax(290px, 390px) 1fr;
          gap: 16px;
          align-items: start;
          width: 100%;
        }
        .lc-col { display: flex; flex-direction: column; }

        /* Input field pairs */
        .lc-inputs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .lc-full { grid-column: 1 / -1; }

        /* Stats row */
        .lc-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        /* ≤ 860px: stack everything single-column; stats 2-across */
        @media (max-width: 860px) {
          .lc-layout { grid-template-columns: 1fr; }
          .lc-stats  { grid-template-columns: repeat(2, 1fr); }
        }

        /* ≤ 440px: inputs single-column too */
        @media (max-width: 440px) {
          .lc-inputs { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{ maxWidth: 1400, margin: "0 auto 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9, flexShrink: 0,
            background: C.accentSoft, border: `1.5px solid ${C.accent}`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17,
          }}>🎓</div>
          <h1 style={{
            margin: 0,
            fontSize: "clamp(14px, 2vw, 22px)",
            fontWeight: 700, letterSpacing: "-0.02em", color: C.text,
          }}>
            Education Loan Repayment Calculator
          </h1>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: C.muted, paddingLeft: 46 }}>
          Moratorium-aware · Indian Rupee · Live
        </p>
      </div>

      {/* ── Body ── */}
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <div className="lc-layout">

          {/* ════ LEFT: Inputs ════ */}
          <div className="lc-col">
            <Section title="Loan Parameters">
              <div className="lc-inputs">
                <div>
                  <FieldLabel>Principal</FieldLabel>
                  <NumInput value={principal} onChange={setPrincipal} prefix="₹" step="10000" />
                </div>
                <div>
                  <FieldLabel>Annual Rate</FieldLabel>
                  <NumInput value={rate} onChange={setRate} suffix="% p.a." step="0.1" />
                </div>
                <div>
                  <FieldLabel>Moratorium</FieldLabel>
                  <NumInput value={moratorium} onChange={setMoratorium} suffix="months" step="1" />
                </div>
                <div>
                  <FieldLabel>Monthly EMI</FieldLabel>
                  <NumInput value={emi} onChange={setEmi} prefix="₹" step="500" />
                </div>
                <div className="lc-full">
                  <Toggle
                    checked={serviced} onChange={setServiced}
                    label="Service interest during moratorium"
                    sub={serviced
                      ? "Pay interest monthly — principal stays unchanged."
                      : "Interest compounds onto principal (default)."}
                  />
                </div>
              </div>
            </Section>

            {calc?.error && (
              <AlertBanner
                icon="⚠️" color={C.red} bg={C.redSoft}
                title={calc.error}
                sub={`Increase EMI above ${fmt((calc.monthlyInterest ?? 0) + 1)} to start reducing the principal.`}
              />
            )}

            {calc && !calc.error && mor > 0 && calc.morInterest > 0 && (
              <AlertBanner
                icon={serviced ? "✅" : "📈"}
                color={serviced ? C.teal : C.amber}
                bg={serviced ? C.tealSoft : C.amberSoft}
                title={serviced
                  ? `Paying ${fmt(calc.morMonthlyInterest)}/mo keeps principal at ${fmt(P)}`
                  : `${fmt(calc.morInterest)} capitalised — effective loan ${fmtShort(calc.effectivePrincipal)}`}
                sub={serviced
                  ? `Total moratorium outflow: ${fmt(calc.morInterest)}`
                  : `${((calc.morInterest / (P || 1)) * 100).toFixed(1)}% added to your original loan amount.`}
              />
            )}
          </div>

          {/* ════ RIGHT: Results ════ */}
          {calc && !calc.error && (
            <div className="lc-col">
              <Section title="Repayment Summary">
                <div className="lc-stats">
                  <Stat label="Duration"
                    value={`${calc.years}y ${calc.remMonths}m`} color={C.teal}
                    sub={`${calc.months} months total`} />
                  <Stat label="Eff. Principal"
                    value={fmtShort(calc.effectivePrincipal)} color={C.principal}
                    sub={mor > 0 && !serviced ? `+${fmtShort(calc.morInterest)} added` : "No capitalisation"} />
                  <Stat label="Repayment Interest"
                    value={fmtShort(calc.repaymentInterest)} color={C.repInt}
                    sub="Post-moratorium interest" />
                  <Stat label="Lifetime Interest"
                    value={fmtShort(calc.lifetimeInterest)} color={C.amber}
                    sub={`${((calc.lifetimeInterest / (P || 1)) * 100).toFixed(1)}% of principal`} />
                </div>
              </Section>

              <Section title="Total Outflow Breakdown">
                <StackedBar principal={P} morInt={calc.morInterest} repInt={calc.repaymentInterest} />
              </Section>

              <Section title="Year-by-Year Amortization">
                <YearTable rows={calc.yearRows} />
              </Section>
            </div>
          )}
        </div>

        <p style={{ textAlign: "center", fontSize: 10, color: C.muted, marginTop: 8, lineHeight: 1.6 }}>
          Assumes fixed rate & equal monthly instalments. For informational purposes only.
        </p>
      </div>
    </div>
  );
}

Prompt:
Build a React + TypeScript (TSX) Education Loan Repayment Calculator for the Indian market (₹ rupees). Use only inline styles and a single injected <style> tag for media queries — no CSS files, no Tailwind, no external component libraries.

DESIGN
Dark theme throughout:

Background: #0d1117, Card: #1c2330, Border: #30363d
Accent/gold: #f0a500, Teal: #2dd4bf, Amber: #f59e0b, Red: #f87171
Blue for principal: #3b82f6, Green for repayment interest: #10b981
Fonts: DM Sans (UI) + DM Mono (numbers) — load from Google Fonts via @import inside the style tag
Centered layout, maxWidth: 700px, responsive to mobile. Inputs collapse to 1-column below 480px.


INPUTS (all reactive — no submit button, recalculate on every keystroke)

Loan Principal (₹ prefix, default ₹15,00,000)
Annual Interest Rate (% p.a. suffix, default 9.5)
Moratorium Period (months suffix, default 48)
Monthly EMI (₹ prefix, default ₹20,000)
Toggle — "Service interest during moratorium" (default OFF)

OFF: interest compounds monthly onto principal during moratorium
ON: borrower pays simple interest each month; principal unchanged



All inputs sit in a 2-column grid inside a dark card section titled "LOAN PARAMETERS". The toggle spans full width and changes border color (teal when ON, dark when OFF).

CORE LOGIC
r = annualRate / 12 / 100   // monthly rate

// Moratorium phase
if toggle OFF:
  effectivePrincipal = P × (1 + r)^moratoriumMonths   // compound capitalised
  moratoriumInterest = effectivePrincipal - P
if toggle ON:
  moratoriumInterest = P × r × moratoriumMonths        // simple, paid monthly
  effectivePrincipal = P                               // unchanged

// Repayment phase
monthlyInterest = effectivePrincipal × r
// ERROR if EMI ≤ monthlyInterest (loan never repays)

// Months to repay:
n = -log(1 - effectivePrincipal × r / EMI) / log(1 + r)
months = ceil(n)

// Build full month-by-month schedule:
for each month:
  interestCharge = balance × r
  principalPayment = min(EMI - interestCharge, balance)
  balance = max(balance - principalPayment, 0)

// Roll up monthly schedule into year-by-year rows

OUTPUTS (all update live)
1. Moratorium Alert Banner (shown when moratorium > 0)

If toggle OFF (amber border): show how much was capitalised and new effective principal
If toggle ON (teal border): show monthly interest cost and total moratorium outflow

2. Error Banner (red, shown when EMI ≤ monthly interest)

Message: "EMI must exceed monthly interest of ₹X to reduce principal"

3. Repayment Summary — 4 stat cards in a 2×2 grid:

Duration (e.g. "8y 4m" + "100 months total") — teal
Effective Principal (post-moratorium amount) — blue
Repayment Interest (interest paid during repayment only) — green
Lifetime Interest (moratorium + repayment interest, shown as % of principal) — amber

4. Stacked Bar — "Total Outflow Breakdown"

Horizontal bar split into 3 colored segments: Principal (blue) / Moratorium Interest (amber) / Repayment Interest (green)
Show percentage labels inside segments if segment > 12% wide
Below bar: legend with colored squares, label, and ₹ value (use short format: L for lakhs, Cr for crores)

5. Year-by-Year Amortization Table

Columns: Year | Opening Balance | Principal Paid | Interest Paid | Closing Balance
Show only first 5 rows by default; "Show all N years" expand button below
Last row closing balance shows "Paid Off ✓" in teal when < ₹1
Table scrolls horizontally on mobile (overflowX: auto, minWidth: 380px)


NUMBER FORMATTING

Full format: ₹ + toLocaleString("en-IN") rounded to nearest rupee
Short format: ≥ 1 Cr → ₹X.XX Cr, ≥ 1 L → ₹X.XX L, else full format


COMPONENT STRUCTURE

NumInput — number input with optional ₹ prefix or suffix, gold border on focus
Toggle — animated sliding pill toggle
Stat — dark card with uppercase label, large mono value, small subtitle
StackedBar — proportional horizontal bar + legend
YearTable — scrollable table with expand/collapse
Section — dark card wrapper with gold uppercase section title + bottom border divider
Main LoanCalculator default export — holds all state, runs useMemo for calc


TYPESCRIPT
Define these interfaces:

CalcResult — all computed output fields plus optional error and monthlyInterest
YearRow — { year, open, princPaid, intPaid, close }
LegendItem — { label, value, color, pct }
Typed props for every sub-component


HEADER
Icon badge (🎓 emoji in a gold-bordered rounded square) + h1 "Education Loan Repayment Calculator" with clamp(16px, 5vw, 22px) font size. Subtitle: "Moratorium-aware · Indian Rupee · Live" in muted color below.

FOOTER
Small centered muted text: "Assumes fixed rate & equal monthly instalments. For informational purposes only."

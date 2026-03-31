Build a complete dark-mode loan repayment calculator website using plain HTML, CSS, and vanilla JavaScript (no frameworks). Create 3 files: index.html, styles.css, script.js.

Project goal:
Given:
1) Loan Amount
2) Interest rate (p.a.)
3) Planned monthly repayment
Calculate and display how long it takes to fully repay the loan (years + months), with a polished UI similar to a modern EMI calculator.

Functional requirements:
- Inputs:
  - Loan amount (slider + exact text/number field)
  - Interest rate p.a. (slider + exact text field; must allow typing decimal values like 6.5, 7.25, and intermediate typing states like “6.” or “.”)
  - Planned monthly repayment (slider + exact text/number field)
- All input minimums should allow 0.
- Users must be able to fully backspace/clear each input field and type fresh values without auto-overwrite issues.
- Sliders and text fields stay synchronized once valid values are entered.
- Validation behavior:
  - Loan amount must be > 0
  - Monthly repayment must be > 0
  - Interest rate must be >= 0
  - If invalid, show an error banner; if valid, hide error banner completely (no leftover bar/space).
- Computation:
  - Monthly rate = (annualRatePercent / 100) / 12
  - Simulate amortization month-by-month until balance <= 0
  - Use “smaller final payment” logic: last payment should be min(monthlyPayment, remainingBalanceWithInterest)
  - If monthly payment is too low to ever repay (monthlyPayment <= loan * monthlyRate when rate > 0), show a clear error.
- Output summary:
  - Monthly interest rate (as % per month)
  - Total principal repaid
  - Total interest
  - Total amount paid
  - Repayment time (years + months) as a prominent large row/card placed below “Total amount paid”.
- Donut chart:
  - Show principal vs interest proportion
  - Label legend for both
  - Center text: “Total paid” and amount, with high contrast and readable color
  - Use a dark-mode-friendly principal color (not plain white), and purple for interest.
- Amortization details section:
  - Collapsible with +/- toggle
  - Shows compact year/month sample breakdown when expanded.

UI/UX requirements:
- Dark modern theme with good contrast.
- Responsive layout (two columns on desktop, stacked on smaller screens).
- Smooth, clean spacing and typography.
- Keep repayment time in one line and with extra spacing above it.

Code quality requirements:
- Keep code organized and readable.
- Use helper functions for formatting INR currency and duration.
- Avoid external dependencies.
- Ensure all behaviors work on refresh with sensible default values.

Deliverables:
- Full contents of index.html, styles.css, script.js
- Brief run instructions (open index.html directly or use python3 -m http.server).

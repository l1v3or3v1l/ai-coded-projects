const $ = (id) => document.getElementById(id);

const el = {
  loanAmount: $("loanAmount"),
  loanAmountInput: $("loanAmountInput"),
  loanAmountPill: $("loanAmountPill"),

  interestRate: $("interestRate"),
  interestRateInput: $("interestRateInput"),
  interestRatePill: $("interestRatePill"),

  monthlyPayment: $("monthlyPayment"),
  monthlyPaymentInput: $("monthlyPaymentInput"),
  monthlyPaymentPill: $("monthlyPaymentPill"),

  repaymentTime: $("repaymentTime"),
  monthlyRate: $("monthlyRate"),
  totalPrincipal: $("totalPrincipal"),
  totalInterest: $("totalInterest"),
  totalPaid: $("totalPaid"),

  notice: $("notice"),
  noticeText: $("noticeText"),

  detailsBody: $("detailsBody"),
  detailsToggle: $("detailsToggle"),

  donut: $("donut"),
  donutTotal: $("donutTotal"),
  miniPrincipal: $("miniPrincipal"),
  miniInterest: $("miniInterest"),
};

const fmtINR = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.round(n));

const fmtNumber = (n, digits = 2) => {
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(n);
};

function formatDuration(totalMonths) {
  const months = Math.max(0, Math.floor(totalMonths));
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  if (years <= 0) return `${remMonths} month${remMonths === 1 ? "" : "s"}`;
  if (remMonths === 0) return `${years} year${years === 1 ? "" : "s"}`;
  return `${years} year${years === 1 ? "" : "s"} ${remMonths} month${remMonths === 1 ? "" : "s"}`;
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function computeAmortization({ loan, annualRatePercent, monthlyPayment, maxMonths = 20000 }) {
  if (!(loan > 0)) return { ok: false, reason: "Loan amount must be greater than 0." };
  if (!(monthlyPayment > 0)) return { ok: false, reason: "Monthly repayment must be greater than 0." };
  if (!(annualRatePercent >= 0)) return { ok: false, reason: "Interest rate must be >= 0." };

  const r = (annualRatePercent / 100) / 12; // monthly interest rate

  // Quick "never repays" check for r>0.
  if (r > 0 && monthlyPayment <= loan * r) {
    return {
      ok: false,
      reason: "Your monthly repayment is too low to ever fully repay this loan (with this interest rate).",
    };
  }

  let balance = loan;
  let totalPaid = 0;
  let totalInterest = 0;

  // Store a small breakdown for the UI.
  const scheduleSample = [];

  for (let month = 1; month <= maxMonths; month++) {
    const interest = balance * r;
    const balanceWithInterest = balance + interest;

    const paymentUsed = Math.min(monthlyPayment, balanceWithInterest);

    totalPaid += paymentUsed;
    totalInterest += interest;
    balance = balanceWithInterest - paymentUsed;

    if (month <= 12 || balance <= 0 || month % 12 === 0) {
      scheduleSample.push({
        month,
        balanceAfter: Math.max(0, balance),
        interest,
        paymentUsed,
      });
    }

    if (balance <= 0) {
      return {
        ok: true,
        months: month,
        totalPaid,
        totalInterest,
        totalPrincipal: loan,
        monthlyRate: r,
        scheduleSample,
      };
    }
  }

  return {
    ok: false,
    reason: "Could not compute payoff time with the current settings. Try a higher monthly repayment.",
  };
}

function updateInputsFromSliders() {
  el.loanAmountInput.value = el.loanAmount.value;
  el.interestRateInput.value = el.interestRate.value;
  el.monthlyPaymentInput.value = el.monthlyPayment.value;

  el.loanAmountPill.textContent = fmtINR(Number(el.loanAmount.value));
  el.interestRatePill.textContent = `${Number(el.interestRate.value)}%`;
  el.monthlyPaymentPill.textContent = fmtINR(Number(el.monthlyPayment.value));
}

function updateSlidersFromInputs() {
  el.loanAmount.value = el.loanAmountInput.value;
  el.interestRate.value = el.interestRateInput.value;
  el.monthlyPayment.value = el.monthlyPaymentInput.value;

  updateInputsFromSliders();
}

function setNotice(message, variant = "warn") {
  el.noticeText.textContent = message;
  if (!message) {
    el.notice.hidden = true;
    el.notice.style.display = "none";
    el.notice.style.borderColor = "transparent";
    el.notice.style.background = "transparent";
    return;
  }

  el.notice.hidden = false;
  el.notice.style.display = "flex";

  if (variant === "bad") {
    el.notice.style.borderColor = "rgba(239,68,68,.35)";
    el.notice.style.background = "rgba(239,68,68,.10)";
    el.notice.style.color = "#FFD2D2";
  } else {
    el.notice.style.borderColor = "rgba(251,191,36,.35)";
    el.notice.style.background = "rgba(251,191,36,.10)";
    el.notice.style.color = "#FFEFC1";
  }
}

function renderDetails(scheduleSample) {
  if (!scheduleSample || scheduleSample.length === 0) {
    el.detailsBody.innerHTML = `<div class="details__empty">Adjust inputs to see a breakdown.</div>`;
    return;
  }

  // Render a compact "year/month" style line set.
  const rows = scheduleSample.map((s) => {
    const y = Math.floor((s.month - 1) / 12);
    const m = ((s.month - 1) % 12) + 1;
    const label = y === 0 ? `Y1 M${m}` : `Y${y + 1} M${m}`;
    return `<div style="display:flex; justify-content:space-between; gap:12px; padding:6px 0; border-top:1px solid rgba(255,255,255,.06);">
      <span style="color:var(--muted); font-size:13px;">${label}</span>
      <span style="font-size:13px; font-weight:700;">Balance: ${fmtINR(s.balanceAfter)}</span>
    </div>`;
  });

  el.detailsBody.innerHTML = rows.join("");
}

function renderDonut({ totalPaid, totalInterest, totalPrincipal }) {
  const safeTotalPaid = Math.max(0.00001, totalPaid);
  const interestPct = clamp((totalInterest / safeTotalPaid) * 100, 0, 100);
  const principalPct = clamp((totalPrincipal / safeTotalPaid) * 100, 0, 100);

  // Conic gradient uses a percentage stop: "X%". We set principal stop at principalPct%.
  el.donut.style.setProperty("--principal-pct", `${principalPct.toFixed(2)}%`);
  el.donutTotal.textContent = fmtINR(totalPaid);
  el.miniPrincipal.textContent = fmtINR(totalPrincipal);
  el.miniInterest.textContent = fmtINR(totalInterest);
}

function renderResults(result) {
  if (!result.ok) {
    el.repaymentTime.textContent = "—";
    el.monthlyRate.textContent = "—";
    el.totalPrincipal.textContent = "₹ 0";
    el.totalInterest.textContent = "₹ 0";
    el.totalPaid.textContent = "₹ 0";

    renderDonut({ totalPaid: 0, totalInterest: 0, totalPrincipal: 0 });
    renderDetails([]);
    setNotice(result.reason, "bad");
    return;
  }

  setNotice("", "warn");

  el.repaymentTime.textContent = formatDuration(result.months);
  el.monthlyRate.textContent = `${(result.monthlyRate * 100).toFixed(4)}% / month`;
  el.totalPrincipal.textContent = fmtINR(result.totalPrincipal);
  el.totalInterest.textContent = fmtINR(result.totalInterest);
  el.totalPaid.textContent = fmtINR(result.totalPaid);

  renderDonut({
    totalPaid: result.totalPaid,
    totalInterest: result.totalInterest,
    totalPrincipal: result.totalPrincipal,
  });

  latestScheduleSample = result.scheduleSample;
  if (detailsExpanded) renderDetails(result.scheduleSample);
  else el.detailsBody.innerHTML = `<div class="details__empty">Adjust inputs to see a breakdown.</div>`;
}

let detailsExpanded = false;
let latestScheduleSample = [];
function setDetailsExpanded(expanded) {
  detailsExpanded = expanded;
  el.detailsBody.style.display = expanded ? "block" : "none";
  if (!el.detailsToggle) return;
  el.detailsToggle.textContent = expanded ? "−" : "+";
  if (!expanded) {
    el.detailsBody.innerHTML = `<div class="details__empty">Adjust inputs to see a breakdown.</div>`;
  } else {
    // Show the most recent breakdown when opening.
    renderDetails(latestScheduleSample);
  }
}

function recalc() {
  updateInputsFromSliders();

  const loan = Number(el.loanAmount.value);
  const annualRatePercent = Number(el.interestRate.value);
  const monthlyPayment = Number(el.monthlyPayment.value);

  const result = computeAmortization({ loan, annualRatePercent, monthlyPayment });
  renderResults(result);
}

// Wire up interactions
for (const id of ["loanAmount", "interestRate", "monthlyPayment"]) {
  el[id].addEventListener("input", () => {
    // Keep input fields synced for that control.
    if (id === "loanAmount") el.loanAmountInput.value = el.loanAmount.value;
    if (id === "interestRate") el.interestRateInput.value = el.interestRate.value;
    if (id === "monthlyPayment") el.monthlyPaymentInput.value = el.monthlyPayment.value;
    recalc();
  });
}

for (const id of ["loanAmountInput", "interestRateInput", "monthlyPaymentInput"]) {
  el[id].addEventListener("input", () => {
    const raw = el[id].value;

    // Allow the field to be temporarily empty while typing.
    if (raw === "") {
      // Do not force any value back; just clear related pills/results.
      setNotice("", "warn");
      el.repaymentTime.textContent = "—";
      el.monthlyRate.textContent = "—";
      el.totalPrincipal.textContent = "₹ 0";
      el.totalInterest.textContent = "₹ 0";
      el.totalPaid.textContent = "₹ 0";
      renderDonut({ totalPaid: 0, totalInterest: 0, totalPrincipal: 0 });
      return;
    }

    // For interest field, allow intermediate states like "6." or "." while typing.
    if (id === "interestRateInput") {
      const cleaned = raw.replace(",", ".");
      // If it's just "." or ends with "." after digits, wait for more input.
      if (/^\d*\.?$/.test(cleaned) && !/^\d+(\.\d+)?$/.test(cleaned)) {
        // Keep text as-is, don't sync slider or recalc yet.
        return;
      }
      el[id].value = cleaned;
    }

    const v = Number(el[id].value);
    if (!Number.isFinite(v)) return;

    // Keep sliders in sync (clamp to slider range)
    if (id === "loanAmountInput") {
      el.loanAmount.value = String(clamp(v, Number(el.loanAmount.min), Number(el.loanAmount.max)));
    }
    if (id === "interestRateInput") {
      el.interestRate.value = String(clamp(v, Number(el.interestRate.min), Number(el.interestRate.max)));
    }
    if (id === "monthlyPaymentInput") {
      el.monthlyPayment.value = String(clamp(v, Number(el.monthlyPayment.min), Number(el.monthlyPayment.max)));
    }

    updateInputsFromSliders();
    recalc();
  });
}

if (el.detailsToggle) {
  el.detailsToggle.addEventListener("click", () => {
    setDetailsExpanded(!detailsExpanded);
    // Recalculate so the breakdown matches the latest inputs when expanded.
    if (!detailsExpanded) return;
    recalc();
  });
}

// Init
updateInputsFromSliders();
setDetailsExpanded(false);
recalc();


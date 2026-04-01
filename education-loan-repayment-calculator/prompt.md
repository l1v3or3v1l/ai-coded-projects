# **Project Specification: Education Loan Repayment Calculator**

## **1. Overview**
Build a **React + TypeScript (TSX)** calculator specifically for the Indian education loan market. The application must be a single-file solution with no external dependencies (CSS/Tailwind/Libraries), relying entirely on inline styles and a single injected `<style>` tag.

---

## **2. Design & Aesthetics**
### **Theme: Dark Mode**
| Element | Hex Code |
| :--- | :--- |
| **Background** | `#0d1117` |
| **Card** | `#1c2330` |
| **Border** | `#30363d` |
| **Accent (Gold)** | `#f0a500` |
| **Teal** | `#2dd4bf` |
| **Amber** | `#f59e0b` |
| **Red** | `#f87171` |
| **Blue (Principal)** | `#3b82f6` |
| **Green (Interest)** | `#10b981` |

### **Typography & Layout**
* **Fonts:** DM Sans (UI) and DM Mono (Numbers) loaded via `@import` from Google Fonts.
* **Width:** Maximum `700px`, centered.
* **Responsiveness:** Inputs collapse to 1-column below `480px`.

---

## **3. Logic & Formulas**
### **Monthly Rate**
$$r = \frac{\text{Annual Rate}}{12 \times 100}$$

### **Moratorium Phase**
* **Toggle OFF (Compounding):**
    $$P_{effective} = P \times (1 + r)^{\text{moratoriumMonths}}$$
    $$\text{Moratorium Interest} = P_{effective} - P$$
* **Toggle ON (Simple Interest):**
    $$\text{Moratorium Interest} = P \times r \times \text{moratoriumMonths}$$
    $$P_{effective} = P$$

### **Repayment Phase**
* **Months to repay ($n$):**
    $$n = \frac{-\log(1 - \frac{P_{effective} \times r}{\text{EMI}})}{\log(1 + r)}$$
* **Schedule:** Iterate month-by-month to calculate interest vs. principal reduction, then roll up into yearly rows.

---

## **4. Component Architecture**
### **TypeScript Interfaces**
```typescript
interface CalcResult {
  monthsToRepay: number;
  effectivePrincipal: number;
  moratoriumInterest: number;
  repaymentInterest: number;
  totalOutflow: number;
  monthlyInterest: number;
  error?: string;
  schedule: YearRow[];
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
  value: string;
  color: string;
  pct: number;
}
```

### **Component List**
* `NumInput`: Gold border on focus, ₹ prefix or % suffix.
* `Toggle`: Animated sliding pill.
* `Stat`: Dark card with large mono values.
* `StackedBar`: Proportional horizontal bar with legend.
* `YearTable`: Scrollable, expandable (first 5 rows default).
* `Section`: Wrapper with gold title and divider.

---

## **5. Features & UI Elements**
1.  **Reactive Inputs:** Real-time calculation on every keystroke.
2.  **Moratorium Banner:** Dynamic color change (Amber if compounding, Teal if servicing).
3.  **Error Handling:** Red banner if $EMI \le \text{Monthly Interest}$.
4.  **Number Formatting:** * **Full:** `toLocaleString("en-IN")`.
    * **Short:** Use **L** (Lakhs) or **Cr** (Crores) for values $\ge 1,00,000$.
5.  **Amortization Table:** "Paid Off ✓" indicator in teal when balance hits zero.

---

## **6. Header & Footer**
* **Header:** 🎓 emoji in gold border + `h1` Title + Muted Subtitle.
* **Footer:** Small muted disclaimer text regarding fixed rates and informational purpose.

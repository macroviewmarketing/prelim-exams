import type { Problem, Subject } from "./types";

const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
const r2 = (x: number) => Math.round(x * 100) / 100;
const r4 = (x: number) => Math.round(x * 10000) / 10000;
const c0 = (x: number) => Math.round(x).toLocaleString("en-US");
const c2 = (x: number) =>
  x.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const P_SET = [10000, 15000, 20000, 25000, 30000, 40000, 50000, 60000, 80000, 100000, 120000, 150000];
const I_SET = [5, 6, 7, 8, 9, 10, 12, 15, 18, 20];
const S = (l: [string, string][]) =>
  l.map((x) => `<span class="k">${x[0]}</span>${x[1]}`).join("\n");

type Gen = () => Omit<Problem, "name">;

const G_si_findF: Gen = () => {
  const P = pick(P_SET), i = pick(I_SET), mo = pick([3, 4, 6, 8, 9, 12, 15, 18, 24]), n = mo / 12;
  const F = P * (1 + (i / 100) * n);
  return {
    id: "si_findF",
    prompt: `A loan of <b>₱${c0(P)}</b> is made for <b>${mo} months</b> at <b>${i}%</b> simple interest. Find the future amount F.`,
    ans: r2(F), unit: "peso",
    hint: "F = P(1 + i·n). Convert months to years: n = months/12.",
    sol: S([
      ["GIVEN:    ", `P = ${c0(P)} ; i = ${i}% ; t = ${mo} months`],
      ["FIND:     ", "F"],
      ["FORMULA:  ", "F = P(1 + i·n)"],
      ["PREP:     ", `n = ${mo}/12 = ${r4(n)} yr ; i = ${(i / 100).toFixed(2)}`],
      ["SUB:      ", `F = ${c0(P)}(1 + ${(i / 100).toFixed(2)} × ${r4(n)})`],
      ["ANSWER:   ", `F = ₱${c2(F)}`],
    ]),
  };
};

const G_si_findRate: Gen = () => {
  const P = pick(P_SET), i = pick(I_SET), mo = pick([4, 6, 8, 9, 12, 18]), n = mo / 12, I = P * (i / 100) * n;
  return {
    id: "si_findRate",
    prompt: `A principal of <b>₱${c0(P)}</b> earns <b>₱${c2(I)}</b> in simple interest over <b>${mo} months</b>. Find the annual rate of interest.`,
    ans: r2(i), unit: "percent",
    hint: "i = I / (P·n), with n in years.",
    sol: S([
      ["GIVEN:    ", `P = ${c0(P)} ; I = ${c2(I)} ; t = ${mo} months`],
      ["FIND:     ", "i (annual rate)"],
      ["FORMULA:  ", "i = I / (P·n)"],
      ["PREP:     ", `n = ${mo}/12 = ${r4(n)} yr`],
      ["SUB:      ", `i = ${c2(I)} / (${c0(P)} × ${r4(n)})`],
      ["ANSWER:   ", `i = ${r2(i)}%`],
    ]),
  };
};

const G_si_ordExact: Gen = () => {
  const P = pick(P_SET), i = pick(I_SET), d = pick([90, 120, 146, 180, 200, 240, 270, 300]), ord = Math.random() < 0.5;
  const base = ord ? 360 : 365, n = d / base, F = P * (1 + (i / 100) * n);
  return {
    id: "si_ordExact",
    prompt: `A loan of <b>₱${c0(P)}</b> at <b>${i}%</b> simple interest runs for <b>${d} days</b>. Find F using <b>${ord ? "ORDINARY" : "EXACT"}</b> simple interest.`,
    ans: r2(F), unit: "peso",
    hint: `Ordinary uses a 360-day year, exact uses 365. Here: ${base} days.`,
    sol: S([
      ["GIVEN:    ", `P = ${c0(P)} ; i = ${i}% ; d = ${d} days (${ord ? "ordinary=360" : "exact=365"})`],
      ["FIND:     ", "F"],
      ["FORMULA:  ", "F = P(1 + i·n)"],
      ["PREP:     ", `n = ${d}/${base} = ${r4(n)} yr`],
      ["SUB:      ", `F = ${c0(P)}(1 + ${(i / 100).toFixed(2)} × ${r4(n)})`],
      ["ANSWER:   ", `F = ₱${c2(F)}`],
    ]),
  };
};

const G_si_actualRate: Gen = () => {
  const P = pick([50000, 80000, 100000, 120000, 150000, 200000]), r = pick([12, 15, 18, 20, 24]);
  const I = P * (r / 100), recv = P - I, act = (I / recv) * 100;
  return {
    id: "si_actualRate",
    prompt: `A borrower takes <b>₱${c0(P)}</b> at <b>${r}%</b> simple interest, but the interest is <b>deducted upfront</b>. After one year the full ₱${c0(P)} is repaid. Find the ACTUAL rate of interest.`,
    ans: r2(act), unit: "percent",
    hint: "You did not receive the full face amount. Divide interest by the amount actually received.",
    sol: S([
      ["GIVEN:    ", `face = ${c0(P)} ; quoted r = ${r}% ; deducted upfront ; t = 1 yr`],
      ["FIND:     ", "actual rate"],
      ["FORMULA:  ", "actual = interest ÷ amount received"],
      ["PREP:     ", `interest = ${(r / 100).toFixed(2)} × ${c0(P)} = ${c0(I)} ; received = ${c0(P)} − ${c0(I)} = ${c0(recv)}`],
      ["SUB:      ", `actual = ${c0(I)} / ${c0(recv)}`],
      ["ANSWER:   ", `actual = ${r2(act)}%`],
    ]),
  };
};

const G_markupGain: Gen = () => {
  const price = pick([100, 120, 150, 180, 200, 250]), pr = pick([20, 25, 30, 40]), rise = pick([10, 12, 15, 20, 25]);
  const cost = price / (1 + pr / 100), ncost = cost * (1 + rise / 100), gain = ((price - ncost) / ncost) * 100;
  return {
    id: "markupGain",
    prompt: `A vendor sells an item for <b>₱${c0(price)}</b> at <b>${pr}% profit</b>. The cost then rises <b>${rise}%</b> but the price stays ₱${c0(price)}. Find the new gain in percent.`,
    ans: r2(gain), unit: "percent",
    hint: "Cost = Price ÷ (1 + profit%). Raise that cost, then new gain = (price − new cost)/new cost.",
    sol: S([
      ["GIVEN:    ", `price = ${c0(price)} ; profit = ${pr}% ; cost rises ${rise}%`],
      ["FIND:     ", "new gain %"],
      ["FORMULA:  ", "Cost = Price ÷ (1 + profit%)"],
      ["PREP:     ", `cost = ${c0(price)}/${(1 + pr / 100).toFixed(2)} = ${c2(cost)} ; new cost = ${c2(cost)}×${(1 + rise / 100).toFixed(2)} = ${c2(ncost)}`],
      ["SUB:      ", `gain = (${c0(price)} − ${c2(ncost)}) / ${c2(ncost)}`],
      ["ANSWER:   ", `gain = ${r2(gain)}%`],
    ]),
  };
};

const G_si_grossUp: Gen = () => {
  const P = pick([100000, 150000, 200000, 250000, 300000]), i = pick([6, 8, 9, 10, 12]), d = pick([45, 60, 90, 120, 180]), tax = pick([15, 20]);
  const gross = P * (i / 100) * (d / 360), net = gross * (1 - tax / 100);
  return {
    id: "si_grossUp",
    prompt: `An investment of <b>₱${c0(P)}</b> runs <b>${d} days</b>. The net interest after a <b>${tax}% withholding tax</b> is <b>₱${c2(net)}</b>. Find the annual rate of return (360-day year).`,
    ans: r2(i), unit: "percent",
    hint: "Net-after-tax hidden step: gross up first. Gross = net ÷ (1 − tax rate), then i = I/(P·n).",
    sol: S([
      ["GIVEN:    ", `P = ${c0(P)} ; d = ${d} ; net = ${c2(net)} ; tax = ${tax}%`],
      ["FIND:     ", "annual rate i"],
      ["FORMULA:  ", "gross = net ÷ (1 − tax) ; i = I/(P·n)"],
      ["PREP:     ", `gross = ${c2(net)}/${(1 - tax / 100).toFixed(2)} = ${c2(gross)} ; n = ${d}/360 = ${r4(d / 360)}`],
      ["SUB:      ", `i = ${c2(gross)} / (${c0(P)} × ${r4(d / 360)})`],
      ["ANSWER:   ", `i = ${r2(i)}%`],
    ]),
  };
};

const G_ci_findF: Gen = () => {
  const P = pick(P_SET), r = pick([6, 8, 9, 10, 12]);
  const m = pick<[number, string]>([[2, "semi-annually"], [4, "quarterly"], [12, "monthly"]]);
  const y = pick([3, 4, 5, 6]);
  const i = r / 100 / m[0], n = m[0] * y, F = P * Math.pow(1 + i, n);
  return {
    id: "ci_findF",
    prompt: `<b>₱${c0(P)}</b> is invested at a nominal <b>${r}%</b> compounded <b>${m[1]}</b> for <b>${y} years</b>. Find the future worth.`,
    ans: r2(F), unit: "peso",
    hint: "F = P(1+i)ⁿ with i = r/m and n = m·t. Put the conversion on the PREP line.",
    sol: S([
      ["GIVEN:    ", `P = ${c0(P)} ; r = ${r}% ; m = ${m[0]} (${m[1]}) ; t = ${y} yr`],
      ["FIND:     ", "F"],
      ["FORMULA:  ", "F = P(1 + i)ⁿ"],
      ["PREP:     ", `i = ${r / 100}/${m[0]} = ${r4(i)} ; n = ${m[0]}×${y} = ${n}`],
      ["SUB:      ", `F = ${c0(P)}(1 + ${r4(i)})^${n}`],
      ["ANSWER:   ", `F = ₱${c2(F)}`],
    ]),
  };
};

const G_ci_findP: Gen = () => {
  const F = pick([100000, 150000, 200000, 250000, 300000, 500000]), r = pick([8, 9, 10, 12]);
  const m = pick<[number, string]>([[4, "quarterly"], [12, "monthly"], [2, "semi-annually"]]);
  const y = pick([4, 5, 6]);
  const i = r / 100 / m[0], n = m[0] * y, P = F * Math.pow(1 + i, -n);
  return {
    id: "ci_findP",
    prompt: `You want <b>₱${c0(F)}</b> in <b>${y} years</b>. The account pays <b>${r}%</b> compounded <b>${m[1]}</b>. How much must you deposit today?`,
    ans: r2(P), unit: "peso",
    hint: "Present worth: P = F(1+i)⁻ⁿ. Same i = r/m, n = m·t.",
    sol: S([
      ["GIVEN:    ", `F = ${c0(F)} ; r = ${r}% ; m = ${m[0]} (${m[1]}) ; t = ${y} yr`],
      ["FIND:     ", "P"],
      ["FORMULA:  ", "P = F(1 + i)⁻ⁿ"],
      ["PREP:     ", `i = ${r / 100}/${m[0]} = ${r4(i)} ; n = ${m[0]}×${y} = ${n}`],
      ["SUB:      ", `P = ${c0(F)}(1 + ${r4(i)})^-${n}`],
      ["ANSWER:   ", `P = ₱${c2(P)}`],
    ]),
  };
};

const G_ci_findi: Gen = () => {
  const P = pick([20000, 30000, 40000, 50000, 60000, 80000]), n = pick([4, 5, 6, 8]), i = pick([6, 8, 9, 10, 12]);
  const F = r2(P * Math.pow(1 + i / 100, n)), ans = (Math.pow(F / P, 1 / n) - 1) * 100;
  return {
    id: "ci_findi",
    prompt: `<b>₱${c0(P)}</b> grows to <b>₱${c2(F)}</b> after <b>${n} years</b>, compounded annually. Find the annual interest rate.`,
    ans: r2(ans), unit: "percent",
    hint: "i = (F/P)^(1/n) − 1. The 1/n is a root, then subtract 1.",
    sol: S([
      ["GIVEN:    ", `P = ${c0(P)} ; F = ${c2(F)} ; n = ${n} yr`],
      ["FIND:     ", "i"],
      ["FORMULA:  ", "i = (F/P)^(1/n) − 1"],
      ["PREP:     ", `F/P = ${c2(F)}/${c0(P)} = ${r4(F / P)}`],
      ["SUB:      ", `i = (${r4(F / P)})^(1/${n}) − 1`],
      ["ANSWER:   ", `i = ${r2(ans)}%`],
    ]),
  };
};

const G_ci_findn: Gen = () => {
  const P = pick([20000, 30000, 40000, 50000, 60000]), i = pick([6, 8, 9, 10, 12]), mult = pick([1.5, 1.6, 1.8, 2]);
  const F = r2(P * mult), ans = Math.log(F / P) / Math.log(1 + i / 100);
  return {
    id: "ci_findn",
    prompt: `How long for <b>₱${c0(P)}</b> to grow to <b>₱${c0(F)}</b> at <b>${i}%</b> compounded annually? Find the number of years.`,
    ans: r2(ans), unit: "years",
    hint: "n = ln(F/P) / ln(1 + i). Use the natural log.",
    sol: S([
      ["GIVEN:    ", `P = ${c0(P)} ; F = ${c0(F)} ; i = ${i}%`],
      ["FIND:     ", "n (years)"],
      ["FORMULA:  ", "n = ln(F/P) / ln(1 + i)"],
      ["PREP:     ", `F/P = ${r4(F / P)} ; ln(F/P) = ${r4(Math.log(F / P))} ; ln(1+i) = ${r4(Math.log(1 + i / 100))}`],
      ["SUB:      ", `n = ${r4(Math.log(F / P))} / ${r4(Math.log(1 + i / 100))}`],
      ["ANSWER:   ", `n = ${r2(ans)} years`],
    ]),
  };
};

const G_ci_EAR: Gen = () => {
  const r = pick([8, 9, 10, 12, 15, 18]);
  const m = pick<[number, string]>([[2, "semi-annually"], [4, "quarterly"], [12, "monthly"]]);
  const ear = (Math.pow(1 + r / 100 / m[0], m[0]) - 1) * 100;
  return {
    id: "ci_EAR",
    prompt: `A rate of <b>${r}%</b> is compounded <b>${m[1]}</b>. Find the effective annual rate (EAR).`,
    ans: r2(ear), unit: "percent",
    hint: "EAR = (1 + r/m)ᵐ − 1. Compounding more often pushes the effective rate above the nominal.",
    sol: S([
      ["GIVEN:    ", `r = ${r}% ; m = ${m[0]} (${m[1]})`],
      ["FIND:     ", "EAR"],
      ["FORMULA:  ", "EAR = (1 + r/m)ᵐ − 1"],
      ["PREP:     ", `r/m = ${r / 100}/${m[0]} = ${r4(r / 100 / m[0])}`],
      ["SUB:      ", `EAR = (1 + ${r4(r / 100 / m[0])})^${m[0]} − 1`],
      ["ANSWER:   ", `EAR = ${r2(ear)}%`],
    ]),
  };
};

const G_ann_findF: Gen = () => {
  const A = pick([5000, 8000, 10000, 12000, 15000, 20000]), i = pick([6, 8, 9, 10, 12]), n = pick([4, 5, 6, 8, 10]);
  const F = A * ((Math.pow(1 + i / 100, n) - 1) / (i / 100));
  return {
    id: "ann_findF",
    prompt: `You deposit <b>₱${c0(A)}</b> at the end of each year for <b>${n} years</b> at <b>${i}%</b>. Find the future worth F.`,
    ans: r2(F), unit: "peso",
    hint: "A-to-F: F = A·[((1+i)ⁿ − 1)/i]. Payments build toward a future total.",
    sol: S([
      ["GIVEN:    ", `A = ${c0(A)} ; i = ${i}% ; n = ${n}`],
      ["FIND:     ", "F"],
      ["FORMULA:  ", "F = A·[((1+i)ⁿ − 1)/i]"],
      ["PREP:     ", `i = ${(i / 100).toFixed(2)} ; (1+i)ⁿ = ${r4(Math.pow(1 + i / 100, n))}`],
      ["SUB:      ", `F = ${c0(A)}·[(${r4(Math.pow(1 + i / 100, n))} − 1)/${(i / 100).toFixed(2)}]`],
      ["ANSWER:   ", `F = ₱${c2(F)}`],
    ]),
  };
};

const G_ann_sinking: Gen = () => {
  const F = pick([100000, 150000, 200000, 250000, 500000]), i = pick([6, 8, 9, 10, 12]), n = pick([4, 5, 6, 8, 10]);
  const A = F * (i / 100 / (Math.pow(1 + i / 100, n) - 1));
  return {
    id: "ann_sinking",
    prompt: `You want <b>₱${c0(F)}</b> in <b>${n} years</b> at <b>${i}%</b>. Find the equal end-of-year deposit A (sinking fund).`,
    ans: r2(A), unit: "peso",
    hint: "Sinking fund: A = F·[i/((1+i)ⁿ − 1)]. This is the A-to-F pair, reversed.",
    sol: S([
      ["GIVEN:    ", `F = ${c0(F)} ; i = ${i}% ; n = ${n}`],
      ["FIND:     ", "A"],
      ["FORMULA:  ", "A = F·[i/((1+i)ⁿ − 1)]"],
      ["PREP:     ", `i = ${(i / 100).toFixed(2)} ; (1+i)ⁿ = ${r4(Math.pow(1 + i / 100, n))}`],
      ["SUB:      ", `A = ${c0(F)}·[${(i / 100).toFixed(2)}/(${r4(Math.pow(1 + i / 100, n))} − 1)]`],
      ["ANSWER:   ", `A = ₱${c2(A)}`],
    ]),
  };
};

const G_ann_findP: Gen = () => {
  const A = pick([5000, 8000, 10000, 12000, 15000, 20000]), i = pick([6, 8, 9, 10, 12]), n = pick([4, 5, 6, 8, 10]);
  const g = Math.pow(1 + i / 100, n), P = A * ((g - 1) / ((i / 100) * g));
  return {
    id: "ann_findP",
    prompt: `An annuity pays <b>₱${c0(A)}</b> at the end of each year for <b>${n} years</b> at <b>${i}%</b>. Find its present worth P.`,
    ans: r2(P), unit: "peso",
    hint: "A-to-P: P = A·[((1+i)ⁿ − 1)/(i(1+i)ⁿ)]. Value today of a stream of payments.",
    sol: S([
      ["GIVEN:    ", `A = ${c0(A)} ; i = ${i}% ; n = ${n}`],
      ["FIND:     ", "P"],
      ["FORMULA:  ", "P = A·[((1+i)ⁿ − 1)/(i(1+i)ⁿ)]"],
      ["PREP:     ", `i = ${(i / 100).toFixed(2)} ; (1+i)ⁿ = ${r4(g)}`],
      ["SUB:      ", `P = ${c0(A)}·[(${r4(g)} − 1)/(${(i / 100).toFixed(2)} × ${r4(g)})]`],
      ["ANSWER:   ", `P = ₱${c2(P)}`],
    ]),
  };
};

const G_ann_capRec: Gen = () => {
  const P = pick([100000, 150000, 200000, 300000, 500000]), i = pick([6, 8, 9, 10, 12]), n = pick([3, 4, 5, 6, 8]);
  const g = Math.pow(1 + i / 100, n), A = P * (((i / 100) * g) / (g - 1));
  return {
    id: "ann_capRec",
    prompt: `A loan of <b>₱${c0(P)}</b> is repaid in <b>${n}</b> equal end-of-year payments at <b>${i}%</b>. Find the annual payment A (capital recovery).`,
    ans: r2(A), unit: "peso",
    hint: "Capital recovery: A = P·[i(1+i)ⁿ/((1+i)ⁿ − 1)]. This is the loan-payment formula.",
    sol: S([
      ["GIVEN:    ", `P = ${c0(P)} ; i = ${i}% ; n = ${n}`],
      ["FIND:     ", "A"],
      ["FORMULA:  ", "A = P·[i(1+i)ⁿ/((1+i)ⁿ − 1)]"],
      ["PREP:     ", `i = ${(i / 100).toFixed(2)} ; (1+i)ⁿ = ${r4(g)}`],
      ["SUB:      ", `A = ${c0(P)}·[${(i / 100).toFixed(2)}×${r4(g)}/(${r4(g)} − 1)]`],
      ["ANSWER:   ", `A = ₱${c2(A)}`],
    ]),
  };
};

const G_ann_due: Gen = () => {
  const A = pick([5000, 8000, 10000, 12000, 15000]), i = pick([6, 8, 9, 10, 12]), n = pick([4, 5, 6, 8]);
  const ord = A * ((Math.pow(1 + i / 100, n) - 1) / (i / 100)), due = ord * (1 + i / 100);
  return {
    id: "ann_due",
    prompt: `You deposit <b>₱${c0(A)}</b> at the <b>beginning</b> of each year for <b>${n} years</b> at <b>${i}%</b> (annuity due). Find the future worth F.`,
    ans: r2(due), unit: "peso",
    hint: "Compute as an ordinary annuity, then multiply by (1 + i). Beginning-of-period earns one extra period.",
    sol: S([
      ["GIVEN:    ", `A = ${c0(A)} ; i = ${i}% ; n = ${n} ; annuity DUE`],
      ["FIND:     ", "F"],
      ["FORMULA:  ", "F = A·[((1+i)ⁿ − 1)/i] × (1 + i)"],
      ["PREP:     ", `ordinary F = ${c2(ord)}`],
      ["SUB:      ", `F = ${c2(ord)} × ${(1 + i / 100).toFixed(2)}`],
      ["ANSWER:   ", `F = ₱${c2(due)}`],
    ]),
  };
};

const G_perp_P: Gen = () => {
  const A = pick([5000, 8000, 10000, 12000, 15000, 20000, 25000]), i = pick([4, 5, 6, 8, 10]);
  const P = A / (i / 100);
  return {
    id: "perp_P",
    prompt: `A perpetuity pays <b>₱${c0(A)}</b> at the end of every year forever, at <b>${i}%</b>. Find its present worth P.`,
    ans: r2(P), unit: "peso",
    hint: "P = A / i. A perpetuity has a present worth but no future worth.",
    sol: S([
      ["GIVEN:    ", `A = ${c0(A)} ; i = ${i}% ; forever`],
      ["FIND:     ", "P"],
      ["FORMULA:  ", "P = A / i"],
      ["PREP:     ", `i = ${(i / 100).toFixed(2)}`],
      ["SUB:      ", `P = ${c0(A)} / ${(i / 100).toFixed(2)}`],
      ["ANSWER:   ", `P = ₱${c2(P)}`],
    ]),
  };
};

const G_perp_A: Gen = () => {
  const P = pick([100000, 200000, 250000, 300000, 500000, 1000000]), i = pick([4, 5, 6, 8, 10]);
  const A = P * (i / 100);
  return {
    id: "perp_A",
    prompt: `A fund of <b>₱${c0(P)}</b> is set aside at <b>${i}%</b> to pay a scholarship forever. Find the yearly amount A it can pay.`,
    ans: r2(A), unit: "peso",
    hint: "From P = A/i, rearrange: A = P·i. The interest thrown off each year is the payment.",
    sol: S([
      ["GIVEN:    ", `P = ${c0(P)} ; i = ${i}% ; forever`],
      ["FIND:     ", "A"],
      ["FORMULA:  ", "A = P · i"],
      ["PREP:     ", `i = ${(i / 100).toFixed(2)}`],
      ["SUB:      ", `A = ${c0(P)} × ${(i / 100).toFixed(2)}`],
      ["ANSWER:   ", `A = ₱${c2(A)}`],
    ]),
  };
};

const G_tax_donor: Gen = () => {
  const gift = pick([400000, 600000, 800000, 1000000, 1200000, 1500000, 2000000]);
  const tax = 0.06 * (gift - 250000);
  return {
    id: "tax_donor",
    prompt: `Your friend gifts you <b>₱${c0(gift)}</b> in a single calendar year. Find the donor's tax.`,
    ans: r2(tax), unit: "peso",
    hint: "6% of the amount OVER ₱250,000. Subtract the threshold first.",
    sol: S([
      ["GIVEN:    ", `gift = ${c0(gift)} ; threshold = 250,000 ; rate = 6%`],
      ["FIND:     ", "donor's tax"],
      ["FORMULA:  ", "tax = 6% × (gift − 250,000)"],
      ["PREP:     ", `excess = ${c0(gift)} − 250,000 = ${c0(gift - 250000)}`],
      ["SUB:      ", `tax = 0.06 × ${c0(gift - 250000)}`],
      ["ANSWER:   ", `tax = ₱${c2(tax)}`],
    ]),
  };
};

const G_tax_estate: Gen = () => {
  const est = pick([500000, 800000, 1000000, 1500000, 2000000, 3000000, 5000000]);
  const tax = 0.06 * est;
  return {
    id: "tax_estate",
    prompt: `A net estate of <b>₱${c0(est)}</b> is transferred to the heirs. Find the estate tax.`,
    ans: r2(tax), unit: "peso",
    hint: "Estate tax is a flat 6% of the net estate. No threshold like donor tax.",
    sol: S([
      ["GIVEN:    ", `net estate = ${c0(est)} ; rate = 6%`],
      ["FIND:     ", "estate tax"],
      ["FORMULA:  ", "tax = 6% × net estate"],
      ["PREP:     ", `rate = 0.06`],
      ["SUB:      ", `tax = 0.06 × ${c0(est)}`],
      ["ANSWER:   ", `tax = ₱${c2(tax)}`],
    ]),
  };
};

const G_tax_profit: Gen = () => {
  const g = pick([50, 55, 60, 65, 70]), o = pick([10, 15, 20, 25]), t = pick([25, 30, 35, 40]);
  const ans = (g - o) * (1 - t / 100);
  return {
    id: "tax_profit",
    prompt: `A firm's gross margin is <b>${g}%</b> of sales, operating costs are <b>${o}%</b> of sales, and it is in the <b>${t}%</b> tax bracket. What percent of sales is profit AFTER taxes?`,
    ans: r2(ans), unit: "percent",
    hint: "Profit before tax = margin − opex (in % of sales). After tax = before × (1 − tax rate).",
    sol: S([
      ["GIVEN:    ", `margin = ${g}% ; opex = ${o}% ; tax = ${t}%`],
      ["FIND:     ", "profit after tax (% of sales)"],
      ["FORMULA:  ", "after = (margin − opex) × (1 − tax)"],
      ["PREP:     ", `before tax = ${g} − ${o} = ${g - o}%`],
      ["SUB:      ", `after = ${g - o}% × (1 − ${(t / 100).toFixed(2)})`],
      ["ANSWER:   ", `after = ${r2(ans)}%`],
    ]),
  };
};

const TOPIC_DEFS: { id: string; name: string; fn: Gen }[] = [
  { id: "si_findF", name: "Simple interest: find F", fn: G_si_findF },
  { id: "si_findRate", name: "Simple interest: find the rate", fn: G_si_findRate },
  { id: "si_ordExact", name: "Ordinary vs exact interest", fn: G_si_ordExact },
  { id: "si_actualRate", name: "Actual rate (upfront deduction)", fn: G_si_actualRate },
  { id: "markupGain", name: "Markup: new gain percent", fn: G_markupGain },
  { id: "si_grossUp", name: "Gross up net-after-tax rate", fn: G_si_grossUp },
  { id: "ci_findF", name: "Compound: find F", fn: G_ci_findF },
  { id: "ci_findP", name: "Compound: find P", fn: G_ci_findP },
  { id: "ci_findi", name: "Compound: find the rate", fn: G_ci_findi },
  { id: "ci_findn", name: "Compound: find n (years)", fn: G_ci_findn },
  { id: "ci_EAR", name: "Effective annual rate", fn: G_ci_EAR },
  { id: "ann_findF", name: "Annuity: find F from A", fn: G_ann_findF },
  { id: "ann_sinking", name: "Sinking fund: find A from F", fn: G_ann_sinking },
  { id: "ann_findP", name: "Annuity: find P from A", fn: G_ann_findP },
  { id: "ann_capRec", name: "Capital recovery: find A from P", fn: G_ann_capRec },
  { id: "ann_due", name: "Annuity due", fn: G_ann_due },
  { id: "perp_P", name: "Perpetuity: find P", fn: G_perp_P },
  { id: "perp_A", name: "Perpetuity: find A", fn: G_perp_A },
  { id: "tax_donor", name: "Donor's tax", fn: G_tax_donor },
  { id: "tax_estate", name: "Estate tax", fn: G_tax_estate },
  { id: "tax_profit", name: "Profit after tax", fn: G_tax_profit },
];

const FORMULA_SHEET_HTML = `
<h4>The 4 reflexes (run before computing)</h4>
<ol>
  <li>Write the formula in symbols first, then numbers.</li>
  <li>"% of what?" Name the base before applying any percentage.</li>
  <li>Match <code>i</code> and <code>n</code> to the same period.</li>
  <li>Hidden step? Net-after-tax = gross up. Deducted upfront = base is amount received. "Effective" = EAR. "By how much" = subtract.</li>
</ol>
<h4>Simple interest</h4>
<table>
  <tbody>
    <tr><td>Future amount</td><td><code>F = P(1 + i·n)</code></td></tr>
    <tr><td>Rate</td><td><code>i = I / (P·n)</code></td></tr>
    <tr><td>Ordinary / exact</td><td><code>n = d/360</code> / <code>n = d/365</code></td></tr>
    <tr><td>Cost from price</td><td><code>Cost = Price ÷ (1 + profit%)</code></td></tr>
    <tr><td>Actual rate (upfront)</td><td>interest ÷ amount received</td></tr>
  </tbody>
</table>
<h4>Compound interest</h4>
<table>
  <tbody>
    <tr><td>Future worth</td><td><code>F = P(1 + i)ⁿ</code></td></tr>
    <tr><td>Present worth</td><td><code>P = F(1 + i)⁻ⁿ</code></td></tr>
    <tr><td>Rate</td><td><code>i = (F/P)^(1/n) − 1</code></td></tr>
    <tr><td>Periods</td><td><code>n = ln(F/P) / ln(1+i)</code></td></tr>
    <tr><td>Per period</td><td><code>i = r/m ; n = m·t</code></td></tr>
    <tr><td>Effective rate</td><td><code>EAR = (1 + r/m)ᵐ − 1</code></td></tr>
  </tbody>
</table>
<h4>Annuity &amp; perpetuity</h4>
<table>
  <tbody>
    <tr><td>Find F from A</td><td><code>F = A·[((1+i)ⁿ−1)/i]</code></td></tr>
    <tr><td>Sinking fund</td><td><code>A = F·[i/((1+i)ⁿ−1)]</code></td></tr>
    <tr><td>Find P from A</td><td><code>P = A·[((1+i)ⁿ−1)/(i(1+i)ⁿ)]</code></td></tr>
    <tr><td>Capital recovery</td><td><code>A = P·[i(1+i)ⁿ/((1+i)ⁿ−1)]</code></td></tr>
    <tr><td>Annuity due</td><td>ordinary value × (1 + i)</td></tr>
    <tr><td>Perpetuity</td><td><code>P = A / i</code></td></tr>
  </tbody>
</table>
<h4>Tax</h4>
<table>
  <tbody>
    <tr><td>Donor's tax</td><td><code>6% × (gift − ₱250,000)</code></td></tr>
    <tr><td>Estate tax</td><td><code>6% × net estate</code></td></tr>
    <tr><td>Profit after tax</td><td>before-tax × (1 − tax rate)</td></tr>
  </tbody>
</table>
`.trim();

export const bes423: Subject = {
  id: "bes423",
  title: "BES 423 · Engineering Economy",
  description: "Simple & compound interest, annuities, perpetuities, and tax problems.",
  topics: TOPIC_DEFS.map((t) => ({
    id: t.id,
    name: t.name,
    generate: () => ({ ...t.fn(), name: t.name }),
  })),
  formulaSheetHtml: FORMULA_SHEET_HTML,
};

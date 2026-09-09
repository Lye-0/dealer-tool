const formatter = new Intl.NumberFormat("ja-JP");
const TAX_RATE = 0.1;
const TAX_FACTOR = 1 + TAX_RATE;
const costIds = ["purchase-price", "auction-fee", "transport-cost", "maintenance-cost", "other-cost"];
const separateFeeIds = ["self-liability", "weight-tax", "stamp-duty", "plate-fee", "recycle-fee"];
const form = document.querySelector("#profit-form");
const carName = document.querySelector("#car-name");
const field = (id) => document.querySelector(`#${id}`);
const taxInclusive = document.querySelector("#tax-inclusive");
const taxExclusive = document.querySelector("#tax-exclusive");
const modePrice = document.querySelector("#mode-price");
const modeProfit = document.querySelector("#mode-profit");
const saleField = document.querySelector("#sale-field");
const desiredField = document.querySelector("#desired-field");
const salesGrid = document.querySelector(".sales-grid");
const saleInput = field("sale-price");
const desiredInput = field("desired-profit");
const secondResultCard = document.querySelector("#second-result-card");
const thirdResultCard = document.querySelector("#third-result-card");
const targetCard = document.querySelector("#target-card");
let currentMode = "price";
let taxMode = "inclusive";
const output = {
  carName: document.querySelector("#result-car-name"),
  total: document.querySelector("#total-cost"),
  secondLabel: document.querySelector("#second-result-label"),
  secondCaption: document.querySelector("#second-result-caption"),
  secondValue: document.querySelector("#second-result-value"),
  thirdLabel: document.querySelector("#third-result-label"),
  thirdCaption: document.querySelector("#third-result-caption"),
  thirdValue: document.querySelector("#third-result-value"),
  targetLabel: document.querySelector("#target-label"),
  targetDescription: document.querySelector("#target-description"),
  target: document.querySelector("#required-sale-price"),
  taxModeLabel: document.querySelector("#tax-mode-label"),
  taxBasisBadge: document.querySelector("#tax-basis-badge"),
  taxBreakdownLabel: document.querySelector("#tax-breakdown-label"),
  taxNet: document.querySelector("#tax-net"),
  taxAmount: document.querySelector("#tax-amount"),
  taxGross: document.querySelector("#tax-gross"),
  costTaxNet: document.querySelector("#cost-tax-net"),
  costTaxAmount: document.querySelector("#cost-tax-amount"),
  costTaxGross: document.querySelector("#cost-tax-gross"),
  feeTaxNet: document.querySelector("#fee-tax-net"),
  feeTaxAmount: document.querySelector("#fee-tax-amount"),
  feeTaxGross: document.querySelector("#fee-tax-gross"),
  paymentTaxNet: document.querySelector("#payment-tax-net"),
  paymentTaxAmount: document.querySelector("#payment-tax-amount"),
  paymentTaxGross: document.querySelector("#payment-tax-gross"),
  separateFeeTotal: document.querySelector("#separate-fee-total"),
  paymentTotal: document.querySelector("#payment-total"),
  paymentTotalDescription: document.querySelector("#payment-total-description"),
  status: document.querySelector("#calculation-status"),
  salesSectionLabel: document.querySelector("#sales-section-label"),
  salesSectionCaption: document.querySelector("#sales-section-caption"),
  calculateLabel: document.querySelector("#calculate-label"),
};

function amount(id) {
  const value = Number(field(id).value);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function yen(value) {
  const rounded = Math.round(value);
  return `${rounded < 0 ? "-" : ""}¥${formatter.format(Math.abs(rounded))}`;
}

function inputToNet(id) {
  const value = amount(id);
  return taxMode === "inclusive" ? value / TAX_FACTOR : value;
}

function netToInputBasis(value) {
  return taxMode === "inclusive" ? value * TAX_FACTOR : value;
}

function taxParts(netValue) {
  const gross = Math.round(netValue * TAX_FACTOR);
  const net = Math.round(netValue);
  return { net, tax: gross - net, gross };
}

function updateTaxRow(netValue, netOutput, taxOutput, grossOutput) {
  const parts = taxParts(netValue);
  netOutput.textContent = yen(parts.net);
  taxOutput.textContent = yen(parts.tax);
  grossOutput.textContent = yen(parts.gross);
}

function updateFeeRow(feeAmount, netOutput, taxOutput, grossOutput) {
  netOutput.textContent = yen(feeAmount);
  taxOutput.textContent = "—";
  grossOutput.textContent = yen(feeAmount);
}

function updatePaymentRow(saleNet, feeAmount, netOutput, taxOutput, grossOutput) {
  const saleParts = taxParts(saleNet);
  netOutput.textContent = yen(saleParts.net + feeAmount);
  taxOutput.textContent = yen(saleParts.tax);
  grossOutput.textContent = yen(saleParts.gross + feeAmount);
}

function updateTaxBreakdown(totalNet, resultNet, separateFees, label) {
  output.taxBreakdownLabel.textContent = label;
  updateTaxRow(totalNet, output.costTaxNet, output.costTaxAmount, output.costTaxGross);
  updateTaxRow(resultNet, output.taxNet, output.taxAmount, output.taxGross);
  updateFeeRow(separateFees, output.feeTaxNet, output.feeTaxAmount, output.feeTaxGross);
  updatePaymentRow(resultNet, separateFees, output.paymentTaxNet, output.paymentTaxAmount, output.paymentTaxGross);
}

function calculate() {
  const total = costIds
    .reduce((sum, id) => sum + inputToNet(id), 0);
  const separateFees = separateFeeIds
    .reduce((sum, id) => sum + amount(id), 0);
  const name = carName.value.trim();

  output.carName.textContent = name || "車名未入力";
  output.total.textContent = yen(netToInputBasis(total));
  output.separateFeeTotal.textContent = yen(separateFees);

  if (currentMode === "price") {
    const desired = inputToNet("desired-profit");
    const requiredSale = total + desired;
    output.secondLabel.textContent = "希望利益";
    output.secondCaption.textContent = "入力した目標";
    output.secondValue.textContent = yen(netToInputBasis(desired));
    output.secondValue.classList.remove("negative");
    thirdResultCard.classList.add("is-hidden");
    targetCard.classList.remove("is-hidden");
    output.targetLabel.textContent = "希望利益を確保するために必要な販売価格";
    output.targetDescription.textContent = "総原価に希望利益を加えた目安です。";
    output.target.textContent = yen(netToInputBasis(requiredSale));
    updateTaxBreakdown(total, requiredSale, separateFees, "必要販売価格");
    output.paymentTotalDescription.textContent = "必要販売価格＋諸費用合計";
    output.paymentTotal.textContent = yen(netToInputBasis(requiredSale) + separateFees);
    output.status.textContent = `${name || "この車両"}の必要販売価格を計算しています。`;
  } else {
    const sale = inputToNet("sale-price");
    const profit = sale - total;
    const margin = sale > 0 ? (profit / sale) * 100 : Number.NaN;
    output.secondLabel.textContent = "粗利益";
    output.secondCaption.textContent = "販売価格−総原価";
    output.secondValue.textContent = yen(netToInputBasis(profit));
    output.secondValue.classList.toggle("negative", profit < 0);
    output.thirdLabel.textContent = "粗利率";
    output.thirdCaption.textContent = "粗利益÷販売価格";
    output.thirdValue.textContent = Number.isFinite(margin) ? `${margin.toFixed(1)}%` : "—";
    thirdResultCard.classList.remove("is-hidden");
    targetCard.classList.add("is-hidden");
    updateTaxBreakdown(total, sale, separateFees, "予定販売価格");
    output.paymentTotalDescription.textContent = "予定販売価格＋諸費用合計";
    output.paymentTotal.textContent = yen(netToInputBasis(sale) + separateFees);
    output.status.textContent = sale > 0
      ? `${name || "この車両"}の粗利益と粗利率を計算しています。`
      : "予定販売価格を入力すると粗利益と粗利率を計算します。";
  }
}

function setTaxMode(mode) {
  taxMode = mode;
  const isInclusive = mode === "inclusive";
  taxInclusive.classList.toggle("active", isInclusive);
  taxExclusive.classList.toggle("active", !isInclusive);
  taxInclusive.setAttribute("aria-selected", String(isInclusive));
  taxExclusive.setAttribute("aria-selected", String(!isInclusive));
  output.taxModeLabel.textContent = isInclusive ? "税込" : "税別";
  output.taxBasisBadge.textContent = `入力：${isInclusive ? "税込" : "税別"}`;
  calculate();
}

function setMode(mode) {
  currentMode = mode;
  const isPriceMode = mode === "price";
  modePrice.classList.toggle("active", isPriceMode);
  modeProfit.classList.toggle("active", !isPriceMode);
  modePrice.setAttribute("aria-selected", String(isPriceMode));
  modeProfit.setAttribute("aria-selected", String(!isPriceMode));
  saleField.classList.toggle("is-hidden", isPriceMode);
  desiredField.classList.toggle("is-hidden", !isPriceMode);
  salesGrid.classList.toggle("single-field", true);
  saleInput.disabled = isPriceMode;
  desiredInput.disabled = !isPriceMode;
  output.salesSectionLabel.textContent = isPriceMode ? "目標条件" : "販売条件";
  output.salesSectionCaption.textContent = isPriceMode ? "Target" : "Sales";
  output.calculateLabel.textContent = isPriceMode ? "販売価格を計算" : "利益を確認する";
  calculate();
}

taxInclusive.addEventListener("click", () => setTaxMode("inclusive"));
taxExclusive.addEventListener("click", () => setTaxMode("exclusive"));
modePrice.addEventListener("click", () => setMode("price"));
modeProfit.addEventListener("click", () => setMode("profit"));
form.addEventListener("input", calculate);
form.addEventListener("submit", (event) => { event.preventDefault(); calculate(); });
setMode("price");
setTaxMode("inclusive");
calculate();

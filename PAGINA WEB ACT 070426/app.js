"use strict";

const STORAGE_KEY = "blackcat_finance_v1";
const VALID_SALE_CATEGORIES = ["camisa", "hoodie", "termo", "combo", "otro"];
const VALID_PAYMENT_METHODS = ["transferencia", "efectivo", "otro"];
const VALID_SALE_STATUSES = ["pendiente", "pagado", "entregado", "cancelado"];
const VALID_INVESTMENT_TYPES = [
  "materia prima",
  "camisas",
  "vinil",
  "sublimación",
  "empaque",
  "herramientas",
  "publicidad",
  "envío",
  "otro"
];
const VALID_EXPENSE_CATEGORIES = [
  "casa",
  "energía eléctrica",
  "internet",
  "préstamo",
  "colegiatura",
  "comida",
  "transporte",
  "salud",
  "entretenimiento",
  "otro"
];
const VALID_EXPENSE_TYPES = ["fijo", "variable"];
const VALID_EXPENSE_STATUSES = ["pendiente", "pagado"];

const state = {
  settings: {
    currentMonth: "",
    salesGoal: 0,
    profitGoal: 0,
    personalBudget: 0,
    fixedSeeded: false
  },
  sales: [],
  investments: [],
  personalExpenses: []
};

const ui = {};

document.addEventListener("DOMContentLoaded", init);

function init() {
  cacheUI();
  loadData();
  setupDefaultFilters();
  bindEvents();
  resetSaleForm();
  resetInvestmentForm();
  resetPersonalExpenseForm();
  renderAll();
}

function cacheUI() {
  ui.globalMonthFilter = document.getElementById("globalMonthFilter");
  ui.loadSampleBtn = document.getElementById("loadSampleBtn");
  ui.exportBtn = document.getElementById("exportBtn");
  ui.importBtn = document.getElementById("importBtn");
  ui.resetBtn = document.getElementById("resetBtn");
  ui.importFileInput = document.getElementById("importFileInput");

  ui.settingsForm = document.getElementById("settingsForm");
  ui.settingsMonth = document.getElementById("settingsMonth");
  ui.salesGoalInput = document.getElementById("salesGoalInput");
  ui.profitGoalInput = document.getElementById("profitGoalInput");
  ui.personalBudgetInput = document.getElementById("personalBudgetInput");
  ui.settingsError = document.getElementById("settingsError");

  ui.saleForm = document.getElementById("saleForm");
  ui.saleId = document.getElementById("saleId");
  ui.saleDate = document.getElementById("saleDate");
  ui.saleClient = document.getElementById("saleClient");
  ui.saleProduct = document.getElementById("saleProduct");
  ui.saleCategory = document.getElementById("saleCategory");
  ui.salePrice = document.getElementById("salePrice");
  ui.saleProductionCost = document.getElementById("saleProductionCost");
  ui.saleShippingCost = document.getElementById("saleShippingCost");
  ui.saleOtherCosts = document.getElementById("saleOtherCosts");
  ui.salePaymentMethod = document.getElementById("salePaymentMethod");
  ui.saleStatus = document.getElementById("saleStatus");
  ui.saleNotes = document.getElementById("saleNotes");
  ui.saleSubmitBtn = document.getElementById("saleSubmitBtn");
  ui.saleError = document.getElementById("saleError");
  ui.salesMonthFilter = document.getElementById("salesMonthFilter");
  ui.salesStatusFilter = document.getElementById("salesStatusFilter");
  ui.salesCategoryFilter = document.getElementById("salesCategoryFilter");
  ui.salesTableBody = document.getElementById("salesTableBody");

  ui.investmentForm = document.getElementById("investmentForm");
  ui.investmentId = document.getElementById("investmentId");
  ui.investmentDate = document.getElementById("investmentDate");
  ui.investmentType = document.getElementById("investmentType");
  ui.investmentDescription = document.getElementById("investmentDescription");
  ui.investmentAmount = document.getElementById("investmentAmount");
  ui.investmentProvider = document.getElementById("investmentProvider");
  ui.investmentNotes = document.getElementById("investmentNotes");
  ui.investmentSubmitBtn = document.getElementById("investmentSubmitBtn");
  ui.investmentError = document.getElementById("investmentError");
  ui.investmentMonthTotal = document.getElementById("investmentMonthTotal");
  ui.investmentsTableBody = document.getElementById("investmentsTableBody");

  ui.personalExpenseForm = document.getElementById("personalExpenseForm");
  ui.personalExpenseId = document.getElementById("personalExpenseId");
  ui.personalExpenseDate = document.getElementById("personalExpenseDate");
  ui.personalExpenseCategory = document.getElementById("personalExpenseCategory");
  ui.personalExpenseDescription = document.getElementById("personalExpenseDescription");
  ui.personalExpenseAmount = document.getElementById("personalExpenseAmount");
  ui.personalExpenseType = document.getElementById("personalExpenseType");
  ui.personalExpenseStatus = document.getElementById("personalExpenseStatus");
  ui.personalExpenseNotes = document.getElementById("personalExpenseNotes");
  ui.personalExpenseSubmitBtn = document.getElementById("personalExpenseSubmitBtn");
  ui.personalExpenseError = document.getElementById("personalExpenseError");
  ui.personalMonthFilter = document.getElementById("personalMonthFilter");
  ui.personalExpensesTableBody = document.getElementById("personalExpensesTableBody");

  ui.metricSales = document.getElementById("metricSales");
  ui.metricCosts = document.getElementById("metricCosts");
  ui.metricGrossProfit = document.getElementById("metricGrossProfit");
  ui.metricPersonalExpenses = document.getElementById("metricPersonalExpenses");
  ui.metricNetProfit = document.getElementById("metricNetProfit");
  ui.metricInvestments = document.getElementById("metricInvestments");
  ui.goalSalesLabel = document.getElementById("goalSalesLabel");
  ui.goalProfitLabel = document.getElementById("goalProfitLabel");
  ui.progressSalesBar = document.getElementById("progressSalesBar");
  ui.progressProfitBar = document.getElementById("progressProfitBar");
  ui.progressSalesText = document.getElementById("progressSalesText");
  ui.progressProfitText = document.getElementById("progressProfitText");
  ui.financialStatus = document.getElementById("financialStatus");

  ui.summarySold = document.getElementById("summarySold");
  ui.summaryInvested = document.getElementById("summaryInvested");
  ui.summaryPersonal = document.getElementById("summaryPersonal");
  ui.summaryGross = document.getElementById("summaryGross");
  ui.summaryNet = document.getElementById("summaryNet");
  ui.summaryAvailable = document.getElementById("summaryAvailable");
  ui.smartMessages = document.getElementById("smartMessages");

  ui.reportSalesByCategory = document.getElementById("reportSalesByCategory");
  ui.reportPersonalByCategory = document.getElementById("reportPersonalByCategory");
  ui.reportInvestmentsByType = document.getElementById("reportInvestmentsByType");
  ui.bestSellingProduct = document.getElementById("bestSellingProduct");
  ui.mostProfitableCategory = document.getElementById("mostProfitableCategory");
  ui.toastContainer = document.getElementById("toastContainer");
}

function bindEvents() {
  ui.settingsForm.addEventListener("submit", onSaveSettings);
  ui.saleForm.addEventListener("submit", onSaveSale);
  ui.investmentForm.addEventListener("submit", onSaveInvestment);
  ui.personalExpenseForm.addEventListener("submit", onSavePersonalExpense);

  ui.globalMonthFilter.addEventListener("change", onGlobalMonthChange);
  ui.salesMonthFilter.addEventListener("change", renderSales);
  ui.personalMonthFilter.addEventListener("change", renderPersonalExpenses);
  ui.salesStatusFilter.addEventListener("change", renderSales);
  ui.salesCategoryFilter.addEventListener("change", renderSales);

  ui.loadSampleBtn.addEventListener("click", loadSampleData);
  ui.exportBtn.addEventListener("click", exportData);
  ui.importBtn.addEventListener("click", () => ui.importFileInput.click());
  ui.importFileInput.addEventListener("change", importData);
  ui.resetBtn.addEventListener("click", resetAllData);

  ui.salesTableBody.addEventListener("click", onSalesTableAction);
  ui.investmentsTableBody.addEventListener("click", onInvestmentsTableAction);
  ui.personalExpensesTableBody.addEventListener("click", onPersonalTableAction);
}

function setupDefaultFilters() {
  const month = state.settings.currentMonth || getCurrentMonth();
  state.settings.currentMonth = month;
  ui.globalMonthFilter.value = month;
  ui.salesMonthFilter.value = month;
  ui.personalMonthFilter.value = month;
}

function onGlobalMonthChange() {
  const month = ui.globalMonthFilter.value || getCurrentMonth();
  state.settings.currentMonth = month;
  ui.salesMonthFilter.value = month;
  ui.personalMonthFilter.value = month;
  ui.settingsMonth.value = month;
  saveData();
  renderAll();
}

function onSaveSettings(event) {
  event.preventDefault();
  ui.settingsError.textContent = "";

  const month = ui.settingsMonth.value;
  const salesGoalRaw = ui.salesGoalInput.value;
  const profitGoalRaw = ui.profitGoalInput.value;
  const personalBudgetRaw = ui.personalBudgetInput.value;

  if (!isValidMonth(month)) {
    ui.settingsError.textContent = "El mes actual no es válido.";
    return;
  }
  if (!isMoneyInputValid(salesGoalRaw) || parseMoney(salesGoalRaw) < 0) {
    ui.settingsError.textContent = "La meta de ventas debe ser un monto válido mayor o igual a 0.";
    return;
  }
  if (!isMoneyInputValid(profitGoalRaw) || parseMoney(profitGoalRaw) < 0) {
    ui.settingsError.textContent = "La meta de ganancia debe ser un monto válido mayor o igual a 0.";
    return;
  }
  if (!isMoneyInputValid(personalBudgetRaw) || parseMoney(personalBudgetRaw) < 0) {
    ui.settingsError.textContent = "El presupuesto personal debe ser un monto válido mayor o igual a 0.";
    return;
  }

  state.settings.currentMonth = month;
  state.settings.salesGoal = parseMoney(salesGoalRaw);
  state.settings.profitGoal = parseMoney(profitGoalRaw);
  state.settings.personalBudget = parseMoney(personalBudgetRaw);

  ui.globalMonthFilter.value = month;
  ui.salesMonthFilter.value = month;
  ui.personalMonthFilter.value = month;
  saveData();
  renderAll();
  showToast("Configuración guardada.", "success");
}

function onSaveSale(event) {
  event.preventDefault();
  addSale();
}

function onSaveInvestment(event) {
  event.preventDefault();
  addInvestment();
}

function onSavePersonalExpense(event) {
  event.preventDefault();
  addPersonalExpense();
}

function onSalesTableAction(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const id = target.getAttribute("data-id");
  const action = target.getAttribute("data-action");
  if (!id || !action) {
    return;
  }
  if (action === "edit") {
    editSale(id);
  } else if (action === "delete") {
    deleteSale(id);
  }
}

function onInvestmentsTableAction(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const id = target.getAttribute("data-id");
  const action = target.getAttribute("data-action");
  if (!id || !action) {
    return;
  }
  if (action === "edit") {
    editInvestment(id);
  } else if (action === "delete") {
    deleteInvestment(id);
  }
}

function onPersonalTableAction(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const id = target.getAttribute("data-id");
  const action = target.getAttribute("data-action");
  if (!id || !action) {
    return;
  }
  if (action === "edit") {
    editPersonalExpense(id);
  } else if (action === "delete") {
    deletePersonalExpense(id);
  } else if (action === "pay") {
    markPersonalExpensePaid(id);
  }
}

function renderAll() {
  renderDashboard();
  renderSales();
  renderInvestments();
  renderPersonalExpenses();
  renderFinancialSummary();
  renderReports();
  syncSettingsForm();
}

function syncSettingsForm() {
  ui.settingsMonth.value = state.settings.currentMonth;
  ui.salesGoalInput.value = Number(state.settings.salesGoal || 0).toFixed(2);
  ui.profitGoalInput.value = Number(state.settings.profitGoal || 0).toFixed(2);
  ui.personalBudgetInput.value = Number(state.settings.personalBudget || 0).toFixed(2);
}

function parseMoney(value) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  let text = String(value).trim();
  if (!text) {
    return 0;
  }

  text = text.replace(/,/g, ".");
  text = text.replace(/\s+/g, "");
  text = text.replace(/[^0-9.\-]/g, "");
  if (!text || text === "." || text === "-" || text === "-.") {
    return 0;
  }

  const parts = text.split(".");
  if (parts.length > 2) {
    const first = parts.shift();
    text = `${first}.${parts.join("")}`;
  }

  const parsed = parseFloat(text);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return parsed;
}

function formatMoney(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return "$0.00";
  }
  return `$${number.toFixed(2)}`;
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    showToast("No se pudo guardar en LocalStorage.", "error");
  }
}

function loadData() {
  const defaultMonth = getCurrentMonth();
  state.settings.currentMonth = defaultMonth;
  state.settings.salesGoal = 0;
  state.settings.profitGoal = 0;
  state.settings.personalBudget = 0;
  state.settings.fixedSeeded = false;
  state.sales = [];
  state.investments = [];
  state.personalExpenses = [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      seedDefaultFixedExpenses(defaultMonth);
      state.settings.fixedSeeded = true;
      saveData();
      return;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      seedDefaultFixedExpenses(defaultMonth);
      state.settings.fixedSeeded = true;
      saveData();
      return;
    }

    const parsedSettings = parsed.settings && typeof parsed.settings === "object" ? parsed.settings : {};
    const loadedMonth = isValidMonth(parsedSettings.currentMonth) ? parsedSettings.currentMonth : defaultMonth;
    state.settings.currentMonth = loadedMonth;
    state.settings.salesGoal = Math.max(0, parseMoney(parsedSettings.salesGoal));
    state.settings.profitGoal = Math.max(0, parseMoney(parsedSettings.profitGoal));
    state.settings.personalBudget = Math.max(0, parseMoney(parsedSettings.personalBudget));
    state.settings.fixedSeeded = Boolean(parsedSettings.fixedSeeded);

    state.sales = Array.isArray(parsed.sales) ? parsed.sales.map(normalizeSale).filter(Boolean) : [];
    state.investments = Array.isArray(parsed.investments) ? parsed.investments.map(normalizeInvestment).filter(Boolean) : [];
    state.personalExpenses = Array.isArray(parsed.personalExpenses)
      ? parsed.personalExpenses.map(normalizePersonalExpense).filter(Boolean)
      : [];

    if (!state.settings.fixedSeeded && state.personalExpenses.length === 0) {
      seedDefaultFixedExpenses(state.settings.currentMonth);
      state.settings.fixedSeeded = true;
      saveData();
    }
  } catch (error) {
    seedDefaultFixedExpenses(defaultMonth);
    state.settings.fixedSeeded = true;
    saveData();
    showToast("Los datos guardados estaban dañados y se restauraron.", "error");
  }
}

function normalizeSale(sale) {
  if (!sale || typeof sale !== "object") {
    return null;
  }
  const normalized = {
    id: sale.id ? String(sale.id) : generateId("sale"),
    date: isValidDate(sale.date) ? sale.date : `${state.settings.currentMonth}-01`,
    client: cleanText(sale.client),
    product: cleanText(sale.product),
    category: VALID_SALE_CATEGORIES.includes(sale.category) ? sale.category : "otro",
    price: Math.max(0, parseMoney(sale.price)),
    productionCost: Math.max(0, parseMoney(sale.productionCost)),
    shippingCost: Math.max(0, parseMoney(sale.shippingCost)),
    otherCosts: Math.max(0, parseMoney(sale.otherCosts)),
    paymentMethod: VALID_PAYMENT_METHODS.includes(sale.paymentMethod) ? sale.paymentMethod : "otro",
    status: VALID_SALE_STATUSES.includes(sale.status) ? sale.status : "pendiente",
    notes: cleanText(sale.notes)
  };
  return normalized;
}

function normalizeInvestment(item) {
  if (!item || typeof item !== "object") {
    return null;
  }
  return {
    id: item.id ? String(item.id) : generateId("inv"),
    date: isValidDate(item.date) ? item.date : `${state.settings.currentMonth}-01`,
    type: VALID_INVESTMENT_TYPES.includes(item.type) ? item.type : "otro",
    description: cleanText(item.description),
    amount: Math.max(0, parseMoney(item.amount)),
    provider: cleanText(item.provider),
    notes: cleanText(item.notes)
  };
}

function normalizePersonalExpense(item) {
  if (!item || typeof item !== "object") {
    return null;
  }
  return {
    id: item.id ? String(item.id) : generateId("pe"),
    date: isValidDate(item.date) ? item.date : `${state.settings.currentMonth}-01`,
    category: VALID_EXPENSE_CATEGORIES.includes(item.category) ? item.category : "otro",
    description: cleanText(item.description),
    amount: Math.max(0, parseMoney(item.amount)),
    type: VALID_EXPENSE_TYPES.includes(item.type) ? item.type : "variable",
    status: VALID_EXPENSE_STATUSES.includes(item.status) ? item.status : "pendiente",
    notes: cleanText(item.notes),
    systemFixed: Boolean(item.systemFixed),
    fixedKey: item.fixedKey ? String(item.fixedKey) : ""
  };
}

function seedDefaultFixedExpenses(month) {
  const baseDate = `${month}-01`;
  const defaults = [
    { fixedKey: "energia", category: "energía eléctrica", description: "Energía eléctrica", amount: 50.0 },
    { fixedKey: "prestamo", category: "préstamo", description: "Préstamos", amount: 70.0 },
    { fixedKey: "internet", category: "internet", description: "Internet", amount: 20.0 },
    { fixedKey: "casa", category: "casa", description: "Casa", amount: 125.0 },
    { fixedKey: "tv", category: "entretenimiento", description: "TV", amount: 50.0 },
    { fixedKey: "colegiatura", category: "colegiatura", description: "Colegiatura", amount: 40.0 }
  ];

  for (let index = 0; index < defaults.length; index += 1) {
    const item = defaults[index];
    state.personalExpenses.push({
      id: generateId("pe"),
      date: baseDate,
      category: item.category,
      description: item.description,
      amount: item.amount,
      type: "fijo",
      status: "pendiente",
      notes: "Gasto fijo inicial",
      systemFixed: true,
      fixedKey: item.fixedKey
    });
  }
}

function calculateTotals(month = state.settings.currentMonth) {
  const monthSales = state.sales.filter((sale) => getMonthFromDate(sale.date) === month);
  const effectiveSales = monthSales.filter((sale) => sale.status === "pagado" || sale.status === "entregado");
  const monthInvestments = state.investments.filter((item) => getMonthFromDate(item.date) === month);
  const monthExpenses = state.personalExpenses.filter((expense) => getMonthFromDate(expense.date) === month);

  const salesTotal = effectiveSales.reduce((acc, sale) => acc + Number(sale.price || 0), 0);
  const salesCosts = effectiveSales.reduce((acc, sale) => acc + calculateSaleCosts(sale), 0);
  const investmentsTotal = monthInvestments.reduce((acc, item) => acc + Number(item.amount || 0), 0);
  const personalExpensesTotal = monthExpenses.reduce((acc, exp) => acc + Number(exp.amount || 0), 0);
  const grossProfit = salesTotal - salesCosts;
  const netProfit = grossProfit - personalExpensesTotal - investmentsTotal;
  const costsTotal = salesCosts + investmentsTotal;
  const salesGoal = Number(state.settings.salesGoal || 0);
  const profitGoal = Number(state.settings.profitGoal || 0);

  const salesGoalProgress = salesGoal > 0 ? (salesTotal / salesGoal) * 100 : 0;
  const profitGoalProgress = profitGoal > 0 ? (netProfit / profitGoal) * 100 : 0;

  let financialState = "En riesgo";
  if (netProfit <= 0) {
    financialState = "Negativo";
  } else if (netProfit >= personalExpensesTotal) {
    financialState = "Positivo";
  }

  return {
    salesTotal,
    salesCosts,
    investmentsTotal,
    personalExpensesTotal,
    costsTotal,
    grossProfit,
    netProfit,
    salesGoal,
    profitGoal,
    salesGoalProgress,
    profitGoalProgress,
    financialState
  };
}

function renderDashboard() {
  const totals = calculateTotals();
  ui.metricSales.textContent = formatMoney(totals.salesTotal);
  ui.metricCosts.textContent = formatMoney(totals.costsTotal);
  ui.metricGrossProfit.textContent = formatMoney(totals.grossProfit);
  ui.metricPersonalExpenses.textContent = formatMoney(totals.personalExpensesTotal);
  ui.metricNetProfit.textContent = formatMoney(totals.netProfit);
  ui.metricInvestments.textContent = formatMoney(totals.investmentsTotal);
  ui.goalSalesLabel.textContent = formatMoney(totals.salesGoal);
  ui.goalProfitLabel.textContent = formatMoney(totals.profitGoal);

  const salesWidth = clampPercentage(totals.salesGoalProgress);
  const profitWidth = clampPercentage(totals.profitGoalProgress);
  ui.progressSalesBar.style.width = `${salesWidth}%`;
  ui.progressProfitBar.style.width = `${profitWidth}%`;
  ui.progressSalesText.textContent = `${safePercent(totals.salesGoalProgress)}% alcanzado`;
  ui.progressProfitText.textContent = `${safePercent(totals.profitGoalProgress)}% alcanzado`;

  ui.financialStatus.className = "status-chip";
  if (totals.financialState === "Positivo") {
    ui.financialStatus.classList.add("positive");
  } else if (totals.financialState === "Negativo") {
    ui.financialStatus.classList.add("negative");
  } else {
    ui.financialStatus.classList.add("warning");
  }
  ui.financialStatus.textContent = `Estado financiero: ${totals.financialState}`;
}

function renderSales() {
  const month = ui.salesMonthFilter.value || state.settings.currentMonth;
  const statusFilter = ui.salesStatusFilter.value || "todos";
  const categoryFilter = ui.salesCategoryFilter.value || "todos";

  const filtered = state.sales
    .filter((sale) => getMonthFromDate(sale.date) === month)
    .filter((sale) => (statusFilter === "todos" ? true : sale.status === statusFilter))
    .filter((sale) => (categoryFilter === "todos" ? true : sale.category === categoryFilter))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));

  if (filtered.length === 0) {
    ui.salesTableBody.innerHTML = '<tr><td colspan="9" class="empty">No hay ventas registradas para este filtro.</td></tr>';
    return;
  }

  const rows = filtered
    .map((sale) => {
      const totalCosts = calculateSaleCosts(sale);
      const profit = calculateSaleProfit(sale);
      return `
        <tr>
          <td>${escapeHTML(sale.date)}</td>
          <td>${escapeHTML(sale.client)}</td>
          <td>${escapeHTML(sale.product)}</td>
          <td>${escapeHTML(sale.category)}</td>
          <td>${formatMoney(sale.price)}</td>
          <td>${formatMoney(totalCosts)}</td>
          <td>${formatMoney(profit)}</td>
          <td><span class="tag ${escapeHTML(sale.status)}">${escapeHTML(sale.status)}</span></td>
          <td>
            <div class="actions">
              <button type="button" class="btn small btn-secondary" data-action="edit" data-id="${escapeHTML(sale.id)}">Editar</button>
              <button type="button" class="btn small btn-danger" data-action="delete" data-id="${escapeHTML(sale.id)}">Eliminar</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  ui.salesTableBody.innerHTML = rows;
}

function renderInvestments() {
  const month = state.settings.currentMonth;
  const filtered = state.investments
    .filter((item) => getMonthFromDate(item.date) === month)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));

  const totalMonth = filtered.reduce((acc, item) => acc + Number(item.amount || 0), 0);
  ui.investmentMonthTotal.textContent = formatMoney(totalMonth);

  if (filtered.length === 0) {
    ui.investmentsTableBody.innerHTML = '<tr><td colspan="6" class="empty">No hay inversiones registradas para este mes.</td></tr>';
    return;
  }

  const rows = filtered
    .map(
      (item) => `
        <tr>
          <td>${escapeHTML(item.date)}</td>
          <td>${escapeHTML(item.type)}</td>
          <td>${escapeHTML(item.description)}</td>
          <td>${formatMoney(item.amount)}</td>
          <td>${escapeHTML(item.provider)}</td>
          <td>
            <div class="actions">
              <button type="button" class="btn small btn-secondary" data-action="edit" data-id="${escapeHTML(item.id)}">Editar</button>
              <button type="button" class="btn small btn-danger" data-action="delete" data-id="${escapeHTML(item.id)}">Eliminar</button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");
  ui.investmentsTableBody.innerHTML = rows;
}

function renderPersonalExpenses() {
  const month = ui.personalMonthFilter.value || state.settings.currentMonth;
  const filtered = state.personalExpenses
    .filter((item) => getMonthFromDate(item.date) === month)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));

  if (filtered.length === 0) {
    ui.personalExpensesTableBody.innerHTML = '<tr><td colspan="7" class="empty">No hay gastos personales registrados para este mes.</td></tr>';
    return;
  }

  const rows = filtered
    .map((item) => {
      const payButton =
        item.status === "pendiente"
          ? `<button type="button" class="btn small" data-action="pay" data-id="${escapeHTML(item.id)}">Marcar pagado</button>`
          : "";
      return `
        <tr>
          <td>${escapeHTML(item.date)}</td>
          <td>${escapeHTML(item.category)}</td>
          <td>${escapeHTML(item.description)}</td>
          <td>${formatMoney(item.amount)}</td>
          <td><span class="tag ${escapeHTML(item.type)}">${escapeHTML(item.type)}</span></td>
          <td><span class="tag ${escapeHTML(item.status)}">${escapeHTML(item.status)}</span></td>
          <td>
            <div class="actions">
              ${payButton}
              <button type="button" class="btn small btn-secondary" data-action="edit" data-id="${escapeHTML(item.id)}">Editar</button>
              <button type="button" class="btn small btn-danger" data-action="delete" data-id="${escapeHTML(item.id)}">Eliminar</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
  ui.personalExpensesTableBody.innerHTML = rows;
}

function renderFinancialSummary() {
  const totals = calculateTotals();
  const available = totals.netProfit;

  ui.summarySold.textContent = formatMoney(totals.salesTotal);
  ui.summaryInvested.textContent = formatMoney(totals.investmentsTotal);
  ui.summaryPersonal.textContent = formatMoney(totals.personalExpensesTotal);
  ui.summaryGross.textContent = formatMoney(totals.grossProfit);
  ui.summaryNet.textContent = formatMoney(totals.netProfit);
  ui.summaryAvailable.textContent = formatMoney(available);

  const messages = [];
  if (totals.netProfit >= 0) {
    messages.push({ text: "Ya cubriste tus gastos personales del mes.", type: "ok" });
  } else {
    messages.push({
      text: `Aún faltan ${formatMoney(Math.abs(totals.netProfit))} para cubrir tus gastos personales.`,
      type: "warn"
    });
  }

  if (totals.salesGoal > 0 && totals.salesTotal >= totals.salesGoal) {
    messages.push({ text: "Ya cumpliste tu meta de ventas.", type: "ok" });
  } else {
    const missingSales = Math.max(totals.salesGoal - totals.salesTotal, 0);
    messages.push({ text: `Aún faltan ${formatMoney(missingSales)} para cumplir tu meta de ventas.`, type: "warn" });
  }

  if (totals.profitGoal > 0 && totals.netProfit >= totals.profitGoal) {
    messages.push({ text: "Ya cumpliste tu meta de ganancia.", type: "ok" });
  } else {
    const missingProfit = Math.max(totals.profitGoal - totals.netProfit, 0);
    messages.push({ text: `Aún faltan ${formatMoney(missingProfit)} para cumplir tu meta de ganancia.`, type: "warn" });
  }

  if (totals.netProfit <= 0 || (totals.profitGoal > 0 && totals.netProfit < totals.profitGoal * 0.5)) {
    messages.push({ text: "Tu ganancia neta está en riesgo.", type: "danger" });
  }

  ui.smartMessages.innerHTML = messages
    .map((msg) => `<p class="smart-message ${msg.type}">${escapeHTML(msg.text)}</p>`)
    .join("");
}

function renderReports() {
  const month = state.settings.currentMonth;
  const monthSales = state.sales.filter((sale) => getMonthFromDate(sale.date) === month);
  const effectiveSales = monthSales.filter((sale) => sale.status === "pagado" || sale.status === "entregado");
  const monthInvestments = state.investments.filter((item) => getMonthFromDate(item.date) === month);
  const monthExpenses = state.personalExpenses.filter((item) => getMonthFromDate(item.date) === month);

  const salesByCategory = {};
  const expensesByCategory = {};
  const investmentsByType = {};
  const productCount = {};
  const profitByCategory = {};

  for (let i = 0; i < effectiveSales.length; i += 1) {
    const sale = effectiveSales[i];
    salesByCategory[sale.category] = (salesByCategory[sale.category] || 0) + Number(sale.price || 0);
    productCount[sale.product] = (productCount[sale.product] || 0) + 1;
    profitByCategory[sale.category] = (profitByCategory[sale.category] || 0) + calculateSaleProfit(sale);
  }

  for (let i = 0; i < monthExpenses.length; i += 1) {
    const item = monthExpenses[i];
    expensesByCategory[item.category] = (expensesByCategory[item.category] || 0) + Number(item.amount || 0);
  }

  for (let i = 0; i < monthInvestments.length; i += 1) {
    const item = monthInvestments[i];
    investmentsByType[item.type] = (investmentsByType[item.type] || 0) + Number(item.amount || 0);
  }

  renderBarList(ui.reportSalesByCategory, salesByCategory);
  renderBarList(ui.reportPersonalByCategory, expensesByCategory);
  renderBarList(ui.reportInvestmentsByType, investmentsByType);

  const bestProduct = getMaxKey(productCount);
  const bestCategory = getMaxKey(profitByCategory);
  ui.bestSellingProduct.textContent = bestProduct || "N/A";
  ui.mostProfitableCategory.textContent = bestCategory || "N/A";
}

function renderBarList(container, dataMap) {
  const entries = Object.entries(dataMap);
  if (entries.length === 0) {
    container.innerHTML = '<p class="empty">Sin datos para este mes.</p>';
    return;
  }

  const max = entries.reduce((acc, [, value]) => Math.max(acc, Number(value || 0)), 0);
  const rows = entries
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .map(([label, value]) => {
      const width = max > 0 ? (Number(value) / max) * 100 : 0;
      return `
        <div class="bar-row">
          <div class="bar-row-head">
            <span>${escapeHTML(label)}</span>
            <strong>${formatMoney(value)}</strong>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${clampPercentage(width)}%"></div>
          </div>
        </div>
      `;
    })
    .join("");

  container.innerHTML = rows;
}

function addSale() {
  ui.saleError.textContent = "";

  const payload = {
    id: ui.saleId.value ? String(ui.saleId.value) : "",
    date: ui.saleDate.value,
    client: cleanText(ui.saleClient.value),
    product: cleanText(ui.saleProduct.value),
    category: ui.saleCategory.value,
    price: parseMoney(ui.salePrice.value),
    productionCost: parseMoney(ui.saleProductionCost.value),
    shippingCost: parseMoney(ui.saleShippingCost.value),
    otherCosts: parseMoney(ui.saleOtherCosts.value),
    paymentMethod: ui.salePaymentMethod.value,
    status: ui.saleStatus.value,
    notes: cleanText(ui.saleNotes.value)
  };

  const validationError = validateSalePayload(payload, {
    price: ui.salePrice.value,
    productionCost: ui.saleProductionCost.value,
    shippingCost: ui.saleShippingCost.value,
    otherCosts: ui.saleOtherCosts.value
  });
  if (validationError) {
    ui.saleError.textContent = validationError;
    return;
  }

  if (payload.id) {
    const index = state.sales.findIndex((item) => item.id === payload.id);
    if (index === -1) {
      ui.saleError.textContent = "No se encontró la venta para editar.";
      return;
    }
    state.sales[index] = normalizeSale(payload);
    showToast("Venta actualizada.", "success");
  } else {
    payload.id = generateId("sale");
    state.sales.push(normalizeSale(payload));
    showToast("Venta registrada.", "success");
  }

  saveData();
  resetSaleForm();
  renderAll();
}

function editSale(id) {
  const sale = state.sales.find((item) => item.id === id);
  if (!sale) {
    showToast("Venta no encontrada.", "error");
    return;
  }

  ui.saleId.value = sale.id;
  ui.saleDate.value = sale.date;
  ui.saleClient.value = sale.client;
  ui.saleProduct.value = sale.product;
  ui.saleCategory.value = sale.category;
  ui.salePrice.value = Number(sale.price).toFixed(2);
  ui.saleProductionCost.value = Number(sale.productionCost).toFixed(2);
  ui.saleShippingCost.value = Number(sale.shippingCost).toFixed(2);
  ui.saleOtherCosts.value = Number(sale.otherCosts).toFixed(2);
  ui.salePaymentMethod.value = sale.paymentMethod;
  ui.saleStatus.value = sale.status;
  ui.saleNotes.value = sale.notes;
  ui.saleSubmitBtn.textContent = "Actualizar venta";
  ui.saleError.textContent = "";
  ui.saleForm.scrollIntoView({ behavior: "smooth", block: "center" });
}

function deleteSale(id) {
  const sale = state.sales.find((item) => item.id === id);
  if (!sale) {
    showToast("Venta no encontrada.", "error");
    return;
  }
  const ok = confirm(`¿Eliminar la venta de ${sale.product} para ${sale.client}?`);
  if (!ok) {
    return;
  }
  state.sales = state.sales.filter((item) => item.id !== id);
  saveData();
  renderAll();
  showToast("Venta eliminada.", "success");
}

function addInvestment() {
  ui.investmentError.textContent = "";

  const payload = {
    id: ui.investmentId.value ? String(ui.investmentId.value) : "",
    date: ui.investmentDate.value,
    type: ui.investmentType.value,
    description: cleanText(ui.investmentDescription.value),
    amount: parseMoney(ui.investmentAmount.value),
    provider: cleanText(ui.investmentProvider.value),
    notes: cleanText(ui.investmentNotes.value)
  };

  const validationError = validateInvestmentPayload(payload, ui.investmentAmount.value);
  if (validationError) {
    ui.investmentError.textContent = validationError;
    return;
  }

  if (payload.id) {
    const index = state.investments.findIndex((item) => item.id === payload.id);
    if (index === -1) {
      ui.investmentError.textContent = "No se encontró la inversión para editar.";
      return;
    }
    state.investments[index] = normalizeInvestment(payload);
    showToast("Inversión actualizada.", "success");
  } else {
    payload.id = generateId("inv");
    state.investments.push(normalizeInvestment(payload));
    showToast("Inversión registrada.", "success");
  }

  saveData();
  resetInvestmentForm();
  renderAll();
}

function editInvestment(id) {
  const investment = state.investments.find((item) => item.id === id);
  if (!investment) {
    showToast("Inversión no encontrada.", "error");
    return;
  }
  ui.investmentId.value = investment.id;
  ui.investmentDate.value = investment.date;
  ui.investmentType.value = investment.type;
  ui.investmentDescription.value = investment.description;
  ui.investmentAmount.value = Number(investment.amount).toFixed(2);
  ui.investmentProvider.value = investment.provider;
  ui.investmentNotes.value = investment.notes;
  ui.investmentSubmitBtn.textContent = "Actualizar inversión";
  ui.investmentError.textContent = "";
  ui.investmentForm.scrollIntoView({ behavior: "smooth", block: "center" });
}

function deleteInvestment(id) {
  const item = state.investments.find((it) => it.id === id);
  if (!item) {
    showToast("Inversión no encontrada.", "error");
    return;
  }
  const ok = confirm(`¿Eliminar la inversión "${item.description}"?`);
  if (!ok) {
    return;
  }
  state.investments = state.investments.filter((it) => it.id !== id);
  saveData();
  renderAll();
  showToast("Inversión eliminada.", "success");
}

function addPersonalExpense() {
  ui.personalExpenseError.textContent = "";

  const payload = {
    id: ui.personalExpenseId.value ? String(ui.personalExpenseId.value) : "",
    date: ui.personalExpenseDate.value,
    category: ui.personalExpenseCategory.value,
    description: cleanText(ui.personalExpenseDescription.value),
    amount: parseMoney(ui.personalExpenseAmount.value),
    type: ui.personalExpenseType.value,
    status: ui.personalExpenseStatus.value,
    notes: cleanText(ui.personalExpenseNotes.value)
  };

  const validationError = validatePersonalExpensePayload(payload, ui.personalExpenseAmount.value);
  if (validationError) {
    ui.personalExpenseError.textContent = validationError;
    return;
  }

  if (payload.id) {
    const index = state.personalExpenses.findIndex((item) => item.id === payload.id);
    if (index === -1) {
      ui.personalExpenseError.textContent = "No se encontró el gasto para editar.";
      return;
    }
    const previous = state.personalExpenses[index];
    const updated = normalizePersonalExpense({
      ...payload,
      systemFixed: previous.systemFixed,
      fixedKey: previous.fixedKey
    });
    state.personalExpenses[index] = updated;
    showToast("Gasto personal actualizado.", "success");
  } else {
    payload.id = generateId("pe");
    state.personalExpenses.push(normalizePersonalExpense(payload));
    showToast("Gasto personal registrado.", "success");
  }

  saveData();
  resetPersonalExpenseForm();
  renderAll();
}

function editPersonalExpense(id) {
  const expense = state.personalExpenses.find((item) => item.id === id);
  if (!expense) {
    showToast("Gasto no encontrado.", "error");
    return;
  }
  ui.personalExpenseId.value = expense.id;
  ui.personalExpenseDate.value = expense.date;
  ui.personalExpenseCategory.value = expense.category;
  ui.personalExpenseDescription.value = expense.description;
  ui.personalExpenseAmount.value = Number(expense.amount).toFixed(2);
  ui.personalExpenseType.value = expense.type;
  ui.personalExpenseStatus.value = expense.status;
  ui.personalExpenseNotes.value = expense.notes;
  ui.personalExpenseSubmitBtn.textContent = "Actualizar gasto";
  ui.personalExpenseError.textContent = "";
  ui.personalExpenseForm.scrollIntoView({ behavior: "smooth", block: "center" });
}

function deletePersonalExpense(id) {
  const expense = state.personalExpenses.find((item) => item.id === id);
  if (!expense) {
    showToast("Gasto no encontrado.", "error");
    return;
  }
  const ok = confirm(`¿Eliminar el gasto "${expense.description}" por ${formatMoney(expense.amount)}?`);
  if (!ok) {
    return;
  }
  state.personalExpenses = state.personalExpenses.filter((item) => item.id !== id);
  saveData();
  renderAll();
  showToast("Gasto eliminado.", "success");
}

function markPersonalExpensePaid(id) {
  const expense = state.personalExpenses.find((item) => item.id === id);
  if (!expense) {
    showToast("Gasto no encontrado.", "error");
    return;
  }
  expense.status = "pagado";
  saveData();
  renderAll();
  showToast("Gasto marcado como pagado.", "success");
}

function exportData() {
  try {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      state
    };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `blackcat_finanzas_${state.settings.currentMonth}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    showToast("Datos exportados en JSON.", "success");
  } catch (error) {
    showToast("No se pudieron exportar los datos.", "error");
  }
}

function importData(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || "{}"));
      const importedState = parsed.state ? parsed.state : parsed;
      if (!importedState || typeof importedState !== "object") {
        throw new Error("Formato inválido");
      }

      const importedSettings = importedState.settings && typeof importedState.settings === "object" ? importedState.settings : {};
      state.settings.currentMonth = isValidMonth(importedSettings.currentMonth)
        ? importedSettings.currentMonth
        : getCurrentMonth();
      state.settings.salesGoal = Math.max(0, parseMoney(importedSettings.salesGoal));
      state.settings.profitGoal = Math.max(0, parseMoney(importedSettings.profitGoal));
      state.settings.personalBudget = Math.max(0, parseMoney(importedSettings.personalBudget));
      state.settings.fixedSeeded = Boolean(importedSettings.fixedSeeded);
      state.sales = Array.isArray(importedState.sales) ? importedState.sales.map(normalizeSale).filter(Boolean) : [];
      state.investments = Array.isArray(importedState.investments)
        ? importedState.investments.map(normalizeInvestment).filter(Boolean)
        : [];
      state.personalExpenses = Array.isArray(importedState.personalExpenses)
        ? importedState.personalExpenses.map(normalizePersonalExpense).filter(Boolean)
        : [];

      saveData();
      setupDefaultFilters();
      renderAll();
      showToast("Datos importados correctamente.", "success");
    } catch (error) {
      showToast("No se pudo importar el JSON. Revisa el archivo.", "error");
    } finally {
      ui.importFileInput.value = "";
    }
  };

  reader.onerror = () => {
    showToast("Error al leer el archivo JSON.", "error");
    ui.importFileInput.value = "";
  };
  reader.readAsText(file);
}

function loadSampleData() {
  const month = state.settings.currentMonth || getCurrentMonth();
  state.settings.salesGoal = 300;
  state.settings.profitGoal = 120;
  state.settings.personalBudget = 355;
  state.sales = [
    {
      id: generateId("sale"),
      date: `${month}-02`,
      client: "María López",
      product: "Camisa básica",
      category: "camisa",
      price: 16.99,
      productionCost: 8.5,
      shippingCost: 1.5,
      otherCosts: 0.99,
      paymentMethod: "transferencia",
      status: "pagado",
      notes: ""
    },
    {
      id: generateId("sale"),
      date: `${month}-03`,
      client: "Carlos Ruiz",
      product: "Camisa oversize",
      category: "camisa",
      price: 19.99,
      productionCost: 10.75,
      shippingCost: 1.25,
      otherCosts: 0.5,
      paymentMethod: "efectivo",
      status: "entregado",
      notes: ""
    },
    {
      id: generateId("sale"),
      date: `${month}-04`,
      client: "Ana Mejía",
      product: "Hoodie",
      category: "hoodie",
      price: 34.0,
      productionCost: 21.5,
      shippingCost: 2.5,
      otherCosts: 1.0,
      paymentMethod: "transferencia",
      status: "pagado",
      notes: ""
    },
    {
      id: generateId("sale"),
      date: `${month}-05`,
      client: "Fernando Cruz",
      product: "Termo",
      category: "termo",
      price: 12.5,
      productionCost: 6.25,
      shippingCost: 1.0,
      otherCosts: 0.75,
      paymentMethod: "otro",
      status: "pendiente",
      notes: ""
    },
    {
      id: generateId("sale"),
      date: `${month}-06`,
      client: "Lucía Ramos",
      product: "Combo BlackCat",
      category: "combo",
      price: 28.99,
      productionCost: 16.99,
      shippingCost: 1.75,
      otherCosts: 0.99,
      paymentMethod: "transferencia",
      status: "entregado",
      notes: ""
    },
    {
      id: generateId("sale"),
      date: `${month}-07`,
      client: "Diego Palma",
      product: "Combo Premium",
      category: "combo",
      price: 35.99,
      productionCost: 19.99,
      shippingCost: 2.25,
      otherCosts: 1.25,
      paymentMethod: "efectivo",
      status: "pagado",
      notes: ""
    }
  ].map(normalizeSale);

  state.investments = [
    {
      id: generateId("inv"),
      date: `${month}-02`,
      type: "publicidad",
      description: "Publicidad redes",
      amount: 5.0,
      provider: "Meta Ads",
      notes: ""
    },
    {
      id: generateId("inv"),
      date: `${month}-03`,
      type: "empaque",
      description: "Empaque personalizado",
      amount: 3.75,
      provider: "PackStore",
      notes: ""
    }
  ].map(normalizeInvestment);

  state.personalExpenses = [];
  seedDefaultFixedExpenses(month);
  state.personalExpenses.push(
    normalizePersonalExpense({
      id: generateId("pe"),
      date: `${month}-08`,
      category: "comida",
      description: "Supermercado",
      amount: 45.5,
      type: "variable",
      status: "pagado",
      notes: ""
    })
  );
  state.settings.fixedSeeded = true;
  saveData();
  renderAll();
  showToast("Datos de ejemplo cargados.", "success");
}

function resetAllData() {
  const confirmOne = confirm("¿Seguro que quieres borrar todos los datos?");
  if (!confirmOne) {
    return;
  }
  const confirmTwo = confirm("Esta acción no se puede deshacer. ¿Confirmas borrar TODO?");
  if (!confirmTwo) {
    return;
  }
  localStorage.removeItem(STORAGE_KEY);
  state.settings.currentMonth = getCurrentMonth();
  state.settings.salesGoal = 0;
  state.settings.profitGoal = 0;
  state.settings.personalBudget = 0;
  state.settings.fixedSeeded = false;
  state.sales = [];
  state.investments = [];
  state.personalExpenses = [];
  seedDefaultFixedExpenses(state.settings.currentMonth);
  state.settings.fixedSeeded = true;
  saveData();
  setupDefaultFilters();
  resetSaleForm();
  resetInvestmentForm();
  resetPersonalExpenseForm();
  renderAll();
  showToast("Todos los datos fueron eliminados.", "success");
}

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  ui.toastContainer.appendChild(toast);
  window.setTimeout(() => {
    if (toast.parentElement) {
      toast.parentElement.removeChild(toast);
    }
  }, 3200);
}

function validateSalePayload(payload, rawMoney) {
  if (!isValidDate(payload.date)) {
    return "La fecha de la venta no es válida.";
  }
  if (!payload.client) {
    return "El cliente es obligatorio.";
  }
  if (!payload.product) {
    return "El producto es obligatorio.";
  }
  if (!VALID_SALE_CATEGORIES.includes(payload.category)) {
    return "La categoría de venta no es válida.";
  }
  if (!VALID_PAYMENT_METHODS.includes(payload.paymentMethod)) {
    return "El método de pago no es válido.";
  }
  if (!VALID_SALE_STATUSES.includes(payload.status)) {
    return "El estado de la venta no es válido.";
  }
  if (!isMoneyInputValid(rawMoney.price) || payload.price < 0) {
    return "El precio de venta debe ser válido y mayor o igual a 0.";
  }
  if (!isMoneyInputValid(rawMoney.productionCost) || payload.productionCost < 0) {
    return "El costo de producción debe ser válido y mayor o igual a 0.";
  }
  if (!isMoneyInputValid(rawMoney.shippingCost) || payload.shippingCost < 0) {
    return "El costo de envío debe ser válido y mayor o igual a 0.";
  }
  if (!isMoneyInputValid(rawMoney.otherCosts) || payload.otherCosts < 0) {
    return "Otros costos debe ser válido y mayor o igual a 0.";
  }
  return "";
}

function validateInvestmentPayload(payload, amountRaw) {
  if (!isValidDate(payload.date)) {
    return "La fecha de inversión no es válida.";
  }
  if (!VALID_INVESTMENT_TYPES.includes(payload.type)) {
    return "El tipo de inversión no es válido.";
  }
  if (!payload.description) {
    return "La descripción es obligatoria.";
  }
  if (!payload.provider) {
    return "El proveedor es obligatorio.";
  }
  if (!isMoneyInputValid(amountRaw) || payload.amount < 0) {
    return "El monto de inversión debe ser válido y mayor o igual a 0.";
  }
  return "";
}

function validatePersonalExpensePayload(payload, amountRaw) {
  if (!isValidDate(payload.date)) {
    return "La fecha del gasto no es válida.";
  }
  if (!VALID_EXPENSE_CATEGORIES.includes(payload.category)) {
    return "La categoría del gasto personal no es válida.";
  }
  if (!payload.description) {
    return "La descripción del gasto es obligatoria.";
  }
  if (!VALID_EXPENSE_TYPES.includes(payload.type)) {
    return "El tipo de gasto no es válido.";
  }
  if (!VALID_EXPENSE_STATUSES.includes(payload.status)) {
    return "El estado del gasto no es válido.";
  }
  if (!isMoneyInputValid(amountRaw) || payload.amount < 0) {
    return "El monto del gasto debe ser válido y mayor o igual a 0.";
  }
  return "";
}

function resetSaleForm() {
  ui.saleForm.reset();
  ui.saleId.value = "";
  ui.saleSubmitBtn.textContent = "Guardar venta";
  ui.saleError.textContent = "";
  ui.saleDate.value = `${state.settings.currentMonth}-01`;
}

function resetInvestmentForm() {
  ui.investmentForm.reset();
  ui.investmentId.value = "";
  ui.investmentSubmitBtn.textContent = "Guardar inversión";
  ui.investmentError.textContent = "";
  ui.investmentDate.value = `${state.settings.currentMonth}-01`;
}

function resetPersonalExpenseForm() {
  ui.personalExpenseForm.reset();
  ui.personalExpenseId.value = "";
  ui.personalExpenseSubmitBtn.textContent = "Guardar gasto";
  ui.personalExpenseError.textContent = "";
  ui.personalExpenseDate.value = `${state.settings.currentMonth}-01`;
}

function calculateSaleCosts(sale) {
  return Number(sale.productionCost || 0) + Number(sale.shippingCost || 0) + Number(sale.otherCosts || 0);
}

function calculateSaleProfit(sale) {
  return Number(sale.price || 0) - calculateSaleCosts(sale);
}

function cleanText(text) {
  if (text === null || text === undefined) {
    return "";
  }
  return String(text).trim();
}

function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00`);
  if (!Number.isFinite(date.getTime())) {
    return false;
  }
  return date.toISOString().slice(0, 10) === value;
}

function isValidMonth(value) {
  return typeof value === "string" && /^\d{4}-\d{2}$/.test(value);
}

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function getMonthFromDate(date) {
  if (!isValidDate(date)) {
    return "";
  }
  return date.slice(0, 7);
}

function isMoneyInputValid(rawValue) {
  if (rawValue === null || rawValue === undefined) {
    return false;
  }
  const text = String(rawValue).trim();
  if (text.length === 0) {
    return false;
  }
  if (!/[0-9]/.test(text)) {
    return false;
  }
  const parsed = parseMoney(text);
  return Number.isFinite(parsed) && parsed >= 0;
}

function clampPercentage(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return 0;
  }
  return Math.max(0, Math.min(number, 100));
}

function safePercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return "0.00";
  }
  return number.toFixed(2);
}

function escapeHTML(value) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getMaxKey(obj) {
  const entries = Object.entries(obj);
  if (entries.length === 0) {
    return "";
  }
  entries.sort((a, b) => Number(b[1]) - Number(a[1]));
  return entries[0][0];
}

function generateId(prefix) {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${random}`;
}

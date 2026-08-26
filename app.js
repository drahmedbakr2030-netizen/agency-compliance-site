const STORAGE_KEY = "agency-compliance-dashboard-v1";

const categories = ["الكل", "موظف", "ترخيص", "عقد", "سلامة", "صيانة", "اشتراك"];
const statusOptions = ["الكل", "منتهي", "عاجل", "يحتاج إجراء", "قريب الانتهاء", "ساري"];

const seedRecords = [
  {
    id: crypto.randomUUID(),
    title: "إقامة",
    category: "موظف",
    subject: "محمد أحمد",
    owner: "الموارد البشرية",
    docNumber: "IQ-2041",
    issueDate: "2025-09-20",
    expiryDate: "2026-09-02",
    attachment: "iqama-mohamed-2026.pdf",
    notes: "تجهيز طلب التجديد قبل الانتهاء بأسبوعين.",
    history: []
  },
  {
    id: crypto.randomUUID(),
    title: "عقد عمل",
    category: "موظف",
    subject: "سارة خالد",
    owner: "الإدارة",
    docNumber: "EMP-108",
    issueDate: "2025-10-15",
    expiryDate: "2026-10-15",
    attachment: "contract-sara.pdf",
    notes: "",
    history: []
  },
  {
    id: crypto.randomUUID(),
    title: "التأمين الطبي",
    category: "موظف",
    subject: "محمد أحمد",
    owner: "الموارد البشرية",
    docNumber: "MED-551",
    issueDate: "2025-12-20",
    expiryDate: "2026-12-20",
    attachment: "medical-mohamed.pdf",
    notes: "",
    history: []
  },
  {
    id: crypto.randomUUID(),
    title: "رخصة البلدية",
    category: "ترخيص",
    subject: "الوكالة",
    owner: "الإدارة",
    docNumber: "MUN-7432",
    issueDate: "2025-09-05",
    expiryDate: "2026-09-05",
    attachment: "municipality-license.pdf",
    notes: "مطلوب مراجعة الرسوم قبل التجديد.",
    history: []
  },
  {
    id: crypto.randomUUID(),
    title: "طفاية حريق",
    category: "سلامة",
    subject: "مدخل المكتب",
    owner: "مسؤول الإدارة",
    docNumber: "FE-01",
    issueDate: "2026-02-01",
    expiryDate: "2026-08-29",
    attachment: "fire-extinguisher-01.jpg",
    notes: "الفحص القادم قريب.",
    history: []
  },
  {
    id: crypto.randomUUID(),
    title: "عقد الإيجار",
    category: "عقد",
    subject: "مقر الوكالة",
    owner: "المدير العام",
    docNumber: "RENT-2026",
    issueDate: "2026-01-01",
    expiryDate: "2026-12-31",
    attachment: "office-rent.pdf",
    notes: "",
    history: []
  },
  {
    id: crypto.randomUUID(),
    title: "اشتراك برنامج التصميم",
    category: "اشتراك",
    subject: "فريق التصميم",
    owner: "مدير التصميم",
    docNumber: "SUB-90",
    issueDate: "2026-01-12",
    expiryDate: "2026-09-15",
    attachment: "",
    notes: "مراجعة عدد المستخدمين قبل التجديد.",
    history: []
  }
];

const state = {
  records: loadRecords(),
  activeRange: "all",
  filters: {
    search: "",
    category: "الكل",
    status: "الكل",
    owner: "الكل"
  }
};

const els = {
  navItems: document.querySelectorAll(".nav-item"),
  views: {
    dashboard: document.getElementById("dashboardView"),
    records: document.getElementById("recordsView"),
    employees: document.getElementById("employeesView"),
    history: document.getElementById("historyView")
  },
  metricGrid: document.getElementById("metricGrid"),
  urgentTable: document.getElementById("urgentTable"),
  urgentCount: document.getElementById("urgentCount"),
  timelineList: document.getElementById("timelineList"),
  recordsTable: document.getElementById("recordsTable"),
  employeeGrid: document.getElementById("employeeGrid"),
  historyList: document.getElementById("historyList"),
  lastUpdated: document.getElementById("lastUpdated"),
  recordDialog: document.getElementById("recordDialog"),
  recordForm: document.getElementById("recordForm"),
  renewDialog: document.getElementById("renewDialog"),
  renewForm: document.getElementById("renewForm"),
  searchInput: document.getElementById("searchInput"),
  categoryFilter: document.getElementById("categoryFilter"),
  statusFilter: document.getElementById("statusFilter"),
  ownerFilter: document.getElementById("ownerFilter"),
  exportBtn: document.getElementById("exportBtn"),
  resetDemoBtn: document.getElementById("resetDemoBtn")
};

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  populateFilters();
  render();
});

function loadRecords() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return getSeedRecords();

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : getSeedRecords();
  } catch {
    return getSeedRecords();
  }
}

function getSeedRecords() {
  return seedRecords.map((record) => ({
    ...record,
    id: crypto.randomUUID(),
    history: []
  }));
}

function saveRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.records));
  els.lastUpdated.textContent = new Intl.DateTimeFormat("ar-SA", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date());
}

function bindEvents() {
  els.navItems.forEach((item) => {
    item.addEventListener("click", () => switchView(item.dataset.view));
  });

  document.querySelectorAll("[data-open-panel]").forEach((button) => {
    button.addEventListener("click", () => {
      els.recordForm.reset();
      els.recordDialog.showModal();
    });
  });

  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => els.recordDialog.close());
  });

  document.querySelectorAll("[data-close-renew]").forEach((button) => {
    button.addEventListener("click", () => els.renewDialog.close());
  });

  document.querySelectorAll("[data-range]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-range]").forEach((segment) => segment.classList.remove("active"));
      button.classList.add("active");
      state.activeRange = button.dataset.range;
      renderDashboard();
    });
  });

  els.recordForm.addEventListener("submit", handleAddRecord);
  els.renewForm.addEventListener("submit", handleRenewRecord);
  els.searchInput.addEventListener("input", (event) => {
    state.filters.search = event.target.value.trim();
    renderRecords();
  });
  els.categoryFilter.addEventListener("change", (event) => {
    state.filters.category = event.target.value;
    renderRecords();
  });
  els.statusFilter.addEventListener("change", (event) => {
    state.filters.status = event.target.value;
    renderRecords();
  });
  els.ownerFilter.addEventListener("change", (event) => {
    state.filters.owner = event.target.value;
    renderRecords();
  });

  els.exportBtn.addEventListener("click", exportData);
  els.resetDemoBtn.addEventListener("click", () => {
    if (!confirm("استرجاع البيانات التجريبية سيستبدل السجلات الحالية. هل تريد المتابعة؟")) return;
    state.records = getSeedRecords();
    saveRecords();
    populateFilters();
    render();
  });

  document.addEventListener("click", (event) => {
    const action = event.target.closest("[data-action]");
    if (!action) return;
    const id = action.dataset.id;

    if (action.dataset.action === "renew") openRenewDialog(id);
    if (action.dataset.action === "delete") deleteRecord(id);
  });
}

function switchView(viewName) {
  els.navItems.forEach((item) => item.classList.toggle("active", item.dataset.view === viewName));
  Object.entries(els.views).forEach(([name, view]) => view.classList.toggle("active", name === viewName));
}

function populateFilters() {
  setOptions(els.categoryFilter, categories);
  setOptions(els.statusFilter, statusOptions);
  const owners = ["الكل", ...new Set(state.records.map((record) => record.owner).filter(Boolean))];
  setOptions(els.ownerFilter, owners);
}

function setOptions(select, values) {
  select.innerHTML = values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("");
}

function handleAddRecord(event) {
  event.preventDefault();
  const form = new FormData(els.recordForm);
  const record = Object.fromEntries(form.entries());
  state.records.unshift({
    id: crypto.randomUUID(),
    title: record.title.trim(),
    category: record.category,
    subject: record.subject.trim(),
    owner: record.owner.trim(),
    docNumber: record.docNumber.trim(),
    issueDate: record.issueDate,
    expiryDate: record.expiryDate,
    attachment: record.attachment.trim(),
    notes: record.notes.trim(),
    history: []
  });

  els.recordDialog.close();
  saveRecords();
  populateFilters();
  render();
}

function openRenewDialog(id) {
  const record = state.records.find((item) => item.id === id);
  if (!record) return;

  els.renewForm.reset();
  els.renewForm.elements.recordId.value = record.id;
  els.renewForm.elements.issueDate.value = new Date().toISOString().slice(0, 10);
  els.renewDialog.showModal();
}

function handleRenewRecord(event) {
  event.preventDefault();
  const form = new FormData(els.renewForm);
  const id = form.get("recordId");
  const record = state.records.find((item) => item.id === id);
  if (!record) return;

  record.history.unshift({
    previousIssueDate: record.issueDate,
    previousExpiryDate: record.expiryDate,
    previousAttachment: record.attachment,
    renewedAt: new Date().toISOString(),
    note: form.get("note").trim()
  });
  record.issueDate = form.get("issueDate");
  record.expiryDate = form.get("expiryDate");
  record.attachment = form.get("attachment").trim() || record.attachment;

  els.renewDialog.close();
  saveRecords();
  render();
}

function deleteRecord(id) {
  const record = state.records.find((item) => item.id === id);
  if (!record || !confirm(`حذف "${record.title}" من السجلات؟`)) return;

  state.records = state.records.filter((item) => item.id !== id);
  saveRecords();
  populateFilters();
  render();
}

function render() {
  renderDashboard();
  renderRecords();
  renderEmployees();
  renderHistory();
  saveRecords();
}

function renderDashboard() {
  const enriched = getEnrichedRecords();
  const metrics = [
    { key: "expired", label: "منتهية", hint: "تحتاج تدخل", className: "expired", count: enriched.filter((item) => item.statusKey === "expired").length },
    { key: "critical", label: "خلال 7 أيام", hint: "عاجلة", className: "critical", count: enriched.filter((item) => item.daysLeft >= 0 && item.daysLeft <= 7).length },
    { key: "warning", label: "خلال 15 يوم", hint: "تجهيز الإجراء", className: "warning", count: enriched.filter((item) => item.daysLeft > 7 && item.daysLeft <= 15).length },
    { key: "soon", label: "خلال 30 يوم", hint: "قريبة", className: "soon", count: enriched.filter((item) => item.daysLeft > 15 && item.daysLeft <= 30).length },
    { key: "valid", label: "سارية", hint: "أكثر من 30 يوم", className: "valid", count: enriched.filter((item) => item.daysLeft > 30).length }
  ];

  els.metricGrid.innerHTML = metrics.map((metric) => `
    <article class="metric-card ${metric.className}">
      <span>${metric.label}</span>
      <strong>${metric.count}</strong>
      <small>${metric.hint}</small>
    </article>
  `).join("");

  const urgent = enriched
    .filter((item) => isInsideRange(item, state.activeRange))
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 8);

  els.urgentCount.textContent = `${urgent.length} سجل`;
  els.urgentTable.innerHTML = urgent.length ? urgent.map(renderRecordRow).join("") : emptyRow(7);

  const timeline = enriched
    .filter((item) => item.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 8);

  els.timelineList.innerHTML = timeline.length ? timeline.map((record) => `
    <article class="timeline-item">
      <strong>${escapeHtml(record.title)} - ${escapeHtml(record.subject)}</strong>
      <span>${formatDate(record.expiryDate)} · ${record.remainingText} · ${escapeHtml(record.owner)}</span>
    </article>
  `).join("") : `<div class="empty-state">لا توجد استحقاقات قريبة</div>`;
}

function renderRecords() {
  const filtered = getFilteredRecords();
  els.recordsTable.innerHTML = filtered.length ? filtered.map(renderRecordRow).join("") : emptyRow(7);
}

function renderEmployees() {
  const employeeRecords = getEnrichedRecords().filter((record) => record.category === "موظف");
  const employeeNames = [...new Set(employeeRecords.map((record) => record.subject))];

  els.employeeGrid.innerHTML = employeeNames.length ? employeeNames.map((name) => {
    const docs = employeeRecords
      .filter((record) => record.subject === name)
      .sort((a, b) => a.daysLeft - b.daysLeft);
    const initials = name.split(" ").map((part) => part[0]).join("").slice(0, 2);
    return `
      <article class="employee-card">
        <header>
          <span class="avatar">${escapeHtml(initials)}</span>
          <div class="cell-title">
            <strong>${escapeHtml(name)}</strong>
            <span>${docs.length} مستند</span>
          </div>
        </header>
        <div class="doc-list">
          ${docs.map((doc) => `
            <div class="doc-line">
              <span>${escapeHtml(doc.title)}</span>
              ${renderStatus(doc)}
            </div>
          `).join("")}
        </div>
      </article>
    `;
  }).join("") : `<div class="empty-state">لا توجد ملفات موظفين</div>`;
}

function renderHistory() {
  const historyItems = state.records.flatMap((record) =>
    (record.history || []).map((item) => ({
      ...item,
      title: record.title,
      subject: record.subject,
      owner: record.owner
    }))
  ).sort((a, b) => new Date(b.renewedAt) - new Date(a.renewedAt));

  els.historyList.innerHTML = historyItems.length ? historyItems.map((item) => `
    <article class="history-item">
      <strong>${escapeHtml(item.title)} - ${escapeHtml(item.subject)}</strong>
      <span>انتهاء سابق: ${formatDate(item.previousExpiryDate)} · تم التجديد: ${formatDate(item.renewedAt)} · المسؤول: ${escapeHtml(item.owner)}</span>
      ${item.note ? `<span>${escapeHtml(item.note)}</span>` : ""}
    </article>
  `).join("") : `<div class="empty-state">لم يتم تسجيل تجديدات بعد</div>`;
}

function renderRecordRow(record) {
  return `
    <tr>
      <td>
        <div class="cell-title">
          <strong>${escapeHtml(record.title)}</strong>
          <span>${escapeHtml(record.docNumber || "بدون رقم")}</span>
        </div>
      </td>
      <td>${escapeHtml(record.subject)}</td>
      <td>${escapeHtml(record.category)}</td>
      <td>${formatDate(record.expiryDate)}</td>
      <td>${renderStatus(record)}</td>
      <td>${escapeHtml(record.owner)}</td>
      <td>
        <div class="row-actions">
          <button class="mini-button" data-action="renew" data-id="${record.id}" type="button">تجديد</button>
          <button class="mini-button danger" data-action="delete" data-id="${record.id}" type="button">حذف</button>
        </div>
      </td>
    </tr>
  `;
}

function getFilteredRecords() {
  return getEnrichedRecords()
    .filter((record) => {
      const searchText = `${record.title} ${record.subject} ${record.owner} ${record.docNumber} ${record.notes}`.toLowerCase();
      const matchesSearch = !state.filters.search || searchText.includes(state.filters.search.toLowerCase());
      const matchesCategory = state.filters.category === "الكل" || record.category === state.filters.category;
      const matchesStatus = state.filters.status === "الكل" || record.statusLabel === state.filters.status;
      const matchesOwner = state.filters.owner === "الكل" || record.owner === state.filters.owner;
      return matchesSearch && matchesCategory && matchesStatus && matchesOwner;
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

function getEnrichedRecords() {
  return state.records.map((record) => {
    const daysLeft = getDaysLeft(record.expiryDate);
    const status = getStatus(daysLeft);
    return {
      ...record,
      daysLeft,
      remainingText: getRemainingText(daysLeft),
      statusKey: status.key,
      statusLabel: status.label,
      statusClass: status.className
    };
  });
}

function getDaysLeft(dateValue) {
  const today = new Date();
  const target = new Date(dateValue);
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / 86400000);
}

function getStatus(daysLeft) {
  if (daysLeft < 0) return { key: "expired", label: "منتهي", className: "status-expired" };
  if (daysLeft <= 7) return { key: "critical", label: "عاجل", className: "status-critical" };
  if (daysLeft <= 15) return { key: "warning", label: "يحتاج إجراء", className: "status-warning" };
  if (daysLeft <= 30) return { key: "soon", label: "قريب الانتهاء", className: "status-soon" };
  return { key: "valid", label: "ساري", className: "status-valid" };
}

function getRemainingText(daysLeft) {
  if (daysLeft < 0) return `منتهي منذ ${Math.abs(daysLeft)} يوم`;
  if (daysLeft === 0) return "ينتهي اليوم";
  if (daysLeft === 1) return "متبقي يوم";
  if (daysLeft === 2) return "متبقي يومان";
  return `متبقي ${daysLeft} يوم`;
}

function isInsideRange(record, range) {
  if (range === "all") return record.daysLeft <= 30;
  const max = Number(range);
  return record.daysLeft <= max;
}

function renderStatus(record) {
  return `<span class="status-badge ${record.statusClass}">${record.statusLabel}</span>`;
}

function formatDate(dateValue) {
  if (!dateValue) return "--";
  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(dateValue));
}

function emptyRow(cols) {
  return `<tr><td colspan="${cols}"><div class="empty-state">لا توجد سجلات مطابقة</div></td></tr>`;
}

function exportData() {
  const blob = new Blob([JSON.stringify(state.records, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `agency-compliance-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

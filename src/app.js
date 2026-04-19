const AUTH_USER = {
  email: "tucorreo@farmacia.com",
  password: "TuClave123"
};

const STORAGE_KEY = "suggestness_medicines";
const SALES_STORAGE_KEY = "suggestness_sales";

let editId = null;

const defaultMedicines = [
  {
    id: 1,
    name: "Paracetamol 500mg",
    laboratory: "Laboratorios Beta",
    serial: "MED-2026-001-4782",
    category: "Analgésicos",
    quantity: 450,
    minStock: 200,
    price: 5500,
    expiry: "2027-08-14",
    location: "Estante A-01"
  },
  {
    id: 2,
    name: "Amoxicilina 500mg",
    laboratory: "FarmaPlus",
    serial: "MED-2026-002-3891",
    category: "Antibióticos",
    quantity: 80,
    minStock: 150,
    price: 12750,
    expiry: "2027-12-19",
    location: "Estante B-05"
  },
  {
    id: 3,
    name: "Ibuprofeno 400mg",
    laboratory: "Medicorp",
    serial: "MED-2026-003-1122",
    category: "Antiinflamatorios",
    quantity: 160,
    minStock: 100,
    price: 8300,
    expiry: "2027-10-10",
    location: "Estante A-04"
  }
];

let medicines = loadMedicines();

document.addEventListener("DOMContentLoaded", () => {
  initLoginPage();
  initForgotPage();
  initDashboardPage();
  initPurchasePage();
  initHistoryPage();
});

function loadMedicines() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [...defaultMedicines];
}

function saveMedicines() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(medicines));
}

function loadSales() {
  const saved = localStorage.getItem(SALES_STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
}

function saveSales(sales) {
  localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(sales));
}

function initLoginPage() {
  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  const loginMessage = document.getElementById("loginMessage");

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (email === AUTH_USER.email && password === AUTH_USER.password) {
      window.location.href = "./dashboard.html";
      return;
    }

    loginMessage.textContent = "Correo o contraseña incorrectos.";
    loginMessage.classList.remove("hidden");
  });
}

function initForgotPage() {
  const forgotForm = document.getElementById("forgotForm");
  if (!forgotForm) return;

  const forgotMessage = document.getElementById("forgotMessage");

  forgotForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const recoveryEmail = document.getElementById("recoveryEmail").value.trim();

    if (recoveryEmail === AUTH_USER.email) {
      forgotMessage.textContent = "Correo válido. En una versión real, aquí se enviaría el enlace de recuperación.";
      forgotMessage.classList.remove("hidden");
      forgotMessage.classList.remove("error");
      forgotMessage.classList.add("success");
    } else {
      forgotMessage.textContent = "Ese correo no coincide con el usuario configurado.";
      forgotMessage.classList.remove("hidden");
      forgotMessage.classList.remove("success");
      forgotMessage.classList.add("error");
    }
  });
}

function initDashboardPage() {
  const medicineForm = document.getElementById("medicineForm");
  const searchInput = document.getElementById("searchInput");
  const clearFormBtn = document.getElementById("clearFormBtn");

  if (!medicineForm) return;

  medicines = loadMedicines();

  clearFormBtn.addEventListener("click", resetForm);
  searchInput.addEventListener("input", renderTable);

  medicineForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const med = {
      id: editId ?? Date.now(),
      name: document.getElementById("medicineName").value.trim(),
      laboratory: document.getElementById("laboratory").value.trim(),
      serial: document.getElementById("serial").value.trim(),
      category: document.getElementById("category").value,
      quantity: Number(document.getElementById("quantity").value),
      minStock: Number(document.getElementById("minStock").value),
      price: Number(document.getElementById("price").value),
      expiry: document.getElementById("expiry").value,
      location: document.getElementById("location").value.trim()
    };

    if (!med.name || !med.laboratory || !med.serial || !med.category || !med.expiry || !med.location) {
      return;
    }

    if (editId) {
      medicines = medicines.map(item => item.id === editId ? med : item);
    } else {
      medicines.unshift(med);
    }

    saveMedicines();
    resetForm();
    renderTable();
  });

  renderTable();
}

function initPurchasePage() {
  const purchaseForm = document.getElementById("purchaseForm");
  if (!purchaseForm) return;

  medicines = loadMedicines();

  const purchaseMedicine = document.getElementById("purchaseMedicine");
  const purchaseQuantity = document.getElementById("purchaseQuantity");
  const purchaseSummary = document.getElementById("purchaseSummary");
  const clearPurchaseBtn = document.getElementById("clearPurchaseBtn");
  const invoiceModal = document.getElementById("invoiceModal");
  const invoiceMessage = document.getElementById("invoiceMessage");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const requiresPrescription = document.getElementById("requiresPrescription");
  const prescriptionWrapper = document.getElementById("prescriptionWrapper");
  const prescriptionFile = document.getElementById("prescriptionFile");
  const finalPurchaseTotal = document.getElementById("finalPurchaseTotal");

  fillMedicineOptions();
  updatePurchaseSummary();

  purchaseMedicine.addEventListener("change", updatePurchaseSummary);
  purchaseQuantity.addEventListener("input", updatePurchaseSummary);

  requiresPrescription.addEventListener("change", () => {
    prescriptionWrapper.classList.toggle("hidden", !requiresPrescription.checked);
    if (!requiresPrescription.checked) {
      prescriptionFile.value = "";
    }
  });

  clearPurchaseBtn.addEventListener("click", () => {
    purchaseForm.reset();
    prescriptionWrapper.classList.add("hidden");
    finalPurchaseTotal.textContent = formatCurrency(0);
    updatePurchaseSummary();
  });

  closeModalBtn.addEventListener("click", () => {
    invoiceModal.classList.add("hidden");
  });

  purchaseForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const customerEmail = document.getElementById("customerEmail").value.trim();
    const invoiceName = document.getElementById("invoiceName").value.trim();
    const invoiceDocument = document.getElementById("invoiceDocument").value.trim();
    const invoiceNotes = document.getElementById("invoiceNotes").value.trim();
    const medicineId = Number(purchaseMedicine.value);
    const quantity = Number(purchaseQuantity.value);
    const selectedMedicine = medicines.find(med => med.id === medicineId);

    if (!customerEmail || !invoiceName || !invoiceDocument || !selectedMedicine || quantity <= 0) {
      purchaseSummary.textContent = "Completa todos los datos obligatorios de la compra.";
      return;
    }

    if (requiresPrescription.checked && prescriptionFile.files.length === 0) {
      purchaseSummary.textContent = "Debes adjuntar la fórmula médica para continuar.";
      return;
    }

    if (quantity > selectedMedicine.quantity) {
      purchaseSummary.textContent = "La cantidad solicitada supera el stock disponible.";
      return;
    }

    medicines = medicines.map(med =>
      med.id === medicineId
        ? { ...med, quantity: med.quantity - quantity }
        : med
    );

    saveMedicines();

    const total = quantity * selectedMedicine.price;
    const sales = loadSales();

    sales.unshift({
      id: Date.now(),
      date: new Date().toISOString(),
      customerEmail,
      customerName: invoiceName,
      document: invoiceDocument,
      medicineId: selectedMedicine.id,
      medicineName: selectedMedicine.name,
      quantity,
      unitPrice: selectedMedicine.price,
      total,
      notes: invoiceNotes
    });

    saveSales(sales);

    const formulaText = requiresPrescription.checked
      ? ` Fórmula médica adjunta: ${prescriptionFile.files[0].name}.`
      : " No requiere fórmula médica.";

    invoiceMessage.textContent =
      `La factura fue emitida correctamente para ${invoiceName}, enviada a ${customerEmail}. ` +
      `Medicamento: ${selectedMedicine.name}. Cantidad: ${quantity}. Total: ${formatCurrency(total)}.` +
      formulaText +
      (invoiceNotes ? ` Nota: ${invoiceNotes}.` : "");

    invoiceModal.classList.remove("hidden");

    purchaseForm.reset();
    prescriptionWrapper.classList.add("hidden");
    fillMedicineOptions();
    finalPurchaseTotal.textContent = formatCurrency(0);
    updatePurchaseSummary();
  });

  function fillMedicineOptions() {
    purchaseMedicine.innerHTML = `<option value="">Selecciona un medicamento</option>`;

    medicines
      .filter(med => med.quantity > 0)
      .forEach(med => {
        const option = document.createElement("option");
        option.value = med.id;
        option.textContent = `${med.name} | Stock: ${med.quantity} | ${formatCurrency(med.price)}`;
        purchaseMedicine.appendChild(option);
      });
  }

  function updatePurchaseSummary() {
    const medicineId = Number(purchaseMedicine.value);
    const quantity = Number(purchaseQuantity.value);
    const selectedMedicine = medicines.find(med => med.id === medicineId);

    if (!selectedMedicine || !quantity || quantity <= 0) {
      purchaseSummary.textContent = "Selecciona un medicamento y una cantidad para ver el resumen.";
      finalPurchaseTotal.textContent = formatCurrency(0);
      return;
    }

    const total = selectedMedicine.price * quantity;

    purchaseSummary.textContent =
      `Vas a comprar ${quantity} unidad(es) de ${selectedMedicine.name}. ` +
      `Stock disponible: ${selectedMedicine.quantity}. ` +
      `Precio unitario: ${formatCurrency(selectedMedicine.price)}.`;

    finalPurchaseTotal.textContent = formatCurrency(total);
  }
}

function initHistoryPage() {
  const historyBody = document.getElementById("historyBody");
  const historySearchInput = document.getElementById("historySearchInput");

  if (!historyBody || !historySearchInput) return;

  historySearchInput.addEventListener("input", renderHistoryTable);
  renderHistoryTable();
}

function renderHistoryTable() {
  const historyBody = document.getElementById("historyBody");
  const historySearchInput = document.getElementById("historySearchInput");
  const historyEmptyState = document.getElementById("historyEmptyState");

  if (!historyBody || !historySearchInput || !historyEmptyState) return;

  const sales = loadSales();
  const query = historySearchInput.value.trim().toLowerCase();

  const filtered = sales.filter((sale) => {
    return (
      (sale.customerName || "").toLowerCase().includes(query) ||
      (sale.medicineName || "").toLowerCase().includes(query) ||
      (sale.document || "").toLowerCase().includes(query) ||
      (sale.customerEmail || "").toLowerCase().includes(query)
    );
  });

  historyBody.innerHTML = "";

  filtered.forEach((sale) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${formatDateTime(sale.date)}</td>
      <td>${sale.customerName || "-"}</td>
      <td>${sale.document || "-"}</td>
      <td>${sale.customerEmail || "-"}</td>
      <td>${sale.medicineName || "-"}</td>
      <td>${sale.quantity || 0}</td>
      <td>${formatCurrency(sale.unitPrice || 0)}</td>
      <td>${formatCurrency(sale.total || 0)}</td>
      <td>${sale.notes || "-"}</td>
    `;

    historyBody.appendChild(row);
  });

  historyEmptyState.classList.toggle("hidden", filtered.length !== 0);
}

function resetForm() {
  const medicineForm = document.getElementById("medicineForm");
  if (!medicineForm) return;

  medicineForm.reset();
  editId = null;
}

function getStatus(med) {
  if (med.quantity < med.minStock) return { label: "Stock Bajo", className: "low" };
  if (med.quantity <= med.minStock + 40) return { label: "Stock Normal", className: "normal" };
  return { label: "Stock Alto", className: "high" };
}

function formatCurrency(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(value);
}

function formatDate(value) {
  const date = new Date(value + "T00:00:00");
  return new Intl.DateTimeFormat("es-CO").format(date);
}

function formatDateTime(value) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(date);
}

function renderTable() {
  const inventoryBody = document.getElementById("inventoryBody");
  const searchInput = document.getElementById("searchInput");
  const emptyState = document.getElementById("emptyState");
  const totalMeds = document.getElementById("totalMeds");
  const lowStock = document.getElementById("lowStock");
  const inventoryValue = document.getElementById("inventoryValue");

  if (!inventoryBody || !searchInput) return;

  medicines = loadMedicines();

  const query = searchInput.value.trim().toLowerCase();

  const filtered = medicines.filter((med) => {
    return med.name.toLowerCase().includes(query) || med.serial.toLowerCase().includes(query);
  });

  inventoryBody.innerHTML = "";

  filtered.forEach((med) => {
    const status = getStatus(med);
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${med.name}<br><span class="muted">${med.laboratory}</span></td>
      <td>${med.serial}</td>
      <td>${med.category}</td>
      <td>${med.quantity}</td>
      <td><span class="status-pill ${status.className}">${status.label}</span></td>
      <td>${formatCurrency(med.price)}</td>
      <td>${formatDate(med.expiry)}</td>
      <td>${med.location}</td>
      <td>
        <div class="actions-cell">
          <button class="mini-btn buy" type="button" data-buy="${med.id}">+20</button>
          <button class="mini-btn edit" type="button" data-edit="${med.id}">Editar</button>
          <button class="mini-btn delete" type="button" data-delete="${med.id}">Eliminar</button>
        </div>
      </td>
    `;

    inventoryBody.appendChild(row);
  });

  emptyState.classList.toggle("hidden", filtered.length !== 0);

  totalMeds.textContent = medicines.length;
  lowStock.textContent = medicines.filter(med => med.quantity < med.minStock).length;
  inventoryValue.textContent = formatCurrency(
    medicines.reduce((acc, med) => acc + (med.quantity * med.price), 0)
  );

  bindRowActions();
}

function bindRowActions() {
  document.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.onclick = () => {
      const id = Number(btn.dataset.delete);
      medicines = medicines.filter((med) => med.id !== id);
      saveMedicines();
      if (editId === id) resetForm();
      renderTable();
    };
  });

  document.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.onclick = () => {
      const id = Number(btn.dataset.edit);
      const med = medicines.find((item) => item.id === id);
      if (!med) return;

      editId = id;
      document.getElementById("medicineName").value = med.name;
      document.getElementById("laboratory").value = med.laboratory;
      document.getElementById("serial").value = med.serial;
      document.getElementById("category").value = med.category;
      document.getElementById("quantity").value = med.quantity;
      document.getElementById("minStock").value = med.minStock;
      document.getElementById("price").value = med.price;
      document.getElementById("expiry").value = med.expiry;
      document.getElementById("location").value = med.location;

      window.scrollTo({ top: 0, behavior: "smooth" });
    };
  });

  document.querySelectorAll("[data-buy]").forEach((btn) => {
    btn.onclick = () => {
      const id = Number(btn.dataset.buy);
      medicines = medicines.map((med) =>
        med.id === id ? { ...med, quantity: med.quantity + 20 } : med
      );
      saveMedicines();
      renderTable();
    };
  });
}
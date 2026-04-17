const loginScreen = document.getElementById('loginScreen');
const appScreen = document.getElementById('appScreen');
const loginForm = document.getElementById('loginForm');
const medicineForm = document.getElementById('medicineForm');
const inventoryBody = document.getElementById('inventoryBody');
const searchInput = document.getElementById('searchInput');
const totalMeds = document.getElementById('totalMeds');
const lowStock = document.getElementById('lowStock');
const inventoryValue = document.getElementById('inventoryValue');
const emptyState = document.getElementById('emptyState');
const logoutBtn = document.getElementById('logoutBtn');
const clearFormBtn = document.getElementById('clearFormBtn');
const openFormBtn = document.getElementById('openFormBtn');

let editId = null;

let medicines = [
  { id: 1, name: 'Paracetamol 500mg', laboratory: 'Laboratorios Beta', serial: 'MED-2026-001-4782', category: 'Analgésicos', quantity: 450, minStock: 200, price: 5.50, expiry: '2027-08-14', location: 'Estante A-01' },
  { id: 2, name: 'Amoxicilina 500mg', laboratory: 'FarmaPlus', serial: 'MED-2026-002-3891', category: 'Antibióticos', quantity: 180, minStock: 150, price: 12.75, expiry: '2027-12-19', location: 'Estante B-05' },
  { id: 3, name: 'Ibuprofeno 400mg', laboratory: 'Laboratorios Beta', serial: 'MED-2026-003-5621', category: 'Antiinflamatorios', quantity: 85, minStock: 100, price: 8.25, expiry: '2027-06-29', location: 'Estante A-15' },
  { id: 4, name: 'Omeprazol 20mg', laboratory: 'MediCorp', serial: 'MED-2026-004-7123', category: 'Antiácidos', quantity: 320, minStock: 150, price: 15.00, expiry: '2028-03-09', location: 'Estante C-08' },
  { id: 5, name: 'Loratadina 10mg', laboratory: 'FarmaPlus', serial: 'MED-2026-005-2947', category: 'Antihistamínicos', quantity: 210, minStock: 100, price: 6.50, expiry: '2027-09-24', location: 'Estante D-03' },
  { id: 6, name: 'Metformina 850mg', laboratory: 'Laboratorios Gamma', serial: 'MED-2026-006-8314', category: 'Antidiabéticos', quantity: 145, minStock: 120, price: 18.90, expiry: '2027-11-04', location: 'Estante E-12' }
];

loginForm.addEventListener('submit', function (event) {
  event.preventDefault();
  loginScreen.classList.add('hidden');
  appScreen.classList.remove('hidden');
  renderTable();
});

logoutBtn.addEventListener('click', function () {
  appScreen.classList.add('hidden');
  loginScreen.classList.remove('hidden');
  loginForm.reset();
});

openFormBtn.addEventListener('click', function () {
  document.getElementById('medicineName').focus();
  window.scrollTo({ top: 240, behavior: 'smooth' });
});

clearFormBtn.addEventListener('click', resetForm);
searchInput.addEventListener('input', renderTable);

medicineForm.addEventListener('submit', function (event) {
  event.preventDefault();

  const med = {
    id: editId ?? Date.now(),
    name: document.getElementById('medicineName').value.trim(),
    laboratory: document.getElementById('laboratory').value.trim(),
    serial: document.getElementById('serial').value.trim(),
    category: document.getElementById('category').value,
    quantity: Number(document.getElementById('quantity').value),
    minStock: Number(document.getElementById('minStock').value),
    price: Number(document.getElementById('price').value),
    expiry: document.getElementById('expiry').value,
    location: document.getElementById('location').value.trim()
  };

  if (editId) {
    medicines = medicines.map(item => item.id === editId ? med : item);
  } else {
    medicines.unshift(med);
  }

  resetForm();
  renderTable();
});

function resetForm() {
  medicineForm.reset();
  editId = null;
  medicineForm.querySelector('button[type="submit"]').textContent = 'Guardar medicamento';
}

function getStatus(med) {
  if (med.quantity < med.minStock) return { label: 'Stock Bajo', className: 'low' };
  if (med.quantity <= med.minStock + 40) return { label: 'Stock Normal', className: 'normal' };
  return { label: 'Stock Alto', className: 'high' };
}

function formatCurrency(value) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(value);
}

function formatDate(value) {
  const date = new Date(value + 'T00:00:00');
  return new Intl.DateTimeFormat('es-CO').format(date);
}

function renderTable() {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = medicines.filter(med =>
    med.name.toLowerCase().includes(query) || med.serial.toLowerCase().includes(query)
  );

  inventoryBody.innerHTML = '';

  filtered.forEach(med => {
    const status = getStatus(med);
    const row = document.createElement('tr');

    row.innerHTML = `
      <td>
        <div class="medicine-name">${med.name}</div>
        <div class="subtext">${med.laboratory}</div>
      </td>
      <td><span class="code-pill">${med.serial}</span></td>
      <td><span class="tag-pill">${med.category}</span></td>
      <td>
        <div class="qty-main">${med.quantity} unidades</div>
        <div class="subtext">Min: ${med.minStock}</div>
      </td>
      <td><span class="status-pill ${status.className}">${status.label}</span></td>
      <td><strong>${formatCurrency(med.price)}</strong></td>
      <td>${formatDate(med.expiry)}</td>
      <td><span class="subtext">${med.location}</span></td>
      <td>
        <div class="actions-cell">
          <button class="mini-btn buy" type="button" data-buy="${med.id}">Comprar +20</button>
          <button class="mini-btn edit" type="button" data-edit="${med.id}">Editar</button>
          <button class="mini-btn delete" type="button" data-delete="${med.id}">Eliminar</button>
        </div>
      </td>
    `;

    inventoryBody.appendChild(row);
  });

  emptyState.classList.toggle('hidden', filtered.length !== 0);
  updateStats();
  bindRowActions();
}

function bindRowActions() {
  document.querySelectorAll('[data-delete]').forEach(btn => {
    btn.onclick = () => {
      const id = Number(btn.dataset.delete);
      medicines = medicines.filter(med => med.id !== id);
      if (editId === id) resetForm();
      renderTable();
    };
  });

  document.querySelectorAll('[data-edit]').forEach(btn => {
    btn.onclick = () => {
      const id = Number(btn.dataset.edit);
      const med = medicines.find(item => item.id === id);
      if (!med) return;

      editId = id;
      document.getElementById('medicineName').value = med.name;
      document.getElementById('laboratory').value = med.laboratory;
      document.getElementById('serial').value = med.serial;
      document.getElementById('category').value = med.category;
      document.getElementById('quantity').value = med.quantity;
      document.getElementById('minStock').value = med.minStock;
      document.getElementById('price').value = med.price;
      document.getElementById('expiry').value = med.expiry;
      document.getElementById('location').value = med.location;
      medicineForm.querySelector('button[type="submit"]').textContent = 'Actualizar medicamento';
      document.getElementById('medicineName').focus();
      window.scrollTo({ top: 240, behavior: 'smooth' });
    };
  });

  document.querySelectorAll('[data-buy]').forEach(btn => {
    btn.onclick = () => {
      const id = Number(btn.dataset.buy);
      medicines = medicines.map(med => med.id === id ? { ...med, quantity: med.quantity + 20 } : med);
      renderTable();
    };
  });
}

function updateStats() {
  totalMeds.textContent = medicines.length;
  lowStock.textContent = medicines.filter(med => med.quantity < med.minStock).length;
  const total = medicines.reduce((acc, med) => acc + (med.quantity * med.price), 0);
  inventoryValue.textContent = formatCurrency(total);
}
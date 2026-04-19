const SALES_STORAGE_KEY = "suggestness_sales";

let salesChartInstance = null;
let currentRange = "week";

document.addEventListener("DOMContentLoaded", () => {
  initDataPage();
});

function initDataPage() {
  const chartCanvas = document.getElementById("salesChart");
  if (!chartCanvas) return;

  bindRangeButtons();
  renderDataDashboard(currentRange);
}

function getSales() {
  const saved = localStorage.getItem(SALES_STORAGE_KEY);
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function bindRangeButtons() {
  const buttons = document.querySelectorAll("[data-range]");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      currentRange = button.dataset.range;
      updateActiveButton(buttons, currentRange);
      renderDataDashboard(currentRange);
    });
  });

  updateActiveButton(buttons, currentRange);
}

function updateActiveButton(buttons, activeRange) {
  buttons.forEach((button) => {
    button.classList.toggle("active-filter", button.dataset.range === activeRange);
  });
}

function renderDataDashboard(range) {
  const sales = getSales();
  const filteredSales = filterSalesByRange(sales, range);
  const groupedSales = groupSalesByRange(filteredSales, range);

  renderSummary(filteredSales);
  renderChart(groupedSales, range);
  renderTopMedicines(filteredSales);
}

function filterSalesByRange(sales, range) {
  const now = new Date();

  return sales.filter((sale) => {
    const saleDate = new Date(sale.date);
    if (Number.isNaN(saleDate.getTime())) return false;

    if (range === "week") {
      const startOfWeek = getStartOfWeek(now);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      return saleDate >= startOfWeek && saleDate < endOfWeek;
    }

    if (range === "month") {
      return (
        saleDate.getFullYear() === now.getFullYear() &&
        saleDate.getMonth() === now.getMonth()
      );
    }

    if (range === "year") {
      return saleDate.getFullYear() === now.getFullYear();
    }

    return true;
  });
}

function getStartOfWeek(date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function groupSalesByRange(sales, range) {
  const grouped = sales.reduce((acc, sale) => {
    const saleDate = new Date(sale.date);
    let key = "";
    let label = "";

    if (range === "week") {
      key = `${saleDate.getFullYear()}-${saleDate.getMonth() + 1}-${saleDate.getDate()}`;
      label = saleDate.toLocaleDateString("es-CO", {
        weekday: "short",
        day: "2-digit"
      });
    }

    if (range === "month") {
      key = `${saleDate.getFullYear()}-${saleDate.getMonth() + 1}-${saleDate.getDate()}`;
      label = saleDate.toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "short"
      });
    }

    if (range === "year") {
      key = `${saleDate.getFullYear()}-${saleDate.getMonth() + 1}`;
      label = saleDate.toLocaleDateString("es-CO", {
        month: "short"
      });
    }

    if (!acc[key]) {
      acc[key] = {
        label,
        total: 0,
        quantity: 0
      };
    }

    acc[key].total += Number(sale.total || 0);
    acc[key].quantity += Number(sale.quantity || 0);

    return acc;
  }, {});

  return Object.values(grouped);
}

function renderSummary(sales) {
  const totalSalesAmount = document.getElementById("totalSalesAmount");
  const totalSalesCount = document.getElementById("totalSalesCount");
  const bestMedicine = document.getElementById("bestMedicine");

  const totalAmount = sales.reduce((acc, sale) => acc + Number(sale.total || 0), 0);
  const totalCount = sales.reduce((acc, sale) => acc + Number(sale.quantity || 0), 0);

  const medicineMap = sales.reduce((acc, sale) => {
    const name = sale.medicineName || "Sin nombre";
    acc[name] = (acc[name] || 0) + Number(sale.quantity || 0);
    return acc;
  }, {});

  const topMedicineEntry = Object.entries(medicineMap).sort((a, b) => b[1] - a[1])[0];

  if (totalSalesAmount) totalSalesAmount.textContent = formatCurrency(totalAmount);
  if (totalSalesCount) totalSalesCount.textContent = totalCount;
  if (bestMedicine) bestMedicine.textContent = topMedicineEntry ? topMedicineEntry[0] : "Sin ventas";
}

function renderChart(groupedSales, range) {
  const canvas = document.getElementById("salesChart");
  if (!canvas) return;

  const labels = groupedSales.map((item) => item.label);
  const totals = groupedSales.map((item) => item.total);

  if (salesChartInstance) {
    salesChartInstance.data.labels = labels;
    salesChartInstance.data.datasets[0].data = totals;
    salesChartInstance.data.datasets[0].label = getDatasetLabel(range);
    salesChartInstance.update();
    return;
  }

  salesChartInstance = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: getDatasetLabel(range),
          data: totals,
          borderColor: "#1e73a0",
          backgroundColor: "rgba(30, 115, 160, 0.15)",
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `Ventas: ${formatCurrency(context.raw)}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return formatCurrency(value);
            }
          }
        }
      }
    }
  });
}

function getDatasetLabel(range) {
  if (range === "week") return "Ventas de la semana";
  if (range === "month") return "Ventas del mes";
  if (range === "year") return "Ventas del año";
  return "Ventas";
}

function renderTopMedicines(sales) {
  const topMedicinesList = document.getElementById("topMedicinesList");
  if (!topMedicinesList) return;

  const ranking = sales.reduce((acc, sale) => {
    const name = sale.medicineName || "Sin nombre";

    if (!acc[name]) {
      acc[name] = {
        name,
        quantity: 0,
        total: 0
      };
    }

    acc[name].quantity += Number(sale.quantity || 0);
    acc[name].total += Number(sale.total || 0);

    return acc;
  }, {});

  const sortedRanking = Object.values(ranking)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  if (sortedRanking.length === 0) {
    topMedicinesList.innerHTML = `<li>No hay ventas registradas todavía.</li>`;
    return;
  }

  topMedicinesList.innerHTML = sortedRanking
    .map((item, index) => `
      <li>
        <span>${index + 1}. ${item.name}</span>
        <strong>${item.quantity} und · ${formatCurrency(item.total)}</strong>
      </li>
    `)
    .join("");
}

function formatCurrency(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(value);
}
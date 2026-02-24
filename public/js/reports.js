const { api, requireAuth, showToast } = window.HMS;

function renderSimpleList(containerId, rows, labelKey) {
  const el = document.getElementById(containerId);
  if (!rows.length) {
    el.innerHTML = `<div class="item"><p>No data</p></div>`;
    return;
  }
  el.innerHTML = rows
    .map((row) => `<div class="item"><p><strong>${row[labelKey]}</strong>: ${row.count}</p></div>`)
    .join("");
}

async function loadReports() {
  try {
    const [summary, byCity, bySpecialization, topDiseases, monthlyRevenue] = await Promise.all([
      api("/api/patients/aggregate/summary"),
      api("/api/patients/aggregate/by-city"),
      api("/api/patients/aggregate/by-specialization"),
      api("/api/patients/aggregate/top-diseases"),
      api("/api/patients/aggregate/monthly-revenue"),
    ]);

    document.getElementById("m-total").textContent = String(summary.totalPatients || 0);
    document.getElementById("m-admitted").textContent = String(summary.admittedPatients || 0);
    document.getElementById("m-pending").textContent = String(summary.pendingBills || 0);
    document.getElementById("m-revenue").textContent = String(summary.totalRevenue || 0);

    renderSimpleList("agg-city", byCity, "city");
    renderSimpleList("agg-specialization", bySpecialization, "specialization");
    renderSimpleList("agg-disease", topDiseases, "disease");

    const revenueEl = document.getElementById("agg-revenue");
    if (!monthlyRevenue.length) {
      revenueEl.innerHTML = `<div class="item"><p>No revenue data</p></div>`;
      return;
    }
    revenueEl.innerHTML = monthlyRevenue
      .map(
        (row) =>
          `<div class="item"><p><strong>${row.month}/${row.year}</strong> - Revenue: ${row.revenue}, Patients: ${row.patients}</p></div>`
      )
      .join("");
  } catch (error) {
    showToast(error.message, true);
  }
}

(async () => {
  const user = await requireAuth();
  if (!user) return;
  await loadReports();
})();

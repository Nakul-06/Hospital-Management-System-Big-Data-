const { api, requireAuth, showToast } = window.HMS;

async function loadMetrics() {
  try {
    const summary = await api("/api/patients/aggregate/summary");
    document.getElementById("m-total").textContent = String(summary.totalPatients || 0);
    document.getElementById("m-admitted").textContent = String(summary.admittedPatients || 0);
    document.getElementById("m-pending").textContent = String(summary.pendingBills || 0);
    document.getElementById("m-paid").textContent = String(summary.paidBills || 0);
  } catch (error) {
    showToast(error.message, true);
  }
}

(async () => {
  const user = await requireAuth();
  if (!user) return;
  await loadMetrics();
})();

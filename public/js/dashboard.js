const { api, requireAuth, showToast, normalizePatient } = window.HMS;

async function loadMetrics() {
  try {
    const rows = await api("/api/patients");
    const patients = rows.map(normalizePatient);
    const total = patients.length;
    const admitted = patients.filter((p) => p.isAdmitted).length;
    const pending = patients.filter((p) => !p.bill.isPaid).length;
    const paid = patients.filter((p) => p.bill.isPaid).length;
    document.getElementById("m-total").textContent = String(total);
    document.getElementById("m-admitted").textContent = String(admitted);
    document.getElementById("m-pending").textContent = String(pending);
    document.getElementById("m-paid").textContent = String(paid);
  } catch (error) {
    showToast(error.message, true);
  }
}

(async () => {
  const user = await requireAuth();
  if (!user) return;
  loadMetrics();
})();

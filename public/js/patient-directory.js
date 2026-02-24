const { api, requireAuth, showToast, normalizePatient } = window.HMS;

let allPatients = [];

function byId(id) {
  return document.getElementById(id);
}

function filteredPatients() {
  const q = byId("search").value.trim().toLowerCase();
  if (!q) return allPatients;
  return allPatients.filter((raw) => {
    const p = normalizePatient(raw);
    return (
      String(p.patientId).toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.phone.toLowerCase().includes(q)
    );
  });
}

function render() {
  const rows = filteredPatients();
  byId("patients-list").innerHTML = rows
    .map((raw) => {
      const p = normalizePatient(raw);
      return `
      <article class="item">
        <p><strong>#${p.patientId}</strong> ${p.name} (${p.gender || "-"})</p>
        <p>${p.phone || "-"} | ${p.email || "-"}</p>
        <p>Doctor: ${p.doctor.name || "-"} | Bill: ${p.bill.totalAmount}</p>
        <div class="actions">
          <a class="btn ghost" href="/patients.html?edit=${p._id}" style="text-decoration:none;">Edit</a>
          <a class="btn warn" href="/records.html?patient=${p._id}" style="text-decoration:none;">Clinical Details</a>
          <button class="btn danger" data-delete="${p._id}">Delete</button>
        </div>
      </article>`;
    })
    .join("");
}

async function load() {
  allPatients = await api("/api/patients");
  render();
}

byId("search").addEventListener("input", render);

byId("patients-list").addEventListener("click", async (e) => {
  const id = e.target.getAttribute("data-delete");
  if (!id) return;
  try {
    await api(`/api/patients/${id}`, { method: "DELETE" });
    showToast("Patient deleted");
    await load();
  } catch (error) {
    showToast(error.message, true);
  }
});

(async () => {
  const user = await requireAuth();
  if (!user) return;
  await load();
})();

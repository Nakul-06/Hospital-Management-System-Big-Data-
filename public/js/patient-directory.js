const { api, requireAuth, showToast, normalizePatient } = window.HMS;

let allPatients = [];

function byId(id) {
  return document.getElementById(id);
}

function render() {
  const rows = allPatients;
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
  const params = new URLSearchParams();
  const values = {
    q: byId("search").value.trim(),
    city: byId("city").value.trim(),
    specialization: byId("specialization").value.trim(),
    disease: byId("disease").value.trim(),
    isAdmitted: byId("isAdmitted").value,
    isPaid: byId("isPaid").value,
    sortBy: byId("sortBy").value,
    order: byId("order").value,
  };

  Object.entries(values).forEach(([key, value]) => {
    if (value !== "") params.set(key, value);
  });

  allPatients = await api(`/api/patients/search?${params.toString()}`);
  render();
}

byId("apply-filters").addEventListener("click", async () => {
  try {
    await load();
  } catch (error) {
    showToast(error.message, true);
  }
});

byId("clear-filters").addEventListener("click", async () => {
  byId("search").value = "";
  byId("city").value = "";
  byId("specialization").value = "";
  byId("disease").value = "";
  byId("isAdmitted").value = "";
  byId("isPaid").value = "";
  byId("sortBy").value = "createdAt";
  byId("order").value = "desc";
  try {
    await load();
  } catch (error) {
    showToast(error.message, true);
  }
});

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

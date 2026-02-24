const { api, requireAuth, showToast } = window.HMS;

let doctors = [];

function byId(id) {
  return document.getElementById(id);
}

function normalizeDoctor(raw = {}) {
  return {
    ...raw,
    doctorId: raw.doctorId ?? "",
    name: raw.name ?? "",
    specialization: raw.specialization ?? "",
    phone: raw.phone ?? "",
    feePerVisit: raw.feePerVisit ?? 0,
  };
}

function payload() {
  return {
    doctorId: Number(byId("doctorId").value),
    name: byId("name").value.trim(),
    specialization: byId("specialization").value.trim(),
    phone: byId("phone").value.trim(),
    feePerVisit: Number(byId("feePerVisit").value || 0),
  };
}

function resetForm() {
  byId("doctor-form").reset();
  byId("doctor-doc-id").value = "";
  byId("cancel-edit").classList.add("hidden");
}

function fillForm(raw) {
  const d = normalizeDoctor(raw);
  byId("doctor-doc-id").value = d._id;
  byId("doctorId").value = d.doctorId;
  byId("name").value = d.name;
  byId("specialization").value = d.specialization;
  byId("phone").value = d.phone;
  byId("feePerVisit").value = d.feePerVisit;
  byId("cancel-edit").classList.remove("hidden");
}

function filtered() {
  const q = byId("search").value.trim().toLowerCase();
  if (!q) return doctors;
  return doctors.filter((row) => {
    const d = normalizeDoctor(row);
    return (
      String(d.doctorId).toLowerCase().includes(q) ||
      d.name.toLowerCase().includes(q) ||
      d.specialization.toLowerCase().includes(q) ||
      d.phone.toLowerCase().includes(q)
    );
  });
}

function render() {
  byId("doctors-list").innerHTML = filtered()
    .map((row) => {
      const d = normalizeDoctor(row);
      return `
      <article class="item">
        <p><strong>#${d.doctorId}</strong> ${d.name}</p>
        <p>${d.specialization} | ${d.phone}</p>
        <p>Fee per visit: ${d.feePerVisit}</p>
        <div class="actions">
          <button class="btn ghost" data-edit="${d._id}">Edit</button>
          <button class="btn danger" data-delete="${d._id}">Delete</button>
        </div>
      </article>
    `;
    })
    .join("");
}

async function loadDoctors() {
  doctors = await api("/api/doctors");
  render();
}

byId("doctor-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const id = byId("doctor-doc-id").value;
    if (id) {
      await api(`/api/doctors/${id}`, { method: "PUT", body: JSON.stringify(payload()) });
      showToast("Doctor updated");
    } else {
      await api("/api/doctors", { method: "POST", body: JSON.stringify(payload()) });
      showToast("Doctor added");
    }
    resetForm();
    await loadDoctors();
  } catch (error) {
    showToast(error.message, true);
  }
});

byId("cancel-edit").addEventListener("click", resetForm);
byId("search").addEventListener("input", render);

byId("doctors-list").addEventListener("click", async (e) => {
  const editId = e.target.getAttribute("data-edit");
  const deleteId = e.target.getAttribute("data-delete");
  try {
    if (editId) {
      const row = doctors.find((d) => d._id === editId);
      if (row) fillForm(row);
      return;
    }
    if (deleteId) {
      await api(`/api/doctors/${deleteId}`, { method: "DELETE" });
      showToast("Doctor deleted");
      await loadDoctors();
    }
  } catch (error) {
    showToast(error.message, true);
  }
});

(async () => {
  const user = await requireAuth();
  if (!user) return;
  await loadDoctors();
})();

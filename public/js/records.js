const { api, requireAuth, showToast, normalizePatient } = window.HMS;

let patients = [];
let current = null;

function byId(id) {
  return document.getElementById(id);
}

function selectedPatient() {
  if (!current) throw new Error("Select a patient first");
  return current;
}

function renderSelect() {
  const select = byId("patient-select");
  select.innerHTML = `<option value="">Select patient</option>${patients
    .map((p) => `<option value="${p._id}">#${p.patientId} - ${p.name}</option>`)
    .join("")}`;
}

function renderLists(p) {
  byId("diseases-list").innerHTML = p.diseases.length
    ? p.diseases
    .map(
      (d, i) => `
      <div class="item">
        <p>${d}</p>
        <div class="actions">
          <button class="btn ghost" data-disease-edit="${i}">Edit</button>
          <button class="btn danger" data-disease-delete="${i}">Delete</button>
        </div>
      </div>`
    )
    .join("")
    : `<div class="item"><p>No diagnosed conditions added yet.</p></div>`;

  byId("treatments-list").innerHTML = p.treatments.length
    ? p.treatments
    .map(
      (t) => `
      <div class="item">
        <p>${String(t.date).slice(0, 10)} - ${t.description}</p>
        <p>Cost: ${t.cost}</p>
        <div class="actions">
          <button class="btn ghost" data-treatment-edit="${t._id}">Edit</button>
          <button class="btn danger" data-treatment-delete="${t._id}">Delete</button>
        </div>
      </div>`
    )
    .join("")
    : `<div class="item"><p>No treatment history available.</p></div>`;

  byId("medicines-list").innerHTML = p.medicines.length
    ? p.medicines
    .map(
      (m) => `
      <div class="item">
        <p>${m.name} - ${m.dosage}</p>
        <p>${m.duration}</p>
        <div class="actions">
          <button class="btn ghost" data-medicine-edit="${m._id}">Edit</button>
          <button class="btn danger" data-medicine-delete="${m._id}">Delete</button>
        </div>
      </div>`
    )
    .join("")
    : `<div class="item"><p>No medication plan added yet.</p></div>`;
}

function bindPatient(p) {
  current = normalizePatient(p);
  byId("selected-label").value = `${current.name} (#${current.patientId})`;
  byId("editStreet").value = current.address.street;
  byId("editCity").value = current.address.city;
  byId("editState").value = current.address.state;
  byId("editPincode").value = current.address.pincode;
  byId("editDoctorId").value = current.doctor.doctorId;
  byId("editDoctorName").value = current.doctor.name;
  byId("editDoctorSpecialization").value = current.doctor.specialization;
  byId("editDoctorPhone").value = current.doctor.phone;
  byId("editRoomCharges").value = current.bill.roomCharges;
  byId("editTreatmentCharges").value = current.bill.treatmentCharges;
  byId("editMedicineCharges").value = current.bill.medicineCharges;
  byId("editIsPaid").value = String(current.bill.isPaid);
  byId("disease-index").value = "";
  byId("disease-name").value = "";
  byId("treatment-id").value = "";
  byId("treatment-form").reset();
  byId("medicine-id").value = "";
  byId("medicine-form").reset();
  renderLists(current);
}

async function loadPatients(keepId = null) {
  const rows = await api("/api/patients");
  patients = rows.map(normalizePatient);
  renderSelect();
  if (keepId) {
    const row = patients.find((p) => p._id === keepId);
    if (row) {
      byId("patient-select").value = keepId;
      bindPatient(row);
      return;
    }
  }
  current = null;
  byId("selected-label").value = "";
  byId("diseases-list").innerHTML = "";
  byId("treatments-list").innerHTML = "";
  byId("medicines-list").innerHTML = "";
}

byId("patient-select").addEventListener("change", (e) => {
  const id = e.target.value;
  const row = patients.find((p) => p._id === id);
  if (!row) {
    current = null;
    byId("selected-label").value = "";
    return;
  }
  bindPatient(row);
});

byId("address-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const p = selectedPatient();
    await api(`/api/patients/${p._id}/address`, {
      method: "PATCH",
      body: JSON.stringify({
        street: byId("editStreet").value.trim(),
        city: byId("editCity").value.trim(),
        state: byId("editState").value.trim(),
        pincode: Number(byId("editPincode").value),
      }),
    });
    showToast("Address updated");
    await loadPatients(p._id);
  } catch (error) {
    showToast(error.message, true);
  }
});

byId("doctor-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const p = selectedPatient();
    await api(`/api/patients/${p._id}/doctor`, {
      method: "PATCH",
      body: JSON.stringify({
        doctorId: Number(byId("editDoctorId").value),
        name: byId("editDoctorName").value.trim(),
        specialization: byId("editDoctorSpecialization").value.trim(),
        phone: byId("editDoctorPhone").value.trim(),
      }),
    });
    showToast("Doctor updated");
    await loadPatients(p._id);
  } catch (error) {
    showToast(error.message, true);
  }
});

byId("bill-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const p = selectedPatient();
    const roomCharges = Number(byId("editRoomCharges").value || 0);
    const treatmentCharges = Number(byId("editTreatmentCharges").value || 0);
    const medicineCharges = Number(byId("editMedicineCharges").value || 0);
    await api(`/api/patients/${p._id}/bill`, {
      method: "PATCH",
      body: JSON.stringify({
        roomCharges,
        treatmentCharges,
        medicineCharges,
        totalAmount: roomCharges + treatmentCharges + medicineCharges,
        isPaid: byId("editIsPaid").value === "true",
      }),
    });
    showToast("Bill updated");
    await loadPatients(p._id);
  } catch (error) {
    showToast(error.message, true);
  }
});

byId("disease-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const p = selectedPatient();
    const index = byId("disease-index").value;
    const name = byId("disease-name").value.trim();
    if (!index) {
      await api(`/api/patients/${p._id}/diseases`, {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      showToast("Condition added");
    } else {
      await api(`/api/patients/${p._id}/diseases/${index}`, {
        method: "PUT",
        body: JSON.stringify({ name }),
      });
      showToast("Condition updated");
    }
    byId("disease-form").reset();
    byId("disease-index").value = "";
    await loadPatients(p._id);
  } catch (error) {
    showToast(error.message, true);
  }
});

byId("diseases-list").addEventListener("click", async (e) => {
  const editIndex = e.target.getAttribute("data-disease-edit");
  const deleteIndex = e.target.getAttribute("data-disease-delete");
  try {
    const p = selectedPatient();
    if (editIndex !== null) {
      byId("disease-index").value = editIndex;
      byId("disease-name").value = p.diseases[Number(editIndex)] || "";
      return;
    }
    if (deleteIndex !== null) {
      await api(`/api/patients/${p._id}/diseases/${deleteIndex}`, { method: "DELETE" });
      showToast("Condition deleted");
      await loadPatients(p._id);
    }
  } catch (error) {
    showToast(error.message, true);
  }
});

byId("treatment-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const p = selectedPatient();
    const itemId = byId("treatment-id").value;
    const payload = {
      date: byId("treatment-date").value,
      description: byId("treatment-desc").value.trim(),
      cost: Number(byId("treatment-cost").value || 0),
    };
    if (!itemId) {
      await api(`/api/patients/${p._id}/treatments`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      showToast("Treatment added");
    } else {
      await api(`/api/patients/${p._id}/treatments/${itemId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      showToast("Treatment updated");
    }
    byId("treatment-form").reset();
    byId("treatment-id").value = "";
    await loadPatients(p._id);
  } catch (error) {
    showToast(error.message, true);
  }
});

byId("treatments-list").addEventListener("click", async (e) => {
  const editId = e.target.getAttribute("data-treatment-edit");
  const deleteId = e.target.getAttribute("data-treatment-delete");
  try {
    const p = selectedPatient();
    if (editId) {
      const t = p.treatments.find((x) => x._id === editId);
      if (!t) return;
      byId("treatment-id").value = t._id;
      byId("treatment-date").value = String(t.date).slice(0, 10);
      byId("treatment-desc").value = t.description || "";
      byId("treatment-cost").value = t.cost ?? 0;
      return;
    }
    if (deleteId) {
      await api(`/api/patients/${p._id}/treatments/${deleteId}`, { method: "DELETE" });
      showToast("Treatment deleted");
      await loadPatients(p._id);
    }
  } catch (error) {
    showToast(error.message, true);
  }
});

byId("medicine-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const p = selectedPatient();
    const itemId = byId("medicine-id").value;
    const payload = {
      name: byId("medicine-name").value.trim(),
      dosage: byId("medicine-dosage").value.trim(),
      duration: byId("medicine-duration").value.trim(),
    };
    if (!itemId) {
      await api(`/api/patients/${p._id}/medicines`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      showToast("Medicine added");
    } else {
      await api(`/api/patients/${p._id}/medicines/${itemId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      showToast("Medicine updated");
    }
    byId("medicine-form").reset();
    byId("medicine-id").value = "";
    await loadPatients(p._id);
  } catch (error) {
    showToast(error.message, true);
  }
});

byId("medicines-list").addEventListener("click", async (e) => {
  const editId = e.target.getAttribute("data-medicine-edit");
  const deleteId = e.target.getAttribute("data-medicine-delete");
  try {
    const p = selectedPatient();
    if (editId) {
      const m = p.medicines.find((x) => x._id === editId);
      if (!m) return;
      byId("medicine-id").value = m._id;
      byId("medicine-name").value = m.name || "";
      byId("medicine-dosage").value = m.dosage || "";
      byId("medicine-duration").value = m.duration || "";
      return;
    }
    if (deleteId) {
      await api(`/api/patients/${p._id}/medicines/${deleteId}`, { method: "DELETE" });
      showToast("Medicine deleted");
      await loadPatients(p._id);
    }
  } catch (error) {
    showToast(error.message, true);
  }
});

(async () => {
  const user = await requireAuth();
  if (!user) return;
  const idFromUrl = new URLSearchParams(location.search).get("patient");
  await loadPatients(idFromUrl);
})();

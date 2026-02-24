const { api, requireAuth, showToast, normalizePatient } = window.HMS;

function byId(id) {
  return document.getElementById(id);
}

function patientPayload() {
  const roomCharges = Number(byId("roomCharges").value || 0);
  const treatmentCharges = Number(byId("treatmentCharges").value || 0);
  const medicineCharges = Number(byId("medicineCharges").value || 0);
  const diseaseText = byId("diseasesSeed").value.trim();
  const initTreatmentDate = byId("initTreatmentDate").value;
  const initTreatmentDescription = byId("initTreatmentDescription").value.trim();
  const initTreatmentCost = byId("initTreatmentCost").value;
  const initMedicineName = byId("initMedicineName").value.trim();
  const initMedicineDosage = byId("initMedicineDosage").value.trim();
  const initMedicineDuration = byId("initMedicineDuration").value.trim();

  const treatmentFields = [initTreatmentDate, initTreatmentDescription, initTreatmentCost];
  const hasAnyTreatment = treatmentFields.some((v) => String(v).trim() !== "");
  const hasAllTreatment = treatmentFields.every((v) => String(v).trim() !== "");
  if (hasAnyTreatment && !hasAllTreatment) {
    throw new Error("Fill all initial treatment fields (date, description, cost)");
  }

  const medicineFields = [initMedicineName, initMedicineDosage, initMedicineDuration];
  const hasAnyMedicine = medicineFields.some((v) => String(v).trim() !== "");
  const hasAllMedicine = medicineFields.every((v) => String(v).trim() !== "");
  if (hasAnyMedicine && !hasAllMedicine) {
    throw new Error("Fill all initial medicine fields (name, dosage, duration)");
  }

  const treatments = hasAllTreatment
    ? [
        {
          date: initTreatmentDate,
          description: initTreatmentDescription,
          cost: Number(initTreatmentCost),
        },
      ]
    : [];

  const medicines = hasAllMedicine
    ? [
        {
          name: initMedicineName,
          dosage: initMedicineDosage,
          duration: initMedicineDuration,
        },
      ]
    : [];

  return {
    patientId: Number(byId("patientId").value),
    name: byId("name").value.trim(),
    age: Number(byId("age").value),
    gender: byId("gender").value,
    phone: byId("phone").value.trim(),
    email: byId("email").value.trim(),
    bloodGroup: byId("bloodGroup").value.trim(),
    isAdmitted: byId("isAdmitted").value === "true",
    admissionDate: byId("admissionDate").value,
    address: {
      street: byId("street").value.trim(),
      city: byId("city").value.trim(),
      state: byId("state").value.trim(),
      pincode: Number(byId("pincode").value),
    },
    doctor: {
      doctorId: Number(byId("doctorId").value),
      name: byId("doctorName").value.trim(),
      specialization: byId("doctorSpecialization").value.trim(),
      phone: byId("doctorPhone").value.trim(),
    },
    diseases: diseaseText ? diseaseText.split(",").map((d) => d.trim()).filter(Boolean) : [],
    treatments,
    medicines,
    bill: {
      roomCharges,
      treatmentCharges,
      medicineCharges,
      totalAmount: roomCharges + treatmentCharges + medicineCharges,
      isPaid: byId("isPaid").value === "true",
    },
  };
}

function resetForm() {
  byId("patient-form").reset();
  byId("patient-doc-id").value = "";
  byId("init-treatment-item-id").value = "";
  byId("init-medicine-item-id").value = "";
  byId("roomCharges").value = 0;
  byId("treatmentCharges").value = 0;
  byId("medicineCharges").value = 0;
  byId("cancel-edit").classList.add("hidden");
}

function fillForm(raw) {
  const p = normalizePatient(raw);
  byId("patient-doc-id").value = p._id;
  byId("patientId").value = p.patientId;
  byId("name").value = p.name;
  byId("age").value = p.age;
  byId("gender").value = p.gender;
  byId("phone").value = p.phone;
  byId("email").value = p.email;
  byId("bloodGroup").value = p.bloodGroup;
  byId("isAdmitted").value = String(p.isAdmitted);
  byId("admissionDate").value = p.admissionDate ? String(p.admissionDate).slice(0, 10) : "";
  byId("street").value = p.address.street;
  byId("city").value = p.address.city;
  byId("state").value = p.address.state;
  byId("pincode").value = p.address.pincode;
  byId("doctorId").value = p.doctor.doctorId;
  byId("doctorName").value = p.doctor.name;
  byId("doctorSpecialization").value = p.doctor.specialization;
  byId("doctorPhone").value = p.doctor.phone;
  byId("diseasesSeed").value = p.diseases.join(", ");
  byId("init-treatment-item-id").value = p.treatments[0]?._id || "";
  byId("init-medicine-item-id").value = p.medicines[0]?._id || "";
  byId("initTreatmentDate").value = p.treatments[0]?.date ? String(p.treatments[0].date).slice(0, 10) : "";
  byId("initTreatmentDescription").value = p.treatments[0]?.description || "";
  byId("initTreatmentCost").value = p.treatments[0]?.cost ?? "";
  byId("initMedicineName").value = p.medicines[0]?.name || "";
  byId("initMedicineDosage").value = p.medicines[0]?.dosage || "";
  byId("initMedicineDuration").value = p.medicines[0]?.duration || "";
  byId("roomCharges").value = p.bill.roomCharges;
  byId("treatmentCharges").value = p.bill.treatmentCharges;
  byId("medicineCharges").value = p.bill.medicineCharges;
  byId("isPaid").value = String(p.bill.isPaid);
  byId("cancel-edit").classList.remove("hidden");
}

async function loadPatientForEditIfPresent() {
  const params = new URLSearchParams(location.search);
  const id = params.get("edit");
  if (!id) return;
  const rows = await api("/api/patients");
  const row = rows.find((p) => p._id === id);
  if (row) fillForm(row);
}

byId("patient-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const id = byId("patient-doc-id").value;
    const payload = patientPayload();
    if (id) {
      const basePayload = { ...payload };
      delete basePayload.treatments;
      delete basePayload.medicines;
      await api(`/api/patients/${id}`, { method: "PUT", body: JSON.stringify(basePayload) });

      const treatmentItemId = byId("init-treatment-item-id").value;
      if (payload.treatments.length) {
        if (treatmentItemId) {
          await api(`/api/patients/${id}/treatments/${treatmentItemId}`, {
            method: "PUT",
            body: JSON.stringify(payload.treatments[0]),
          });
        } else {
          await api(`/api/patients/${id}/treatments`, {
            method: "POST",
            body: JSON.stringify(payload.treatments[0]),
          });
        }
      }

      const medicineItemId = byId("init-medicine-item-id").value;
      if (payload.medicines.length) {
        if (medicineItemId) {
          await api(`/api/patients/${id}/medicines/${medicineItemId}`, {
            method: "PUT",
            body: JSON.stringify(payload.medicines[0]),
          });
        } else {
          await api(`/api/patients/${id}/medicines`, {
            method: "POST",
            body: JSON.stringify(payload.medicines[0]),
          });
        }
      }

      showToast("Patient updated");
      setTimeout(() => (location.href = "/patient-directory.html"), 250);
      return;
    }
    await api("/api/patients", { method: "POST", body: JSON.stringify(payload) });
    showToast("Patient created");
    resetForm();
  } catch (error) {
    showToast(error.message, true);
  }
});

byId("cancel-edit").addEventListener("click", () => {
  resetForm();
  history.replaceState({}, "", "/patients.html");
});

(async () => {
  const user = await requireAuth();
  if (!user) return;
  await loadPatientForEditIfPresent();
})();

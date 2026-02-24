(() => {
  const toastEl = document.getElementById("toast");

  function showToast(message, isError = false) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.style.background = isError ? "#b4233f" : "#111827";
    toastEl.classList.add("show");
    setTimeout(() => toastEl.classList.remove("show"), 2200);
  }

  function getToken() {
    return localStorage.getItem("hms_token") || "";
  }

  function setToken(token) {
    localStorage.setItem("hms_token", token);
  }

  function clearToken() {
    localStorage.removeItem("hms_token");
  }

  async function api(url, options = {}) {
    const token = getToken();
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(url, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || "Request failed");
    }
    return data;
  }

  async function requireAuth() {
    const token = getToken();
    if (!token) {
      location.href = "/login.html";
      return null;
    }
    try {
      const user = await api("/api/auth/me");
      const label = document.getElementById("user-label");
      if (label) label.textContent = `${user.fullName} (${user.role})`;
      const logoutBtn = document.getElementById("logout-btn");
      if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
          clearToken();
          location.href = "/login.html";
        });
      }
      return user;
    } catch (_error) {
      clearToken();
      location.href = "/login.html";
      return null;
    }
  }

  function normalizePatient(raw = {}) {
    const address = raw.address || {};
    const doctor = raw.doctor || {};
    const bill = raw.bill || {};
    return {
      ...raw,
      patientId: raw.patientId ?? "",
      name: raw.name ?? "",
      age: raw.age ?? "",
      gender: raw.gender ?? "",
      phone: raw.phone ?? "",
      email: raw.email ?? "",
      bloodGroup: raw.bloodGroup ?? "",
      isAdmitted: raw.isAdmitted ?? false,
      admissionDate: raw.admissionDate ?? "",
      address: {
        street: address.street ?? "",
        city: address.city ?? "",
        state: address.state ?? "",
        pincode: address.pincode ?? "",
      },
      doctor: {
        doctorId: doctor.doctorId ?? "",
        name: doctor.name ?? "",
        specialization: doctor.specialization ?? "",
        phone: doctor.phone ?? "",
      },
      diseases: Array.isArray(raw.diseases) ? raw.diseases : [],
      treatments: Array.isArray(raw.treatments) ? raw.treatments : [],
      medicines: Array.isArray(raw.medicines) ? raw.medicines : [],
      bill: {
        roomCharges: bill.roomCharges ?? 0,
        treatmentCharges: bill.treatmentCharges ?? 0,
        medicineCharges: bill.medicineCharges ?? 0,
        totalAmount: bill.totalAmount ?? 0,
        isPaid: bill.isPaid ?? false,
      },
    };
  }

  window.HMS = {
    api,
    showToast,
    requireAuth,
    getToken,
    setToken,
    clearToken,
    normalizePatient,
  };
})();

const { api, showToast, getToken, setToken } = window.HMS;

if (getToken()) {
  location.href = "/dashboard.html";
}

const tabLogin = document.getElementById("tab-login");
const tabSignup = document.getElementById("tab-signup");
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");

tabLogin.addEventListener("click", () => {
  tabLogin.classList.add("active");
  tabSignup.classList.remove("active");
  loginForm.classList.remove("hidden");
  signupForm.classList.add("hidden");
});

tabSignup.addEventListener("click", () => {
  tabSignup.classList.add("active");
  tabLogin.classList.remove("active");
  signupForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
});

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await api("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        fullName: document.getElementById("signup-name").value.trim(),
        email: document.getElementById("signup-email").value.trim(),
        role: document.getElementById("signup-role").value.trim(),
        password: document.getElementById("signup-password").value,
      }),
    });
    showToast("Account created. Please login.");
    tabLogin.click();
  } catch (error) {
    showToast(error.message, true);
  }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const data = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: document.getElementById("login-email").value.trim(),
        password: document.getElementById("login-password").value,
      }),
    });
    setToken(data.token);
    showToast("Login successful");
    setTimeout(() => {
      location.href = "/dashboard.html";
    }, 300);
  } catch (error) {
    showToast(error.message, true);
  }
});

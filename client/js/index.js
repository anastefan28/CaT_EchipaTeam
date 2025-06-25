//dom elements
const loginToggle = document.getElementById("loginToggle");
const registerToggle = document.getElementById("registerToggle");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const registerError = document.getElementById("registerError");
const loginError = document.getElementById("loginError");
//helpers
function showError(el, msg) {
  if (el) {
    el.textContent = msg;
    el.classList.remove("hidden");
  }
}

function hideError(el) {
  if (el) {
    el.textContent = "";
    el.classList.add("hidden");
  }
}
async function postJSON(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Unexpected error");
  return data;
}
function validatePassword(password) {
  const rules = [
    { test: /.{8,}/, message: "At least 8 characters" },
    { test: /[a-z]/, message: "At least one lowercase letter" },
    { test: /[A-Z]/, message: "At least one uppercase letter" },
    { test: /\d/, message: "At least one number" },
    { test: /[!@#$%^&*()_\-+=[\]{};':"\\|,.<>/?]/, message: "At least one special character" },
  ];
  return rules.filter(rule => !rule.test.test(password)).map(rule => rule.message);
}
//login/register toggle
loginToggle.addEventListener("click", () => {
  loginToggle.classList.add("active");
  registerToggle.classList.remove("active");
  loginForm.classList.remove("hidden");
  registerForm.classList.add("hidden");
});

registerToggle.addEventListener("click", () => {
  registerToggle.classList.add("active");
  loginToggle.classList.remove("active");
  registerForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
});
//google auth
document.getElementById("googleLogin").addEventListener("click", () => {
  window.location.href = "/api/auth/google";
});

document.getElementById("googleRegister").addEventListener("click", () => {
  window.location.href = "/api/auth/google";
});
//normal login/register
loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideError(loginError);

  const email = document.getElementById("loginEmail")?.value;
  const password = document.getElementById("loginPassword")?.value;

  try {
    await postJSON("/api/auth/login", { email, password });
    const res = await fetch("/api/me");
    const user = await res.json();

    if (user.role === "admin") {
      window.location.href = "/admin";
    } else {
      window.location.href = "/dashboard";
    }
  } catch (err) {
    showError(loginError, err.message || "Login failed.");
  }
});

registerForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideError(registerError);

  const name = document.getElementById("registerName")?.value;
  const email = document.getElementById("registerEmail")?.value;
  const password = document.getElementById("registerPassword")?.value;
  const confirmPassword = document.getElementById("confirmPassword")?.value;

  if (password !== confirmPassword) {
    return showError(registerError, "Passwords do not match.");
  }

  try {
    await postJSON("/api/auth/register", {
      username: name,
      email,
      password,
      role: "member",
    });
    window.location.href = "/index";
  } catch (err) {
    console.error("Registration error:", err);
    showError(registerError, err.message || "Registration failed.");
  }
});
const passwordInput = document.getElementById("registerPassword");
const passwordHint = document.getElementById("passwordHint");

passwordInput.addEventListener("input", () => {
  const errors = validatePassword(passwordInput.value);
  if (errors.length > 0) {
    passwordHint.textContent = "⚠️ " + errors.join(", ");
    passwordHint.classList.remove("hidden");
  } else {
    passwordHint.classList.add("hidden");
    passwordHint.textContent = "";
  }
});



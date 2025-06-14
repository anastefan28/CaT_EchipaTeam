const loginToggle = document.getElementById("loginToggle");
const registerToggle = document.getElementById("registerToggle");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const registerError = document.getElementById("registerError");
const loginError = document.getElementById("loginError");

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

document.getElementById("googleLogin").addEventListener("click", () => {
  window.location.href = "/api/auth/google";
});

document.getElementById("googleRegister").addEventListener("click", () => {
  window.location.href = "/api/auth/google";
});

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

document.getElementById("forgotPassword").addEventListener("click", (e) => {
  e.preventDefault();
  alert("Password reset functionality would be implemented here.");
});

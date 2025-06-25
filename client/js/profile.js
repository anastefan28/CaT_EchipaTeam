document.addEventListener("DOMContentLoaded", () => {
  loadUserData();
});

async function loadUserData() {
  try {
    const res = await fetch("/api/me");
    switch (res.status) {
      case 200:
        user = await res.json();
        break;
      case 401:
        throw new Error("Unauthorized – please sign in");
      case 404:
        throw new Error("User not found");
      case 500:
        throw new Error("Server had an issue");
    }
    if (user.oauth_provider) {
      document.getElementById("changePasswordBtn").style.display = "none";
    }
    document.getElementById("email").value = user.email;
    document.getElementById("username").value = user.username;

    const badgeHost = document.getElementById("statusBadge");
    const stBadge = document.createElement("span");
    stBadge.className = `status-badge status-${user.role}`;
    stBadge.textContent = capitalize(user.role);
    badgeHost.appendChild(stBadge);

    document.getElementById("memberSince").textContent = new Date(
      user.created_at
    ).toLocaleDateString();

    const typeHost = document.getElementById("accountType");
    typeHost.append(user.oauth_provider ? "OAuth" : "Regular", " ");
    const badge = document.createElement("span");
    badge.className = "oauth-badge";
    badge.textContent = user.oauth_provider || "Local";
    typeHost.appendChild(badge);

    document.getElementById("userId").textContent = user.id;
  } catch (err) {
    console.error("Error loading user data:", err);
    window.location.href = "/index";
  }
}
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

document.getElementById("profileForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = { username: document.getElementById("username").value };
  try {
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(formData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Update failed");
    }
    const result = await res.json();
    console.log("Profile update:", result);
    showMessage("Profile updated successfully!", "success");
  } catch (err) {
    console.error("Error updating profile:", err.message);
    showMessage(` ${err.message}`, "error");
  }
});

document.getElementById("changePasswordBtn").addEventListener("click", () => {
  document.getElementById("passwordCard").style.display = "block";
});

document.getElementById("cancelPasswordBtn").addEventListener("click", () => {
  document.getElementById("passwordForm").reset();
  document.getElementById("passwordCard").style.display = "none";
});

document.getElementById("passwordForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (newPassword !== confirmPassword) {
      showMessage("New passwords do not match.", "error", "#passwordCard");
      return;
    }
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Password update failed");
      }
      document.getElementById("passwordForm").reset();
      document.getElementById("passwordCard").style.display = "none";
      showMessage( " Password updated successfully!","success","#passwordCard");
    } catch (err) {
      showMessage(`⚠️ ${err.message}`, "error", "#passwordCard");
    }
  });

function showMessage(message, type, containerSelector = ".main-container") {
  const existingMessages = document.querySelectorAll(
    ".success-message, .error-message"
  );
  existingMessages.forEach((msg) => msg.remove());

  const messageDiv = document.createElement("div");
  messageDiv.className =
    type === "success" ? "success-message" : "error-message";
  messageDiv.textContent = message;

  const container = document.querySelector(containerSelector);
  if (container) container.insertBefore(messageDiv, container.firstChild);

  setTimeout(() => messageDiv.remove(), 5000);
}

document.getElementById("logoutBtn").addEventListener("click", async (e) => {
  e.preventDefault();
  try {
    const res = await fetch("/api/auth/logout", { method: "POST" });
    if (!res.ok) throw new Error("Logout failed");
  } catch (err) {
    showMessage(`⚠️ ${err.message}`, "error");
  }
  window.location.href = "/index";
});
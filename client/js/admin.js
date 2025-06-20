let currentTab = "users";
let currentEditType = null;
let currentEditId = null;

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      switchTab(btn.getAttribute("data-tab"));
    });
  });

  fetchDashboardStats();
  fetchUsers();
  fetchCampsites();
  fetchBookings();

  document.getElementById("userForm").addEventListener("submit", saveUser);
  document
    .getElementById("campsiteForm")
    .addEventListener("submit", saveCampsite);
  document
    .getElementById("bookingForm")
    .addEventListener("submit", saveBooking);

  document
    .getElementById("bookingSearch")
    .addEventListener("input", filterBookings);
  document
    .getElementById("bookingStatusFilter")
    .addEventListener("change", filterBookings);
  document
    .getElementById("bookingDateFilter")
    .addEventListener("change", filterBookings);

  document.getElementById("userSearch").addEventListener("input", filterUsers);
  document
    .getElementById("userRoleFilter")
    .addEventListener("change", filterUsers);

  document
    .getElementById("campsiteSearch")
    .addEventListener("input", filterCampsites);
  document
    .getElementById("campsiteCountyFilter")
    .addEventListener("change", filterCampsites);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal").forEach((modal) => {
        modal.style.display = "none";
      });
    }
  });

  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.style.display = "none";
      }
    });
  });
});

function switchTab(tab) {
  document
    .querySelectorAll(".tab-btn")
    .forEach((btn) => btn.classList.remove("active"));
  document
    .querySelectorAll(".tab-content")
    .forEach((tabEl) => tabEl.classList.remove("active"));
  document.querySelector(`[data-tab="${tab}"]`).classList.add("active");
  document.getElementById(`${tab}-tab`).classList.add("active");
  currentTab = tab;
}

function closeModal(id) {
  document.getElementById(id).style.display = "none";
  currentEditType = null;
  currentEditId = null;
}

function openUserModal(mode = "create", userId = null) {
  currentEditType = "user";
  currentEditId = userId;

  if (mode === "create") {
    document.getElementById("userModalTitle").textContent = "Add New User";
    document.getElementById("userForm").reset();

    document.getElementById("userPassword").required = true;
  } else {
    document.getElementById("userModalTitle").textContent = "Edit User";
    document.getElementById("userPassword").required = false;
    loadUserData(userId);
  }

  document.getElementById("userModal").style.display = "block";
}

function openCampsiteModal(mode = "create", campsiteId = null) {
  currentEditType = "campsite";
  currentEditId = campsiteId;

  if (mode === "create") {
    document.getElementById("campsiteModalTitle").textContent =
      "Add New Campsite";
    document.getElementById("campsiteForm").reset();
  } else {
    document.getElementById("campsiteModalTitle").textContent = "Edit Campsite";
    loadCampsiteData(campsiteId);
  }

  document.getElementById("campsiteModal").style.display = "block";
}

function openBookingModal() {
  currentEditType = "booking";
  currentEditId = null;
  document.getElementById("bookingModalTitle").textContent = "Add New Booking";
  document.getElementById("bookingForm").reset();
  document.getElementById("bookingModal").style.display = "block";
}

async function loadUserData(userId) {
  try {
    const res = await fetch(`/api/admin/users/${userId}`);

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Failed to fetch user data.");
    }

    const user = await res.json();

    document.getElementById("userName").value = user.username || "";
    document.getElementById("userEmail").value = user.email || "";
    document.getElementById("userPassword").value = "";
    document.getElementById("userRole").value = user.role || "member";
  } catch (err) {
    console.error("Error loading user data:", err.message);
    alert("Error loading user data: " + err.message);
  }
}

async function loadCampsiteData(campsiteId) {
  try {
    const res = await fetch(`/api/admin/campsites/${campsiteId}`);

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Failed to fetch campsite data.");
    }

    const campsite = await res.json();

    document.getElementById("campsiteName").value = campsite.name || "";
    document.getElementById("campsiteDescription").value =
      campsite.description || "";
    document.getElementById("campsiteLat").value = campsite.lat || "";
    document.getElementById("campsiteLon").value = campsite.lon || "";
    document.getElementById("campsiteCapacity").value = campsite.capacity || "";
    document.getElementById("campsitePrice").value = campsite.price || "";
    document.getElementById("campsiteCounty").value = campsite.county || "";
    document.getElementById("campsiteType").value = campsite.type || "tent";
  } catch (err) {
    console.error("Error loading campsite data:", err.message);
    alert("Error loading campsite data: " + err.message);
  }
}

async function fetchUsers() {
  try {
    const res = await fetch("/api/admin/users", {});

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Failed to fetch users.");
    }

    const users = await res.json();
    renderUsers(users);
  } catch (err) {
    console.error("Error fetching users:", err.message);
    alert("Error loading users: " + err.message);
  }
}

function renderUsers(users) {
  const tbody = document.getElementById("usersTableBody");

  while (tbody.firstChild) {
    tbody.removeChild(tbody.firstChild);
  }

  users.forEach((user) => {
    const tr = document.createElement("tr");

    const idCell = document.createElement("td");
    idCell.textContent = user.id;

    const usernameCell = document.createElement("td");
    usernameCell.textContent = user.username;

    const emailCell = document.createElement("td");
    emailCell.textContent = user.email;

    const roleCell = document.createElement("td");
    roleCell.textContent = user.role;

    const dateCell = document.createElement("td");
    dateCell.textContent = new Date(user.created_at).toLocaleDateString();

    const actionsCell = document.createElement("td");

    const editBtn = document.createElement("button");
    editBtn.className = "btn-secondary";
    editBtn.textContent = "✏️";
    editBtn.addEventListener("click", () => openUserModal("edit", user.id));

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn-danger";
    deleteBtn.textContent = "🗑️";
    deleteBtn.addEventListener("click", () => deleteUser(user.id));

    actionsCell.appendChild(editBtn);
    actionsCell.appendChild(deleteBtn);

    tr.appendChild(idCell);
    tr.appendChild(usernameCell);
    tr.appendChild(emailCell);
    tr.appendChild(roleCell);
    tr.appendChild(dateCell);
    tr.appendChild(actionsCell);

    tbody.appendChild(tr);
  });
}

async function fetchCampsites() {
  try {
    const res = await fetch("/api/admin/campsites", {});

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Failed to fetch campsites.");
    }

    const campsites = await res.json();
    renderCampsites(campsites);
  } catch (err) {
    console.error("Error fetching campsites:", err.message);
    alert("Error loading campsites: " + err.message);
  }
}

function renderCampsites(campsites) {
  const tbody = document.getElementById("campsitesTableBody");

  while (tbody.firstChild) {
    tbody.removeChild(tbody.firstChild);
  }

  campsites.forEach((camp) => {
    const tr = document.createElement("tr");

    const idCell = document.createElement("td");
    idCell.textContent = camp.id;

    const nameCell = document.createElement("td");
    nameCell.textContent = camp.name;

    const countyCell = document.createElement("td");
    countyCell.textContent = camp.county;

    const priceCell = document.createElement("td");
    priceCell.textContent = `${camp.price} RON`;

    const ratingCell = document.createElement("td");
    ratingCell.textContent = camp.avg_rating || "N/A";

    const actionsCell = document.createElement("td");

    const editBtn = document.createElement("button");
    editBtn.className = "btn-secondary";
    editBtn.textContent = "✏️";
    editBtn.addEventListener("click", () => openCampsiteModal("edit", camp.id));

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn-danger";
    deleteBtn.textContent = "🗑️";
    deleteBtn.addEventListener("click", () =>
      deleteCampsite(deleteBtn, camp.id)
    );

    actionsCell.appendChild(editBtn);
    actionsCell.appendChild(deleteBtn);

    tr.appendChild(idCell);
    tr.appendChild(nameCell);
    tr.appendChild(countyCell);
    tr.appendChild(priceCell);
    tr.appendChild(ratingCell);
    tr.appendChild(actionsCell);

    tbody.appendChild(tr);
  });
}

async function fetchDashboardStats() {
  try {
    const res = await fetch("/api/admin/stats", {});

    if (!res.ok) throw new Error("Failed to fetch stats.");

    const stats = await res.json();
    document.getElementById("totalUsers").textContent = stats.total_users;
    document.getElementById("totalCampsites").textContent =
      stats.total_campsites;
    document.getElementById("totalBookings").textContent = stats.total_bookings;
  } catch (err) {
    console.error("Dashboard stats error:", err.message);
  }
}

async function fetchBookings() {
  try {
    const res = await fetch("/api/admin/bookings", {});

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Failed to fetch bookings.");
    }

    const bookings = await res.json();
    renderBookings(bookings);
  } catch (err) {
    console.error("Error fetching bookings:", err.message);
    alert("Error loading bookings: " + err.message);
  }
}

function renderBookings(bookings) {
  const tbody = document.getElementById("bookingsTableBody");
  tbody.textContent = "";

  bookings.forEach((booking) => {
    const tr = document.createElement("tr");

    const idCell = document.createElement("td");
    idCell.textContent = booking.id;
    tr.appendChild(idCell);

    const userCell = document.createElement("td");
    userCell.textContent =
      booking.user_name || booking.username || `User ${booking.user_id}`;
    tr.appendChild(userCell);

    const campsiteCell = document.createElement("td");
    campsiteCell.textContent =
      booking.campsite_name || `Campsite ${booking.campsite_id}`;
    tr.appendChild(campsiteCell);

    const startDateCell = document.createElement("td");
    startDateCell.textContent = new Date(
      booking.start_date
    ).toLocaleDateString();
    tr.appendChild(startDateCell);

    const endDateCell = document.createElement("td");
    endDateCell.textContent = new Date(booking.end_date).toLocaleDateString();
    tr.appendChild(endDateCell);

    const totalCell = document.createElement("td");
    totalCell.textContent = `${booking.total} RON`;
    tr.appendChild(totalCell);

    const statusCell = document.createElement("td");
    statusCell.textContent = booking.status;
    tr.appendChild(statusCell);

    const actionsCell = document.createElement("td");

    const editBtn = document.createElement("button");
    editBtn.className = "btn-secondary";
    editBtn.textContent = "✏️";
    editBtn.addEventListener("click", () => editBooking(booking.id));

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn-danger";
    deleteBtn.textContent = "🗑️";
    deleteBtn.addEventListener("click", () => deleteBooking(booking.id));

    actionsCell.appendChild(editBtn);
    actionsCell.appendChild(deleteBtn);
    tr.appendChild(actionsCell);

    tbody.appendChild(tr);
  });
}

function filterUsers() {
  const searchValue = document.getElementById("userSearch").value.toLowerCase();
  const selectedRole = document.getElementById("userRoleFilter").value;

  const rows = document.querySelectorAll("#usersTableBody tr");

  rows.forEach((row) => {
    const username = row.children[1]?.textContent.toLowerCase() || "";
    const email = row.children[2]?.textContent.toLowerCase() || "";
    const role = row.children[3]?.textContent.toLowerCase() || "";

    const matchesSearch =
      username.includes(searchValue) || email.includes(searchValue);
    const matchesRole = !selectedRole || role === selectedRole.toLowerCase();

    row.style.display = matchesSearch && matchesRole ? "" : "none";
  });
}

function filterCampsites() {
  const countyFilter = document
    .getElementById("campsiteCountyFilter")
    .value.toLowerCase();
  const searchInput = document
    .getElementById("campsiteSearch")
    .value.toLowerCase();

  const rows = document.querySelectorAll("#campsitesTableBody tr");

  rows.forEach((row) => {
    const name = row.children[1]?.textContent.toLowerCase() || "";
    const county = row.children[2]?.textContent.toLowerCase() || "";

    const matchesCounty = !countyFilter || county === countyFilter;
    const matchesSearch =
      name.includes(searchInput) || county.includes(searchInput);

    row.style.display = matchesCounty && matchesSearch ? "" : "none";
  });
}

function filterBookings() {
  const searchValue = document
    .getElementById("bookingSearch")
    .value.toLowerCase();
  const statusFilter = document.getElementById("bookingStatusFilter").value;
  const dateFilter = document.getElementById("bookingDateFilter").value;

  const rows = document.querySelectorAll("#bookingsTableBody tr");

  rows.forEach((row) => {
    const user = row.children[1]?.textContent.toLowerCase() || "";
    const campsite = row.children[2]?.textContent.toLowerCase() || "";
    const status = row.children[6]?.textContent.toLowerCase() || "";
    const startDate = new Date(row.children[3]?.textContent || "");
    const endDate = new Date(row.children[4]?.textContent || "");

    const matchesSearch =
      user.includes(searchValue) || campsite.includes(searchValue);
    const matchesStatus =
      !statusFilter || status === statusFilter.toLowerCase();
    const matchesDate =
      !dateFilter ||
      (startDate <= new Date(dateFilter) && endDate >= new Date(dateFilter));

    row.style.display =
      matchesSearch && matchesStatus && matchesDate ? "" : "none";
  });
}

async function saveUser(e) {
  e.preventDefault();

  const username = document.getElementById("userName").value.trim();
  const email = document.getElementById("userEmail").value.trim();
  const password = document.getElementById("userPassword").value;
  const role = document.getElementById("userRole").value;

  if (!username || !email || !role) {
    alert("Please fill in all required fields.");
    return;
  }

  if (!currentEditId && !password) {
    alert("Password is required for new users.");
    return;
  }

  try {
    let res;
    const userData = { username, email, role };

    if (password) {
      userData.password = password;
    }

    if (currentEditId) {
      res = await fetch(`/api/admin/users/${currentEditId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });
    } else {
      res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });
    }

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.error || `Failed to ${currentEditId ? "update" : "create"} user.`
      );
    }

    closeModal("userModal");
    fetchUsers();
    fetchDashboardStats();
  } catch (err) {
    console.error(
      `Error ${currentEditId ? "updating" : "creating"} user:`,
      err
    );
    alert(
      `Error ${currentEditId ? "updating" : "creating"} user: ` + err.message
    );
  }
}

async function saveCampsite(e) {
  e.preventDefault();

  const name = document.getElementById("campsiteName").value.trim();
  const description = document
    .getElementById("campsiteDescription")
    .value.trim();
  const lat = parseFloat(document.getElementById("campsiteLat").value);
  const lon = parseFloat(document.getElementById("campsiteLon").value);
  const capacity = parseInt(document.getElementById("campsiteCapacity").value);
  const price = parseFloat(document.getElementById("campsitePrice").value);
  const county = document.getElementById("campsiteCounty").value.trim();
  const type = document.getElementById("campsiteType").value;

  if (
    !name ||
    isNaN(lat) ||
    isNaN(lon) ||
    !capacity ||
    isNaN(price) ||
    !county ||
    !type
  ) {
    alert("Please fill in all fields correctly.");
    return;
  }

  try {
    let res;
    const campsiteData = {
      name,
      description,
      lat,
      lon,
      capacity,
      price,
      county,
      type,
    };

    if (currentEditId) {
      res = await fetch(`/api/admin/campsites/${currentEditId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campsiteData),
      });
    } else {
      res = await fetch("/api/admin/campsites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campsiteData),
      });
    }

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.error ||
          `Failed to ${currentEditId ? "update" : "create"} campsite.`
      );
    }

    closeModal("campsiteModal");
    fetchCampsites();
    fetchDashboardStats();
    alert(`Campsite ${currentEditId ? "updated" : "created"} successfully!`);
  } catch (err) {
    console.error(
      `Error ${currentEditId ? "updating" : "creating"} campsite:`,
      err
    );
    alert(
      `Error ${currentEditId ? "updating" : "creating"} campsite: ` +
        err.message
    );
  }
}

async function saveBooking(e) {
  e.preventDefault();
  console.log("Save booking functionality needs to be implemented");
}

async function deleteUser(id) {
  if (!confirm("Are you sure you want to delete this user?")) return;

  try {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to delete user.");
    }
    fetchDashboardStats();
    fetchUsers();
    alert("User deleted successfully!");
  } catch (err) {
    console.error("Error deleting user:", err);
    alert("Error deleting user: " + err.message);
  }
}

async function deleteCampsite(btn, id) {
  if (!confirm("Are you sure you want to delete this campsite?")) return;

  try {
    const res = await fetch(`/api/admin/campsites/${id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to delete campsite.");
    }
    fetchDashboardStats();
    fetchCampsites();
    alert("Campsite deleted successfully!");
  } catch (err) {
    console.error("Error deleting campsite:", err);
    alert("Error deleting campsite: " + err.message);
  }
}

function editBooking(id) {
  console.log("Edit booking:", id);
}

async function deleteBooking(id) {
  if (!confirm("Are you sure you want to delete this booking?")) return;

  try {
    const res = await fetch(`/api/admin/bookings/${id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to delete booking.");
    }

    fetchDashboardStats();
    fetchBookings();
    alert("Booking deleted successfully!");
  } catch (err) {
    console.error("Error deleting booking:", err);
    alert("Error deleting booking: " + err.message);
  }
}

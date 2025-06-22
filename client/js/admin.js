let currentTab = "users";
let currentEditType = null;
let currentEditId = null;
let uploadedMediaIds = [];

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

  document.getElementById("logoutBtn").addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) throw new Error("Logout failed");
    } catch (err) {
      console.warn("Logout request failed:", err);
    }
    window.location.href = "/index";
  });

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

    document
      .getElementById("campsiteMedia")
      .addEventListener("change", handleMediaUpload);
  
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
  uploadedMediaIds = [];
  clearMediaPreview();
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
  uploadedMediaIds = [];

  const currentMediaGroup = document.getElementById("currentMediaGroup");
  const uploadGroup = document.getElementById("uploadMediaGroup");

  if (mode === "create") {
    document.getElementById("campsiteModalTitle").textContent =
      "Add New Campsite";
    document.getElementById("campsiteForm").reset();
    clearMediaPreview();

    if (currentMediaGroup) currentMediaGroup.style.display = "none";
    if (uploadGroup) uploadGroup.style.display = "none";
  } else {
    document.getElementById("campsiteModalTitle").textContent = "Edit Campsite";

    if (currentMediaGroup) currentMediaGroup.style.display = "block";
    if (uploadGroup) uploadGroup.style.display = "block";

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
    const res = await fetch(`/api/users/${userId}`);
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
    const res = await fetch(`/api/campsites/${campsiteId}`);
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
    uploadedMediaIds = Array.isArray(campsite.media_ids) ? [...campsite.media_ids] : [];

    loadExistingMedia(uploadedMediaIds);

  } catch (err) {
    console.error("Error loading campsite data:", err.message);
    alert("Error loading campsite data: " + err.message);
  }
}

function loadExistingMedia(mediaIds) {
  const container = document.getElementById("mediaPreviewContainer");
  clearElement(container); 
  mediaIds.forEach((id) => {
    const item = createMediaPreviewItem(`/api/media/${id}`, id, true);
    container.appendChild(item);
  });
}

function createMediaPreviewItem(src, id, isExisting = false) {
  const wrapper = document.createElement("div");
  wrapper.className = "media-preview-item";
  wrapper.dataset.mediaId = id; 
  wrapper.style.position = "relative";
  wrapper.style.display = "inline-block";
  wrapper.style.margin = "5px";

  const img = document.createElement("img");
  img.src = src;
  img.alt = "Media preview";
  img.style.width = "100px";
  img.style.height = "100px";
  img.style.objectFit = "cover";
  img.style.borderRadius = "8px";
  wrapper.appendChild(img);

  const del = document.createElement("button");
  del.type = "button";
  del.innerHTML = "×";
  del.className = "media-delete-btn";
  del.style.cssText = `
    position: absolute;
    top: 5px; right: 5px;
    width: 24px; height: 24px;
    border: none; border-radius: 50%;
    background: rgba(255,0,0,0.8);
    color: #fff; font-size: 16px; line-height: 1;
    cursor: pointer;
  `;
  wrapper.appendChild(del);

  del.addEventListener("click", async () => {
    if (!confirm("Delete this image?")) return;

    try {
      if (isExisting) {
        const res = await fetch(`/api/media/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete media");
      }
      uploadedMediaIds = uploadedMediaIds.filter((mid) => mid !== id);

      wrapper.remove(); 
    } catch (err) {
      alert("Error deleting media: " + err.message);
    }
  });

  return wrapper;
}

function clearMediaPreview() {
  const box = document.getElementById("mediaPreviewContainer");
  if (box) clearElement(box);
  uploadedMediaIds = [];
}

async function updateMediaCampsiteId(mediaIds, campsiteId) {
  if (!mediaIds.length) return;
  await fetch("/api/media/update-campsite", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ media_ids: mediaIds, campsite_id: campsiteId }),
  });
}

async function handleMediaUpload(event) {
  const files = event.target.files;
  if (!files?.length) return;

  const formData = new FormData();


  formData.append("campsite_id", currentEditId || "0");

  for (const file of files) formData.append("data", file);

  try {
    const res = await fetch("/api/media", { method: "POST", body: formData });
    const result = await res.json();

    if (!res.ok) throw new Error(result.error || "Upload failed");

    const newIds = result.media_ids || [];
    uploadedMediaIds = [...new Set([...uploadedMediaIds, ...newIds])];

    const container = document.getElementById("mediaPreviewContainer");
    newIds.forEach((id) => {
      const thumb = createMediaPreviewItem(`/api/media/${id}`, id, false);
      container.appendChild(thumb);
    });

    event.target.value = "";

    alert(
      `Successfully uploaded ${newIds.length} image${
        newIds.length > 1 ? "s" : ""
      }`
    );


  } catch (err) {
    console.error("Media upload error:", err);
    alert("Error uploading media: " + err.message);
  }
}

async function fetchUsers() {
  try {
    const res = await fetch("/api/users", {});

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
    const res = await fetch("/api/campsites", {});

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
    const res = await fetch("/api/stats", {});

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
    const res = await fetch("/api/bookings", {});

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

    const startDate = new Date(booking.start_date);
    const endDate = new Date(booking.end_date);
    const diffDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const nights = diffDays > 0 ? diffDays : 1;
    const total = nights * parseFloat(booking.campsite_price || 0);

    const totalCell = document.createElement("td");
    totalCell.textContent = `${total.toFixed(2)} RON`;
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
      res = await fetch(`/api/users/${currentEditId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });
    } else {
      res = await fetch("/api/users", {
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
      res = await fetch(`/api/campsites/${currentEditId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campsiteData),
      });
    } else {
      res = await fetch("/api/campsites", {
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

  const checkin = document.getElementById("bookingCheckin").value;
  const checkout = document.getElementById("bookingCheckout").value;
  const guests = parseInt(document.getElementById("bookingGuests").value);

  if (!checkin || !checkout || isNaN(guests)) {
    alert("Please fill in all fields.");
    return;
  }

  if (!currentEditId) {
    alert(
      "Booking creation from admin is not allowed. Select an existing booking to edit."
    );
    return;
  }

  try {
    const bookingData = { checkin, checkout, guests };

    const res = await fetch(`/api/bookings/${currentEditId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookingData),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to update booking.");
    }

    closeModal("bookingModal");
    fetchBookings();
    fetchDashboardStats();
    alert("Booking updated successfully!");
  } catch (err) {
    console.error("Error updating booking:", err);
    alert("Error updating booking: " + err.message);
  }
}

async function deleteUser(id) {
  if (!confirm("Are you sure you want to delete this user?")) return;

  try {
    const res = await fetch(`/api/users/${id}`, {
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
    const res = await fetch(`/api/campsites/${id}`, {
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

async function editBooking(id) {
  currentEditType = "booking";
  currentEditId = id;

  try {
    const res = await fetch(`/api/bookings/${id}`);
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Failed to fetch booking data.");
    }

    const booking = await res.json();
    document.getElementById("bookingCheckin").value = booking.checkin;
    document.getElementById("bookingCheckout").value = booking.checkout;
    document.getElementById("bookingGuests").value = booking.guests;

    document.getElementById("bookingModalTitle").textContent = "Edit Booking";
    document.getElementById("bookingModal").style.display = "block";
  } catch (err) {
    console.error("Error loading booking:", err.message);
    alert("Error loading booking: " + err.message);
  }
}

async function deleteBooking(id) {
  if (!confirm("Are you sure you want to delete this booking?")) return;

  try {
    const res = await fetch(`/api/bookings/${id}`, {
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

function clearElement(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

(function () {
  document.addEventListener("DOMContentLoaded", initExportButtons);

  function initExportButtons() {
    [
      { tab: "users", table: "usersTableBody" },
      { tab: "campsites", table: "campsitesTableBody" },
      { tab: "bookings", table: "bookingsTableBody" },
    ].forEach(({ tab, table }) => {
      const host = document.querySelector(`#${tab}-tab .action-header`);
      if (!host) return;

      const controlBox = document.createElement("div");
      controlBox.style.display = "flex";
      controlBox.style.gap = "6px";
      controlBox.style.marginLeft = "auto";
      controlBox.style.marginRight = "10px";

      const svgBtn = document.createElement("button");
      svgBtn.className = "btn-secondary";
      svgBtn.textContent = "🖼 SVG";
      svgBtn.addEventListener("click", () =>
        exportTableToSvg(table, `${tab}.svg`)
      );
      controlBox.appendChild(svgBtn);

      const pdfBtn = document.createElement("button");
      pdfBtn.className = "btn-secondary";
      pdfBtn.textContent = "📄 PDF";
      pdfBtn.addEventListener("click", () =>
        exportTableToPdf(table, `${tab}.pdf`)
      );
      controlBox.appendChild(pdfBtn);

      const addBtn = host.querySelector(".btn-primary");
      if (addBtn) {
        host.insertBefore(controlBox, addBtn);
      } else {
        host.appendChild(controlBox);
      }
    });
  }

  function exportTableToSvg(tbodyId, filename) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return alert("Table not found.");

    const rows = Array.from(tbody.querySelectorAll("tr")).filter(
      (r) => r.style.display !== "none"
    );
    if (!rows.length) return alert("Nothing to export.");

    const cellPadding = 6,
      fontSize = 12,
      lineHeight = 25,
      colWidths = [];
    rows.forEach((tr) =>
      Array.from(tr.cells).forEach((td, c) => {
        const w =
          td.textContent.trim().length * (fontSize * 0.55) + cellPadding * 2;
        colWidths[c] = Math.max(colWidths[c] || 0, w);
      })
    );

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("xmlns", svgNS);
    svg.setAttribute(
      "width",
      colWidths.reduce((a, b) => a + b, 0)
    );
    svg.setAttribute("height", rows.length * lineHeight);
    svg.setAttribute("font-family", "sans-serif");
    svg.setAttribute("font-size", fontSize);

    let y = fontSize + cellPadding;
    rows.forEach((tr) => {
      let x = 0;
      Array.from(tr.cells).forEach((td, c) => {
        const rect = document.createElementNS(svgNS, "rect");
        rect.setAttribute("x", x);
        rect.setAttribute("y", y - fontSize);
        rect.setAttribute("width", colWidths[c]);
        rect.setAttribute("height", lineHeight);
        rect.setAttribute("fill", "#fff");
        rect.setAttribute("stroke", "#000");
        rect.setAttribute("stroke-width", "0.5");
        svg.appendChild(rect);

        const txt = document.createElementNS(svgNS, "text");
        txt.setAttribute("x", x + cellPadding);
        txt.setAttribute("y", y);
        txt.textContent = td.textContent.trim();
        svg.appendChild(txt);

        x += colWidths[c];
      });
      y += lineHeight;
    });

    downloadBlob(
      new Blob([svg.outerHTML], { type: "image/svg+xml" }),
      filename
    );
  }

  function exportTableToPdf(tbodyId, filename) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return alert("Table not found.");

    const rows = Array.from(tbody.querySelectorAll("tr")).filter(
      (r) => r.style.display !== "none"
    );
    if (!rows.length) return alert("Nothing to export.");

    const table = tbody.closest("table");
    const head = Array.from(table.tHead.rows[0].cells).map((th) =>
      th.textContent.trim()
    );
    const body = rows.map((r) =>
      Array.from(r.cells).map((td) => td.textContent.trim())
    );

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4",
    });

    doc.text(filename.replace(".pdf", "").toUpperCase(), 40, 40);
    doc.autoTable({
      head: [head],
      body,
      startY: 60,
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [80, 80, 80] },
    });

    doc.save(filename);
  }

  function downloadBlob(blob, filename) {
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(blob),
      download: filename,
      style: "display:none",
    });
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 400);
  }

  document
    .getElementById("exportPopularBtn")
    .addEventListener("click", async () => {
      try {
        const res = await fetch("/api/campsites?sort=popular&limit=3");
        if (!res.ok) throw new Error("Failed to fetch popular campsites");

        const campsites = await res.json();
        if (!campsites.length) {
          alert("No popular campsites found.");
          return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: "pt", format: "a4" });

        doc.setFontSize(18);
        doc.text("Top Popular Campsites", 40, 40);

        let y = 70;
        for (const [i, camp] of campsites.entries()) {
          doc.setFontSize(14);
          doc.text(`${i + 1}. ${camp.name}`, 40, y);

          doc.setFontSize(10);
          doc.text(`County: ${camp.county}`, 40, y + 18);
          doc.text(`Type: ${camp.type}`, 40, y + 32);
          doc.text(`Price: ${camp.price} RON`, 200, y + 18);
          doc.text(`Capacity: ${camp.capacity}`, 200, y + 32);
          doc.text(`Rating: ${camp.avg_rating || "N/A"}`, 350, y + 18);

          doc.text("Description:", 40, y + 50);
          doc.setFont("helvetica", "normal");
          doc.text(camp.description || "No description", 40, y + 65, {
            maxWidth: 520,
          });

          if (camp.media_ids && camp.media_ids.length > 0) {
            const imageUrl = `/api/media/${camp.media_ids[0]}`;
            const imageData = await fetch(imageUrl)
              .then((r) => r.blob())
              .then(blobToBase64);

            if (imageData) {
              doc.addImage(imageData, "JPEG", 400, y + 40, 140, 100);
              y += 120;
            }
          }

          y += 100;
          if (y > 700) {
            doc.addPage();
            y = 50;
          }
        }

        doc.save("top-popular-campsites.pdf");
      } catch (err) {
        console.error("Export error:", err);
        alert("Failed to export popular campsites.");
      }
    });

  document
    .getElementById("exportPopularDatesBtn")
    .addEventListener("click", async () => {
      try {
        const campsitesRes = await fetch("/api/campsites");
        if (!campsitesRes.ok) throw new Error("Failed to fetch campsites");

        const campsites = await campsitesRes.json();
        if (!campsites.length) {
          alert("No campsites found.");
          return;
        }

        const allBookingData = [];
        for (const campsite of campsites) {
          try {
            const bookingRes = await fetch(
              `/api/campsites/${campsite.id}/booked`
            );
            if (bookingRes.ok) {
              const bookingData = await bookingRes.json();
              if (bookingData && bookingData.length > 0) {
                allBookingData.push({
                  campsite: campsite.name,
                  county: campsite.county,
                  bookings: bookingData,
                });
              }
            }
          } catch (err) {
            console.warn(`Failed to fetch bookings for ${campsite.name}:`, err);
          }
        }

        if (!allBookingData.length) {
          alert("No booking data found.");
          return;
        }

        const dateFrequency = {};
        const monthFrequency = {};
        const seasonFrequency = { Spring: 0, Summer: 0, Fall: 0, Winter: 0 };

        allBookingData.forEach(({ bookings }) => {
          bookings.forEach((booking) => {
            const checkIn = new Date(booking.checkin);
            const checkOut = new Date(booking.checkout);

            for (
              let d = new Date(checkIn);
              d <= checkOut;
              d.setDate(d.getDate() + 1)
            ) {
              const dateStr = d.toISOString().split("T")[0];
              const monthStr = d.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              });

              dateFrequency[dateStr] = (dateFrequency[dateStr] || 0) + 1;
              monthFrequency[monthStr] = (monthFrequency[monthStr] || 0) + 1;

              const month = d.getMonth() + 1;
              if (month >= 3 && month <= 5) seasonFrequency.Spring++;
              else if (month >= 6 && month <= 8) seasonFrequency.Summer++;
              else if (month >= 9 && month <= 11) seasonFrequency.Fall++;
              else seasonFrequency.Winter++;
            }
          });
        });

        const topDates = Object.entries(dateFrequency)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10);

        const topMonths = Object.entries(monthFrequency)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 6);

        const topSeasons = Object.entries(seasonFrequency).sort(
          ([, a], [, b]) => b - a
        );

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: "pt", format: "a4" });

        doc.setFontSize(18);
        doc.text("Popular Booking Dates Analysis", 40, 40);

        let y = 80;

        doc.setFontSize(14);
        doc.text("Top 10 Most Popular Booking Dates", 40, y);
        y += 30;

        doc.setFontSize(10);
        topDates.forEach(([date, count], index) => {
          const formattedDate = new Date(date).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          });
          doc.text(`${index + 1}. ${formattedDate} - ${count} bookings`, 50, y);
          y += 18;
        });

        y += 20;

        doc.setFontSize(14);
        doc.text("Most Popular Booking Months", 40, y);
        y += 30;

        doc.setFontSize(10);
        topMonths.forEach(([month, count], index) => {
          doc.text(`${index + 1}. ${month} - ${count} booked days`, 50, y);
          y += 18;
        });

        y += 20;

        doc.setFontSize(14);
        doc.text("Seasonal Booking Distribution", 40, y);
        y += 30;

        doc.setFontSize(10);
        topSeasons.forEach(([season, count], index) => {
          const percentage = (
            (count /
              Object.values(seasonFrequency).reduce((a, b) => a + b, 0)) *
            100
          ).toFixed(1);
          doc.text(
            `${index + 1}. ${season} - ${count} booked days (${percentage}%)`,
            50,
            y
          );
          y += 18;
        });

        if (y > 650) {
          doc.addPage();
          y = 50;
        } else {
          y += 30;
        }

        doc.setFontSize(14);
        doc.text("Booking Activity by Campsite", 40, y);
        y += 30;

        doc.setFontSize(10);
        allBookingData
          .sort((a, b) => b.bookings.length - a.bookings.length)
          .slice(0, 10)
          .forEach(({ campsite, county, bookings }, index) => {
            doc.text(
              `${index + 1}. ${campsite} (${county}) - ${
                bookings.length
              } bookings`,
              50,
              y
            );
            y += 18;

            if (y > 750) {
              doc.addPage();
              y = 50;
            }
          });

        doc.save("popular-booking-dates-analysis.pdf");
      } catch (err) {
        console.error("Export error:", err);
        alert("Failed to export popular booking dates.");
      }
    });

  async function blobToBase64(blob) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }
})();
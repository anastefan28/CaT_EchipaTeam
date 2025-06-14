import {
  getAllUsers,
  deleteUserById,
  findUserByEmail,
  findUserById,
  createUser,
  updateUserById,
} from "../models/userModel.js";
import {
  getCampsites,
  createCampsite,
  deleteCampsiteById,
  findCampsiteById,
  updateCampsiteById,
} from "../models/campsiteModel.js";
import { getAdminStats } from "../models/adminModel.js";
import { getBookings } from "../models/adminModel.js";
import { sendJson, json } from "../utils/json.js";
import bcrypt from "bcrypt";

export async function handleAdminUsers(req, res) {
  const users = await getAllUsers();
  sendJson(res, 200, users);
}

export async function handleCreateUser(req, res) {
  try {
    const { username, email, password, role, confirmed } = await json(req);

    if (!username || !email || !password || !role) {
      return sendJson(res, 400, { error: "All fields are required." });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return sendJson(res, 409, { error: "Email is already registered." });
    }

    const hashed = await bcrypt.hash(password, 10);
    await createUser({ username, email, password: hashed, role,confirmed });

    return sendJson(res, 201, {
      success: true,
      message: "User created successfully.",
    });
  } catch (err) {
    console.error("Register error:", err);
    return sendJson(res, 500, { error: "Internal server error." });
  }
}

export async function handleAdminCampsites(req, res) {
  if (req.user.role !== "admin") {
    return sendJson(res, 403, { error: "Admin access required." });
  }

  const campsites = await getCampsites();
  sendJson(res, 200, campsites);
}

export async function handleAdminStats(req, res) {
  const stats = await getAdminStats();
  sendJson(res, 200, stats);
}

export async function handleAdminBookings(req, res) {
  if (req.user.role !== "admin") {
    return sendJson(res, 403, { error: "Admin access required." });
  }

  const bookings = await getBookings();
  sendJson(res, 200, bookings);
}

export async function handleDeleteUser(req, res) {
  const id = req.params?.id || req.url.split("/").pop();

  try {
    const deleted = await deleteUserById(id);

    if (!deleted) {
      return sendJson(res, 404, { error: "User not found" });
    }

    return sendJson(res, 200, {
      success: true,
      message: "User deleted successfully",
    });
  } catch (err) {
    console.error("Delete user error:", err);
    return sendJson(res, 500, { error: "Internal server error" });
  }
}

export async function handleCreateCampsite(req, res) {
  try {
    const { name, description, lat, lon, capacity, price, county, type } =
      await json(req);

    if (
      !name ||
      lat === undefined ||
      lon === undefined ||
      !capacity ||
      price === undefined ||
      !county ||
      !type
    ) {
      return sendJson(res, 400, { error: "Missing required fields." });
    }

    const campsite = await createCampsite({
      name,
      description,
      lat,
      lon,
      capacity,
      price,
      county,
      type,
    });

    return sendJson(res, 201, campsite);
  } catch (err) {
    console.error("Create campsite error:", err);
    return sendJson(res, 500, { error: "Failed to create campsite." });
  }
}

export async function handleDeleteCampsite(req, res) {
  const id = req.params?.id || req.url.split("/").pop();

  try {
    const deleted = await deleteCampsiteById(id);

    if (!deleted) {
      return sendJson(res, 404, { error: "Campsite not found" });
    }

    return sendJson(res, 200, {
      success: true,
      message: "Campsite deleted successfully",
    });
  } catch (err) {
    console.error("Delete campsite error:", err);
    return sendJson(res, 500, { error: "Internal server error" });
  }
}

export async function handleGetUserById(req, res) {
  const id = req.params?.id || req.url.split("/").pop();

  try {
    const user = await findUserById(id);
    if (!user) {
      return sendJson(res, 404, { error: "User not found" });
    }

    delete user.password;

    return sendJson(res, 200, user);
  } catch (err) {
    console.error("Fetch user error:", err);
    return sendJson(res, 500, { error: "Internal server error" });
  }
}

export async function handleGetCampsiteById(req, res) {
  const id = req.params?.id || req.url.split("/").pop();

  try {
    const campsite = await findCampsiteById(id);
    if (!campsite) {
      return sendJson(res, 404, { error: "Campsite not found" });
    }

    return sendJson(res, 200, campsite);
  } catch (err) {
    console.error("Fetch campsite error:", err);
    return sendJson(res, 500, { error: "Internal server error" });
  }
}

export async function handleUpdateUser(req, res) {
  const id = req.params?.id || req.url.split("/").pop();

  try {
    const { username, email, password, role } = await json(req);

    if (!username || !email || !role) {
      return sendJson(res, 400, { error: "Missing required fields." });
    }

    const existing = await findUserById(id);
    if (!existing) {
      return sendJson(res, 404, { error: "User not found." });
    }

    const updatedUser = {
      username,
      email,
      role,
    };

    if (password) {
      updatedUser.password = await bcrypt.hash(password, 10);
    }

    await updateUserById(id, updatedUser);
    return sendJson(res, 200, {
      success: true,
      message: "User updated successfully.",
    });
  } catch (err) {
    console.error("Update user error:", err);
    return sendJson(res, 500, { error: "Internal server error." });
  }
}

export async function handleUpdateCampsite(req, res) {
  const id = req.params?.id || req.url.split("/").pop();

  try {
    const { name, description, lat, lon, capacity, price, county, type } =
      await json(req);

    if (
      !name ||
      lat === undefined ||
      lon === undefined ||
      !capacity ||
      price === undefined ||
      !county ||
      !type
    ) {
      return sendJson(res, 400, { error: "Missing required fields." });
    }

    const existing = await findCampsiteById(id);
    if (!existing) {
      return sendJson(res, 404, { error: "Campsite not found." });
    }

    await updateCampsiteById(id, {
      name,
      description,
      lat,
      lon,
      capacity,
      price,
      county,
      type,
    });

    return sendJson(res, 200, {
      success: true,
      message: "Campsite updated successfully.",
    });
  } catch (err) {
    console.error("Update campsite error:", err);
    return sendJson(res, 500, { error: "Internal server error." });
  }
}

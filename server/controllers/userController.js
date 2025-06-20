import { verifyJWT , getJWT} from "../utils/jwt.js";
import { getAllUsers, getUserById, updateUserById, findUserByEmail, deleteUserById, createUser} from "../models/userModel.js";
import { sendJson, json } from "../utils/json.js";
import { AppError } from "../utils/appError.js";
import bcrypt from "bcrypt";

export async function handleMe(req, res) {
  const token = getJWT(req);
  const payload = verifyJWT(token);
  if (!payload) {
    throw new AppError('Invalid token', 401);
  }

  const user = await getUserById(payload.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  sendJson(res, 200, user);
}

export async function handleUpdateUser(req, res) {
  const id = req.params?.id || req.url.split("/").pop();

  try {
    const { username, email, password, role } = await json(req);
    if (!username || !email || !role) {
      return sendJson(res, 400, { error: "Missing required fields." });
    }
    const existing = await getUserById(id);
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
export async function handleGetUserById(req, res) {
  const id = req.params?.id || req.url.split("/").pop();

  try {
    const user = await getUserById(id);
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

export async function handleCreateUser(req, res) {
  try {
    const { username, email, password, role } = await json(req);

    if (!username || !email || !password || !role) {
      return sendJson(res, 400, { error: "All fields are required." });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return sendJson(res, 409, { error: "Email is already registered." });
    }

    const hashed = await bcrypt.hash(password, 10);
    await createUser({ username, email, password: hashed, role });

    return sendJson(res, 201, {
      success: true,
      message: "User created successfully.",
    });
  } catch (err) {
    console.error("Register error:", err);
    return sendJson(res, 500, { error: "Internal server error." });
  }
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

export async function handleGetAllUsers(req, res) {
  const users = await getAllUsers();
  sendJson(res, 200, users);
}
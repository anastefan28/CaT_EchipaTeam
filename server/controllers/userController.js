import { getUserById, updateUserById, findUserByEmail, deleteUserById, createUser, getAllUsers } from "../models/userModel.js";
import { sendJson} from "../utils/json.js";
import { AppError } from "../utils/appError.js";
import bcrypt from "bcrypt";
import{isValidId} from "../utils/valid.js";
export async function handleMe(req, res) {
  const user = await getUserById(req.user.id);
  sendJson(res, 200, user);
}

export async function handleUpdateUser(req, res) {
  const id = req.params?.id || req.url.split("/").pop();
  try {
    if(!isValidId(id)) {
      throw new AppError("Invalid user id", 400);
    }
    const { username, email, password, role } = req.body;
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
    await updateUserById(id, updatedUser, 'admin');
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
  if (!isValidId(id)) {
    return sendJson(res, 400, { error: "Invalid user ID" });
  }
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
    const { username, email, password, role,confirmed } = req.body;
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

export async function handleDeleteUser(req, res) {
  const id = req.params?.id || req.url.split("/").pop();
  if (!isValidId(id)) {
    return sendJson(res, 400, { error: "Invalid user ID" });
  }
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

export async function handlePatchMe(req, res) {
  const userId = req.user.id;
  const user = await getUserById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  const { username, currentPassword, newPassword } = req.body;
  if (username !== undefined) {
    await updateUserById(user.id, { username },'member');
  }
  if (currentPassword || newPassword) {
    if(user.oauth_provider)
      throw new AppError('Cannot change password for OAuth users.', 403);
    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match)
      throw new AppError('Current password is incorrect.', 401);
    const newHash = await bcrypt.hash(newPassword, 12);
    await updateUserById(user.id, { password: newHash }, 'member');
  }
  return sendJson(res, 200, { success: true, message: "Account updated." });
}
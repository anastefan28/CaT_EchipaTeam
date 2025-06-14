import { googleClient, nonce } from "../config/google.js";
import {
  findUserByOAuthSub,
  createOAuthUser,
  confirmUserByToken,
} from "../models/userModel.js";
import { generateJWT } from "../utils/jwt.js";
import { serialize } from "cookie";
import {
  findUserByEmail,
  validatePassword,
  createUser,
} from "../models/userModel.js";
import { sendJson, json } from "../utils/json.js";
import bcrypt from "bcrypt";
import { AppError } from "../utils/appError.js";

import crypto from "crypto";
import { sendConfirmationEmail } from "../utils/mailer.js";


export async function handleLogin(req, res) {
  const { email, password } = await json(req);
  if (!email || !password) {
    throw new AppError("Email and password are required.", 400);
  }

  const user = await findUserByEmail(email);
  if (
    user.password_hash === null || user.password_hash === null ||
    !(await validatePassword(password, user.password_hash))
  ) {
    throw new AppError(
      "Invalid credentials. If you don’t have an account, please register first.",
      401
    );
  }

  if (!user.confirmed) {
    throw new AppError("Please confirm your email before logging in.", 401);
  }

  const token = generateJWT(user);
  res.writeHead(200, {
    "Set-Cookie": serialize("token", token, {
      httpOnly: true,
      path: "/",
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    }),
    "Content-Type": "application/json",
  });
  res.end(
    JSON.stringify({
      success: true,
      user: { id: user.id, username: user.username, email: user.email },
    })
  );
}

export async function handleRegister(req, res) {
  const { username, email, password, role } = await json(req);

  if (!username || !email || !password || !role) {
    throw new AppError("All fields are required.", 400);
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    throw new AppError("Email is already registered.", 409);
  }

  const hashed = await bcrypt.hash(password, 10);
  const confirmationToken = crypto.randomUUID();

  const user = await createUser({
    username,
    email,
    password: hashed,
    role,
    confirmationToken,
  });
  console.log(
    "Sending confirmation email to:",
    email,
    "with token:",
    confirmationToken
  );

  await sendConfirmationEmail(email, confirmationToken);

  res.writeHead(201, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ success: true }));
}

export function handleLogout(req, res) {
  res.writeHead(302, {
    "Set-Cookie": "token=; HttpOnly; Path=/; Max-Age=0",
    Location: "/",
  });
  res.end();
}

export async function handleGoogleCallback(req, res) {
  const params = googleClient.callbackParams(req);
  const tokenSet = await googleClient.callback(
    "http://localhost:8000/api/auth/google/callback",
    params,
    { nonce }
  );

  const userinfo = await googleClient.userinfo(tokenSet.access_token);

  let user = await findUserByOAuthSub(userinfo.sub);
  if (!user) {
    user = await createOAuthUser({
      email: userinfo.email,
      username: userinfo.name,
      oauth_provider: "google",
      oauth_sub: userinfo.sub,
    });
  }

  const jwtToken = generateJWT(user);
  res.writeHead(302, {
    "Set-Cookie": serialize("token", jwtToken, {
      httpOnly: true,
      path: "/",
      maxAge: 3600,
    }),
    Location: "/dashboard",
  });
  res.end();
}

export async function handleEmailConfirmation(req, res) {
  const urlParts = new URL(req.url, `http://${req.headers.host}`);
  const token = urlParts.searchParams.get("token");

  console.log("Token from URL:", token);

  if (!token)
    return sendJson(res, 400, { error: "Invalid confirmation link." });

  const updated = await confirmUserByToken(token);

  if (!updated)
    return sendJson(res, 404, { error: "Invalid or expired token." });

  res.writeHead(302, { Location: "/confirmation-success" });
  res.end();
}
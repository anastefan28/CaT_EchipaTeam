import { generateAuthUrl } from "../config/google.js";
import {
  handleGoogleCallback,
  handleLogin,
  handleRegister,
  handleLogout,
  handleEmailConfirmation,
} from "../controllers/authController.js";
import { parse } from "url";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendJson } from "../utils/json.js";
import { registerSchema, loginSchema } from "../schemas/authSchema.js";
import { validateBody } from "../middlewares/validate.js";

export async function authRoute(req, res) {
	const { pathname } = parse(req.url, true);
	const { method } = req;
	if (pathname === "/api/auth/google") {
		const url = generateAuthUrl();
		res.writeHead(302, { Location: url });
		return res.end();
	}
	if (pathname === "/api/auth/google/callback") {
		return handleGoogleCallback(req, res);
	}
	if (method === "POST" && pathname === "/api/auth/login") {
		return asyncHandler(validateBody(loginSchema)(handleLogin))(req, res);
	}
	if (method === "POST" && pathname === "/api/auth/register")
		return asyncHandler(validateBody(registerSchema)(handleRegister))(req, res);

	if (method === "POST" && pathname === "/api/auth/logout")
		return asyncHandler(handleLogout)(req, res);

	if (method === "GET" && pathname.startsWith("/api/auth/confirm-email")) {
    return asyncHandler(handleEmailConfirmation)(req, res);
  }
	sendJson(res, 405, { error: "Method not allowed" });
}

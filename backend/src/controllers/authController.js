import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendTokenResponse } from "../utils/token.js";

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  let role = req.body.role || "Member";

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError("Email is already registered", 409);
  }

  if (role === "Admin" && process.env.ALLOW_PUBLIC_ADMIN_SIGNUP === "false") {
    throw new AppError("Admin registration is disabled", 403);
  }

  const user = await User.create({ name, email, password, role });
  sendTokenResponse(user, 201, res);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError("Invalid email or password", 401);
  }

  sendTokenResponse(user, 200, res);
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toJSON() });
});

export const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 }).select("name email role createdAt");
  res.json({ success: true, data: users });
});

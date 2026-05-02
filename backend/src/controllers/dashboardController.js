import asyncHandler from "../utils/asyncHandler.js";
import { getDashboardStats } from "../services/dashboardService.js";

export const getDashboard = asyncHandler(async (req, res) => {
  const stats = await getDashboardStats(req.user);
  res.json({ success: true, data: stats });
});

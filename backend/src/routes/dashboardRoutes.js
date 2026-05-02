import express from "express";
import { getDashboard } from "../controllers/dashboardController.js";
import { protect } from "../middleware/authMiddleware.js";
import { requireDatabase } from "../middleware/databaseMiddleware.js";

const router = express.Router();

router.get("/", requireDatabase, protect, getDashboard);

export default router;

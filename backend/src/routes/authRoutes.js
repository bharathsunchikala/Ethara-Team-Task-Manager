import express from "express";
import { listUsers, login, me, register } from "../controllers/authController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import { requireDatabase } from "../middleware/databaseMiddleware.js";
import { validate } from "../middleware/validate.js";
import { loginSchema, registerSchema } from "../middleware/validators.js";

const router = express.Router();

router.post("/register", requireDatabase, validate(registerSchema), register);
router.post("/login", requireDatabase, validate(loginSchema), login);
router.get("/me", requireDatabase, protect, me);
router.get("/users", requireDatabase, protect, authorize("Admin"), listUsers);

export default router;

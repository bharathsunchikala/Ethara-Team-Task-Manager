import express from "express";
import { listUsers, login, me, register } from "../controllers/authController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { loginSchema, registerSchema } from "../middleware/validators.js";

const router = express.Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.get("/me", protect, me);
router.get("/users", protect, authorize("Admin"), listUsers);

export default router;

import express from "express";
import {
  createTask,
  deleteTask,
  getTask,
  getTasks,
  updateTask,
  updateTaskStatus
} from "../controllers/taskController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import {
  taskCreateSchema,
  taskStatusSchema,
  taskUpdateSchema
} from "../middleware/validators.js";

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(getTasks)
  .post(authorize("Admin"), validate(taskCreateSchema), createTask);

router
  .route("/:id")
  .get(getTask)
  .put(authorize("Admin"), validate(taskUpdateSchema), updateTask)
  .delete(authorize("Admin"), deleteTask);

router.put("/:id/status", validate(taskStatusSchema), updateTaskStatus);

export default router;

import express from "express";
import {
  addProjectMembers,
  createProject,
  deleteProject,
  getProject,
  getProjects,
  removeProjectMember,
  updateProject
} from "../controllers/projectController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import {
  projectCreateSchema,
  projectMembersSchema,
  projectUpdateSchema
} from "../middleware/validators.js";

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(getProjects)
  .post(authorize("Admin"), validate(projectCreateSchema), createProject);

router
  .route("/:id")
  .get(getProject)
  .put(authorize("Admin"), validate(projectUpdateSchema), updateProject)
  .delete(authorize("Admin"), deleteProject);

router.post(
  "/:id/members",
  authorize("Admin"),
  validate(projectMembersSchema),
  addProjectMembers
);
router.delete("/:id/members/:memberId", authorize("Admin"), removeProjectMember);

export default router;

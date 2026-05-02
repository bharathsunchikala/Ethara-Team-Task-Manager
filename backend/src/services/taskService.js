import Project from "../models/Project.js";
import Task from "../models/Task.js";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import { isPastDate } from "../utils/date.js";
import { isProjectMember } from "./projectService.js";

export const ensureValidDueDate = (dueDate) => {
  if (isPastDate(dueDate)) {
    throw new AppError("Due date cannot be in the past", 400);
  }
};

export const ensureValidTaskAssignment = async ({ projectId, assignedTo }) => {
  const [project, assignee] = await Promise.all([
    Project.findById(projectId),
    User.findById(assignedTo)
  ]);

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  if (!assignee) {
    throw new AppError("Assigned user not found", 400);
  }

  if (!isProjectMember(project, assignedTo)) {
    throw new AppError("Assigned user must be a member of the project", 400);
  }

  return { project, assignee };
};

export const assertTaskAccess = (task, user) => {
  if (user.role === "Admin") return;

  const assigneeId = (task.assignedTo?._id || task.assignedTo).toString();

  if (assigneeId !== user._id.toString()) {
    throw new AppError("You do not have access to this task", 403);
  }
};

export const getTaskForUser = async (taskId, user) => {
  const task = await Task.findById(taskId)
    .populate("project", "name description members")
    .populate("assignedTo", "name email role")
    .populate("createdBy", "name email role");

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  assertTaskAccess(task, user);
  return task;
};

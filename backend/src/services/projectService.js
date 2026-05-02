import Project from "../models/Project.js";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";

export const uniqueObjectIds = (ids = []) => {
  return [...new Set(ids.map((id) => id.toString()))];
};

const idToString = (value) => {
  return (value?._id || value).toString();
};

export const ensureUsersExist = async (ids = []) => {
  const uniqueIds = uniqueObjectIds(ids);
  if (uniqueIds.length === 0) return [];

  const users = await User.find({ _id: { $in: uniqueIds } });

  if (users.length !== uniqueIds.length) {
    throw new AppError("One or more users could not be found", 400);
  }

  return users;
};

export const isProjectMember = (project, userId) => {
  return project.members.some((member) => idToString(member) === idToString(userId));
};

export const assertProjectAccess = (project, user) => {
  if (user.role === "Admin") return;

  if (!isProjectMember(project, user._id)) {
    throw new AppError("You do not have access to this project", 403);
  }
};

export const getProjectForUser = async (projectId, user) => {
  const project = await Project.findById(projectId);

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  assertProjectAccess(project, user);
  return project;
};

import Project from "../models/Project.js";
import Task from "../models/Task.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { buildPaginationMeta, parsePagination, parseSort } from "../utils/query.js";
import {
  ensureUsersExist,
  getProjectForUser,
  isProjectMember,
  uniqueObjectIds
} from "../services/projectService.js";

const populateProject = (query) =>
  query
    .populate("members", "name email role")
    .populate("createdBy", "name email role");

export const createProject = asyncHandler(async (req, res) => {
  const memberIds = uniqueObjectIds([...(req.body.members || []), req.user._id]);
  await ensureUsersExist(memberIds);

  const project = await Project.create({
    name: req.body.name,
    description: req.body.description,
    members: memberIds,
    createdBy: req.user._id
  });

  const populatedProject = await populateProject(Project.findById(project._id));
  res.status(201).json({ success: true, data: populatedProject });
});

export const getProjects = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const sort = parseSort(req.query, ["name", "createdAt"], "-createdAt");
  const query = req.user.role === "Admin" ? {} : { members: req.user._id };

  if (req.query.search) {
    query.$or = [
      { name: { $regex: req.query.search, $options: "i" } },
      { description: { $regex: req.query.search, $options: "i" } }
    ];
  }

  const [projects, total] = await Promise.all([
    populateProject(Project.find(query).sort(sort).skip(skip).limit(limit)),
    Project.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: projects,
    pagination: buildPaginationMeta(total, page, limit)
  });
});

export const getProject = asyncHandler(async (req, res) => {
  const project = await getProjectForUser(req.params.id, req.user);
  const [populatedProject, taskSummary] = await Promise.all([
    populateProject(Project.findById(project._id)),
    Task.aggregate([
      { $match: { project: project._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ])
  ]);

  res.json({
    success: true,
    data: {
      ...populatedProject.toObject(),
      taskSummary
    }
  });
});

export const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    throw new AppError("Project not found", 404);
  }

  if (req.body.members) {
    await ensureUsersExist(req.body.members);
    project.members = uniqueObjectIds([...req.body.members, project.createdBy]);
  }

  if (req.body.name !== undefined) project.name = req.body.name;
  if (req.body.description !== undefined) project.description = req.body.description;

  await project.save();

  const populatedProject = await populateProject(Project.findById(project._id));
  res.json({ success: true, data: populatedProject });
});

export const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    throw new AppError("Project not found", 404);
  }

  await Promise.all([
    Task.deleteMany({ project: project._id }),
    Project.deleteOne({ _id: project._id })
  ]);

  res.json({ success: true, message: "Project deleted" });
});

export const addProjectMembers = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    throw new AppError("Project not found", 404);
  }

  const incomingIds = req.body.memberIds || req.body.members || [req.body.memberId];
  await ensureUsersExist(incomingIds);

  project.members = uniqueObjectIds([...project.members, ...incomingIds]);
  await project.save();

  const populatedProject = await populateProject(Project.findById(project._id));
  res.json({ success: true, data: populatedProject });
});

export const removeProjectMember = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    throw new AppError("Project not found", 404);
  }

  const memberId = req.params.memberId;

  if (!isProjectMember(project, memberId)) {
    throw new AppError("User is not a member of this project", 400);
  }

  if (project.createdBy.toString() === memberId.toString()) {
    throw new AppError("Project creator cannot be removed", 400);
  }

  const assignedTasks = await Task.countDocuments({ project: project._id, assignedTo: memberId });
  if (assignedTasks > 0) {
    throw new AppError("Reassign this member's tasks before removing them", 400);
  }

  project.members = project.members.filter((member) => member.toString() !== memberId.toString());
  await project.save();

  const populatedProject = await populateProject(Project.findById(project._id));
  res.json({ success: true, data: populatedProject });
});

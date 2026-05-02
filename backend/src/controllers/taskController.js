import Task from "../models/Task.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { overdueFilter } from "../utils/date.js";
import { buildPaginationMeta, parsePagination, parseSort } from "../utils/query.js";
import {
  assertTaskAccess,
  ensureValidDueDate,
  ensureValidTaskAssignment,
  getTaskForUser
} from "../services/taskService.js";

const populateTask = (query) =>
  query
    .populate("project", "name description members")
    .populate("assignedTo", "name email role")
    .populate("createdBy", "name email role");

const buildTaskQuery = (req) => {
  const query = req.user.role === "Admin" ? {} : { assignedTo: req.user._id };

  if (req.query.project) query.project = req.query.project;
  if (req.query.status) query.status = req.query.status;
  if (req.query.priority) query.priority = req.query.priority;
  if (req.query.assignedTo && req.user.role === "Admin") query.assignedTo = req.query.assignedTo;
  if (req.query.overdue === "true") Object.assign(query, overdueFilter());
  if (req.query.search) {
    query.$or = [
      { title: { $regex: req.query.search, $options: "i" } },
      { description: { $regex: req.query.search, $options: "i" } }
    ];
  }

  return query;
};

export const createTask = asyncHandler(async (req, res) => {
  ensureValidDueDate(req.body.dueDate);
  await ensureValidTaskAssignment({
    projectId: req.body.project,
    assignedTo: req.body.assignedTo
  });

  const task = await Task.create({
    ...req.body,
    createdBy: req.user._id
  });

  const populatedTask = await populateTask(Task.findById(task._id));
  res.status(201).json({ success: true, data: populatedTask });
});

export const getTasks = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const sort = parseSort(
    req.query,
    ["createdAt", "updatedAt", "dueDate", "priority", "status", "title"],
    "dueDate"
  );
  const query = buildTaskQuery(req);

  const [tasks, total] = await Promise.all([
    populateTask(Task.find(query).sort(sort).skip(skip).limit(limit)),
    Task.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: tasks,
    pagination: buildPaginationMeta(total, page, limit)
  });
});

export const getTask = asyncHandler(async (req, res) => {
  const task = await getTaskForUser(req.params.id, req.user);
  res.json({ success: true, data: task });
});

export const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    throw new AppError("Task not found", 404);
  }

  if (req.body.dueDate) {
    ensureValidDueDate(req.body.dueDate);
  }

  const targetProject = req.body.project || task.project;
  const targetAssignee = req.body.assignedTo || task.assignedTo;

  if (req.body.project || req.body.assignedTo) {
    await ensureValidTaskAssignment({
      projectId: targetProject,
      assignedTo: targetAssignee
    });
  }

  Object.assign(task, req.body);
  await task.save();

  const populatedTask = await populateTask(Task.findById(task._id));
  res.json({ success: true, data: populatedTask });
});

export const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    throw new AppError("Task not found", 404);
  }

  await Task.deleteOne({ _id: task._id });
  res.json({ success: true, message: "Task deleted" });
});

export const updateTaskStatus = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    throw new AppError("Task not found", 404);
  }

  assertTaskAccess(task, req.user);
  task.status = req.body.status;
  await task.save();

  const populatedTask = await populateTask(Task.findById(task._id));
  res.json({ success: true, data: populatedTask });
});

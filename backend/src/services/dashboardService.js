import Project from "../models/Project.js";
import Task from "../models/Task.js";
import User from "../models/User.js";
import { overdueFilter } from "../utils/date.js";

const recentTaskPipeline = (taskQuery) =>
  Task.find(taskQuery)
    .sort({ updatedAt: -1 })
    .limit(6)
    .populate("project", "name")
    .populate("assignedTo", "name email")
    .select("title status priority dueDate project assignedTo createdAt updatedAt");

export const getDashboardStats = async (user) => {
  const isAdmin = user.role === "Admin";
  const taskQuery = isAdmin ? {} : { assignedTo: user._id };
  const projectQuery = isAdmin ? {} : { members: user._id };

  const [
    totalTasks,
    completedTasks,
    pendingTasks,
    overdueTasks,
    assignedToMe,
    totalProjects,
    totalUsers,
    recentTasks,
    recentProjects
  ] = await Promise.all([
    Task.countDocuments(taskQuery),
    Task.countDocuments({ ...taskQuery, status: "Completed" }),
    Task.countDocuments({ ...taskQuery, status: { $ne: "Completed" } }),
    Task.countDocuments({ ...taskQuery, ...overdueFilter() }),
    Task.countDocuments({ assignedTo: user._id }),
    Project.countDocuments(projectQuery),
    isAdmin ? User.countDocuments() : Promise.resolve(undefined),
    recentTaskPipeline(taskQuery),
    Project.find(projectQuery)
      .sort({ createdAt: -1 })
      .limit(4)
      .populate("createdBy", "name email")
      .select("name description createdAt createdBy members")
  ]);

  const recentActivity = [
    ...recentTasks.map((task) => ({
      id: task._id,
      type: "task",
      label: task.title,
      status: task.status,
      timestamp: task.updatedAt,
      project: task.project?.name,
      assignedTo: task.assignedTo?.name
    })),
    ...recentProjects.map((project) => ({
      id: project._id,
      type: "project",
      label: project.name,
      timestamp: project.createdAt,
      createdBy: project.createdBy?.name
    }))
  ]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 8);

  return {
    totalTasks,
    completedTasks,
    pendingTasks,
    overdueTasks,
    assignedToMe,
    totalProjects,
    totalUsers,
    recentTasks,
    recentProjects,
    recentActivity
  };
};

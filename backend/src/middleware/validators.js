import Joi from "joi";

const objectId = Joi.string().hex().length(24);

export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(80).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid("Admin", "Member").default("Member")
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const projectCreateSchema = Joi.object({
  name: Joi.string().max(120).required(),
  description: Joi.string().max(1000).allow("").default(""),
  members: Joi.array().items(objectId).default([])
});

export const projectUpdateSchema = Joi.object({
  name: Joi.string().max(120),
  description: Joi.string().max(1000).allow(""),
  members: Joi.array().items(objectId)
}).min(1);

export const projectMembersSchema = Joi.object({
  memberId: objectId,
  members: Joi.array().items(objectId),
  memberIds: Joi.array().items(objectId)
}).or("memberId", "members", "memberIds");

export const taskCreateSchema = Joi.object({
  title: Joi.string().max(160).required(),
  description: Joi.string().max(1500).allow("").default(""),
  status: Joi.string().valid("Todo", "In Progress", "Completed").default("Todo"),
  priority: Joi.string().valid("Low", "Medium", "High", "Urgent").default("Medium"),
  dueDate: Joi.date().required(),
  project: objectId.required(),
  assignedTo: objectId.required()
});

export const taskUpdateSchema = Joi.object({
  title: Joi.string().max(160),
  description: Joi.string().max(1500).allow(""),
  status: Joi.string().valid("Todo", "In Progress", "Completed"),
  priority: Joi.string().valid("Low", "Medium", "High", "Urgent"),
  dueDate: Joi.date(),
  project: objectId,
  assignedTo: objectId
}).min(1);

export const taskStatusSchema = Joi.object({
  status: Joi.string().valid("Todo", "In Progress", "Completed").required()
});

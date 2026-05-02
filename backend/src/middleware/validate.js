import AppError from "../utils/AppError.js";

const sanitizeObject = (value) => {
  if (!value || typeof value !== "object") return value;

  Object.keys(value).forEach((key) => {
    if (typeof value[key] === "string") {
      value[key] = value[key].trim();
    } else if (typeof value[key] === "object") {
      sanitizeObject(value[key]);
    }
  });

  return value;
};

export const validate = (schema, source = "body") => (req, res, next) => {
  const { value, error } = schema.validate(req[source], {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });

  if (error) {
    const message = error.details.map((detail) => detail.message).join(". ");
    throw new AppError(message, 400);
  }

  req[source] = sanitizeObject(value);
  next();
};

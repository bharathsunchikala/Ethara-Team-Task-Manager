import AppError from "../utils/AppError.js";

const handleDuplicateKey = (error) => {
  const field = Object.keys(error.keyValue || {})[0] || "field";
  return new AppError(`${field} already exists`, 409);
};

const handleValidationError = (error) => {
  const message = Object.values(error.errors)
    .map((err) => err.message)
    .join(". ");
  return new AppError(message || "Validation failed", 400);
};

const handleCastError = () => new AppError("Resource not found", 404);

export const notFound = (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
};

export const errorHandler = (error, req, res, next) => {
  let err = error;

  if (error.name === "CastError") err = handleCastError(error);
  if (error.name === "ValidationError") err = handleValidationError(error);
  if (error.code === 11000) err = handleDuplicateKey(error);
  if (error.name === "JsonWebTokenError") err = new AppError("Invalid token", 401);
  if (error.name === "TokenExpiredError") err = new AppError("Token expired", 401);

  const statusCode = err.statusCode || 500;
  const payload = {
    success: false,
    message: err.isOperational ? err.message : "Something went wrong"
  };

  if (process.env.NODE_ENV === "development") {
    payload.stack = err.stack;
  }

  res.status(statusCode).json(payload);
};

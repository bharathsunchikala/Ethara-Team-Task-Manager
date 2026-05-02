import mongoose from "mongoose";
import AppError from "../utils/AppError.js";

export const requireDatabase = (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    next();
    return;
  }

  next(new AppError("Database is not connected yet. Please try again in a moment.", 503));
};

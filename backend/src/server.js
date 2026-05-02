import "dotenv/config";
import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 5000;
const DB_RETRY_INTERVAL_MS = 10000;

const connectWithRetry = async () => {
  try {
    await connectDB();
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    setTimeout(connectWithRetry, DB_RETRY_INTERVAL_MS);
  }
};

const startServer = () => {
  const server = app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
  });

  connectWithRetry();

  process.on("unhandledRejection", (error) => {
    console.error("Unhandled rejection:", error);
  });

  process.on("uncaughtException", (error) => {
    console.error("Uncaught exception:", error);
    server.close(() => process.exit(1));
  });
};

startServer();

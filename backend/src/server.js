import "dotenv/config";
import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
  });

  process.on("unhandledRejection", (error) => {
    console.error("Unhandled rejection:", error);
    server.close(() => process.exit(1));
  });

  process.on("uncaughtException", (error) => {
    console.error("Uncaught exception:", error);
    server.close(() => process.exit(1));
  });
};

startServer();

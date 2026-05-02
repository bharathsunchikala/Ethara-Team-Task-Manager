import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let memoryServer;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  let uri = process.env.MONGO_URI || process.env.MONGO_URL || process.env.DATABASE_URL;

  if (!uri && process.env.NODE_ENV !== "production") {
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri();
    console.log("Using in-memory MongoDB for local development");
  }

  if (!uri) {
    throw new Error("MONGO_URI or MONGO_URL is required");
  }

  mongoose.set("strictQuery", true);

  const connection = await mongoose.connect(uri);
  console.log(`MongoDB connected: ${connection.connection.host}`);
};

process.on("SIGINT", async () => {
  if (memoryServer) {
    await memoryServer.stop();
  }
});

export default connectDB;

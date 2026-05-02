import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let memoryServer;

const connectDB = async () => {
  let uri = process.env.MONGO_URI;

  if (!uri && process.env.NODE_ENV !== "production") {
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri();
    console.log("Using in-memory MongoDB for local development");
  }

  if (!uri) {
    throw new Error("MONGO_URI is required");
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

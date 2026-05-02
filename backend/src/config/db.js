import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let memoryServer;

const buildRailwayMongoUri = () => {
  const { MONGOHOST, MONGOPORT, MONGOUSER, MONGOPASSWORD } = process.env;

  if (!MONGOHOST || !MONGOUSER || !MONGOPASSWORD) {
    return null;
  }

  const username = encodeURIComponent(MONGOUSER);
  const password = encodeURIComponent(MONGOPASSWORD);
  const port = MONGOPORT || "27017";

  return `mongodb://${username}:${password}@${MONGOHOST}:${port}/ethara_team_task_manager?authSource=admin`;
};

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  let uri =
    process.env.MONGO_URI ||
    process.env.MONGO_URL ||
    process.env.DATABASE_URL ||
    buildRailwayMongoUri();

  if (!uri && process.env.NODE_ENV !== "production") {
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri();
    console.log("Using in-memory MongoDB for local development");
  }

  if (!uri) {
    throw new Error("MONGO_URI, MONGO_URL, or Railway Mongo variables are required");
  }

  mongoose.set("strictQuery", true);

  const connection = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000
  });
  console.log(`MongoDB connected: ${connection.connection.host}`);
};

process.on("SIGINT", async () => {
  if (memoryServer) {
    await memoryServer.stop();
  }
});

export default connectDB;

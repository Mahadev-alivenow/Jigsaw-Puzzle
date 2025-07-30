import mongoose from "mongoose";

// MongoDB connection configuration
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/puzzle_craft";
const DB_NAME = "puzzle_craft";

// Updated connection options for newer versions of Mongoose
const connectionOptions = {
  dbName: DB_NAME,
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  // Removed deprecated options:
  // bufferCommands: false, // This is now handled automatically
  // bufferMaxEntries: 0, // This option is no longer supported
};

// Global variable to store the connection promise
let cachedConnection = null;

async function connectDB() {
  // If we already have a cached connection, return it
  if (cachedConnection) {
    console.log("🔄 [Database] Using cached MongoDB connection");
    return cachedConnection;
  }

  try {
    console.log("🔌 [Database] Connecting to MongoDB...");
    console.log("🔌 [Database] Database name:", DB_NAME);
    console.log(
      "🔌 [Database] Connection URI:",
      MONGODB_URI.replace(/\/\/.*@/, "//***:***@"),
    );

    // Create new connection
    cachedConnection = await mongoose.connect(MONGODB_URI, connectionOptions);

    console.log("✅ [Database] Connected to MongoDB successfully");
    console.log(
      "✅ [Database] Connection state:",
      mongoose.connection.readyState,
    );
    console.log(
      "✅ [Database] Database name:",
      mongoose.connection.db.databaseName,
    );

    // Handle connection events
    mongoose.connection.on("error", (error) => {
      console.error("❌ [Database] MongoDB connection error:", error);
      cachedConnection = null;
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ [Database] MongoDB disconnected");
      cachedConnection = null;
    });

    mongoose.connection.on("reconnected", () => {
      console.log("🔄 [Database] MongoDB reconnected");
    });

    return cachedConnection;
  } catch (error) {
    console.error("❌ [Database] Failed to connect to MongoDB:", error);
    cachedConnection = null;
    throw error;
  }
}

// Function to check connection status
export function getConnectionStatus() {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  return {
    state: states[mongoose.connection.readyState] || "unknown",
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    name: mongoose.connection.name,
  };
}

// Function to gracefully close the connection
export async function closeConnection() {
  if (cachedConnection) {
    await mongoose.connection.close();
    cachedConnection = null;
    console.log("🔒 [Database] MongoDB connection closed");
  }
}

export default connectDB;

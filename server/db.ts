import mongoose from "mongoose";

// Connection options for production readiness
const options = {
  maxPoolSize: 10,
  minPoolSize: 2,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 5000,
  family: 4, // Use IPv4
};

// Cache for serverless environments to reuse connection
let isConnected = false;

// Connect to MongoDB with connection caching for serverless
export async function connectDB() {
  // Check for MONGODB_URI here instead of at module load
  if (!process.env.MONGODB_URI) {
    throw new Error(
      "MONGODB_URI must be set. Did you forget to configure MongoDB connection?",
    );
  }

  // Reuse existing connection if available
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log("♻️  Using existing MongoDB connection");
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, options);
    isConnected = true;
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    isConnected = false;
    throw error; // Don't exit in serverless, throw error instead
  }
}

// Graceful shutdown - only for traditional server environments
if (process.env.NODE_ENV !== 'production') {
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
    process.exit(0);
  });
}

// Export mongoose instance for direct access if needed
export { mongoose };

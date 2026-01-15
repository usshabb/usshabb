import mongoose from "mongoose";

if (!process.env.MONGODB_URI) {
  throw new Error(
    "MONGODB_URI must be set. Did you forget to configure MongoDB connection?",
  );
}

// Connection options for production readiness
const options = {
  maxPoolSize: 10,
  minPoolSize: 2,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 5000,
  family: 4, // Use IPv4
};

// Connect to MongoDB
export async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!, options);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log("MongoDB connection closed");
  process.exit(0);
});

// Export mongoose instance for direct access if needed
export { mongoose };

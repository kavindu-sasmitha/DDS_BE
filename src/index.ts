import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routers/authRouter";
import examRoutes from "./routers/examRouter";
import adminRoutes from "./routers/adminRouter";
import aiRouter from "./routers/aiRouter";
import videoRoutes from "./routers/videoRouter";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const DB_URL = process.env.DB_URL as string;

app.use(cors({
  origin: "*",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== Serverless-safe MongoDB connection caching =====
let cachedConnection: typeof mongoose | null = null;

const connectDB = async () => {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }
  try {
    cachedConnection = await mongoose.connect(DB_URL, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log("Connected to MongoDB successfully!");
    return cachedConnection;
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    cachedConnection = null;
    throw error;
  }
};

// Ensure DB is connected before handling any request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(503).json({ 
      message: "Database connection failed. Please try again." 
    });
  }
});

// Health check
app.get("/", (req, res) => {
  res.json({ message: "DINIRU Driving School API is running" });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/exams", examRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/ai", aiRouter);
app.use("/api/v1/videos", videoRoutes);

// ===== Local development only =====
if (process.env.NODE_ENV !== "production") {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`DINIRU Driving School Backend running on port ${PORT}`);
    });
  });
}

export default app;
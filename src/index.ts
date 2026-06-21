import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./config/db";

import authRoutes from "./routers/authRouter";
import examRoutes from "./routers/examRouter"; 
import adminRoutes from "./routers/adminRouter";
import aiRouter from "./routers/aiRouter";
import videoRoutes from "./routers/videoRouter";
import { User } from "./models/userModel";

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("ok")
})



app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/exams", examRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/ai", aiRouter);
app.use("/api/v1/videos", videoRoutes);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`DINIRU Driving School Backend running on port ${PORT}`);
});
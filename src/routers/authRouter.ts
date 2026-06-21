import express from "express";
import {
  registerStudent,
  loginUser,
  refreshTokens,
  getMe,
  googleCheck,
  googleCallback, // <-- අලුත් controller function එක මෙතනට import කළා
} from "../controllers/authController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

// Public auth endpoints
router.post("/register", registerStudent);
router.post("/login", loginUser);
router.post("/refresh-token", refreshTokens);
router.post("/google-check", googleCheck);

router.get("/google/callback", googleCallback); // <-- GET route එකක් විදිහට මෙතනට එකතු කළා

// Protected account profile lookup vector
router.get("/me", protect as any, getMe);

export default router;
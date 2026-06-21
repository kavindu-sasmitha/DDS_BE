import { Router } from "express";
import { askAiTeacher } from "../controllers/aiController";
import { protect } from "../middleware/authMiddleware";

const router = Router();


router.post("/ask-teacher", protect as any, askAiTeacher);

export default router;
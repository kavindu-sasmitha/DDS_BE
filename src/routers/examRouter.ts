import { Router } from "express";
import { 
  createExamPaper, 
  getExamPapers, 
  getSinglePaper,
  updateExamPaper,
  deleteExamPaper,
  submitExam, 
  getMyExamResults 
} from "../controllers/examController";
import { protect, restrictToAdmin } from "../middleware/authMiddleware"; 

const router = Router();


router.use(protect as any); 


router.get("/papers", getExamPapers);
router.get("/papers/:id", getSinglePaper);


router.post("/create", restrictToAdmin as any, createExamPaper);       // Add Paper
router.put("/papers/:id", restrictToAdmin as any, updateExamPaper);    // Update Paper
router.delete("/papers/:id", restrictToAdmin as any, deleteExamPaper); // Delete Paper


router.post("/submit", submitExam as any);
router.get("/my-results", getMyExamResults as any);

export default router;
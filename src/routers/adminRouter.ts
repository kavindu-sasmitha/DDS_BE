import { Router } from "express";
import {
  approveStudent,
  updateExamDate,
  searchStudentFullDetails,
  collectStudentPayment,
  setCourseFee,
  getTrainingEligibleStudents, // 🆕 Imported new controller hook
} from "../controllers/adminController";
import { protect, restrictToAdmin } from "../middleware/authMiddleware";

const router = Router();

// Secure entire route cluster down to authenticated administrative vectors exclusively
router.use(protect as any);
router.use(restrictToAdmin as any);

router.get("/search-student", searchStudentFullDetails);
router.get("/training-eligible", getTrainingEligibleStudents); // 🆕 Added GET route for fetching active training trainees
router.post("/approve/:userId", approveStudent);
router.post("/update-exam-date", updateExamDate);
router.post("/collect-payment", collectStudentPayment);
router.post("/set-course-fee", setCourseFee);

export default router;

import { Router } from "express";
import { 
  addShortVideo, 
  getAllShortVideos, 
  updateShortVideo, 
  deleteShortVideo,
  getSingleVideo 
} from "../controllers/videoController";
import { protect, restrictToAdmin } from "../middleware/authMiddleware";

const router = Router();


router.get("/get-all", protect as any, getAllShortVideos);


router.get("/get/:id", protect as any, restrictToAdmin as any, getSingleVideo); 
router.post("/add", protect as any, restrictToAdmin as any, addShortVideo);
router.put("/update/:id", protect as any, restrictToAdmin as any, updateShortVideo);
router.delete("/delete/:id", protect as any, restrictToAdmin as any, deleteShortVideo);

export default router;
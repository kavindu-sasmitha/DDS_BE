import { Request, Response } from "express";
import { examService } from "../services/examService";

interface AuthRequest extends Request {
  user: {
    sub?: string;
    _id?: string;
    id?: string;
    [key: string]: any;
  };
}

// 1. Create Paper
export const createExamPaper = async (req: Request, res: Response) => {
  try {
    const paper = await examService.createPaper(req.body);
    res
      .status(201)
      .json({ message: "Exam Paper created successfully..!", data: paper });
  } catch (err: any) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Failed to create paper", error: err.message });
  }
};

// 2. Read All Papers (With Pagination)
export const getExamPapers = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  try {
    const papers = await examService.getPapers(skip, limit);
    const totalDataCount = await examService.countPapers();

    res.status(200).json({
      message: "Exam papers retrieved successfully",
      data: papers,
      totalPage: Math.ceil(totalDataCount / limit),
      totalDataCount,
      page,
    });
  } catch (err: any) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Failed to fetch exam papers", error: err.message });
  }
};

const getIdParam = (id: string | string[] | undefined): string | undefined => {
  if (!id) return undefined;
  return Array.isArray(id) ? id[0] : id;
};

// 3. Read Single Paper
export const getSinglePaper = async (req: Request, res: Response) => {
  try {
    const paperId = getIdParam(req.params.id);
    if (!paperId) {
      return res.status(400).json({ message: "Invalid paper id" });
    }

    const paper = await examService.getPaperByIdForStudent(paperId);
    if (!paper) {
      return res.status(404).json({ message: "Exam paper not found" });
    }
    res
      .status(200)
      .json({ message: "Exam paper retrieved successfully", data: paper });
  } catch (err: any) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Failed to fetch exam paper", error: err.message });
  }
};

// 4. Update Paper
export const updateExamPaper = async (req: Request, res: Response) => {
  try {
    const paperId = getIdParam(req.params.id);
    if (!paperId) {
      return res.status(400).json({ message: "Invalid paper id" });
    }

    const updatedPaper = await examService.updatePaper(paperId, req.body);
    if (!updatedPaper) {
      return res
        .status(404)
        .json({ message: "Exam paper not found to update" });
    }
    res.status(200).json({
      message: "Exam paper updated successfully..!",
      data: updatedPaper,
    });
  } catch (err: any) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Failed to update exam paper", error: err.message });
  }
};

// 5. Delete Paper
export const deleteExamPaper = async (req: Request, res: Response) => {
  try {
    const paperId = getIdParam(req.params.id);
    if (!paperId) {
      return res.status(400).json({ message: "Invalid paper id" });
    }

    const deletedPaper = await examService.deletePaper(paperId);
    if (!deletedPaper) {
      return res
        .status(404)
        .json({ message: "Exam paper not found to delete" });
    }
    res.status(200).json({ message: "Exam paper deleted successfully..!" });
  } catch (err: any) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Failed to delete exam paper", error: err.message });
  }
};

// 6. Submit Exam Paper Logic
export const submitExam = async (req: AuthRequest, res: Response) => {
  const { examPaperId, answers } = req.body;

  // 💡 CHANGE: Fallback to alternative user ID properties if sub is undefined
  const studentId = req.user.sub || req.user._id || req.user.id;

  if (!studentId) {
    return res
      .status(401)
      .json({
        message: "Unauthorized! Student ID could not be resolved from token.",
      });
  }

  try {
    const paper = await examService.getPaperByIdForAdmin(examPaperId);
    if (!paper) {
      return res.status(404).json({ message: "Paper details not found" });
    }

    let scoreCount = 0;
    paper.questions.forEach((q, idx) => {
      // Handles both frontend Array approach smoothly
      if (answers[idx] === q.correctOptionIndex) {
        scoreCount++;
      }
    });

    const scorePercentage = Math.round(
      (scoreCount / paper.questions.length) * 100,
    );
    const passed = scorePercentage >= 50;

    const result = await examService.createResult({
      studentId,
      examPaperId,
      score: scorePercentage,
      passed,
      answers, // Expected: Array of numbers [0, 2, 1]
    });

    res.status(200).json({
      message: "Exam evaluated successfully..!",
      score: scorePercentage,
      passed,
      data: result,
    });
  } catch (err: any) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Failed to evaluate exam", error: err.message });
  }
};

// 7. Get My History
export const getMyExamResults = async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  const studentId = req.user.sub || req.user._id || req.user.id;

  if (!studentId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const results = await examService.getStudentResults(studentId, skip, limit);
    const totalDataCount = await examService.countStudentResults(studentId);

    res.status(200).json({
      message: "Student marks history data",
      data: results,
      totalPage: Math.ceil(totalDataCount / limit),
      totalDataCount,
      page,
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      message: "Failed to fetch student performance history",
      error: err.message,
    });
  }
};

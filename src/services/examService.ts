import { Types } from "mongoose";
import { ExamPaper } from "../models/examPaper";
import { ExamResult } from "../models/examResult";

export const examService = {
  // Create a new paper
  createPaper: async (body: any) => {
    return await ExamPaper.create(body);
  },

  // Get papers with pagination (Students don't see answers)
  getPapers: async (skip: number, limit: number) => {
    return await ExamPaper.find()
      .select("-questions.correctOptionIndex")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  },

  // Admin function to view full details including answers
  getPaperByIdForAdmin: async (id: string) => {
    return await ExamPaper.findById(id);
  },

  // Get single paper with options (Students don't see answers)
  getPaperByIdForStudent: async (id: string) => {
    return await ExamPaper.findById(id).select("-questions.correctOptionIndex");
  },

  // Update paper details or questions
  updatePaper: async (id: string, body: any) => {
    return await ExamPaper.findByIdAndUpdate(id, body, { new: true, runValidators: true });
  },

  // Delete paper from system
  deletePaper: async (id: string) => {
    return await ExamPaper.findByIdAndDelete(id);
  },

  // Count total papers
  countPapers: async () => {
    return await ExamPaper.countDocuments();
  },

  // Save student submitted result marks
  createResult: async (resultData: any) => {
    return await ExamResult.create(resultData);
  },

  //get students
  getStudentResults: async (studentId: string, skip: number, limit: number) => {
    return await ExamResult.find({ 
      studentId: new Types.ObjectId(studentId) as any 
    })
      .populate("examPaperId", "title durationMinutes")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  },

  // Count student total results
  countStudentResults: async (studentId: string) => {
    return await ExamResult.countDocuments({ 
      studentId: new Types.ObjectId(studentId) as any 
    });
  }
};
import { Request, Response } from "express";
import { User } from "../models/userModel";
import { Student } from "../models/studentModel";
import { ExamResult } from "../models/examResult";
import { calculatePracticalDate } from "../util/dateHelper";
import { Types } from "mongoose";

export const approveStudent = async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { approved: true },
      { new: true },
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res
      .status(200)
      .json({ message: "Student account approved successfully", data: user });
  } catch (err: any) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Fail to approve student", error: err.message });
  }
};

export const updateExamDate = async (req: Request, res: Response) => {
  const { studentId, examDateStr } = req.body;
  try {
    const examDate = new Date(examDateStr);
    // 💡 Automatically shift forward by 2 months using the helper
    const practicalStartDate = calculatePracticalDate(examDate);

    const queryFilter = Types.ObjectId.isValid(studentId)
      ? { _id: new Types.ObjectId(studentId) }
      : { studentId: studentId };

    const student = await Student.findOneAndUpdate(
      queryFilter as any,
      { examDate, practicalStartDate },
      { new: true },
    );

    if (!student) {
      return res.status(404).json({ message: "Student record not found" });
    }
    res
      .status(200)
      .json({
        message: "Exam date and automatic practical schedule updated",
        data: student,
      });
  } catch (err: any) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Fail to update exam schedule", error: err.message });
  }
};

export const searchStudentFullDetails = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: "Query string parameter required" });
    }

    const searchStr = (query as string).trim();
    let studentProfile = null;
    let userProfile = null;

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(searchStr);

    if (isObjectId) {
      studentProfile = await Student.findById(searchStr);
    }

    if (!studentProfile) {
      studentProfile = await Student.findOne({
        $or: [{ nicNumber: searchStr }, { studentId: searchStr }],
      });
    }

    if (studentProfile) {
      userProfile = await User.findById(studentProfile.userId).select("-password");
    } else {
      userProfile = await User.findOne({ phoneNumber: searchStr }).select("-password");
      if (userProfile) {
        studentProfile = await Student.findOne({ userId: userProfile._id });
      }
    }

    if (!studentProfile || !userProfile) {
      return res.status(404).json({ message: "No matching student records found across the driving school system" });
    }

    const marksHistory = await ExamResult.find({
      studentId: studentProfile._id
    } as any)
      .populate("examPaperId", "title")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Student records located successfully",
      data: {
        ...studentProfile.toObject(),
        userId: userProfile.toObject(),
        marksHistory
      }
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: "Fail to execute look up query", error: err.message });
  }
};

export const setCourseFee = async (req: Request, res: Response) => {
  const { studentId, totalFee } = req.body;

  if (!studentId || !totalFee) {
    return res
      .status(400)
      .json({ message: "studentId and totalFee are required." });
  }

  try {
    const queryFilter = Types.ObjectId.isValid(studentId)
      ? { _id: new Types.ObjectId(studentId) }
      : { studentId: studentId };

    const student = await Student.findOne(queryFilter);
    if (!student) {
      return res.status(404).json({ message: "Student record not found." });
    }

    const feeNum = parseFloat(totalFee);
    student.set("totalFee", feeNum);
    if (!student.paymentHistory || student.paymentHistory.length === 0) {
      student.set("remainingBalance", feeNum);
    } else {
      const totalPaid = student.paymentHistory.reduce(
        (sum, p) => sum + (p.amount || 0),
        0,
      );
      student.set("remainingBalance", feeNum - totalPaid);
    }

    const updatedStudent = await student.save();
    res
      .status(200)
      .json({
        message: "Total course fee configured successfully!",
        data: updatedStudent,
      });
  } catch (err: any) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Failed to set course fee", error: err.message });
  }
};

export const collectStudentPayment = async (req: Request, res: Response) => {
  const { studentId, amountPaid } = req.body;

  if (!studentId || !amountPaid) {
    return res
      .status(400)
      .json({ message: "studentId and amountPaid are required fields." });
  }

  try {
    const queryFilter = Types.ObjectId.isValid(studentId)
      ? { _id: new Types.ObjectId(studentId) }
      : { studentId: studentId };

    const student = await Student.findOne(queryFilter);
    if (!student) {
      return res.status(404).json({ message: "Student record not found." });
    }

    const totalFee = student.get("totalFee") || 0;
    if (totalFee === 0) {
      return res
        .status(400)
        .json({
          message:
            "Please set the Total Course Fee for this student before collecting payments.",
        });
    }

    const paymentAmount = parseFloat(amountPaid);
    const currentRemaining =
      student.get("remainingBalance") !== undefined
        ? student.get("remainingBalance")
        : totalFee;

    if (paymentAmount > currentRemaining) {
      return res
        .status(400)
        .json({
          message: `Paying amount exceeds the remaining balance of Rs. ${currentRemaining}`,
        });
    }

    const nextInstallmentNumber = (student.paymentHistory?.length || 0) + 1;
    student.paymentHistory.push({
      installmentNumber: nextInstallmentNumber,
      amount: paymentAmount,
      status: "COMPLETED",
      paidDate: new Date(),
    } as any);

    const newRemaining = currentRemaining - paymentAmount;
    student.set("remainingBalance", newRemaining);
    student.paidInstallments = student.paymentHistory.length;

    if (newRemaining <= 0) {
      student.paymentStatus = "COMPLETED";
    } else {
      student.paymentStatus = "PARTIAL";
    }

    const updatedStudent = await student.save();

    res.status(200).json({
      message:
        updatedStudent.paymentStatus === "COMPLETED"
          ? "Full Payment Completed! 🎉"
          : `Payment of Rs. ${paymentAmount.toLocaleString()} received successfully!`,
      data: updatedStudent,
    });
  } catch (err: any) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Failed to collect payment", error: err.message });
  }
};

// 🆕 UPDATED CONTROLLER: Added Mongoose sorting logic instance to scale queue orders
export const getTrainingEligibleStudents = async (req: Request, res: Response) => {
  try {
    const today = new Date();

    // Query filters: fetch active users and sort by practicalStartDate in ascending order (1)
    // 💡 This will list students with the closest or most urgent start dates at the top
    const eligibleStudents = await Student.find({
      practicalStartDate: { $ne: null, $lte: today }
    })
    .populate("userId", "name email phoneNumber")
    .sort({ practicalStartDate: 1 }); // 1 = Ascending order (Oldest/Closest date first)

    res.status(200).json({
      message: "Training eligible trainees list parsed successfully",
      data: eligibleStudents
    });
  } catch (err: any) {
    console.error("Error inside training allocation routine:", err);
    res.status(500).json({ message: "Failed to fetch training trainees", error: err.message });
  }
};
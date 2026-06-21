import { Student } from "../models/studentModel";
import { Types } from "mongoose";

export const studentService = {
  // 🆕 Configure total package fee allocation
  setTotalCourseFee: async (studentId: string, totalFee: number) => {
    const queryFilter = Types.ObjectId.isValid(studentId)
      ? { _id: new Types.ObjectId(studentId) }
      : { studentId: studentId };

    const student = await Student.findOne(queryFilter);
    if (!student) return null;

    student.set("totalFee", totalFee);

    // Recalculate remaining dues dynamically
    const totalPaid =
      student.paymentHistory?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    student.set("remainingBalance", totalFee - totalPaid);

    if (student.get("remainingBalance") <= 0) {
      student.paymentStatus = "COMPLETED";
    } else if (totalPaid > 0) {
      student.paymentStatus = "PARTIAL";
    } else {
      student.paymentStatus = "PENDING";
    }

    return await student.save();
  },

  // 💡 UPDATE: Flexible incremental custom volume collection
  collectInstallments: async (studentId: string, amountPaid: number) => {
    const queryFilter = Types.ObjectId.isValid(studentId)
      ? { _id: new Types.ObjectId(studentId) }
      : { studentId: studentId };

    const student = await Student.findOne(queryFilter);
    if (!student) return null;

    const totalFee = student.get("totalFee") || 0;
    const currentRemaining =
      student.get("remainingBalance") !== undefined
        ? student.get("remainingBalance")
        : totalFee;

    // Append history
    const nextInstallmentNumber = (student.paymentHistory?.length || 0) + 1;
    student.paymentHistory.push({
      installmentNumber: nextInstallmentNumber,
      amount: amountPaid,
      status: "COMPLETED",
      paidDate: new Date(),
    } as any);

    // Dynamic calculations
    const newRemaining = currentRemaining - amountPaid;
    student.set("remainingBalance", newRemaining);
    student.paidInstallments = student.paymentHistory.length;

    if (newRemaining <= 0) {
      student.paymentStatus = "COMPLETED";
    } else {
      student.paymentStatus = "PARTIAL";
    }

    return await student.save();
  },
};

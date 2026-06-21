import mongoose, { Document, model, Schema } from "mongoose";

// Payment Installment Interface
interface IPaymentInstallment {
  installmentNumber: number;
  amount: number;
  paidDate: Date | null;
  status: "PENDING" | "COMPLETED";
}

// 💡 UPDATE: Added totalFee and remainingBalance to the interface
export interface IStudent extends Document {
  userId: mongoose.Types.ObjectId;
  studentId: string;
  nicNumber: string;
  address: string;
  qrCodeUrl?: string;
  paymentStatus: "PENDING" | "PARTIAL" | "COMPLETED";
  paidInstallments: number;
  totalFee: number; // 🆕 Total configured course fee
  remainingBalance: number; // 🆕 Remaining dues balance amount
  paymentHistory: IPaymentInstallment[];
  assignedInstructor?: mongoose.Types.ObjectId;
  examDate?: Date;
  practicalStartDate?: Date;
}

const studentSchema = new Schema<IStudent>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    studentId: { type: String, unique: true },
    nicNumber: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    qrCodeUrl: { type: String, default: "" },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PARTIAL", "COMPLETED"],
      default: "PENDING",
    },
    paidInstallments: { type: Number, default: 0 },

    // 🆕 NEW: Configure Dynamic Course Billing Structure fields
    totalFee: { type: Number, default: 0 },
    remainingBalance: { type: Number, default: 0 },

    // 💡 UPDATE: Cleaned up hardcoded 5 installments to a clean, dynamic array template
    paymentHistory: {
      type: [
        {
          installmentNumber: { type: Number, required: true },
          amount: { type: Number, default: 0 },
          paidDate: { type: Date, default: null },
          status: {
            type: String,
            enum: ["PENDING", "COMPLETED"],
            default: "PENDING",
          },
        },
      ],
      default: [], // 👈 Starts empty now, payments append dynamically
    },
    assignedInstructor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    examDate: { type: Date, default: null },
    practicalStartDate: { type: Date, default: null },
  },
  { timestamps: true },
);

// ── 🆔 AUTO GENERATE STUDENT ID PRE-SAVE HOOK ──
studentSchema.pre<IStudent>("save", async function () {
  if (this.isNew) {
    try {
      const currentYearShort = new Date().getFullYear().toString().slice(-2);
      const prefix = `DDS${currentYearShort}`;

      const StudentModel = mongoose.model<IStudent>("Student");

      const lastStudent = await StudentModel.findOne({
        studentId: new RegExp(`^${prefix}`),
      })
        .sort({ studentId: -1 })
        .exec();

      let nextNumber = 1;

      if (lastStudent && lastStudent.studentId) {
        const currentSerialNumber = lastStudent.studentId.replace(prefix, "");
        const parsedNumber = parseInt(currentSerialNumber, 10);
        if (!isNaN(parsedNumber)) {
          nextNumber = parsedNumber + 1;
        }
      }

      const paddedNumber = nextNumber.toString().padStart(4, "0");
      this.studentId = `${prefix}${paddedNumber}`;
    } catch (error) {
      console.error("Error inside student pre-save hook: ", error);
      throw error;
    }
  }
});

export const Student = model<IStudent>("Student", studentSchema);

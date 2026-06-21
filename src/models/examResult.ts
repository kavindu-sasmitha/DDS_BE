import { Document, model, Schema } from "mongoose";

export interface IExamResult extends Document {
    studentId: Schema.Types.ObjectId;
    examPaperId: Schema.Types.ObjectId;
    score: number;
    passed: boolean;
    answers: number[];
}

const examResultSchema = new Schema<IExamResult>(
    {
        studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
        examPaperId: { type: Schema.Types.ObjectId, ref: "ExamPaper", required: true },
        score: { type: Number, required: true },
        passed: { type: Boolean, required: true },
        answers: { type: [Number], required: true }
    },
    { timestamps: true }
);

export const ExamResult = model<IExamResult>("ExamResult", examResultSchema);
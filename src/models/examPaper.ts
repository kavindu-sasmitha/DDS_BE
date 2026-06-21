import { Document, model, Schema } from "mongoose";

interface IQuestion {
    questionText: string;
    imageUrl?: string; 
    options: string[];
    correctOptionIndex: number;
}

export interface IExamPaper extends Document {
    title: string;
    description?: string;
    durationMinutes: number;
    questions: IQuestion[];
}

const examPaperSchema = new Schema<IExamPaper>(
    {
        title: { type: String, required: true },
        description: { type: String },
        durationMinutes: { type: Number, required: true, default: 45 },
        questions: [
            {
                questionText: { type: String, required: true },
                imageUrl: { type: String, required: false },
                options: { type: [String], required: true },
                correctOptionIndex: { type: Number, required: true }
            }
        ]
    },
    { timestamps: true }
);

export const ExamPaper = model<IExamPaper>("ExamPaper", examPaperSchema);
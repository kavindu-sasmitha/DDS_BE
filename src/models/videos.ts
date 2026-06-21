import { Document, model, Schema } from "mongoose";

export interface IVideo extends Document {
    title: string;
    description?: string;
    videoUrl: string; // URL pointing to Cloudinary, AWS S3, or YouTube Short link
    category: "THEORY" | "PRACTICAL" | "TRIAL_TIPS";
}

const videoSchema = new Schema<IVideo>(
    {
        title: { type: String, required: true },
        description: { type: String },
        videoUrl: { type: String, required: true },
        category: { type: String, enum: ["THEORY", "PRACTICAL", "TRIAL_TIPS"], required: true }
    },
    { timestamps: true }
);

export const Video = model<IVideo>("Video", videoSchema);
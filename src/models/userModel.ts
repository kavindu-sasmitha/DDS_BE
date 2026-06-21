import { Document, model, Schema } from "mongoose";

// Defines the main user roles in the driving school system
export enum UserRole {
    ADMIN = "ADMIN",
    INSTRUCTOR = "INSTRUCTOR",
    STUDENT = "STUDENT"
}

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    phoneNumber: string; // Used for Notify.lk SMS integration
    roles: UserRole[];
    approved: boolean; // Managed by Admin to lock/unlock platform access
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        phoneNumber: { type: String, required: true },
        roles: { 
            type: [String], 
            enum: Object.values(UserRole), 
            default: [UserRole.STUDENT] 
        },
        approved: { type: Boolean, default: false } // Default is false, needs admin approval
    },
    { timestamps: true }
);


export const User = model<IUser>("User", userSchema);
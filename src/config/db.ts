import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Fetching the connection string from your .env file
const DB_URL = process.env.DB_URL as string;

/**
 * Establishes a connection to the MongoDB Instance
 */
export const connectDB = async (): Promise<void> => {
    try {
        if (!DB_URL) {
            throw new Error("Database URL (DB_URL) is missing in the environment configurations (.env file)");
        }

        const conn = await mongoose.connect(DB_URL);
        
        console.log(`🍃 MongoDB Connected Successfully: ${conn.connection.host}`);
    } catch (error: any) {
        console.error(` Database Connection Error: ${error.message}`);
        // Exit process with failure code if connection fails
        process.exit(1);
    }
};
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { IUser } from "../models/userModel";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;


export const signAccessToken = (user: IUser): string => {
  return jwt.sign(
    {
      sub: user._id.toString(),
      roles: user.roles,
      email: user.email,
      approved: user.approved,
    },
    JWT_SECRET,
    { expiresIn: "30m" } // 30 minutes lifespan
  );
};


export const signRefreshToken = (user: IUser): string => {
  return jwt.sign(
    {
      sub: user._id.toString(),
    },
    JWT_REFRESH_SECRET,
    { expiresIn: "7d" } // 7 days lifespan
  );
};
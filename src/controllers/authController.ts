import { Request, Response } from "express";
import { authService } from "../services/authService";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { User } from "../models/userModel";
import { Student } from "../models/studentModel"; 

import { OAuth2Client } from "google-auth-library";


const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const registerStudent = async (req: Request, res: Response) => {
  try {
    const studentData = {
      ...req.body,
      role: "STUDENT",
    };

    const result = await authService.registerStudentService(studentData);

    res.status(201).json({
      message: "Registration successful..!",
      ...result,
    });
  } catch (err: any) {
    console.error(err);
    if (err.message === "User already exists") {
      return res.status(400).json({ message: err.message });
    }
    res
      .status(500)
      .json({ message: "Failed to register student", error: err.message });
  }
};

export const googleCallback = async (req: Request, res: Response) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ message: "Authorization code missing" });
    }

    const { tokens } = await client.getToken(code as string);
    client.setCredentials(tokens);

    // ✅ FIXED: redirect to frontend URL
    res.redirect(`https://diniru-driving-training-school.vercel.app/auth/google/callback?token=${tokens.access_token}`);
  } catch (err: any) {
    console.error("Callback error:", err);
    res.status(500).json({ message: "Callback failed" });
  }
};



export const loginUser = async (req: Request, res: Response) => {
  try {
    const result = await authService.loginUserService(req.body);
    res.status(200).json({
      message: "Login successful..!",
      ...result,
    });
  } catch (err: any) {
    console.error(err);
    if (err.message === "Invalid email or password") {
      return res.status(401).json({ message: err.message });
    }
    res.status(500).json({ message: "Failed to login", error: err.message });
  }
};


export const googleCheck = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Google token is required!" });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ message: "Invalid Google token payload!" });
    }

    const email = payload.email;
    const name = payload.name || "";

    const user = await User.findOne({ email });

    if (user) {
      const tokenData = await authService.loginGoogleUserService(user);

      return res.status(200).json({
        status: "SUCCESS",
        message: "Login successful via Google..!",
        ...tokenData
      });
      
    } else {
      return res.status(200).json({
        status: "NOT_FOUND",
        message: "User not registered in database",
        email: email,
        name: name,
      });
    }

  } catch (err: any) {
    console.error("Google Check Error:", err);
    res.status(500).json({ message: "Google authentication failed", error: err.message });
  }
};


export const refreshTokens = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshAccessTokenService(refreshToken);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(401).json({ message: err.message });
  }
};


export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Unauthorized account session reference" });
    }

    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User profile record absent" });
    }

    res.status(200).json({ user });
  } catch (err: any) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Failed to fetch profile details", error: err.message });
  }
};

export const getSingleStudentForAdmin = async (req: Request, res: Response) => {
  const queryParam = req.params.query;
  const query = Array.isArray(queryParam) ? queryParam[0] : queryParam; 

  if (!query) {
    return res.status(400).json({ message: "Missing search query parameter" });
  }

  try {
    let studentDetails = null;

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(query);

    if (isObjectId) {
      studentDetails = await Student.findById(query).populate(
        "userId",
        "-password",
      );
    }

    if (!studentDetails) {
      studentDetails = await Student.findOne({ nicNumber: query }).populate(
        "userId",
        "-password",
      );
    }

    if (!studentDetails) {
      const user = await User.findOne({ phoneNumber: query });

      if (user) {
        studentDetails = await Student.findOne({ userId: user._id }).populate(
          "userId",
          "-password",
        );
      }
    }

    if (!studentDetails) {
      return res
        .status(404)
        .json({
          message:
            "No student found with the provided ID, NIC, or Phone Number",
        });
    }

    res.status(200).json({
      message: "Student profile retrieved successfully..!",
      data: studentDetails,
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      message: "Failed to fetch student details",
      error: err.message,
    });
  }
};
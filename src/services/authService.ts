import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User, UserRole } from "../models/userModel";
import { Student } from "../models/studentModel";
import { signAccessToken, signRefreshToken } from "../util/token";

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;

export const authService = {
  /**
   * Registers a new user account alongside a tracking student reference object.
   */
  registerStudentService: async (studentData: any) => {
    // 1. Destructure address from incoming studentData object
    const { name, email, password, phoneNumber, nicNumber, address } = studentData;

    // Validation: Enforce absolute email uniqueness
    const userExists = await User.findOne({ email });
    if (userExists) {
      throw new Error("User already exists");
    }

    // Validation: Enforce absolute NIC uniqueness before creating any records
    const nicExists = await Student.findOne({ nicNumber });
    if (nicExists) {
      throw new Error("A student with this NIC number already exists");
    }

    // Secure credentials processing
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Persist core user authentication entity
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phoneNumber, // Cleaned: Using the actual phoneNumber from frontend directly
      roles: [UserRole.STUDENT], // Keeping default role assignment clean
    });

    // Automatically provision driving school profile records linked to user identity
    const student = await Student.create({
      userId: user._id,
      nicNumber, // Cleaned: Saving true unique NIC number
      address,   // New Field: Persisting the student's residential address
    });

    return {
      accessToken: signAccessToken(user),
      refreshToken: signRefreshToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        approved: user.approved,
        roles: user.roles,
      },
      student,
    };
  },

  /**
   * Evaluates system records to authenticate credentials.
   */
  loginUserService: async (loginData: any) => {
    const { email, password } = loginData;
    const user = await User.findOne({ email });

    // Validate identity record existence and hash equality
    if (user && (await bcrypt.compare(password, user.password))) {
      return {
        accessToken: signAccessToken(user),
        refreshToken: signRefreshToken(user),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          roles: user.roles,
          approved: user.approved,
        },
      };
    } else {
      throw new Error("Invalid email or password");
    }
  },

  /**
   * 🆕 Generates authentic token vectors specifically for verified Google Sign-ins.
   * මේකෙන් Google හරහා සාර්ථකව ආපු User කෙනෙකුට Password Check කිරීමකින් තොරව JWT ලබා දේ.
   */
  loginGoogleUserService: async (userEntity: any) => {
    return {
      accessToken: signAccessToken(userEntity),
      refreshToken: signRefreshToken(userEntity),
      user: {
        id: userEntity._id,
        name: userEntity.name,
        email: userEntity.email,
        roles: userEntity.roles,
        approved: userEntity.approved,
      },
    };
  },

  /**
   * Reissues access tokens via validation of an authentic refresh token.
   */
  refreshAccessTokenService: async (token: string) => {
    if (!token) throw new Error("Refresh Token required");

    try {
      const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as { sub: string };

      const user = await User.findById(decoded.sub);
      if (!user) throw new Error("User associated with token not found");

      // Sign and return fresh access authorization matrix
      const newAccessToken = signAccessToken(user);
      return { accessToken: newAccessToken };
    } catch (err) {
      throw new Error("Invalid or expired refresh token");
    }
  },
};
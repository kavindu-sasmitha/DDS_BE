import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

// Extend Express Request types inline cleanly to accommodate session injection
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    roles: string[];
    email: string;
    approved: boolean;
  };
}

//req token in header 
export const protect = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      
      // Decodes payload structure matching standard generation profiles
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      req.user = {
        id: decoded.sub,
        roles: decoded.roles,
        email: decoded.email,
        approved: decoded.approved,
      };

      return next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: "Not authorized, token validation failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, access token absent" });
  }
};


export const checkApproved = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.approved) {
    next();
  } else {
    res.status(403).json({
      message: "Access Denied. Driving school platform profile is awaiting administrative review.",
    });
  }
};


export const restrictToAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  
  if (req.user && req.user.roles && req.user.roles.includes("ADMIN")) {
    return next(); 
  }


  return res.status(403).json({
    message: "Access Denied. This administrative action is strictly restricted to driving school managers.",
  });
};
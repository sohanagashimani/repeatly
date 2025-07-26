import { NextFunction, Request, Response } from "express";
import { firebaseAuth } from "../firebase";
import "../@types/express";
import { prisma } from "@repeatly/database";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res
        .status(401)
        .json({ error: "Missing or invalid authorization header" });
      return;
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await firebaseAuth.verifyIdToken(token);

    if (!decodedToken.email_verified) {
      res.status(403).json({ error: "Email not verified" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: decodedToken.uid },
    });

    if (!user) {
      res.status(404).json({
        error: "User not found in database. Please complete account setup.",
      });
      return;
    }

    req.userId = decodedToken.uid;
    req.userEmail = decodedToken.email;
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || "",
      emailVerified: decodedToken.email_verified || false,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const authMiddlewareForUserCreation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res
        .status(401)
        .json({ error: "Missing or invalid authorization header" });
      return;
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await firebaseAuth.verifyIdToken(token);

    if (!decodedToken.email_verified) {
      res.status(403).json({ error: "Email not verified" });
      return;
    }

    req.userId = decodedToken.uid;
    req.userEmail = decodedToken.email;
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || "",
      emailVerified: decodedToken.email_verified || false,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

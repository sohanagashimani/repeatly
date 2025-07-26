import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const gatewayAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.headers["x-api-key"] as string;

    if (!apiKey) {
      res.status(401).json({ error: "API key is required" });
      return;
    }

    const apiKeyRecord = await prisma.apiKey.findFirst({
      where: {
        gcpKeyName: {
          contains: apiKey.slice(-4),
        },
      },
      include: {
        user: true,
      },
    });

    if (!apiKeyRecord) {
      res.status(401).json({ error: "Invalid API key" });
      return;
    }

    req.userId = apiKeyRecord.userId;
    req.userEmail = apiKeyRecord.user.email;
    req.user = {
      uid: apiKeyRecord.user.id,
      email: apiKeyRecord.user.email,
      emailVerified: apiKeyRecord.user.emailVerified,
    };

    next();
  } catch (error) {
    console.error("Gateway auth middleware error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

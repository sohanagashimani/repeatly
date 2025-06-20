import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getApiKeys = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;

    // Check if user exists in database
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res
        .status(404)
        .json({ error: "User not found. Please create your account first." });
      return;
    }

    // Fetch all API keys for the user
    const apiKeys = await prisma.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        lastFour: true,
        status: true,
        createdAt: true,
        gcpKeyName: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      apiKeys,
      total: apiKeys.length,
    });
  } catch (error) {
    console.error("Error fetching API keys:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

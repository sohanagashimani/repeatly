import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { apiKeysService } from "../../../../lib/googleAuth";

const prisma = new PrismaClient();

export const deleteApiKey = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    console.log({ id });
    if (!id) {
      res.status(400).json({ error: "API key ID is required" });
      return;
    }

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

    // Check if API key exists and belongs to the user
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!apiKey) {
      res.status(404).json({ error: "API key not found" });
      return;
    }

    try {
      // Delete the API key from Google Cloud
      await apiKeysService.projects.locations.keys.delete({
        name: apiKey.gcpKeyName,
      });

      console.log(`GCP API key deleted: ${apiKey.gcpKeyName}`);
    } catch (gcpError) {
      console.error("Error deleting API key from GCP:", gcpError);
      // Continue with database deletion even if GCP deletion fails
      console.log("Continuing with database deletion despite GCP error");
    }

    // Delete the API key from our database
    await prisma.apiKey.delete({
      where: { id },
    });

    console.log(`API key deleted from database for user ${userId}: ${id}`);

    res.json({ message: "API key deleted successfully" });
  } catch (error) {
    console.error("Error deleting API key:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

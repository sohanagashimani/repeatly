import { Request, Response } from "express";
import { prisma } from "@repeatly/database";
import { apiKeysService, getProjectId } from "../../../../lib/googleAuth";

export const getApiKeyStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: id,
        userId: userId,
      },
    });

    if (!apiKey) {
      res.status(404).json({ error: "API key not found" });
      return;
    }

    if (apiKey.status === "completed") {
      res.status(200).json({
        id: apiKey.id,
        name: apiKey.name,
        lastFour: apiKey.lastFour,
        status: "completed",
        message: "API key is ready for use",
        createdAt: apiKey.createdAt,
      });
      return;
    }

    try {
      const projectId = getProjectId();

      const listResponse = await apiKeysService.projects.locations.keys.list({
        parent: `projects/${projectId}/locations/global`,
      });

      const matchingKey = listResponse.data.keys?.find((key: any) =>
        key.displayName?.includes(`(${userId})`)
      );

      if (!matchingKey || !matchingKey.name) {
        res.status(202).json({
          id: apiKey.id,
          name: apiKey.name,
          status: "creating",
          message:
            "API key is still being created. Please try again in a few moments.",
        });
        return;
      }

      const keyStringResponse =
        await apiKeysService.projects.locations.keys.getKeyString({
          name: matchingKey.name,
        });

      const keyString = keyStringResponse.data.keyString;

      if (!keyString) {
        throw new Error("Failed to retrieve API key string");
      }

      const updatedApiKey = await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: {
          lastFour: keyString.slice(-4),
          status: "completed",

          ...(apiKey.gcpKeyName !== matchingKey.name && {
            gcpKeyName: matchingKey.name,
          }),
        },
      });

      res.status(200).json({
        id: updatedApiKey.id,
        name: updatedApiKey.name,
        key: keyString,
        lastFour: updatedApiKey.lastFour,
        status: "completed",
        message:
          "API key created successfully! Please save this key as it will not be shown again.",
        createdAt: updatedApiKey.createdAt,
      });
    } catch (gcpError) {
      console.error("Error checking API key status:", gcpError);
      res.status(202).json({
        id: apiKey.id,
        name: apiKey.name,
        status: "creating",
        message:
          "API key is still being created. Please try again in a few moments.",
      });
    }
  } catch (error) {
    console.error("Error getting API key status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

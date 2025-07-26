import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { apiKeysService, getProjectId } from "../../../../lib/googleAuth";
import {
  API_KEY_LIMITS,
  API_KEY_MESSAGES,
} from "../../../../constants/apiKeys";

const prisma = new PrismaClient();

export const createApiKey = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { displayName } = req.body;
    const userId = req.userId!;

    if (
      !displayName ||
      typeof displayName !== "string" ||
      displayName.trim().length === 0
    ) {
      res.status(400).json({ error: API_KEY_MESSAGES.KEY_NAME_REQUIRED });
      return;
    }

    if (displayName.trim().length > API_KEY_LIMITS.MAX_KEY_NAME_LENGTH) {
      res.status(400).json({ error: API_KEY_MESSAGES.KEY_NAME_TOO_LONG });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ error: API_KEY_MESSAGES.USER_NOT_FOUND });
      return;
    }

    const existingKeysCount = await prisma.apiKey.count({
      where: { userId },
    });

    if (existingKeysCount >= API_KEY_LIMITS.MAX_KEYS_PER_USER) {
      res.status(400).json({ error: API_KEY_MESSAGES.MAX_KEYS_EXCEEDED });
      return;
    }

    const projectId = getProjectId();

    try {
      const createResponse =
        await apiKeysService.projects.locations.keys.create({
          parent: `projects/${projectId}/locations/global`,
          requestBody: {
            displayName: `${displayName.trim()} (${userId})`,
            restrictions: {
              apiTargets: [
                {
                  service: process.env.API_GATEWAY_HOST,
                  methods: ["*"],
                },
              ],
            },
          },
        });

      const operation = createResponse.data;

      if (!operation.name) {
        throw new Error("No operation name returned from API key creation");
      }

      const newApiKey = await prisma.apiKey.create({
        data: {
          name: displayName.trim(),
          gcpKeyName: operation.name,
          lastFour: "****",
          status: "creating",
          userId: userId,
        },
      });

      console.log(
        `API key creation initiated for user ${userId}: ${newApiKey.id}`
      );
      console.log(`Operation: ${operation.name}`);

      res.status(202).json({
        id: newApiKey.id,
        name: newApiKey.name,
        status: "creating",
        message:
          "API key is being created. Please check back in a few moments or refresh the page.",
        createdAt: newApiKey.createdAt,
      });
    } catch (gcpError) {
      console.error("Error creating API key in GCP:", gcpError);
      res.status(500).json({ error: API_KEY_MESSAGES.CREATION_FAILED });
    }
  } catch (error) {
    console.error("Error creating API key:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

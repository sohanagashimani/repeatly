import { Request, Response } from "express";
import { prisma } from "@repeatly/database";

export const updateUserVerification = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { uid, emailVerified } = req.user!;

    const updatedUser = await prisma.user.update({
      where: { id: uid },
      data: { emailVerified: emailVerified },
    });

    res.status(200).json({
      message: "Email verification status updated successfully",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        emailVerified: updatedUser.emailVerified,
      },
    });
  } catch (error) {
    console.error("Error updating verification status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

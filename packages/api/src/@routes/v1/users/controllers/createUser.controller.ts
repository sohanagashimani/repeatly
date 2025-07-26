import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { firstName, lastName } = req.body;
    const { uid, email, emailVerified } = req.user!;

    if (!emailVerified) {
      res.status(403).json({ error: "Email not verified" });
      return;
    }

    const existingUserByUid = await prisma.user.findUnique({
      where: { id: uid },
    });

    if (existingUserByUid) {
      if (!existingUserByUid.emailVerified && emailVerified) {
        const updatedUser = await prisma.user.update({
          where: { id: uid },
          data: { emailVerified: true },
        });

        res.status(200).json({
          message: "User already exists, email verification status updated",
          user: updatedUser,
        });
        return;
      }

      res.status(200).json({
        message: "User already exists",
        user: existingUserByUid,
      });
      return;
    }

    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUserByEmail) {
      res.status(409).json({
        error:
          "A user with this email already exists with a different account ID",
      });
      return;
    }

    const newUser = await prisma.user.create({
      data: {
        id: uid,
        email: email,
        firstName: firstName || "",
        lastName: lastName || "",
        emailVerified: true,
      },
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        emailVerified: newUser.emailVerified,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

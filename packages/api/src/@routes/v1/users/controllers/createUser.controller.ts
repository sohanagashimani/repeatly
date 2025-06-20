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

    // Double-check email verification (middleware should have caught this)
    if (!emailVerified) {
      res.status(403).json({ error: "Email not verified" });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { id: uid },
    });

    if (existingUser) {
      // Update emailVerified status if it's outdated
      if (!existingUser.emailVerified && emailVerified) {
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
        user: existingUser,
      });
      return;
    }

    // Create new user with verified email status
    const newUser = await prisma.user.create({
      data: {
        id: uid,
        email: email,
        firstName: firstName || "",
        lastName: lastName || "",
        emailVerified: true, // Set to true since user passed verification middleware
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

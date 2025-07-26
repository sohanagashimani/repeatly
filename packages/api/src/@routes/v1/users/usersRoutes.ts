import { Router } from "express";
import { createUser } from "./controllers/createUser.controller";
import { updateUserVerification } from "./controllers/updateUserVerification.controller";
import {
  authMiddlewareForUserCreation,
  authMiddleware,
} from "../../../@middlewares/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const router = Router();

router.post("/", authMiddlewareForUserCreation, createUser);

router.patch("/sync-verification", authMiddleware, updateUserVerification);

router.get("/me", authMiddleware, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) {
    res.status(404).json({ error: "User not found" });
  } else {
    res.json(user);
  }
});

export { router as usersRoutes };

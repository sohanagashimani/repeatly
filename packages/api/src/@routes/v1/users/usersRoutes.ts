import { Router } from "express";
import { createUser } from "./controllers/createUser.controller";
import { updateUserVerification } from "./controllers/updateUserVerification.controller";
import {
  authMiddlewareForUserCreation,
  authMiddleware,
} from "../../../@middlewares/auth";

const router = Router();

// Create user (for new signups)
router.post("/", authMiddlewareForUserCreation, createUser);

// Sync email verification status (for existing users)
router.patch("/sync-verification", authMiddleware, updateUserVerification);

export { router as usersRoutes };

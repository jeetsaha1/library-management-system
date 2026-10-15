
import { Router } from "express";
import {
  createLibrarian,
  getLibrarians,
} from "../controllers/userController.js";
import {
  protect,
  authorize,
} from "../middleware/authMiddleware.js";

const router = Router();

// Only admins can create librarian accounts.
router.post(
  "/librarians",
  protect,
  authorize("admin"),
  createLibrarian
);

// Only admins can view the list of librarians.
router.get(
  "/librarians",
  protect,
  authorize("admin"),
  getLibrarians
);

export default router;

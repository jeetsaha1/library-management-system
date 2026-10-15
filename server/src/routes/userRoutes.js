import { Router } from "express";
import {
  createLibrarian,
  getLibrarians,
  getMembers,
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

// Librarians and admins can view registered members (for book issuing)
router.get(
  "/members",
  protect,
  authorize("admin", "librarian"),
  getMembers
);

export default router;

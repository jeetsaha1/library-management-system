
import { Router } from "express";
import {
  issueBook,
  returnBook,
  getMyLoans,
  getAllLoans,
  getOverdueLoans,
} from "../controllers/borrowController.js";

// Replace this import with your team's actual authentication
// middleware before exposing these routes.
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/issue", protect, issueBook);
router.put("/:id/return", protect, returnBook);
router.get("/my", protect, getMyLoans);
router.get("/overdue", protect, getOverdueLoans);
router.get("/", protect, getAllLoans);

export default router;

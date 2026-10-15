import { Router } from "express";
import {
  createRequest,
  getMyRequests,
  getPendingRequests,
  getAllRequests,
  approveRequest,
  rejectRequest,
} from "../controllers/requestController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = Router();

// Member creates a book request
router.post("/", protect, createRequest);

// Member views their own requests
router.get("/my", protect, getMyRequests);

// Staff lists pending requests
router.get(
  "/pending",
  protect,
  authorize("librarian", "admin"),
  getPendingRequests
);

// Staff lists all requests
router.get(
  "/",
  protect,
  authorize("librarian", "admin"),
  getAllRequests
);

// Staff approves a pending request
router.put(
  "/:id/approve",
  protect,
  authorize("librarian", "admin"),
  approveRequest
);

// Staff rejects a pending request
router.put(
  "/:id/reject",
  protect,
  authorize("librarian", "admin"),
  rejectRequest
);

export default router;


import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  listBooks,
  listCategories,
  getBook,
  createBook,
  updateBook,
  deleteBook,
} from "../controllers/bookController.js";

const router = express.Router();

// All book endpoints require authentication.
router.use(protect);

// Register categories before /:id.
router.get("/categories", listCategories);
router.get("/", listBooks);
router.get("/:id", getBook);

// Only staff can manage books.
router.post("/", authorize("admin", "librarian"), createBook);
router.put("/:id", authorize("admin", "librarian"), updateBook);
router.delete("/:id", authorize("admin", "librarian"), deleteBook);

export default router;

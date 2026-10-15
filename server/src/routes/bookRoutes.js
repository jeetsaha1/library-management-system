import { Router } from "express";
import Book from "../models/Book.js";
import BorrowRecord from "../models/BorrowRecord.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = Router();

// GET /api/books - Browse & search books (public or authenticated)
router.get("/", async (req, res, next) => {
  try {
    const { search } = req.query;
    const query = {};

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [{ title: regex }, { author: regex }, { isbn: regex }];
    }

    const books = await Book.find(query).sort({ title: 1 }).lean();

    return res.status(200).json({
      success: true,
      count: books.length,
      data: books,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/books/:id - Get book by ID
router.get("/:id", async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id).lean();
    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }
    return res.status(200).json({
      success: true,
      data: book,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/books - Add book (librarian, admin)
router.post("/", protect, authorize("admin", "librarian"), async (req, res, next) => {
  try {
    const { title, author, isbn, totalCopies } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Book title is required.",
      });
    }

    const parsedCopies = Number(totalCopies);
    if (isNaN(parsedCopies) || parsedCopies < 0) {
      return res.status(400).json({
        success: false,
        message: "Total copies must be a non-negative number.",
      });
    }

    const book = await Book.create({
      title: title.trim(),
      author: typeof author === "string" ? author.trim() : "",
      isbn: typeof isbn === "string" ? isbn.trim() : "",
      totalCopies: parsedCopies,
      availableCopies: parsedCopies,
    });

    return res.status(201).json({
      success: true,
      message: "Book created successfully.",
      data: book,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/books/:id - Update book (librarian, admin)
router.put("/:id", protect, authorize("admin", "librarian"), async (req, res, next) => {
  try {
    const { title, author, isbn, totalCopies, availableCopies } = req.body;
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    if (title !== undefined) {
      if (!title || typeof title !== "string" || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Book title cannot be empty.",
        });
      }
      book.title = title.trim();
    }

    if (author !== undefined) {
      book.author = typeof author === "string" ? author.trim() : "";
    }

    if (isbn !== undefined) {
      book.isbn = typeof isbn === "string" ? isbn.trim() : "";
    }

    if (totalCopies !== undefined) {
      const copies = Number(totalCopies);
      if (isNaN(copies) || copies < 0) {
        return res.status(400).json({
          success: false,
          message: "Total copies must be a non-negative number.",
        });
      }
      // If adjusting total copies, adjust available copies accordingly
      const difference = copies - book.totalCopies;
      book.totalCopies = copies;
      book.availableCopies = Math.max(0, book.availableCopies + difference);
    }

    if (availableCopies !== undefined) {
      const avail = Number(availableCopies);
      if (isNaN(avail) || avail < 0) {
        return res.status(400).json({
          success: false,
          message: "Available copies must be a non-negative number.",
        });
      }
      book.availableCopies = Math.min(avail, book.totalCopies);
    }

    await book.save();

    return res.status(200).json({
      success: true,
      message: "Book updated successfully.",
      data: book,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/books/:id - Delete book (librarian, admin, only if no active loans)
router.delete("/:id", protect, authorize("admin", "librarian"), async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    // Check if book has active issued loans
    const activeLoans = await BorrowRecord.countDocuments({
      book: req.params.id,
      status: "issued",
    });

    if (activeLoans > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete book while ${activeLoans} active copy/copies are borrowed.`,
      });
    }

    await Book.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Book deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
});

export default router;

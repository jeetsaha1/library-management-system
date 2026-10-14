
import mongoose from "mongoose";
import Book from "../models/Book.js";
import BorrowRecord from "../models/BorrowRecord.js";

function sendError(res, status, message) {
  return res.status(status).json({ success: false, message });
}


function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}


// GET /api/books?search=...&category=...
export async function listBooks(req, res) {
  try {
    const { search = "", category = "" } = req.query;
    const filter = {};

    if (search.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), "i");
      filter.$or = [
        { title: regex },
        { author: regex },
        { category: regex },
        { isbn: regex },
      ];
    }

    if (category.trim()) {
      filter.category = category.trim();
    }

    const books = await Book.find(filter).sort({ title: 1 }).limit(200);
    return res.json({ success: true, count: books.length, data: books });
  } catch (error) {
    console.error("List books failed:", error.message);
    return sendError(res, 500, "Unable to load books");
  }
}

// GET /api/books/categories
export async function listCategories(req, res) {
  try {
    const categories = await Book.distinct("category", { category: { $ne: "" } });
    return res.json({ success: true, data: categories.sort() });
  } catch (error) {
    console.error("List categories failed:", error.message);
    return sendError(res, 500, "Unable to load categories");
  }
}

// GET /api/books/:id
export async function getBook(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendError(res, 400, "Invalid book ID");
  }

  try {
    const book = await Book.findById(req.params.id);
    if (!book) return sendError(res, 404, "Book not found");

    return res.json({ success: true, data: book });
  } catch (error) {
    console.error("Get book failed:", error.message);
    return sendError(res, 500, "Unable to load book");
  }
}

// POST /api/books
export async function createBook(req, res) {
  const { title, author, category, isbn, totalCopies } = req.body;

  if (!title?.trim() || !author?.trim() || !category?.trim() || !isbn?.trim()) {
    return sendError(res, 400, "Title, author, category and ISBN are required");
  }

  if (!Number.isInteger(totalCopies) || totalCopies < 1) {
    return sendError(res, 400, "totalCopies must be a positive whole number");
  }

  try {
    const book = await Book.create({
      title,
      author,
      category,
      isbn,
      totalCopies,
      availableCopies: totalCopies,
    });

    return res.status(201).json({
      success: true,
      message: "Book created successfully",
      data: book,
    });
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 409, "A book with this ISBN already exists");
    }
    if (error.name === "ValidationError") {
      return sendError(res, 400, error.message);
    }

    console.error("Create book failed:", error.message);
    return sendError(res, 500, "Unable to create book");
  }
}

// PUT /api/books/:id
export async function updateBook(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendError(res, 400, "Invalid book ID");
  }

  const allowedFields = ["title", "author", "category", "isbn", "totalCopies"];
  const changes = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) changes[field] = req.body[field];
  }

  if (Object.keys(changes).length === 0) {
    return sendError(res, 400, "No valid fields supplied");
  }

  if (
    changes.totalCopies !== undefined &&
    (!Number.isInteger(changes.totalCopies) || changes.totalCopies < 1)
  ) {
    return sendError(res, 400, "totalCopies must be a positive whole number");
  }

  try {
    const book = await Book.findById(req.params.id);
    if (!book) return sendError(res, 404, "Book not found");

    const issuedCopies = book.totalCopies - book.availableCopies;
    if (
      changes.totalCopies !== undefined &&
      changes.totalCopies < issuedCopies
    ) {
    return sendError(
     res,
     409,
     `Cannot set totalCopies below ${issuedCopies} currently issued copies`
    );

    }

    Object.assign(book, changes);

    // Preserve the number of copies already issued.
    if (changes.totalCopies !== undefined) {
      book.availableCopies = changes.totalCopies - issuedCopies;
    }

    await book.save();

    return res.json({
      success: true,
      message: "Book updated successfully",
      data: book,
    });
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 409, "A book with this ISBN already exists");
    }
    if (error.name === "ValidationError") {
      return sendError(res, 400, error.message);
    }

    console.error("Update book failed:", error.message);
    return sendError(res, 500, "Unable to update book");
  }
}

// DELETE /api/books/:id
export async function deleteBook(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendError(res, 400, "Invalid book ID");
  }

  try {
    const book = await Book.findById(req.params.id);
    if (!book) return sendError(res, 404, "Book not found");

    const activeLoans = await BorrowRecord.countDocuments({
      book: book._id,
      status: "issued",
    });

    if (activeLoans > 0) {
      return sendError(res, 409, "Cannot delete a book with active loans");
    }

    await book.deleteOne();

    return res.json({ success: true, message: "Book deleted successfully" });
  } catch (error) {
    console.error("Delete book failed:", error.message);
    return sendError(res, 500, "Unable to delete book");
  }
}

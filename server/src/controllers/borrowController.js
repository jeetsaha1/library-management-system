
import mongoose from "mongoose";
import BorrowRecord from "../models/BorrowRecord.js";
import Book from "../models/Book.js";
import {
  LOAN_DAYS,
  calculateFine,
  addDays,
  startOfDay,
} from "../utils/fine.js";

function getUserId(req) {
  return req.user?.id || req.user?._id;
}

function getStaffRole(req) {
  return ["admin", "librarian"].includes(
    String(req.user?.role || "").toLowerCase()
  );
}

function sendError(res, status, message) {
  return res.status(status).json({ success: false, message });
}

// POST /api/borrow/issue
export async function issueBook(req, res) {
  const userId = getUserId(req);
  const { bookId } = req.body;

  if (!userId) {
    return sendError(res, 401, "Please log in first");
  }

  if (!mongoose.isValidObjectId(bookId)) {
    return sendError(res, 400, "A valid bookId is required");
  }

  const session = await mongoose.startSession();

  try {
    let createdLoan;

    await session.withTransaction(async () => {
      const book = await Book.findOneAndUpdate(
        { _id: bookId, availableCopies: { $gt: 0 } },
        { $inc: { availableCopies: -1 } },
        { new: true, session }
      );

      if (!book) {
        const exists = await Book.exists({ _id: bookId }).session(session);
        const error = new Error(
          exists ? "No copies of this book are available" : "Book not found"
        );
        error.status = exists ? 409 : 404;
        throw error;
      }

      const issueDate = new Date();
      const dueDate = addDays(issueDate, LOAN_DAYS);

      const records = await BorrowRecord.create(
        [{
          user: userId,
          book: bookId,
          issueDate,
          dueDate,
          status: "issued",
          returnDate: null,
          fineAmount: 0,
        }],
        { session }
      );

      createdLoan = records[0];
    });

    return res.status(201).json({
      success: true,
      message: "Book issued successfully",
      data: createdLoan,
    });
  } catch (error) {
    if (error.status) {
      return sendError(res, error.status, error.message);
    }

    console.error("Issue book failed:", error.message);
    return sendError(res, 500, "Unable to issue book");
  } finally {
    await session.endSession();
  }
}

// PUT /api/borrow/:id/return
export async function returnBook(req, res) {
  const userId = getUserId(req);
  const { id } = req.params;

  if (!userId) {
    return sendError(res, 401, "Please log in first");
  }

  if (!mongoose.isValidObjectId(id)) {
    return sendError(res, 400, "Invalid borrowing record ID");
  }

  const session = await mongoose.startSession();

  try {
    let returnedLoan;

    await session.withTransaction(async () => {
      const filter = {
        _id: id,
        status: "issued",
      };

      // Customers may return only their own loans.
      if (!getStaffRole(req)) {
        filter.user = userId;
      }

      const loan = await BorrowRecord.findOne(filter).session(session);

      if (!loan) {
        const error = new Error(
          "Active loan not found; it may already be returned"
        );
        error.status = 404;
        throw error;
      }

      const returnedAt = new Date();
      const fineAmount = calculateFine(loan.dueDate, returnedAt);

      returnedLoan = await BorrowRecord.findOneAndUpdate(
        { _id: loan._id, status: "issued" },
        {
          $set: {
            status: "returned",
            returnDate: returnedAt,
            fineAmount,
          },
        },
        { new: true, session }
      );

      if (!returnedLoan) {
        const error = new Error("This book has already been returned");
        error.status = 409;
        throw error;
      }

      const book = await Book.findByIdAndUpdate(
        loan.book,
        { $inc: { availableCopies: 1 } },
        { new: true, session }
      );

      if (!book) {
        throw new Error("Book record missing; return transaction cancelled");
      }
    });

    return res.status(200).json({
      success: true,
      message: "Book returned successfully",
      data: returnedLoan,
    });
  } catch (error) {
    if (error.status) {
      return sendError(res, error.status, error.message);
    }

    console.error("Return book failed:", error.message);
    return sendError(res, 500, "Unable to return book");
  } finally {
    await session.endSession();
  }
}

// GET /api/borrow/my
export async function getMyLoans(req, res) {
  const userId = getUserId(req);

  if (!userId) {
    return sendError(res, 401, "Please log in first");
  }

  try {
    const loans = await BorrowRecord.find({ user: userId })
      .populate("book")
      .sort({ issueDate: -1 });

    return res.json({ success: true, count: loans.length, data: loans });
  } catch (error) {
    console.error("Borrowing history failed:", error.message);
    return sendError(res, 500, "Unable to load borrowing history");
  }
}

// GET /api/borrow
export async function getAllLoans(req, res) {
  if (!getUserId(req)) {
    return sendError(res, 401, "Please log in first");
  }

  if (!getStaffRole(req)) {
    return sendError(res, 403, "Staff access required");
  }

  try {
    const loans = await BorrowRecord.find()
      .populate("user")
      .populate("book")
      .sort({ issueDate: -1 });

    return res.json({ success: true, count: loans.length, data: loans });
  } catch (error) {
    console.error("All loans query failed:", error.message);
    return sendError(res, 500, "Unable to load borrowing records");
  }
}

// GET /api/borrow/overdue
export async function getOverdueLoans(req, res) {
  if (!getUserId(req)) {
    return sendError(res, 401, "Please log in first");
  }

  if (!getStaffRole(req)) {
    return sendError(res, 403, "Staff access required");
  }

  try {
    const today = startOfDay(new Date());

    const loans = await BorrowRecord.find({
      status: "issued",
      dueDate: { $lt: today },
    })
      .populate("user")
      .populate("book")
      .sort({ dueDate: 1 });

    return res.json({ success: true, count: loans.length, data: loans });
  } catch (error) {
    console.error("Overdue query failed:", error.message);
    return sendError(res, 500, "Unable to load overdue loans");
  }
}

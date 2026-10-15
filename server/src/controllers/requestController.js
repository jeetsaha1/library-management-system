import mongoose from "mongoose";
import BookRequest from "../models/BookRequest.js";
import Book from "../models/Book.js";
import BorrowRecord from "../models/BorrowRecord.js";
import { LOAN_DAYS, addDays } from "../utils/fine.js";

function getUserId(req) {
  return req.user?.id || req.user?._id;
}

function sendError(res, status, message) {
  return res.status(status).json({ success: false, message });
}

// POST /api/requests - Member submits a request for a book
export async function createRequest(req, res) {
  const userId = getUserId(req);
  const { bookId } = req.body;

  if (!userId) {
    return sendError(res, 401, "Please log in first");
  }

  if (!mongoose.isValidObjectId(bookId)) {
    return sendError(res, 400, "A valid bookId is required");
  }

  try {
    const book = await Book.findById(bookId);
    if (!book) {
      return sendError(res, 404, "Book not found");
    }

    if (book.availableCopies <= 0) {
      return sendError(res, 409, "No copies of this book are currently available");
    }

    // Check if the member already has an equivalent pending request for this book
    const existingPending = await BookRequest.findOne({
      user: userId,
      book: bookId,
      status: "pending",
    });

    if (existingPending) {
      return sendError(
        res,
        409,
        "You already have a pending request for this book. Please wait for librarian review."
      );
    }

    // Check if member already has an active loan for this book
    const existingActiveLoan = await BorrowRecord.findOne({
      user: userId,
      book: bookId,
      status: "issued",
    });

    if (existingActiveLoan) {
      return sendError(
        res,
        409,
        "You currently have this book on loan. Return it before requesting it again."
      );
    }

    const request = await BookRequest.create({
      user: userId,
      book: bookId,
      status: "pending",
      requestDate: new Date(),
    });

    const populated = await BookRequest.findById(request._id)
      .populate("book")
      .populate("user", "name email");

    return res.status(201).json({
      success: true,
      message: "Book request submitted successfully. Awaiting librarian approval.",
      data: populated,
    });
  } catch (error) {
    console.error("Create request failed:", error.message);
    return sendError(res, 500, "Unable to submit book request");
  }
}

// GET /api/requests/my - Member views their own requests
export async function getMyRequests(req, res) {
  const userId = getUserId(req);

  if (!userId) {
    return sendError(res, 401, "Please log in first");
  }

  try {
    const requests = await BookRequest.find({ user: userId })
      .populate("book")
      .populate("decidedBy", "name email")
      .populate("borrowRecord")
      .sort({ requestDate: -1 });

    return res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    console.error("Get my requests failed:", error.message);
    return sendError(res, 500, "Unable to load your requests");
  }
}

// GET /api/requests/pending - Librarian views pending requests
export async function getPendingRequests(req, res) {
  try {
    const requests = await BookRequest.find({ status: "pending" })
      .populate("book")
      .populate("user", "name email")
      .sort({ requestDate: 1 }); // oldest first

    return res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    console.error("Get pending requests failed:", error.message);
    return sendError(res, 500, "Unable to load pending requests");
  }
}

// GET /api/requests - Librarian/Admin views all requests
export async function getAllRequests(req, res) {
  try {
    const requests = await BookRequest.find()
      .populate("book")
      .populate("user", "name email")
      .populate("decidedBy", "name email")
      .populate("borrowRecord")
      .sort({ requestDate: -1 });

    return res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    console.error("Get all requests failed:", error.message);
    return sendError(res, 500, "Unable to load requests");
  }
}

// PUT /api/requests/:id/approve - Librarian approves a pending request
export async function approveRequest(req, res) {
  const librarianId = getUserId(req);
  const { id } = req.params;

  if (!librarianId) {
    return sendError(res, 401, "Please log in first");
  }

  if (!mongoose.isValidObjectId(id)) {
    return sendError(res, 400, "Invalid request ID");
  }

  const session = await mongoose.startSession();

  try {
    let resultData;

    await session.withTransaction(async () => {
      // 1. Atomically check and lock the request if pending
      const request = await BookRequest.findOne({
        _id: id,
        status: "pending",
      }).session(session);

      if (!request) {
        const existing = await BookRequest.findById(id).session(session);
        if (!existing) {
          const err = new Error("Request not found");
          err.status = 404;
          throw err;
        }
        const err = new Error(
          `Request has already been ${existing.status} on ${new Date(
            existing.decisionDate
          ).toLocaleDateString()}`
        );
        err.status = 409;
        throw err;
      }

      // 2. Atomically decrement book available copies if > 0
      const book = await Book.findOneAndUpdate(
        { _id: request.book, availableCopies: { $gt: 0 } },
        { $inc: { availableCopies: -1 } },
        { new: true, session }
      );

      if (!book) {
        const err = new Error(
          "No available copies of this book remaining to approve request."
        );
        err.status = 409;
        throw err;
      }

      // 3. Create exactly one active borrowing record
      const issueDate = new Date();
      const dueDate = addDays(issueDate, LOAN_DAYS);

      const [loan] = await BorrowRecord.create(
        [
          {
            user: request.user,
            book: request.book,
            issueDate,
            dueDate,
            status: "issued",
            returnDate: null,
            fineAmount: 0,
          },
        ],
        { session }
      );

      // 4. Update request status to approved
      request.status = "approved";
      request.decisionDate = new Date();
      request.decidedBy = librarianId;
      request.borrowRecord = loan._id;
      await request.save({ session });

      resultData = {
        request,
        loan,
      };
    });

    const populated = await BookRequest.findById(id)
      .populate("book")
      .populate("user", "name email")
      .populate("decidedBy", "name email")
      .populate("borrowRecord");

    return res.status(200).json({
      success: true,
      message: "Request approved and book issued successfully.",
      data: populated,
    });
  } catch (error) {
    if (error.status) {
      return sendError(res, error.status, error.message);
    }
    console.error("Approve request failed:", error.message);
    return sendError(res, 500, "Unable to approve request");
  } finally {
    await session.endSession();
  }
}

// PUT /api/requests/:id/reject - Librarian rejects a pending request
export async function rejectRequest(req, res) {
  const librarianId = getUserId(req);
  const { id } = req.params;
  const { reason } = req.body || {};

  if (!librarianId) {
    return sendError(res, 401, "Please log in first");
  }

  if (!mongoose.isValidObjectId(id)) {
    return sendError(res, 400, "Invalid request ID");
  }

  try {
    // Atomically find and update only if currently pending
    const request = await BookRequest.findOneAndUpdate(
      { _id: id, status: "pending" },
      {
        $set: {
          status: "rejected",
          decisionDate: new Date(),
          decidedBy: librarianId,
          rejectionReason: typeof reason === "string" ? reason.trim() : "",
        },
      },
      { new: true }
    );

    if (!request) {
      const existing = await BookRequest.findById(id);
      if (!existing) {
        return sendError(res, 404, "Request not found");
      }
      return sendError(
        res,
        409,
        `Request has already been ${existing.status} and cannot be rejected.`
      );
    }

    const populated = await BookRequest.findById(id)
      .populate("book")
      .populate("user", "name email")
      .populate("decidedBy", "name email");

    return res.status(200).json({
      success: true,
      message: "Request rejected successfully.",
      data: populated,
    });
  } catch (error) {
    console.error("Reject request failed:", error.message);
    return sendError(res, 500, "Unable to reject request");
  }
}

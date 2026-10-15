import mongoose from "mongoose";

const bookRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      required: true,
    },
    requestDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    decisionDate: {
      type: Date,
      default: null,
    },
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: "",
    },
    borrowRecord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BorrowRecord",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly find user requests and maintain query performance
bookRequestSchema.index({ user: 1, requestDate: -1 });

// Index for librarian queries to filter pending requests
bookRequestSchema.index({ status: 1, requestDate: -1 });

export default mongoose.model("BookRequest", bookRequestSchema);

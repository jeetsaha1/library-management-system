
import mongoose from "mongoose";

const borrowSchema = new mongoose.Schema(
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

    issueDate: {
      type: Date,
      default: Date.now,
      required: true,
    },

    dueDate: {
      type: Date,
      required: true,
    },

    returnDate: {
      type: Date,
      default: null,
    },

    fineAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Overdue status is calculated from dueDate.
    // A loan remains "issued" until the book is returned.
    status: {
      type: String,
      enum: ["issued", "returned"],
      default: "issued",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Efficient customer borrowing history.
borrowSchema.index({
  user: 1,
  issueDate: -1,
});

// Efficient lookup of active and overdue loans.
borrowSchema.index({
  status: 1,
  dueDate: 1,
});

// Export the BorrowRecord model.
export default mongoose.model("BorrowRecord", borrowSchema);

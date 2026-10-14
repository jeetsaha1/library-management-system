
import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    isbn: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    totalCopies: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "totalCopies must be a whole number",
      },
    },
    availableCopies: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "availableCopies must be a whole number",
      },
    },
  },
  { timestamps: true }
);

bookSchema.index({ title: 1 });
bookSchema.index({ category: 1 });

export default mongoose.model("Book", bookSchema);

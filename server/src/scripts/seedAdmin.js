
import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";

async function seedAdmin() {
  const {
    MONGODB_URI,
    ADMIN_NAME,
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
  } = process.env;

  if (!MONGODB_URI || !ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error(
      "MONGODB_URI, ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD must be configured."
    );
  }

  if (ADMIN_PASSWORD.length < 12) {
    throw new Error("ADMIN_PASSWORD must contain at least 12 characters.");
  }

  await mongoose.connect(MONGODB_URI);

  const email = ADMIN_EMAIL.trim().toLowerCase();
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    if (existingUser.role === "admin") {
      console.log("An administrator with this email already exists.");
      return;
    }

    throw new Error(
      "This email belongs to a non-admin account. Choose a different ADMIN_EMAIL or review the account manually."
    );
  }

  await User.create({
    name: ADMIN_NAME.trim(),
    email,
    password: ADMIN_PASSWORD,
    role: "admin",
  });

  console.log("Administrator account created successfully.");
}

try {
  await seedAdmin();
} catch (error) {
  console.error("Administrator initialization failed:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect().catch(() => {});
}

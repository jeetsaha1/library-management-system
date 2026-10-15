import User from "../models/User.js";

export async function createLibrarian(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      password.length < 8
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name and email are required. Password must contain at least 8 characters.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const librarian = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: "librarian",
    });

    return res.status(201).json({
      success: true,
      message: "Librarian account created successfully.",
      librarian: {
        id: librarian._id.toString(),
        name: librarian.name,
        email: librarian.email,
        role: librarian.role,
        createdAt: librarian.createdAt,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    next(error);
  }
}

export async function getLibrarians(req, res, next) {
  try {
    const librarians = await User.find({ role: "librarian" })
      .select("name email role createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: librarians.length,
      librarians: librarians.map((librarian) => ({
        id: librarian._id.toString(),
        name: librarian.name,
        email: librarian.email,
        role: librarian.role,
        createdAt: librarian.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
}

export async function getMembers(req, res, next) {
  try {
    const members = await User.find({ role: "member" })
      .select("name email role createdAt")
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: members.length,
      members: members.map((member) => ({
        id: member._id.toString(),
        name: member.name,
        email: member.email,
        role: member.role,
        createdAt: member.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
}

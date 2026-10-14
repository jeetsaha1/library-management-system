
import express from "express";
import borrowRoutes from "./routes/borrowRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";

const app = express();

app.use(express.json());

app.use("/api/borrow", borrowRoutes);
app.use("/api/books", bookRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "LibTrack API is running",
  });
});

export default app;

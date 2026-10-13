import express from "express";
import borrowRoutes from "./routes/borrowRoutes.js";

const app = express();

app.use(express.json());
app.use("/api/borrow", borrowRoutes);
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "LibTrack API is running"
  });
});

export default app;
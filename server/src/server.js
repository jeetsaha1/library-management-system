
import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`LibTrack API listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start LibTrack:", error.message);
    process.exit(1);
  }
}

startServer();

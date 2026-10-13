
import jwt from "jsonwebtoken";

export function protect(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication token required",
    });
  }

  const token = authHeader.slice("Bearer ".length);
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error("JWT_SECRET is not configured");
    return res.status(500).json({
      success: false,
      message: "Authentication is not configured",
    });
  }

  try {
    const decoded = jwt.verify(token, secret);

    // Temporary compatibility mapping. Confirm the real JWT
    // payload fields with Member 1 before final integration.
    const id = decoded.id || decoded._id || decoded.userId || decoded.sub;
    const role = decoded.role;

    if (!id) {
      return res.status(401).json({
        success: false,
        message: "Token does not contain a user ID",
      });
    }

    req.user = { ...decoded, id, role };
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
    });
  }
}

import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ user, allowedRoles, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to the appropriate home dashboard for their actual role
    const home = {
      admin: "/admin/dashboard",
      librarian: "/librarian/dashboard",
      member: "/member/dashboard",
    }[user.role] || "/login";

    return <Navigate to={home} replace />;
  }

  return children;
}

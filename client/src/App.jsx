import React, { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import AuthForm from "./components/AuthForm";
import Navbar from "./components/layout/Navbar";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import MemberDashboard from "./pages/MemberDashboard";
import MemberBorrowings from "./pages/MemberBorrowings";
import MemberRequests from "./pages/MemberRequests";
import LibrarianDashboard from "./pages/LibrarianDashboard";
import LibrarianBorrowings from "./pages/LibrarianBorrowings";
import LibrarianRequests from "./pages/LibrarianRequests";
import AdminDashboard from "./pages/AdminDashboard";
import Librarians from "./pages/Librarians";
import BooksPage from "./pages/BooksPage";

function getSavedUser() {
  try {
    const saved = sessionStorage.getItem("libtrack_user");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

// Dedicated Auth Page component
function AuthPage({ user, onLoginSuccess }) {
  const [mode, setMode] = useState("login");
  const navigate = useNavigate();

  // If already logged in, redirect to the user's role-based home
  if (user) {
    const home = {
      admin: "/admin/dashboard",
      librarian: "/librarian/dashboard",
      member: "/member/dashboard",
    }[user.role] || "/";
    return <Navigate to={home} replace />;
  }

  function handleSuccess(userData) {
    onLoginSuccess(userData);
    const destination = {
      admin: "/admin/dashboard",
      librarian: "/librarian/dashboard",
      member: "/member/dashboard",
    }[userData.role] || "/";
    navigate(destination, { replace: true });
  }

  return (
    <div className="container py-5">
      <div className="row align-items-center justify-content-center g-5">
        <div className="col-lg-5">
          <div className="mb-4">
            <span className="badge text-bg-primary mb-3">
              Your library, organized
            </span>
            <h1 className="display-5 fw-bold">Welcome to LibTrack</h1>
            <p className="lead text-secondary">
              A simple place to access your library account and manage your reading journey.
            </p>
          </div>

          <div className="d-flex gap-3 mb-3">
            <div className="text-primary fs-3">✓</div>
            <div>
              <h2 className="h6 fw-bold mb-1">Secure authentication</h2>
              <p className="text-secondary mb-0">
                Sign in using your registered email and password.
              </p>
            </div>
          </div>

          <div className="d-flex gap-3">
            <div className="text-primary fs-3">✓</div>
            <div>
              <h2 className="h6 fw-bold mb-1">Role-based accounts</h2>
              <p className="text-secondary mb-0">
                Accounts identify members, librarians, and admins.
              </p>
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <AuthForm
            mode={mode}
            onModeChange={setMode}
            onSuccess={handleSuccess}
          />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(getSavedUser);

  function handleLogout() {
    sessionStorage.removeItem("libtrack_token");
    sessionStorage.removeItem("libtrack_user");
    setUser(null);
  }

  // Fallback home redirection based on authentication and role
  function RoleHomeRedirect() {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    const home = {
      admin: "/admin/dashboard",
      librarian: "/librarian/dashboard",
      member: "/member/dashboard",
    }[user.role] || "/login";

    return <Navigate to={home} replace />;
  }

  return (
    <BrowserRouter>
      <main className="min-vh-100 bg-light d-flex flex-column">
        <Navbar user={user} onLogout={handleLogout} />

        <div className="flex-grow-1">
          <Routes>
            {/* Public Auth Routes */}
            <Route
              path="/login"
              element={<AuthPage user={user} onLoginSuccess={setUser} />}
            />
            <Route
              path="/register"
              element={<AuthPage user={user} onLoginSuccess={setUser} />}
            />

            {/* Member Experience */}
            <Route
              path="/member/dashboard"
              element={
                <ProtectedRoute user={user} allowedRoles={["member"]}>
                  <MemberDashboard user={user} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/member/books"
              element={
                <ProtectedRoute user={user} allowedRoles={["member"]}>
                  <BooksPage role="member" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/member/requests"
              element={
                <ProtectedRoute user={user} allowedRoles={["member"]}>
                  <MemberRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/member/borrowings"
              element={
                <ProtectedRoute user={user} allowedRoles={["member"]}>
                  <MemberBorrowings />
                </ProtectedRoute>
              }
            />

            {/* Librarian Experience */}
            <Route
              path="/librarian/dashboard"
              element={
                <ProtectedRoute user={user} allowedRoles={["librarian"]}>
                  <LibrarianDashboard user={user} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/librarian/requests"
              element={
                <ProtectedRoute user={user} allowedRoles={["librarian"]}>
                  <LibrarianRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/librarian/books"
              element={
                <ProtectedRoute user={user} allowedRoles={["librarian"]}>
                  <BooksPage role="librarian" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/librarian/borrowings"
              element={
                <ProtectedRoute user={user} allowedRoles={["librarian"]}>
                  <LibrarianBorrowings filterOverdueOnly={false} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/librarian/overdue"
              element={
                <ProtectedRoute user={user} allowedRoles={["librarian"]}>
                  <LibrarianBorrowings filterOverdueOnly={true} />
                </ProtectedRoute>
              }
            />

            {/* Administrator Experience */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute user={user} allowedRoles={["admin"]}>
                  <AdminDashboard user={user} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/librarians"
              element={
                <ProtectedRoute user={user} allowedRoles={["admin"]}>
                  <Librarians />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/books"
              element={
                <ProtectedRoute user={user} allowedRoles={["admin"]}>
                  <BooksPage role="admin" />
                </ProtectedRoute>
              }
            />

            {/* Root & Catch-all */}
            <Route path="/" element={<RoleHomeRedirect />} />
            <Route path="*" element={<RoleHomeRedirect />} />
          </Routes>
        </div>

        <footer className="text-center text-secondary py-4 border-top bg-white mt-auto">
          <small>LibTrack Library Management System</small>
        </footer>
      </main>
    </BrowserRouter>
  );
}

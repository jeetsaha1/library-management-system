
import { useState } from "react";
import AuthForm from "./components/AuthForm";
import Librarians from "./pages/Librarians";

function getSavedUser() {
  try {
    const saved = sessionStorage.getItem("libtrack_user");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [mode, setMode] = useState("login");
  const [user, setUser] = useState(getSavedUser);
  const [showLibrarians, setShowLibrarians] = useState(false);

  function handleLogout() {
    sessionStorage.removeItem("libtrack_token");
    sessionStorage.removeItem("libtrack_user");
    setUser(null);
    setMode("login");
    setShowLibrarians(false);
  }

  if (user) {
    const roleName = {
      admin: "Administrator",
      librarian: "Librarian",
      member: "Library Member",
    }[user.role] || "User";

    const isAdmin = user.role === "admin";

    return (
      <main className="min-vh-100 bg-light">
        <nav className="navbar navbar-dark bg-primary px-3 px-md-5">
          <span className="navbar-brand fw-bold">LibTrack</span>

          <div className="d-flex gap-2 align-items-center">
            {isAdmin && (
              <button
                className="btn btn-outline-light"
                onClick={() =>
                  setShowLibrarians((current) => !current)
                }
              >
                {showLibrarians
                  ? "Back to Dashboard"
                  : "Manage Librarians"}
              </button>
            )}

            <button
              className="btn btn-outline-light"
              onClick={handleLogout}
            >
              Sign out
            </button>
          </div>
        </nav>

        {isAdmin && showLibrarians ? (
          <Librarians />
        ) : (
          <div className="container py-5">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4 p-md-5">
                <span className="badge text-bg-primary mb-3">
                  {roleName}
                </span>

                <h1 className="fw-bold">
                  Welcome, {user.name}!
                </h1>

                <p className="text-secondary">
                  You are signed in to LibTrack.
                </p>

                <hr />

                <h2 className="h5">Account details</h2>

                <p className="mb-1">
                  <strong>Name:</strong> {user.name}
                </p>

                <p className="mb-1">
                  <strong>Email:</strong> {user.email}
                </p>

                <p className="mb-0">
                  <strong>Role:</strong> {roleName}
                </p>

                {isAdmin ? (
                  <div className="alert alert-info mt-4 mb-0">
                    Use Manage Librarians to create librarian
                    accounts and view existing librarians.
                  </div>
                ) : (
                  <div className="alert alert-info mt-4 mb-0">
                    You are signed in. Your available features
                    depend on your account role.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <footer className="text-center text-secondary py-4">
          <small>LibTrack Library Management System</small>
        </footer>
      </main>
    );
  }

  return (
    <main className="min-vh-100 bg-light">
      <nav className="navbar navbar-dark bg-primary px-3 px-md-5">
        <span className="navbar-brand fw-bold">LibTrack</span>
        <span className="text-white small">
          Library Management System
        </span>
      </nav>

      <div className="container py-5">
        <div className="row align-items-center justify-content-center g-5">
          <div className="col-lg-5">
            <div className="mb-4">
              <span className="badge text-bg-primary mb-3">
                Your library, organized
              </span>

              <h1 className="display-5 fw-bold">
                Welcome to LibTrack
              </h1>

              <p className="lead text-secondary">
                A simple place to access your library account
                and manage your reading journey.
              </p>
            </div>

            <div className="d-flex gap-3 mb-3">
              <div className="text-primary fs-3">✓</div>
              <div>
                <h2 className="h6 fw-bold mb-1">
                  Secure authentication
                </h2>
                <p className="text-secondary mb-0">
                  Sign in using your registered email and password.
                </p>
              </div>
            </div>

            <div className="d-flex gap-3">
              <div className="text-primary fs-3">✓</div>
              <div>
                <h2 className="h6 fw-bold mb-1">
                  Role-based accounts
                </h2>
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
              onSuccess={setUser}
            />
          </div>
        </div>
      </div>

      <footer className="text-center text-secondary py-4">
        <small>LibTrack Library Management System</small>
      </footer>
    </main>
  );
}

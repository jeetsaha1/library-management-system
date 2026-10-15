import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  function handleSignOut() {
    if (onLogout) {
      onLogout();
    }
    navigate("/login");
  }

  const role = user?.role;
  const roleName = {
    admin: "Administrator",
    librarian: "Librarian",
    member: "Member",
  }[role] || "User";

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary px-3 px-md-5">
      <div className="container-fluid px-0">
        <Link className="navbar-brand fw-bold fs-4 d-flex align-items-center gap-2" to="/">
          LibTrack
        </Link>

        {user && (
          <div className="d-flex flex-wrap align-items-center gap-2">
            {role === "member" && (
              <>
                <Link to="/member/dashboard" className="btn btn-sm btn-outline-light">
                  Dashboard
                </Link>
                <Link to="/member/books" className="btn btn-sm btn-outline-light">
                  Browse Books
                </Link>
                <Link to="/member/requests" className="btn btn-sm btn-outline-light">
                  My Requests
                </Link>
                <Link to="/member/borrowings" className="btn btn-sm btn-outline-light">
                  My Borrowings
                </Link>
              </>
            )}

            {role === "librarian" && (
              <>
                <Link to="/librarian/dashboard" className="btn btn-sm btn-outline-light">
                  Dashboard
                </Link>
                <Link to="/librarian/requests" className="btn btn-sm btn-outline-light">
                  Requests
                </Link>
                <Link to="/librarian/books" className="btn btn-sm btn-outline-light">
                  Manage Books
                </Link>
                <Link to="/librarian/borrowings" className="btn btn-sm btn-outline-light">
                  All Loans
                </Link>
                <Link to="/librarian/overdue" className="btn btn-sm btn-outline-light">
                  Overdue
                </Link>
              </>
            )}

            {role === "admin" && (
              <>
                <Link to="/admin/dashboard" className="btn btn-sm btn-outline-light">
                  Dashboard
                </Link>
                <Link to="/admin/librarians" className="btn btn-sm btn-outline-light">
                  Manage Librarians
                </Link>
                <Link to="/admin/books" className="btn btn-sm btn-outline-light">
                  Manage Books
                </Link>
              </>
            )}

            <div className="ms-2 border-start ps-2 d-flex align-items-center gap-2">
              <span className="badge bg-light text-primary d-none d-md-inline-block">
                {roleName}: {user.name}
              </span>
              <button
                className="btn btn-sm btn-outline-light"
                onClick={handleSignOut}
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

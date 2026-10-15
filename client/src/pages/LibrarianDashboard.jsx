import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import Loading from "../components/common/Loading";
import ErrorMessage from "../components/common/ErrorMessage";

export default function LibrarianDashboard({ user }) {
  const [stats, setStats] = useState({
    booksCount: 0,
    loansCount: 0,
    overdueCount: 0,
    pendingRequestsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadLibrarianStats() {
    setLoading(true);
    setError("");
    try {
      const [booksRes, loansRes, overdueRes, requestsRes] = await Promise.all([
        api.get("/books"),
        api.get("/borrow"),
        api.get("/borrow/overdue"),
        api.get("/requests/pending").catch(() => ({ data: { count: 0 } })),
      ]);

      const activeLoans = (loansRes.data.data || []).filter(
        (l) => l.status === "issued"
      );

      setStats({
        booksCount: booksRes.data.count ?? (booksRes.data.data || []).length,
        loansCount: activeLoans.length,
        overdueCount: overdueRes.data.count ?? (overdueRes.data.data || []).length,
        pendingRequestsCount:
          requestsRes.data.count ?? (requestsRes.data.data || []).length,
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load librarian dashboard statistics."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLibrarianStats();
  }, []);

  return (
    <div className="container py-5">
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4 p-md-5">
          <span className="badge text-bg-primary mb-3">Librarian Workspace</span>
          <h1 className="fw-bold">Welcome, {user?.name}!</h1>
          <p className="text-secondary">
            Manage catalogue inventory, review member borrowing requests, and process book returns.
          </p>

          <hr />

          <h2 className="h5 mb-3">Librarian Account Details</h2>
          <div className="row g-2 mb-4">
            <div className="col-sm-6">
              <p className="mb-1">
                <strong>Name:</strong> {user?.name}
              </p>
            </div>
            <div className="col-sm-6">
              <p className="mb-1">
                <strong>Email:</strong> {user?.email}
              </p>
            </div>
          </div>

          <div className="d-flex flex-wrap gap-3">
            <Link to="/librarian/requests" className="btn btn-warning text-dark fw-semibold">
              Pending Requests {stats.pendingRequestsCount > 0 && `(${stats.pendingRequestsCount})`}
            </Link>
            <Link to="/librarian/books" className="btn btn-primary">
              Manage Books
            </Link>
            <Link to="/librarian/borrowings" className="btn btn-outline-primary">
              All Borrowing Records
            </Link>
            <Link to="/librarian/overdue" className="btn btn-outline-danger">
              Overdue Loans
            </Link>
          </div>
        </div>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError("")} />

      {loading ? (
        <Loading message="Loading library summary counts..." />
      ) : (
        <div className="row g-4">
          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body p-4">
                <span className="text-muted small text-uppercase fw-bold">
                  Pending Requests
                </span>
                <h2
                  className={`display-6 fw-bold mt-2 mb-0 ${
                    stats.pendingRequestsCount > 0
                      ? "text-warning"
                      : "text-secondary"
                  }`}
                >
                  {stats.pendingRequestsCount}
                </h2>
                <p className="text-secondary small mt-2 mb-0">
                  Member requests awaiting review.
                </p>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body p-4">
                <span className="text-muted small text-uppercase fw-bold">
                  Total Book Titles
                </span>
                <h2 className="display-6 fw-bold text-primary mt-2 mb-0">
                  {stats.booksCount}
                </h2>
                <p className="text-secondary small mt-2 mb-0">
                  Unique titles currently catalogued.
                </p>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body p-4">
                <span className="text-muted small text-uppercase fw-bold">
                  Active Loans
                </span>
                <h2 className="display-6 fw-bold text-success mt-2 mb-0">
                  {stats.loansCount}
                </h2>
                <p className="text-secondary small mt-2 mb-0">
                  Books currently in member hands.
                </p>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body p-4">
                <span className="text-muted small text-uppercase fw-bold">
                  Overdue Loans
                </span>
                <h2
                  className={`display-6 fw-bold mt-2 mb-0 ${
                    stats.overdueCount > 0 ? "text-danger" : "text-muted"
                  }`}
                >
                  {stats.overdueCount}
                </h2>
                <p className="text-secondary small mt-2 mb-0">
                  Active loans past their due date.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

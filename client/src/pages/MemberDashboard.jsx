import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import Loading from "../components/common/Loading";
import ErrorMessage from "../components/common/ErrorMessage";

export default function MemberDashboard({ user }) {
  const [loans, setLoans] = useState([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [loansRes, requestsRes] = await Promise.all([
        api.get("/borrow/my"),
        api.get("/requests/my"),
      ]);

      setLoans(loansRes.data.data || []);
      const pending = (requestsRes.data.data || []).filter(
        (r) => r.status === "pending"
      );
      setPendingRequestsCount(pending.length);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load your dashboard data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const now = new Date();
  const activeLoans = loans.filter((l) => l.status === "issued");
  const overdueOrDueSoonLoans = activeLoans.filter((l) => {
    const dueDate = new Date(l.dueDate);
    const diffDays = (dueDate - now) / (1000 * 60 * 60 * 24);
    return diffDays <= 3;
  });

  // Calculate outstanding fines
  const totalFines = loans.reduce((acc, l) => {
    let fine = l.fineAmount || 0;
    if (l.status === "issued") {
      const due = new Date(l.dueDate);
      due.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (today > due) {
        const daysLate = Math.round((today - due) / (1000 * 60 * 60 * 24));
        fine = Math.max(fine, daysLate * 5);
      }
    }
    return acc + fine;
  }, 0);

  return (
    <div className="container py-5">
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4 p-md-5">
          <span className="badge text-bg-primary mb-3">Library Member</span>
          <h1 className="fw-bold">Welcome, {user?.name}!</h1>
          <p className="text-secondary">
            You are signed in to LibTrack. Browse books, submit borrowing requests, and track your loans here.
          </p>

          <hr />

          <h2 className="h5 mb-3">Account Details</h2>
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
            <Link to="/member/books" className="btn btn-primary">
              Browse Books
            </Link>
            <Link to="/member/borrowings" className="btn btn-outline-primary">
              My Borrowings
            </Link>
            <Link to="/member/requests" className="btn btn-outline-warning text-dark">
              My Requests {pendingRequestsCount > 0 && `(${pendingRequestsCount})`}
            </Link>
          </div>
        </div>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError("")} />

      {loading ? (
        <Loading message="Loading account statistics..." />
      ) : (
        <div className="row g-4">
          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body p-4">
                <span className="text-muted small text-uppercase fw-bold">
                  Currently Borrowed
                </span>
                <h2 className="display-6 fw-bold text-primary mt-2 mb-0">
                  {activeLoans.length}
                </h2>
                <p className="text-secondary small mt-2 mb-0">
                  Active book loans currently in your possession.
                </p>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body p-4">
                <span className="text-muted small text-uppercase fw-bold">
                  Pending Requests
                </span>
                <h2 className={`display-6 fw-bold mt-2 mb-0 ${pendingRequestsCount > 0 ? "text-warning" : "text-secondary"}`}>
                  {pendingRequestsCount}
                </h2>
                <p className="text-secondary small mt-2 mb-0">
                  Awaiting librarian approval before issuance.
                </p>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body p-4">
                <span className="text-muted small text-uppercase fw-bold">
                  Due Soon / Overdue
                </span>
                <h2
                  className={`display-6 fw-bold mt-2 mb-0 ${
                    overdueOrDueSoonLoans.length > 0
                      ? "text-warning"
                      : "text-success"
                  }`}
                >
                  {overdueOrDueSoonLoans.length}
                </h2>
                <p className="text-secondary small mt-2 mb-0">
                  Books due within 3 days or past due date.
                </p>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body p-4">
                <span className="text-muted small text-uppercase fw-bold">
                  Outstanding Fines
                </span>
                <h2
                  className={`display-6 fw-bold mt-2 mb-0 ${
                    totalFines > 0 ? "text-danger" : "text-success"
                  }`}
                >
                  ₹{totalFines}
                </h2>
                <p className="text-secondary small mt-2 mb-0">
                  Calculated at ₹5/day for overdue returns.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from "react";
import api from "../services/api";
import Loading from "../components/common/Loading";
import ErrorMessage from "../components/common/ErrorMessage";
import SuccessMessage from "../components/common/SuccessMessage";
import EmptyState from "../components/common/EmptyState";

export default function MemberBorrowings() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [returningId, setReturningId] = useState(null);

  async function loadBorrowings() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/borrow/my");
      setLoans(res.data.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load borrowing records."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBorrowings();
  }, []);

  async function handleReturn(recordId) {
    setReturningId(recordId);
    setError("");
    setSuccess("");
    try {
      const res = await api.put(`/borrow/${recordId}/return`);
      setSuccess(res.data.message || "Book returned successfully!");
      await loadBorrowings();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to return book.");
    } finally {
      setReturningId(null);
    }
  }

  const activeLoans = loans.filter((l) => l.status === "issued");
  const pastLoans = loans.filter((l) => l.status === "returned");

  function getCalculatedFine(loan) {
    if (loan.status === "returned") {
      return loan.fineAmount || 0;
    }
    const due = new Date(loan.dueDate);
    due.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (today > due) {
      const days = Math.round((today - due) / (1000 * 60 * 60 * 24));
      return days * 5;
    }
    return 0;
  }

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold">My Borrowings</h2>
          <p className="text-secondary mb-0">
            View your active book loans, return dates, and loan history.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={loadBorrowings}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError("")} />
      <SuccessMessage message={success} onDismiss={() => setSuccess("")} />

      {loading ? (
        <Loading message="Loading borrowing records..." />
      ) : (
        <>
          {/* Active Loans Section */}
          <div className="card border-0 shadow-sm mb-5">
            <div className="card-header bg-white border-bottom py-3">
              <h5 className="mb-0 fw-semibold">
                Current Active Loans ({activeLoans.length})
              </h5>
            </div>
            <div className="card-body p-0">
              {activeLoans.length === 0 ? (
                <div className="p-4 text-center text-muted">
                  You currently have no borrowed books.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Book Title</th>
                        <th>Borrow Date</th>
                        <th>Due Date</th>
                        <th>Status</th>
                        <th>Fine Accrued</th>
                        <th className="text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeLoans.map((loan) => {
                        const dueDate = new Date(loan.dueDate);
                        const isOverdue = new Date() > dueDate;
                        const fine = getCalculatedFine(loan);

                        return (
                          <tr key={loan._id}>
                            <td className="fw-semibold">
                              {loan.book?.title || "Unknown Book"}
                            </td>
                            <td>
                              {new Date(loan.issueDate).toLocaleDateString()}
                            </td>
                            <td>
                              <span
                                className={
                                  isOverdue ? "text-danger fw-bold" : ""
                                }
                              >
                                {dueDate.toLocaleDateString()}
                              </span>
                            </td>
                            <td>
                              {isOverdue ? (
                                <span className="badge bg-danger">Overdue</span>
                              ) : (
                                <span className="badge bg-primary">Active</span>
                              )}
                            </td>
                            <td>
                              {fine > 0 ? (
                                <span className="text-danger fw-semibold">
                                  ₹{fine}
                                </span>
                              ) : (
                                <span className="text-success">₹0</span>
                              )}
                            </td>
                            <td className="text-end">
                              <button
                                className="btn btn-sm btn-outline-success"
                                disabled={returningId === loan._id}
                                onClick={() => handleReturn(loan._id)}
                              >
                                {returningId === loan._id
                                  ? "Returning..."
                                  : "Return Book"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Borrowing History Section */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom py-3">
              <h5 className="mb-0 fw-semibold">
                Borrowing History ({pastLoans.length})
              </h5>
            </div>
            <div className="card-body p-0">
              {pastLoans.length === 0 ? (
                <div className="p-4 text-center text-muted">
                  No completed returns yet.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Book Title</th>
                        <th>Borrow Date</th>
                        <th>Due Date</th>
                        <th>Return Date</th>
                        <th>Status</th>
                        <th>Fine Paid / Recorded</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pastLoans.map((loan) => (
                        <tr key={loan._id}>
                          <td className="fw-semibold">
                            {loan.book?.title || "Unknown Book"}
                          </td>
                          <td>
                            {new Date(loan.issueDate).toLocaleDateString()}
                          </td>
                          <td>
                            {new Date(loan.dueDate).toLocaleDateString()}
                          </td>
                          <td>
                            {loan.returnDate
                              ? new Date(loan.returnDate).toLocaleDateString()
                              : "—"}
                          </td>
                          <td>
                            <span className="badge bg-secondary">
                              Returned
                            </span>
                          </td>
                          <td>
                            {loan.fineAmount > 0 ? (
                              <span className="text-danger fw-semibold">
                                ₹{loan.fineAmount}
                              </span>
                            ) : (
                              <span className="text-success">₹0</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

import React, { useState, useEffect } from "react";
import api from "../services/api";
import Loading from "../components/common/Loading";
import ErrorMessage from "../components/common/ErrorMessage";
import SuccessMessage from "../components/common/SuccessMessage";
import EmptyState from "../components/common/EmptyState";

export default function LibrarianBorrowings({ filterOverdueOnly = false }) {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [returningId, setReturningId] = useState(null);

  // For Manual Issue Book action
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [issuing, setIssuing] = useState(false);

  async function loadLoans() {
    setLoading(true);
    setError("");
    try {
      const endpoint = filterOverdueOnly ? "/borrow/overdue" : "/borrow";
      const res = await api.get(endpoint);
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
    loadLoans();
  }, [filterOverdueOnly]);

  async function handleProcessReturn(loanId) {
    if (!window.confirm("Confirm processing return for this book?")) {
      return;
    }
    setReturningId(loanId);
    setError("");
    setSuccess("");
    try {
      const res = await api.put(`/borrow/${loanId}/return`);
      const fine = res.data.data?.fineAmount || 0;
      setSuccess(
        `Book returned successfully! ${
          fine > 0 ? `Calculated Overdue Fine: ₹${fine}` : "No fine applied."
        }`
      );
      await loadLoans();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to process book return.");
    } finally {
      setReturningId(null);
    }
  }

  async function openIssueModal() {
    setError("");
    try {
      const [booksRes, membersRes] = await Promise.all([
        api.get("/books"),
        api.get("/users/members").catch(() => ({ data: { members: [] } })),
      ]);

      const available = (booksRes.data.data || []).filter(
        (b) => b.availableCopies > 0
      );
      setBooks(available);
      if (available.length > 0) {
        setSelectedBookId(available[0]._id);
      }

      const memberList = membersRes.data.members || [];
      setMembers(memberList);
      if (memberList.length > 0) {
        setSelectedMemberId(memberList[0].id);
      }

      setShowIssueModal(true);
    } catch {
      setError("Unable to load books or member records for manual issuing.");
    }
  }

  async function handleIssueBook(e) {
    e.preventDefault();
    if (!selectedBookId) return;

    setIssuing(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        bookId: selectedBookId,
        memberId: selectedMemberId || undefined,
      };

      const res = await api.post("/borrow/issue", payload);
      setSuccess(
        res.data.message ||
          "Book issued manually to member with 7-day loan period."
      );
      setShowIssueModal(false);
      await loadLoans();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to issue book.");
    } finally {
      setIssuing(false);
    }
  }

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
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold">
            {filterOverdueOnly
              ? "Overdue Loans Management"
              : "All Borrowing Records"}
          </h2>
          <p className="text-secondary mb-0">
            {filterOverdueOnly
              ? "Review loans that have passed their due date and calculate overdue fines."
              : "Track all active and past library loans across members."}
          </p>
        </div>
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={loadLoans}
            disabled={loading}
          >
            Refresh
          </button>
          {!filterOverdueOnly && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={openIssueModal}
            >
              + Issue Book (Manual)
            </button>
          )}
        </div>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError("")} />
      <SuccessMessage message={success} onDismiss={() => setSuccess("")} />

      {loading ? (
        <Loading message="Loading borrowing records..." />
      ) : loans.length === 0 ? (
        <EmptyState
          title={
            filterOverdueOnly ? "No overdue loans!" : "No borrowing records"
          }
          message={
            filterOverdueOnly
              ? "All active loans are within their permitted loan periods."
              : "No books have been borrowed yet."
          }
        />
      ) : (
        <div className="table-responsive bg-white rounded shadow-sm border">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Member / User</th>
                <th>Book Title</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Return Date</th>
                <th>Status</th>
                <th>Fine</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => {
                const isIssued = loan.status === "issued";
                const dueDate = new Date(loan.dueDate);
                const isOverdue = isIssued && new Date() > dueDate;
                const fine = getCalculatedFine(loan);

                return (
                  <tr key={loan._id}>
                    <td>
                      <div>
                        <span className="fw-semibold">
                          {loan.user?.name || "Member"}
                        </span>
                      </div>
                      <small className="text-muted">{loan.user?.email}</small>
                    </td>
                    <td>
                      <span className="fw-medium">
                        {loan.book?.title || "Book record removed"}
                      </span>
                    </td>
                    <td>{new Date(loan.issueDate).toLocaleDateString()}</td>
                    <td>
                      <span className={isOverdue ? "text-danger fw-bold" : ""}>
                        {dueDate.toLocaleDateString()}
                      </span>
                    </td>
                    <td>
                      {loan.returnDate
                        ? new Date(loan.returnDate).toLocaleDateString()
                        : "—"}
                    </td>
                    <td>
                      {isIssued ? (
                        isOverdue ? (
                          <span className="badge bg-danger">Overdue</span>
                        ) : (
                          <span className="badge bg-primary">Active</span>
                        )
                      ) : (
                        <span className="badge bg-secondary">Returned</span>
                      )}
                    </td>
                    <td>
                      {fine > 0 ? (
                        <span className="text-danger fw-bold">₹{fine}</span>
                      ) : (
                        <span className="text-success">₹0</span>
                      )}
                    </td>
                    <td className="text-end">
                      {isIssued && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-success"
                          disabled={returningId === loan._id}
                          onClick={() => handleProcessReturn(loan._id)}
                        >
                          {returningId === loan._id
                            ? "Processing..."
                            : "Process Return"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Manual Issue Book Modal */}
      {showIssueModal && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Manual Book Issuance</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowIssueModal(false)}
                ></button>
              </div>
              <form onSubmit={handleIssueBook}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">
                      Select Member <span className="text-danger">*</span>
                    </label>
                    {members.length === 0 ? (
                      <div className="alert alert-info py-2 small mb-0">
                        No separate registered members found. Book will be issued to current staff account.
                      </div>
                    ) : (
                      <select
                        className="form-select"
                        value={selectedMemberId}
                        onChange={(e) => setSelectedMemberId(e.target.value)}
                        required
                      >
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.email})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      Select Available Book <span className="text-danger">*</span>
                    </label>
                    {books.length === 0 ? (
                      <div className="alert alert-warning mb-0">
                        No books with available copies found.
                      </div>
                    ) : (
                      <select
                        className="form-select"
                        value={selectedBookId}
                        onChange={(e) => setSelectedBookId(e.target.value)}
                        required
                      >
                        {books.map((b) => (
                          <option key={b._id} value={b._id}>
                            {b.title} ({b.availableCopies} available)
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <p className="small text-muted mb-0">
                    Direct manual issuance creates a loan with a 7-day loan period and immediately decrements available copies.
                  </p>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowIssueModal(false)}
                    disabled={issuing}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={issuing || books.length === 0}
                  >
                    {issuing ? "Issuing..." : "Confirm Issue"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

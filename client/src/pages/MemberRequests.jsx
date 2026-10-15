import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import Loading from "../components/common/Loading";
import ErrorMessage from "../components/common/ErrorMessage";
import SuccessMessage from "../components/common/SuccessMessage";
import EmptyState from "../components/common/EmptyState";

export default function MemberRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadRequests() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/requests/my");
      setRequests(res.data.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load your book requests."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  function getStatusBadge(status) {
    switch (status) {
      case "pending":
        return <span className="badge bg-warning text-dark">Pending</span>;
      case "approved":
        return <span className="badge bg-success">Approved</span>;
      case "rejected":
        return <span className="badge bg-danger">Rejected</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  }

  return (
    <div className="container py-5">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold">My Book Requests</h2>
          <p className="text-secondary mb-0">
            Track your book borrowing requests and review approval decisions by the library staff.
          </p>
        </div>
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={loadRequests}
            disabled={loading}
          >
            Refresh
          </button>
          <Link to="/member/books" className="btn btn-primary">
            + Request Another Book
          </Link>
        </div>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError("")} />
      <SuccessMessage message={success} onDismiss={() => setSuccess("")} />

      {loading ? (
        <Loading message="Loading your book requests..." />
      ) : requests.length === 0 ? (
        <EmptyState
          title="No book requests yet"
          message="You haven't requested any books. Browse the catalogue to submit your first borrowing request!"
          action={
            <Link to="/member/books" className="btn btn-primary btn-sm">
              Browse Catalogue
            </Link>
          }
        />
      ) : (
        <div className="table-responsive bg-white rounded shadow-sm border">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Book Title</th>
                <th>Author</th>
                <th>Request Date</th>
                <th>Decision Date</th>
                <th>Status</th>
                <th>Details / Reason</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req._id}>
                  <td>
                    <span className="fw-semibold text-dark">
                      {req.book?.title || "Book record unavailable"}
                    </span>
                    {req.book?.isbn && (
                      <div className="text-muted small">ISBN: {req.book.isbn}</div>
                    )}
                  </td>
                  <td>{req.book?.author || "—"}</td>
                  <td>{new Date(req.requestDate).toLocaleDateString()}</td>
                  <td>
                    {req.decisionDate
                      ? new Date(req.decisionDate).toLocaleDateString()
                      : "—"}
                  </td>
                  <td>{getStatusBadge(req.status)}</td>
                  <td>
                    {req.status === "approved" ? (
                      <span className="text-success small fw-medium">
                        Loan active. Due date:{" "}
                        {req.borrowRecord?.dueDate
                          ? new Date(req.borrowRecord.dueDate).toLocaleDateString()
                          : "7 days from approval"}
                      </span>
                    ) : req.status === "rejected" ? (
                      <span className="text-danger small">
                        {req.rejectionReason || "Request declined by librarian."}
                      </span>
                    ) : (
                      <span className="text-muted small">
                        Awaiting librarian review...
                      </span>
                    )}
                  </td>
                  <td className="text-end">
                    {req.status === "approved" && (
                      <Link
                        to="/member/borrowings"
                        className="btn btn-sm btn-outline-success"
                      >
                        View in Loans
                      </Link>
                    )}
                    {req.status === "rejected" && (
                      <Link
                        to="/member/books"
                        className="btn btn-sm btn-outline-secondary"
                      >
                        Request Again
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

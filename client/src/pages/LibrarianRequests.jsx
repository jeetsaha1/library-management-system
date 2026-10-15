import React, { useState, useEffect } from "react";
import api from "../services/api";
import Loading from "../components/common/Loading";
import ErrorMessage from "../components/common/ErrorMessage";
import SuccessMessage from "../components/common/SuccessMessage";
import EmptyState from "../components/common/EmptyState";

export default function LibrarianRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [processingId, setProcessingId] = useState(null);

  // Rejection modal
  const [rejectingRequest, setRejectingRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  async function loadPendingRequests() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/requests/pending");
      setRequests(res.data.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load pending requests."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPendingRequests();
  }, []);

  async function handleApprove(request) {
    if (
      !window.confirm(
        `Approve request and issue "${request.book?.title}" to ${request.user?.name}?`
      )
    ) {
      return;
    }

    setProcessingId(request._id);
    setError("");
    setSuccess("");
    try {
      const res = await api.put(`/requests/${request._id}/approve`);
      setSuccess(
        res.data.message ||
          `Request approved! 7-day loan created for ${request.user?.name}.`
      );
      await loadPendingRequests();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to approve request. The book may have run out of available copies."
      );
    } finally {
      setProcessingId(null);
    }
  }

  function openRejectModal(request) {
    setRejectingRequest(request);
    setRejectionReason("");
  }

  async function handleConfirmReject(e) {
    e.preventDefault();
    if (!rejectingRequest) return;

    setProcessingId(rejectingRequest._id);
    setError("");
    setSuccess("");
    try {
      const res = await api.put(`/requests/${rejectingRequest._id}/reject`, {
        reason: rejectionReason,
      });
      setSuccess(res.data.message || "Request rejected successfully.");
      setRejectingRequest(null);
      await loadPendingRequests();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reject request.");
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="container py-5">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold">Pending Book Requests</h2>
          <p className="text-secondary mb-0">
            Review member requests. Approving a request atomically creates an active 7-day loan and updates book stock.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={loadPendingRequests}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError("")} />
      <SuccessMessage message={success} onDismiss={() => setSuccess("")} />

      {loading ? (
        <Loading message="Loading pending requests..." />
      ) : requests.length === 0 ? (
        <EmptyState
          title="No pending requests!"
          message="All patron book requests have been reviewed and processed."
        />
      ) : (
        <div className="table-responsive bg-white rounded shadow-sm border">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Member</th>
                <th>Requested Book</th>
                <th>ISBN</th>
                <th>Available Copies</th>
                <th>Request Date</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => {
                const book = req.book;
                const hasCopies = book && book.availableCopies > 0;
                const isProcessing = processingId === req._id;

                return (
                  <tr key={req._id}>
                    <td>
                      <div className="fw-semibold">{req.user?.name}</div>
                      <div className="text-muted small">{req.user?.email}</div>
                    </td>
                    <td>
                      <span className="fw-medium text-dark">
                        {book?.title || "Unknown Book"}
                      </span>
                      <div className="text-muted small">
                        Author: {book?.author || "—"}
                      </div>
                    </td>
                    <td>
                      <small className="text-secondary">{book?.isbn || "—"}</small>
                    </td>
                    <td>
                      {hasCopies ? (
                        <span className="badge bg-success-subtle text-success border border-success-subtle">
                          {book.availableCopies} of {book.totalCopies} available
                        </span>
                      ) : (
                        <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                          0 copies available
                        </span>
                      )}
                    </td>
                    <td>{new Date(req.requestDate).toLocaleDateString()}</td>
                    <td>
                      <span className="badge bg-warning text-dark">Pending</span>
                    </td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-success"
                          disabled={isProcessing || !hasCopies}
                          onClick={() => handleApprove(req)}
                        >
                          {isProcessing ? "Processing..." : "Approve"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          disabled={isProcessing}
                          onClick={() => openRejectModal(req)}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingRequest && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold text-danger">
                  Reject Book Request
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setRejectingRequest(null)}
                ></button>
              </div>
              <form onSubmit={handleConfirmReject}>
                <div className="modal-body">
                  <p className="mb-2">
                    Are you sure you want to reject the request for{" "}
                    <strong>"{rejectingRequest.book?.title}"</strong> by{" "}
                    <strong>{rejectingRequest.user?.name}</strong>?
                  </p>
                  <div className="mb-3">
                    <label className="form-label">
                      Rejection Reason (Optional)
                    </label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="e.g. Book is reserved for physical reference / Member has reached borrowing quota"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setRejectingRequest(null)}
                    disabled={processingId === rejectingRequest._id}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-danger"
                    disabled={processingId === rejectingRequest._id}
                  >
                    {processingId === rejectingRequest._id
                      ? "Rejecting..."
                      : "Confirm Rejection"}
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

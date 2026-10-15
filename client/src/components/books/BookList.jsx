import React, { useState, useEffect } from "react";
import api from "../../services/api";
import Loading from "../common/Loading";
import ErrorMessage from "../common/ErrorMessage";
import SuccessMessage from "../common/SuccessMessage";
import EmptyState from "../common/EmptyState";

export default function BookList({ role, onBorrowSuccess }) {
  const [books, setBooks] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [selectedBook, setSelectedBook] = useState(null); // for view details modal
  const [editingBook, setEditingBook] = useState(null); // for edit modal
  const [isCreating, setIsCreating] = useState(false); // for create modal
  const [submitting, setSubmitting] = useState(false);
  const [requestingId, setRequestingId] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    author: "",
    isbn: "",
    totalCopies: 1,
  });

  const isStaff = role === "admin" || role === "librarian";

  async function fetchBooksAndRequests() {
    setLoading(true);
    setError("");
    try {
      const endpoint = search.trim()
        ? `/books?search=${encodeURIComponent(search.trim())}`
        : "/books";
      
      const promises = [api.get(endpoint)];
      if (role === "member") {
        promises.push(api.get("/requests/my").catch(() => ({ data: { data: [] } })));
      }

      const results = await Promise.all(promises);
      setBooks(results[0].data.data || []);
      if (results[1]) {
        setMyRequests(results[1].data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load books from catalogue.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBooksAndRequests();
  }, []);

  function handleSearchSubmit(e) {
    e.preventDefault();
    fetchBooksAndRequests();
  }

  // Check if member currently has a pending request for a book
  function hasPendingRequest(bookId) {
    return myRequests.some(
      (r) =>
        r.status === "pending" &&
        ((r.book?._id && r.book._id === bookId) || r.book === bookId)
    );
  }

  async function handleRequestBook(bookId) {
    setError("");
    setSuccess("");
    setRequestingId(bookId);
    try {
      const res = await api.post("/requests", { bookId });
      setSuccess(
        res.data.message ||
          "Book requested successfully! Awaiting librarian approval."
      );
      // Refresh my requests and book list
      await fetchBooksAndRequests();
      if (onBorrowSuccess) {
        onBorrowSuccess();
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to request this book. Check copy availability or pending requests."
      );
    } finally {
      setRequestingId(null);
    }
  }

  async function handleDelete(bookId, bookTitle) {
    if (!window.confirm(`Are you sure you want to delete "${bookTitle}"?`)) {
      return;
    }
    setError("");
    setSuccess("");
    try {
      const res = await api.delete(`/books/${bookId}`);
      setSuccess(res.data.message || "Book deleted successfully.");
      await fetchBooksAndRequests();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete book.");
    }
  }

  function openCreateModal() {
    setFormData({ title: "", author: "", isbn: "", totalCopies: 1 });
    setIsCreating(true);
  }

  function openEditModal(book) {
    setEditingBook(book);
    setFormData({
      title: book.title || "",
      author: book.author || "",
      isbn: book.isbn || "",
      totalCopies: book.totalCopies ?? 1,
    });
  }

  async function handleSaveBook(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      if (isCreating) {
        const res = await api.post("/books", formData);
        setSuccess(res.data.message || "Book added successfully.");
        setIsCreating(false);
      } else if (editingBook) {
        const res = await api.put(`/books/${editingBook._id}`, formData);
        setSuccess(res.data.message || "Book updated successfully.");
        setEditingBook(null);
      }
      await fetchBooksAndRequests();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save book details.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <form
          onSubmit={handleSearchSubmit}
          className="d-flex gap-2 flex-grow-1"
          style={{ maxWidth: "500px" }}
        >
          <input
            type="text"
            className="form-control"
            placeholder="Search by title, author, or ISBN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">
            Search
          </button>
          {search && (
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => {
                setSearch("");
                setTimeout(() => {
                  fetchBooksAndRequests();
                }, 0);
              }}
            >
              Reset
            </button>
          )}
        </form>

        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={fetchBooksAndRequests}
            disabled={loading}
          >
            Refresh
          </button>
          {isStaff && (
            <button
              type="button"
              className="btn btn-success"
              onClick={openCreateModal}
            >
              + Add Book
            </button>
          )}
        </div>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError("")} />
      <SuccessMessage message={success} onDismiss={() => setSuccess("")} />

      {loading ? (
        <Loading message="Loading book catalogue..." />
      ) : books.length === 0 ? (
        <EmptyState
          title="No books found"
          message={
            search
              ? `No books match "${search}". Try searching for another title or author.`
              : "There are currently no books in the catalogue."
          }
          action={
            isStaff && (
              <button
                className="btn btn-primary btn-sm"
                onClick={openCreateModal}
              >
                Add the first book
              </button>
            )
          }
        />
      ) : (
        <div className="table-responsive bg-white rounded shadow-sm border">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>ISBN</th>
                <th className="text-center">Availability</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => {
                const available = book.availableCopies > 0;
                const isPending = role === "member" && hasPendingRequest(book._id);

                return (
                  <tr key={book._id}>
                    <td>
                      <span className="fw-semibold text-dark">{book.title}</span>
                    </td>
                    <td>{book.author || "—"}</td>
                    <td>
                      <small className="text-secondary">{book.isbn || "—"}</small>
                    </td>
                    <td className="text-center">
                      {available ? (
                        <span className="badge bg-success-subtle text-success border border-success-subtle">
                          {book.availableCopies} of {book.totalCopies} available
                        </span>
                      ) : (
                        <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                          Out of stock (0/{book.totalCopies})
                        </span>
                      )}
                    </td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setSelectedBook(book)}
                        >
                          View Details
                        </button>

                        {role === "member" && (
                          <button
                            type="button"
                            className={isPending ? "btn btn-sm btn-warning" : "btn btn-sm btn-primary"}
                            disabled={!available || isPending || requestingId === book._id}
                            onClick={() => handleRequestBook(book._id)}
                          >
                            {requestingId === book._id
                              ? "Requesting..."
                              : isPending
                              ? "Pending Approval"
                              : "Request Book"}
                          </button>
                        )}

                        {isStaff && (
                          <>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => openEditModal(book)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(book._id, book.title)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* View Book Details Modal */}
      {selectedBook && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Book Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedBook(null)}
                ></button>
              </div>
              <div className="modal-body">
                <h4 className="fw-bold text-primary mb-1">{selectedBook.title}</h4>
                <p className="text-secondary mb-3">
                  By {selectedBook.author || "Unknown"}
                </p>
                <div className="list-group list-group-flush border-top border-bottom mb-3">
                  <div className="list-group-item d-flex justify-content-between px-0">
                    <span className="text-muted">ISBN</span>
                    <span className="fw-semibold">{selectedBook.isbn || "—"}</span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between px-0">
                    <span className="text-muted">Total Copies</span>
                    <span className="fw-semibold">{selectedBook.totalCopies}</span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between px-0">
                    <span className="text-muted">Available Copies</span>
                    <span className="fw-semibold">
                      {selectedBook.availableCopies}
                    </span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between px-0">
                    <span className="text-muted">Status</span>
                    <span>
                      {selectedBook.availableCopies > 0 ? (
                        <span className="badge bg-success">Available for loan</span>
                      ) : (
                        <span className="badge bg-danger">Currently unavailable</span>
                      )}
                    </span>
                  </div>
                  {role === "member" && hasPendingRequest(selectedBook._id) && (
                    <div className="list-group-item d-flex justify-content-between px-0 bg-light">
                      <span className="text-warning fw-semibold">Your Request</span>
                      <span className="badge bg-warning text-dark">
                        Pending Librarian Approval
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                {role === "member" && selectedBook.availableCopies > 0 && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={
                      hasPendingRequest(selectedBook._id) ||
                      requestingId === selectedBook._id
                    }
                    onClick={() => {
                      handleRequestBook(selectedBook._id);
                      setSelectedBook(null);
                    }}
                  >
                    {hasPendingRequest(selectedBook._id)
                      ? "Pending Approval"
                      : "Request this book"}
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedBook(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create or Edit Book Modal */}
      {(isCreating || editingBook) && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  {isCreating ? "Add New Book" : "Edit Book"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingBook(null);
                  }}
                ></button>
              </div>
              <form onSubmit={handleSaveBook}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">
                      Title <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Author</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.author}
                      onChange={(e) =>
                        setFormData({ ...formData, author: e.target.value })
                      }
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">ISBN</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.isbn}
                      onChange={(e) =>
                        setFormData({ ...formData, isbn: e.target.value })
                      }
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      Total Copies <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      min="0"
                      value={formData.totalCopies}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          totalCopies: parseInt(e.target.value) || 0,
                        })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setIsCreating(false);
                      setEditingBook(null);
                    }}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting
                      ? "Saving..."
                      : isCreating
                      ? "Add Book"
                      : "Save Changes"}
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


import { useEffect, useState } from "react";
import api from "../services/api";

export default function Librarians() {
  const [librarians, setLibrarians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);

  async function loadLibrarians() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/users/librarians");
      setLibrarians(response.data.librarians || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load librarians. Please log in as an admin."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLibrarians();
  }, []);

  function handleChange(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      const response = await api.post("/users/librarians", form);

      setMessage(response.data.message || "Librarian created successfully.");
      setForm({ name: "", email: "", password: "" });

      await loadLibrarians();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to create the librarian account."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="container py-4">
      <div className="mb-4">
        <h2>Librarian Management</h2>
        <p className="text-muted">
          Create librarian accounts and view existing librarians.
        </p>
      </div>

      {message && (
        <div className="alert alert-success" role="status">
          {message}
        </div>
      )}

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <section className="card shadow-sm mb-4">
        <div className="card-body">
          <h5 className="card-title mb-3">Create Librarian</h5>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label" htmlFor="librarian-name">
                Full name
              </label>
              <input
                id="librarian-name"
                className="form-control"
                name="name"
                value={form.name}
                onChange={handleChange}
                maxLength={100}
                autoComplete="name"
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="librarian-email">
                Email address
              </label>
              <input
                id="librarian-email"
                className="form-control"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                maxLength={254}
                autoComplete="email"
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="librarian-password">
                Temporary password
              </label>
              <input
                id="librarian-password"
                className="form-control"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                minLength={8}
                autoComplete="new-password"
                required
              />
              <div className="form-text">
                Use at least 8 characters.
              </div>
            </div>

            <button
              className="btn btn-primary"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Creating..." : "Create Librarian"}
            </button>
          </form>
        </div>
      </section>

      <section className="card shadow-sm">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="card-title mb-0">Existing Librarians</h5>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={loadLibrarians}
              disabled={loading}
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p>Loading librarians...</p>
          ) : librarians.length === 0 ? (
            <p className="text-muted mb-0">No librarians found.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped align-middle">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {librarians.map((librarian) => (
                    <tr key={librarian.id}>
                      <td>{librarian.name}</td>
                      <td>{librarian.email}</td>
                      <td>{librarian.role}</td>
                      <td>
                        {librarian.createdAt
                          ? new Date(librarian.createdAt).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

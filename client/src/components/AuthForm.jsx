import { useState } from "react";
import api from "../services/api";

export default function AuthForm({ mode, onSuccess, onModeChange }) {
  const isRegister = mode === "register";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const endpoint = isRegister
        ? "/auth/register"
        : "/auth/login";

      const payload = isRegister
        ? { name, email, password }
        : { email, password };

      const response = await api.post(endpoint, payload);
      const data = response.data;

      sessionStorage.setItem("libtrack_token", data.token);
      sessionStorage.setItem(
        "libtrack_user",
        JSON.stringify(data.user)
      );

      setMessage(data.message || "Success!");

      onSuccess(data.user);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to connect to LibTrack. Check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body p-4 p-md-5">
        <h2 className="fw-bold mb-2">
          {isRegister ? "Create your account" : "Welcome back"}
        </h2>

        <p className="text-secondary mb-4">
          {isRegister
            ? "Register as a LibTrack library member."
            : "Sign in to access your library account."}
        </p>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {message && (
          <div className="alert alert-success" role="status">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="mb-3">
              <label htmlFor="name" className="form-label">
                Full name
              </label>
              <input
                id="name"
                className="form-control form-control-lg"
                type="text"
                autoComplete="name"
                maxLength={100}
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
          )}

          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              Email address
            </label>
            <input
              id="email"
              className="form-control form-control-lg"
              type="email"
              autoComplete="email"
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              id="password"
              className="form-control form-control-lg"
              type="password"
              autoComplete={
                isRegister ? "new-password" : "current-password"
              }
              minLength={isRegister ? 8 : undefined}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            {isRegister && (
              <div className="form-text">
                Use at least 8 characters.
              </div>
            )}
          </div>

          <button
            className="btn btn-primary btn-lg w-100"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : isRegister
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <div className="text-center mt-4">
          {isRegister ? (
            <>
              Already have an account?{" "}
              <button
                type="button"
                className="btn btn-link p-0"
                onClick={() => onModeChange("login")}
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              New to LibTrack?{" "}
              <button
                type="button"
                className="btn btn-link p-0"
                onClick={() => onModeChange("register")}
              >
                Create an account
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
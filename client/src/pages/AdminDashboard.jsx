import React from "react";
import { Link } from "react-router-dom";

export default function AdminDashboard({ user }) {
  return (
    <div className="container py-5">
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4 p-md-5">
          <span className="badge text-bg-primary mb-3">Administrator Workspace</span>

          <h1 className="fw-bold">Welcome, {user?.name}!</h1>

          <p className="text-secondary">
            You are signed in as an Administrator. You have system-wide privileges to manage librarian accounts and book inventory.
          </p>

          <hr />

          <h2 className="h5 mb-3">Account details</h2>

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

          <div className="alert alert-info mb-4">
            Use the administrative controls below to register staff librarians or manage library catalogue books.
          </div>

          <div className="d-flex flex-wrap gap-3">
            <Link to="/admin/librarians" className="btn btn-primary">
              Manage Librarians
            </Link>
            <Link to="/admin/books" className="btn btn-outline-primary">
              Manage Books
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

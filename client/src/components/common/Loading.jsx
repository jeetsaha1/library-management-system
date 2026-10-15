import React from "react";

export default function Loading({ message = "Loading..." }) {
  return (
    <div className="d-flex align-items-center justify-content-center py-5 gap-3">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      <span className="text-secondary">{message}</span>
    </div>
  );
}

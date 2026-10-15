import React from "react";

export default function SuccessMessage({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div className="alert alert-success alert-dismissible fade show" role="status">
      {message}
      {onDismiss && (
        <button
          type="button"
          className="btn-close"
          aria-label="Close"
          onClick={onDismiss}
        ></button>
      )}
    </div>
  );
}

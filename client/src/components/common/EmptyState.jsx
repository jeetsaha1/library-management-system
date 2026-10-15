import React from "react";

export default function EmptyState({ title = "No records found", message, action }) {
  return (
    <div className="text-center py-5 px-3 bg-white rounded border">
      <h5 className="text-muted fw-semibold mb-2">{title}</h5>
      {message && <p className="text-secondary small mb-3">{message}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}

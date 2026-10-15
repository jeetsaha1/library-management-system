import React from "react";
import BookList from "../components/books/BookList";

export default function BooksPage({ role }) {
  const titles = {
    member: {
      heading: "Book Catalogue",
      subheading: "Explore available books, check availability, and borrow titles.",
    },
    librarian: {
      heading: "Manage Book Catalogue",
      subheading: "Add new books, update catalogued details, and manage inventory copies.",
    },
    admin: {
      heading: "Library Book Management",
      subheading: "Oversee the library catalogue and edit or remove titles as needed.",
    },
  }[role] || {
    heading: "Book Catalogue",
    subheading: "Browse titles available in LibTrack.",
  };

  return (
    <div className="container py-5">
      <div className="mb-4">
        <h2 className="fw-bold">{titles.heading}</h2>
        <p className="text-secondary">{titles.subheading}</p>
      </div>

      <BookList role={role} />
    </div>
  );
}

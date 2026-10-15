# LibTrack — Library Management System

A library management application built with React, Vite, Node.js, Express, MongoDB, and Docker Compose.

---

## 1. Project Overview

**LibTrack** is a college project providing a simple, functional, role-based Library Management System featuring:

- **Member**: Browse catalogue, search books by title/author/ISBN, view available copies, submit book borrowing requests, track pending/approved/rejected requests, view active loans, return books, track due dates, and monitor overdue fines.
- **Librarian**: Review pending member requests with transactional **Approve** (issues active 7-day loan, updates inventory) and **Reject** (with optional reason, leaves copies unchanged), manual book issuance to registered members, process book returns with automatic fine calculation, manage book catalogue, and track overdue loans.
- **Administrator**: Comprehensive dashboard, librarian account creation and management, full book catalogue management, and secure sign-out.

---

## 2. Technology Stack

- **Frontend**: React.js 19, Vite, JavaScript, Bootstrap 5.3, React Router 7, Axios.
- **Backend**: Node.js, Express.js 5, Mongoose 8.
- **Database**: MongoDB (MongoDB Atlas / local container).
- **Authentication**: JWT (JSON Web Tokens) with Bearer token authorization header and password hashing via bcryptjs.
- **Environment**: Docker & Docker Compose.

---

## 3. Business Workflow: Book Request & Librarian Approval

```text
Member browses books
       │
       ▼
Member requests a book  ──► Saved as "pending" (copies NOT decremented)
       │
       ▼
Librarian reviews pending requests
       │
   ┌───┴───────────────────────────────┐
   ▼                                   ▼
Approve Request                     Reject Request
   │                                   │
   ├─ Checks book availability         ├─ Sets status to "rejected"
   ├─ Creates active BorrowRecord      ├─ Optional rejection reason
   ├─ Sets 7-day dueDate               └─ Copies remain untouched
   ├─ Decrements availableCopies
   └─ Links loan to BookRequest
```

### Key Workflow Rules:
1. Creating a request does **not** issue a book and does **not** decrement available copies.
2. Only an authorized librarian or administrator can approve or reject a request.
3. Duplicate pending requests by the same member for the same book are rejected with `409 Conflict`.
4. Approval is atomic and transactional: creates exactly one active borrowing record, decrements `availableCopies`, and transitions status to `approved`.
5. An already approved or rejected request cannot be re-processed.
6. Members view their requests in **My Requests** and active loans in **My Borrowings**.
7. Direct manual issuance (`+ Issue Book`) remains available for in-person library visits to issue books directly to selected members.

---

## 4. Features by Role

### A. Library Member
- **Dashboard**: Welcome banner, account details, and four real-time summary cards:
  - Currently Borrowed count.
  - Pending Requests count.
  - Due Soon or Overdue count.
  - Outstanding Fines (calculated at ₹5/day for overdue days).
- **Book Catalogue**:
  - Live search by title, author, or ISBN.
  - Available copies badge and stock indicators.
  - View book details modal with pending request alerts.
  - **Request Book** button (switches to "Pending Approval" if already requested; disabled when 0 copies available).
- **My Requests**:
  - Track all requests with status badges: `Pending` (yellow), `Approved` (green), `Rejected` (red).
  - Displays decision date, rejection reasons, and links to active loans.
- **My Borrowings**:
  - **Current Active Loans**: Book title, borrow date, due date, status badge, accrued fine, and Return Book action.
  - **Borrowing History**: Past completed loans with return dates and recorded fines.

### B. Librarian
- **Dashboard**: Welcome banner, librarian details, quick navigation buttons, and summary metrics:
  - Pending Requests count.
  - Total Book Titles.
  - Active Loans across all members.
  - Overdue Loans count.
- **Pending Requests Management** (`/librarian/requests`):
  - List of all pending requests with member name, email, book title, ISBN, and available copies.
  - **Approve**: Atomically creates active loan, decrements stock, and updates status.
  - **Reject**: Modal with optional reason, transitions status to rejected without altering stock.
- **Manage Books**:
  - Add new book with title, author, ISBN, and copy counts.
  - Edit existing book details.
  - Delete book with safety checks (deletion prevented if copies are actively borrowed).
- **Borrowings Management** (`/librarian/borrowings`):
  - View all member borrowing records.
  - **+ Issue Book (Manual)**: Select registered member and available book to issue in-person loans.
  - **Process Return**: Return loan with automatic fine calculation.
- **Overdue Loans**:
  - Dedicated view showing only active loans past their due date.

### C. Administrator
- **Dashboard**: Account details, direct links to Manage Librarians and Manage Books.
- **Librarian Management**:
  - Form to create librarian accounts with frontend & backend validation (minimum 8-character password, email format validation).
  - List of existing librarians with name, email, role, and registration date.
- **Manage Books**: Full catalogue oversight and book maintenance.

---

## 5. API Module Overview

| Endpoint | Method | Role / Access | Description |
|---|---|---|---|
| `/api/auth/register` | `POST` | Public | Register a new member account |
| `/api/auth/login` | `POST` | Public | Sign in and receive JWT token |
| `/api/books` | `GET` | Public / All | Get book catalogue; supports `?search=` |
| `/api/books/:id` | `GET` | Public / All | Get specific book details |
| `/api/books` | `POST` | Librarian, Admin | Add new book to catalogue |
| `/api/books/:id` | `PUT` | Librarian, Admin | Update book details |
| `/api/books/:id` | `DELETE` | Librarian, Admin | Delete book (if no active loans) |
| `/api/requests` | `POST` | Member | Submit a book borrowing request |
| `/api/requests/my` | `GET` | Member | Retrieve member's own requests |
| `/api/requests/pending` | `GET` | Librarian, Admin | Retrieve pending requests for review |
| `/api/requests/:id/approve` | `PUT` | Librarian, Admin | Approve request, create loan, decrement stock |
| `/api/requests/:id/reject` | `PUT` | Librarian, Admin | Reject request with optional reason |
| `/api/borrow/issue` | `POST` | Authenticated | Manual direct issuance to member |
| `/api/borrow/:id/return` | `PUT` | Authenticated | Return borrowed book and calculate fine |
| `/api/borrow/my` | `GET` | Authenticated | Retrieve member's own loan history |
| `/api/borrow` | `GET` | Librarian, Admin | Retrieve all loans across members |
| `/api/borrow/overdue` | `GET` | Librarian, Admin | Retrieve active loans that are overdue |
| `/api/users/members` | `GET` | Librarian, Admin | Retrieve list of registered library members |
| `/api/users/librarians` | `GET` | Admin | List all registered librarians |
| `/api/users/librarians` | `POST` | Admin | Create a new librarian account |

---

## 6. Test Commands

Run the full automated test suite (fine calculation & request/approval workflow):
```bash
docker compose exec server npm test
```

Run only request & approval workflow tests:
```bash
docker compose exec server npm run test:requests
```

Run Vite production build check:
```bash
docker compose exec client npx vite build
```

---

## 7. College Demo Workflow

1. **Member Workflow**:
   - Log in or register as a Member (`demo.member@example.com` / `password123`).
   - Land on `/member/dashboard` showing summary cards (Current Loans, Pending Requests, Overdue, Fines).
   - Click **Browse Books**, find an available book, and click **Request Book**.
   - Notice the button changes to **Pending Approval** and available copies are **not** decremented yet.
   - Click **My Requests** to view the request marked with a yellow **Pending** badge.

2. **Librarian Approval Workflow**:
   - Sign out and log in as a Librarian (`demo.librarian@example.com` / `password123` or created librarian).
   - Land on `/librarian/dashboard` showing pending request notification count.
   - Click **Pending Requests** (or navigate to `/librarian/requests`).
   - Review the member's request and click **Approve**.
   - Confirmation is displayed; the request is removed from pending, stock is decremented, and an active loan is created.

3. **Verification in Member Account**:
   - Log back in as the Member.
   - Check **My Requests**: status is now a green **Approved** badge with due date details.
   - Check **My Borrowings**: book now appears under **Current Active Loans** with a **Return Book** action.
   - Click **Return Book** to return it and watch availability update back in catalogue.

4. **Rejection Verification**:
   - Submit another request as Member.
   - In Librarian account, click **Reject**, enter a reason, and confirm.
   - Member sees red **Rejected** badge in **My Requests** with reason displayed, and can request again.
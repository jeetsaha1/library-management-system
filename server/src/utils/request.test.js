import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import Book from "../models/Book.js";
import BookRequest from "../models/BookRequest.js";
import BorrowRecord from "../models/BorrowRecord.js";

async function runTests() {
  console.log("Starting Book Request & Approval Workflow Automated Tests...");
  await connectDB();

  const secret = process.env.JWT_SECRET || "test-secret";

  // Find or create test users
  let member = await User.findOne({ role: "member" });
  if (!member) {
    member = await User.create({
      name: "Test Member",
      email: "test.member@example.com",
      password: "password123",
      role: "member",
    });
  }

  let librarian = await User.findOne({ role: "librarian" });
  if (!librarian) {
    librarian = await User.create({
      name: "Test Librarian",
      email: "test.librarian@example.com",
      password: "password123",
      role: "librarian",
    });
  }

  // Create a dedicated test book
  const testBook = await Book.create({
    title: "Automated Testing Handbook " + Date.now(),
    author: "QA Engineer",
    isbn: "978-" + Math.floor(1000000000 + Math.random() * 9000000000),
    totalCopies: 1,
    availableCopies: 1,
  });

  const memberToken = jwt.sign({ id: member._id.toString(), role: "member" }, secret, { expiresIn: "1h" });
  const librarianToken = jwt.sign({ id: librarian._id.toString(), role: "librarian" }, secret, { expiresIn: "1h" });

  const BASE_URL = "http://localhost:5000/api";

  // 1. Unauthenticated user cannot create request
  const unauthRes = await fetch(`${BASE_URL}/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bookId: testBook._id }),
  });
  assert.equal(unauthRes.status, 401, "Unauthenticated request should return 401");
  console.log("✓ Test 1: Unauthenticated request rejected (401)");

  // 2. Authenticated member can create a book request
  const createRes = await fetch(`${BASE_URL}/requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${memberToken}`,
    },
    body: JSON.stringify({ bookId: testBook._id }),
  });
  assert.equal(createRes.status, 201, "Member request should return 201");
  const createData = await createRes.json();
  assert.equal(createData.success, true);
  assert.equal(createData.data.status, "pending");
  const requestId = createData.data._id;
  console.log("✓ Test 2: Member successfully created pending request (201)");

  // Verify creating request did NOT decrement book availability
  const bookCheck1 = await Book.findById(testBook._id);
  assert.equal(bookCheck1.availableCopies, 1, "Creating request must not decrement available copies");
  console.log("✓ Test 3: Creating request does not decrement book available copies");

  // 3. Member cannot submit duplicate pending request for same book
  const dupRes = await fetch(`${BASE_URL}/requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${memberToken}`,
    },
    body: JSON.stringify({ bookId: testBook._id }),
  });
  assert.equal(dupRes.status, 409, "Duplicate pending request should return 409");
  console.log("✓ Test 4: Duplicate pending request rejected (409)");

  // 4. Member can list their own requests
  const myRes = await fetch(`${BASE_URL}/requests/my`, {
    headers: { Authorization: `Bearer ${memberToken}` },
  });
  assert.equal(myRes.status, 200);
  const myData = await myRes.json();
  assert.ok(myData.data.some((r) => r._id === requestId));
  console.log("✓ Test 5: Member can list their own requests (200)");

  // 5. Member cannot approve or reject requests
  const memberApproveRes = await fetch(`${BASE_URL}/requests/${requestId}/approve`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${memberToken}` },
  });
  assert.equal(memberApproveRes.status, 403, "Member cannot approve requests (403)");
  console.log("✓ Test 6: Member cannot approve requests (403)");

  // 6. Librarian can list pending requests
  const pendingRes = await fetch(`${BASE_URL}/requests/pending`, {
    headers: { Authorization: `Bearer ${librarianToken}` },
  });
  assert.equal(pendingRes.status, 200);
  const pendingData = await pendingRes.json();
  assert.ok(pendingData.data.some((r) => r._id === requestId));
  console.log("✓ Test 7: Librarian can view pending requests list");

  // 7. Librarian approves request
  const approveRes = await fetch(`${BASE_URL}/requests/${requestId}/approve`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${librarianToken}` },
  });
  assert.equal(approveRes.status, 200, "Librarian approval should return 200");
  const approveData = await approveRes.json();
  assert.equal(approveData.data.status, "approved");
  assert.ok(approveData.data.borrowRecord, "Approved request must link to a created BorrowRecord");
  console.log("✓ Test 8: Librarian approved request and created loan");

  // Check that book available copies was decremented to 0
  const bookCheck2 = await Book.findById(testBook._id);
  assert.equal(bookCheck2.availableCopies, 0, "Approved loan must decrement availableCopies to 0");
  console.log("✓ Test 9: Book availability correctly updated to 0");

  // 8. Cannot approve already approved request
  const reApproveRes = await fetch(`${BASE_URL}/requests/${requestId}/approve`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${librarianToken}` },
  });
  assert.equal(reApproveRes.status, 409, "Already approved request cannot be re-approved (409)");
  console.log("✓ Test 10: Already approved request cannot be approved again (409)");

  // 9. Cannot reject already approved request
  const reRejectRes = await fetch(`${BASE_URL}/requests/${requestId}/reject`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${librarianToken}`,
    },
    body: JSON.stringify({ reason: "Duplicate" }),
  });
  assert.equal(reRejectRes.status, 409, "Already approved request cannot be rejected (409)");
  console.log("✓ Test 11: Already approved request cannot be rejected (409)");

  // 10. Test rejection workflow on a new request
  const testBook2 = await Book.create({
    title: "Rejection Test Book " + Date.now(),
    author: "QA Tester",
    isbn: "978-" + Math.floor(1000000000 + Math.random() * 9000000000),
    totalCopies: 1,
    availableCopies: 1,
  });

  const req2Res = await fetch(`${BASE_URL}/requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${memberToken}`,
    },
    body: JSON.stringify({ bookId: testBook2._id }),
  });
  const req2Data = await req2Res.json();
  const req2Id = req2Data.data._id;

  const rejectRes = await fetch(`${BASE_URL}/requests/${req2Id}/reject`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${librarianToken}`,
    },
    body: JSON.stringify({ reason: "Currently reserved for maintenance" }),
  });
  assert.equal(rejectRes.status, 200, "Rejection should return 200");
  const rejectData = await rejectRes.json();
  assert.equal(rejectData.data.status, "rejected");

  const bookCheck3 = await Book.findById(testBook2._id);
  assert.equal(bookCheck3.availableCopies, 1, "Rejection must not decrement copies");
  console.log("✓ Test 12: Rejection leaves copies unchanged and marks status rejected");

  // 11. Cleanup test records
  await BookRequest.deleteMany({ _id: { $in: [requestId, req2Id] } });
  if (approveData.data.borrowRecord?._id) {
    await BorrowRecord.findByIdAndDelete(approveData.data.borrowRecord._id);
  }
  await Book.deleteMany({ _id: { $in: [testBook._id, testBook2._id] } });

  console.log("==========================================");
  console.log("All 12 Request & Approval Tests Passed!");
  console.log("==========================================");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

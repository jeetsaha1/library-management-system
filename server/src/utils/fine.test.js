import assert from "node:assert/strict";
import {
  calculateFine,
  daysLate,
  addDays,
  LOAN_DAYS,
  FINE_PER_DAY,
} from "./fine.js";

const issueDate = new Date(2026, 9, 10, 12, 0, 0);
const dueDate = addDays(issueDate, LOAN_DAYS);

// Configuration
assert.equal(LOAN_DAYS, 7);
assert.equal(FINE_PER_DAY, 5);

// Early return
assert.equal(calculateFine(dueDate, addDays(dueDate, -2)), 0);

// Returned on due date
assert.equal(calculateFine(dueDate, dueDate), 0);

// Late returns
assert.equal(calculateFine(dueDate, addDays(dueDate, 1)), 5);
assert.equal(calculateFine(dueDate, addDays(dueDate, 3)), 15);
assert.equal(calculateFine(dueDate, addDays(dueDate, 4)), 20);
assert.equal(calculateFine(dueDate, addDays(dueDate, 7)), 35);
assert.equal(calculateFine(dueDate, addDays(dueDate, 30)), 150);

// Overdue-day count
assert.equal(daysLate(dueDate, addDays(dueDate, -1)), 0);
assert.equal(daysLate(dueDate, dueDate), 0);
assert.equal(daysLate(dueDate, addDays(dueDate, 1)), 1);
assert.equal(daysLate(dueDate, addDays(dueDate, 3)), 3);
assert.equal(daysLate(dueDate, addDays(dueDate, 7)), 7);

// Same calendar day: no fine, even at a different time
const dueDateMorning = new Date(2026, 9, 17, 9, 0, 0);
const dueDateEvening = new Date(2026, 9, 17, 23, 59, 0);
assert.equal(calculateFine(dueDateMorning, dueDateEvening), 0);

// Calendar-day boundary
const nextDay = new Date(2026, 9, 18, 0, 1, 0);
assert.equal(calculateFine(dueDateMorning, nextDay), 5);

console.log("All fine tests passed successfully!");
console.log("Early return: ₹0");
console.log("On due date: ₹0");
console.log("1 day late: ₹5");
console.log("3 days late: ₹15");
console.log("7 days late: ₹35");
console.log("30 days late: ₹150");
console.log("Calendar-day boundary tests passed.");
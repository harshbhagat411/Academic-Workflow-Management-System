# Chapter 7: Testing

This chapter presents the test suite for the Academic Workflow Management System. The suite comprises positive, negative, and validation test cases designed to verify the correct functioning of all implemented system modules, ensuring robustness, security (via role-based access control), proper error handling, and validation logic.

As per design guidelines, the actual output is assumed to match the expected output, and the status for all successfully implemented features is marked as **Pass**.

---

## 7.1 Authentication & Password Recovery

| Test Case ID | Test Case | Input | Expected Output | Actual Output | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-AUTH-01** | User Login with valid credentials (Positive) | `POST /api/auth/login`<br>Body: `{ "loginId": "admin", "password": "password123" }` | HTTP 200 OK<br>JSON containing JWT `token` and `role`. | Matches Expected | Pass |
| **TC-AUTH-02** | User Login with invalid password (Negative) | `POST /api/auth/login`<br>Body: `{ "loginId": "admin", "password": "wrongpassword" }` | HTTP 401 Unauthorized<br>JSON: `{ "message": "Invalid credentials" }` | Matches Expected | Pass |
| **TC-AUTH-03** | User Login with deactivated account status (Negative) | `POST /api/auth/login`<br>Body: `{ "loginId": "deactivated_stu", "password": "password123" }` | HTTP 403 Forbidden<br>JSON: `{ "message": "Your account has been deactivated..." }` | Matches Expected | Pass |
| **TC-AUTH-04** | First-time login password setup (Positive) | `POST /api/auth/first-time-password`<br>Auth: Bearer JWT (First Login)<br>Body: `{ "newPassword": "secureNewPassword123" }` | HTTP 200 OK<br>JSON: `{ "message": "Password updated successfully. Access granted." }` | Matches Expected | Pass |
| **TC-AUTH-05** | First-time login password too short (Negative / Validation) | `POST /api/auth/first-time-password`<br>Auth: Bearer JWT (First Login)<br>Body: `{ "newPassword": "123" }` | HTTP 400 Bad Request<br>JSON: `{ "message": "Password must be at least 6 characters long." }` | Matches Expected | Pass |
| **TC-AUTH-06** | Request OTP for password reset (Forgot Password - Positive) | `POST /api/auth/forgot-password-request`<br>Body: `{ "email": "student@college.edu" }` | HTTP 200 OK<br>JSON: `{ "message": "OTP sent to your registered email" }` | Matches Expected | Pass |
| **TC-AUTH-07** | Reset password with invalid / expired OTP (Negative) | `POST /api/auth/reset-password`<br>Body: `{ "email": "student@college.edu", "otp": "000000", "newPassword": "newpassword123" }` | HTTP 400 Bad Request<br>JSON: `{ "message": "Invalid OTP" }` or `{ "message": "OTP has expired" }` | Matches Expected | Pass |

---

## 7.2 Role-Based Access Control (RBAC)

| Test Case ID | Test Case | Input | Expected Output | Actual Output | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-RBAC-01** | Admin role accessing administrative routes (Positive) | `GET /api/users/all`<br>Auth: Bearer JWT (Admin Role) | HTTP 200 OK<br>JSON: Array of all registered users. | Matches Expected | Pass |
| **TC-RBAC-02** | Student role attempting to access Admin routes (Negative / Authorization) | `GET /api/users/all`<br>Auth: Bearer JWT (Student Role) | HTTP 403 Forbidden<br>JSON: `{ "message": "Access denied" }` | Matches Expected | Pass |
| **TC-RBAC-03** | Anonymous request to protected route without token (Negative) | `GET /api/users/me`<br>Auth: None | HTTP 401 Unauthorized<br>JSON: `{ "message": "Not authorized, no token" }` | Matches Expected | Pass |

---

## 7.3 User & Profile Management

| Test Case ID | Test Case | Input | Expected Output | Actual Output | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-USER-01** | Admin creates a new student user manually (Positive) | `POST /api/users/create`<br>Auth: Bearer JWT (Admin)<br>Body: `{ "userId": "STU105", "loginId": "stu105", "password": "password123", "name": "John Doe", "email": "john@college.edu", "phone": "9876543210", "gender": "Male", "role": "Student", "department": "Information Technology", "semester": 4 }` | HTTP 201 Created<br>JSON: Created student user record metadata. | Matches Expected | Pass |
| **TC-USER-02** | Admin creates a user with missing required field (Negative / Validation) | `POST /api/users/create`<br>Auth: Bearer JWT (Admin)<br>Body: `{ "userId": "STU106", "loginId": "stu106", "password": "password123", "name": "No Email", "role": "Student", "department": "IT" }` | HTTP 400 Bad Request / Validation Error<br>JSON error message. | Matches Expected | Pass |
| **TC-USER-03** | User updates profile contact information (Positive) | `PATCH /api/users/me`<br>Auth: Bearer JWT (Student)<br>Body: `{ "phone": "9998887776", "email": "johndoe_new@college.edu" }` | HTTP 200 OK<br>JSON: Updated profile details. | Matches Expected | Pass |

---

## 7.4 Subject Management

| Test Case ID | Test Case | Input | Expected Output | Actual Output | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-SUB-01** | Admin creates a new Subject (Positive) | `POST /api/subjects/create`<br>Auth: Bearer JWT (Admin)<br>Body: `{ "name": "Operating Systems", "code": "CS-204", "department": "Computer Science", "semester": 4, "facultyId": "60c72b2f9b1d8b2a5c8e2342" }` | HTTP 201 Created<br>JSON: Subject object metadata. | Matches Expected | Pass |
| **TC-SUB-02** | Admin deletes a Subject (Positive) | `DELETE /api/subjects/60c72b2f9b1d8b2a5c8e2343`<br>Auth: Bearer JWT (Admin) | HTTP 200 OK<br>JSON: `{ "message": "Subject deleted successfully" }` | Matches Expected | Pass |

---

## 7.5 Timetable Management

| Test Case ID | Test Case | Input | Expected Output | Actual Output | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-TIME-01** | Admin schedules a new class lecture slot (Positive) | `POST /api/timetable/add`<br>Auth: Bearer JWT (Admin)<br>Body: `{ "semester": 4, "section": "A", "day": "Monday", "startTime": "09:00", "endTime": "10:00", "type": "Lecture", "subjectId": "60c72b2f9b1d8b2a5c8e2341", "facultyId": "60c72b2f9b1d8b2a5c8e2342" }` | HTTP 201 Created<br>JSON: Timetable slot record. | Matches Expected | Pass |
| **TC-TIME-02** | Admin enters invalid day format for timetable slot (Negative / Validation) | `POST /api/timetable/add`<br>Auth: Bearer JWT (Admin)<br>Body: `{ "semester": 4, "section": "A", "day": "Funday", "startTime": "09:00", "endTime": "10:00", "type": "Lecture", "subjectId": "60c72b2f9b1d8b2a5c8e2341", "facultyId": "60c72b2f9b1d8b2a5c8e2342" }` | HTTP 400 Bad Request / validation error (due to Mongoose `day` enum). | Matches Expected | Pass |

---

## 7.6 Attendance Management

| Test Case ID | Test Case | Input | Expected Output | Actual Output | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-ATT-01** | Faculty creates an Attendance Session (Positive) | `POST /api/attendance/session/create`<br>Auth: Bearer JWT (Faculty)<br>Body: `{ "subjectId": "60c72b2f9b1d8b2a5c8e2341", "date": "2026-07-01T10:00:00Z", "section": "A", "topic": "Process Synchronization" }` | HTTP 201 Created<br>JSON: Session metadata. | Matches Expected | Pass |
| **TC-ATT-02** | Faculty marks attendance for students in a session (Positive) | `POST /api/attendance/mark`<br>Auth: Bearer JWT (Faculty)<br>Body: `{ "sessionId": "60c72b2f9b1d8b2a5c8e2380", "attendanceData": [{ "studentId": "60c72b2f9b1d8b2a5c8e2350", "status": "Present" }, { "studentId": "60c72b2f9b1d8b2a5c8e2351", "status": "Absent" }] }` | HTTP 200 OK<br>JSON: `{ "message": "Attendance marked successfully" }` | Matches Expected | Pass |

---

## 7.7 Assessment & Grading Management

| Test Case ID | Test Case | Input | Expected Output | Actual Output | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-ASM-01** | Faculty registers a new Assessment (Positive) | `POST /api/assessments/create`<br>Auth: Bearer JWT (Faculty)<br>Body: `{ "subjectId": "60c72b2f9b1d8b2a5c8e2341", "type": "Quiz", "title": "Quiz 1", "maxMarks": 10, "examDate": "2026-07-10", "section": "A" }` | HTTP 201 Created<br>JSON: Assessment metadata. | Matches Expected | Pass |
| **TC-ASM-02** | Faculty saves student mark exceeding assessment limit (Negative / Validation) | `POST /api/assessments/60c72b2f9b1d8b2a5c8e2390/marks`<br>Auth: Bearer JWT (Faculty)<br>Body: `{ "marksData": [{ "studentId": "60c72b2f9b1d8b2a5c8e2350", "marksObtained": 15 }] }` *(maxMarks is 10)* | HTTP 400 Bad Request<br>JSON: `{ "message": "Marks obtained cannot exceed max marks" }` | Matches Expected | Pass |

---

## 7.8 Academic Requests Workflow

| Test Case ID | Test Case | Input | Expected Output | Actual Output | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-REQ-01** | Student submits Leave Application request (Positive) | `POST /api/requests/create`<br>Auth: Bearer JWT (Student)<br>Body: `{ "requestType": "Leave Application", "description": "Medical leave", "startDate": "2026-07-02", "endDate": "2026-07-04", "facultyId": "60c72b2f9b1d8b2a5c8e2342" }` | HTTP 201 Created<br>JSON: Request object containing generated `requestId`. | Matches Expected | Pass |
| **TC-REQ-02** | Faculty reviews and signs off request (Faculty Approval - Positive) | `PUT /api/requests/60c72b2f9b1d8b2a5c8e2395/status`<br>Auth: Bearer JWT (Faculty)<br>Body: `{ "action": "Faculty Approved", "remarks": "Approved by mentor" }` | HTTP 200 OK<br>JSON: Request record with state updated to `Faculty Approved`. | Matches Expected | Pass |
| **TC-REQ-03** | Admin approves request finally (Final Approval - Positive) | `PUT /api/requests/admin/60c72b2f9b1d8b2a5c8e2395/status`<br>Auth: Bearer JWT (Admin)<br>Body: `{ "action": "Approved", "remarks": "Final signature granted" }` | HTTP 200 OK<br>JSON: Request record with status updated to `Approved`. | Matches Expected | Pass |

---

## 7.9 Mentorship Chat

| Test Case ID | Test Case | Input | Expected Output | Actual Output | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-CHAT-01** | Student opens room messages (Positive) | `GET /api/chat/messages/60c72b2f9b1d8b2a5c8e2400`<br>Auth: Bearer JWT (Student) | HTTP 200 OK<br>JSON: Array of historical message objects. | Matches Expected | Pass |

---

## 7.10 Academic Bot (AI Assistant)

| Test Case ID | Test Case | Input | Expected Output | Actual Output | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-BOT-01** | Student sends academic query within standard parameters (Positive) | `POST /api/academic-bot/ask`<br>Body: `{ "message": "Can you explain process scheduling?", "studentId": "60c72b2f9b1d8b2a5c8e2350" }` | HTTP 200 OK<br>JSON: `{ "reply": "..." }` containing the AI response. | Matches Expected | Pass |
| **TC-BOT-02** | Student query contains forbidden/blocked keywords (Negative / Validation) | `POST /api/academic-bot/ask`<br>Body: `{ "message": "Which movie is releasing today?", "studentId": "60c72b2f9b1d8b2a5c8e2350" }` | HTTP 200 OK<br>JSON: `{ "reply": "This assistant handles academic queries only." }` | Matches Expected | Pass |
| **TC-BOT-03** | Query exceeds max message length (Negative / Validation) | `POST /api/academic-bot/ask`<br>Body: `{ "message": "<string of 501 chars>", "studentId": "60c72b2f9b1d8b2a5c8e2350" }` | HTTP 400 Bad Request<br>JSON: `{ "reply": "Message too long. Please restrict to 500 characters." }` | Matches Expected | Pass |
| **TC-BOT-04** | Rate limiter triggers after exceeding maximum daily requests (Negative) | `POST /api/academic-bot/ask`<br>Body: `{ "message": "What is virtual memory?", "studentId": "60c72b2f9b1d8b2a5c8e2350" }`<br>*(Context: Student has already queried 10 times today)* | HTTP 429 Too Many Requests<br>JSON: `{ "reply": "Daily limit reached (10 requests/day). Please try again tomorrow." }` | Matches Expected | Pass |

# Chapter 7: Testing (Manual GUI Test Cases)

This chapter outlines the manual functional test cases for verification of the user interfaces (GUIs) implemented in the Academic Workflow Management System. These test cases are designed to be executed directly from a web browser by an end-user, simulating interaction with forms, navigation elements, inputs, and interactive components.

The actual outputs are assumed to match the expected outputs, and the status for all successfully implemented features is marked as **Pass**.

---

## 7.1 Login, Password Control & Recovery

| Test Case ID | Test Case | Input/Test Data | Expected Output | Actual Output | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-GUI-AUTH-01** | Verify Login functionality with valid credentials (Positive) | Enter Login ID: `"admin"`, Password: `"password123"`, click the **Login** button. | User is authenticated successfully and redirected to the Admin Dashboard page. | Matches Expected | Pass |
| **TC-GUI-AUTH-02** | Verify Login functionality with invalid password (Negative) | Enter Login ID: `"admin"`, Password: `"wrongpass"`, click the **Login** button. | An alert message displaying `"Invalid credentials"` is rendered. User remains on the Login screen. | Matches Expected | Pass |
| **TC-GUI-AUTH-03** | Verify forced password setup on first-time login (Validation) | Login with newly registered credentials, click the **Login** button. | User is redirected to a locked "Force Password Change" page. Access to the main app dashboard is blocked until completed. | Matches Expected | Pass |
| **TC-GUI-AUTH-04** | Verify password length validation on setup page (Validation) | On the password change form, enter New Password: `"123"`, click **Save**. | Form validation error is displayed: `"Password must be at least 6 characters long."` | Matches Expected | Pass |
| **TC-GUI-AUTH-05** | Verify OTP request for password recovery (Forgot Password - Positive) | Click **Forgot Password**, input Email: `"student@college.edu"`, click the **Send OTP** button. | Notification toast displays `"OTP sent to your registered email"`. The verification OTP field becomes visible and enabled. | Matches Expected | Pass |

---

## 7.2 Profile & Settings Management

| Test Case ID | Test Case | Input/Test Data | Expected Output | Actual Output | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-GUI-PROF-01** | Verify interface theme settings toggle (Positive) | Navigate to the Settings panel, click the Theme dropdown, select `"Dark Mode"`, and click **Save Settings**. | The application styling shifts to Dark Mode color theme instantly. Selection persists upon page reload. | Matches Expected | Pass |
| **TC-GUI-PROF-02** | Verify user profile details update (Positive) | Navigate to Settings, enter new contact phone number `"9988776655"`, click **Save Details**. | Success popup displays `"Profile updated successfully"`, and the user profile header updates with the new number. | Matches Expected | Pass |

---

## 7.3 User Management & Enrolment

| Test Case ID | Test Case | Input/Test Data | Expected Output | Actual Output | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-GUI-USER-01** | Verify manual Faculty account registration (Positive) | Go to "Create User" screen, select Role: `"Faculty"`, fill name, email, specialization as `"Networks"`, click **Submit**. | Notification toast displays `"User created successfully"`. The registration form fields clear automatically. | Matches Expected | Pass |
| **TC-GUI-USER-02** | Verify bulk user upload validation on invalid files (Negative) | Go to the Bulk Upload dashboard, choose a text document instead of CSV/Excel, click the **Upload** button. | Error prompt appears: `"Invalid file format. Please upload a CSV or Excel file."` Upload process is terminated. | Matches Expected | Pass |
| **TC-GUI-USER-03** | Verify deactivating an active user account (Authorization/Admin) | Go to User List page, search for user ID `"STU105"`, click the red **Deactivate** action button next to their name. | Account status updates to `"Deactivated"`. The user is instantly blocked from logging in (verified on login retry). | Matches Expected | Pass |

---

## 7.4 Subject & Timetable scheduling

| Test Case ID | Test Case | Input/Test Data | Expected Output | Actual Output | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-GUI-SUB-01** | Verify creating a new Subject (Positive) | Open Subject Planner, click **Add Subject**, fill Course Code: `"CS202"`, Name: `"Operating Systems"`, assign Faculty, click **Create**. | The subject list table updates, showing `"CS202"` in the grid. | Matches Expected | Pass |
| **TC-GUI-TIME-01** | Verify scheduling a class timetable slot (Positive) | Open Timetable Builder, select Semester: `4`, Section: `"A"`, Day: `"Monday"`, Time: `"09:00 - 10:00"`, Subject: `"Operating Systems"`, click **Add Slot**. | The scheduled class cell shows up on the Section A weekly timetable grid. | Matches Expected | Pass |

---

## 7.5 Attendance Tracking

| Test Case ID | Test Case | Input/Test Data | Expected Output | Actual Output | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-GUI-ATT-01** | Verify attendance marking for class sessions (Positive) | Open Attendance sheet, choose Subject: `"Operating Systems"`, Section: `"A"`, check boxes for `"Present"` or `"Absent"` next to student names, click **Submit**. | Toast message displays `"Attendance marked successfully"`. The list locks from immediate edits. | Matches Expected | Pass |
| **TC-GUI-ATT-02** | Verify student attendance status summary display (Positive) | Log in as Student, open the Attendance dashboard tab. | Rendered page shows progress bar indicators for subject percentages (e.g. CS202: 85%) and total classes attended. | Matches Expected | Pass |

---

## 7.6 Academic Evaluations & Grading

| Test Case ID | Test Case | Input/Test Data | Expected Output | Actual Output | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-GUI-ASM-01** | Verify creating new assessment tasks (Positive) | Go to Assessments, click **Add Assessment**, fill type: `"Quiz"`, title: `"Quiz 1"`, max marks: `10`, click **Save**. | The Quiz 1 evaluation sheet becomes listed in the pending grading directory. | Matches Expected | Pass |
| **TC-GUI-ASM-02** | Verify locking marks sheet entry (Positive) | Open Quiz 1 grades, enter student scores, click the **Lock Marks** button. | A warning dialogue prompt appears. After clicking confirm, input fields turn read-only, and entry status changes to `"Locked"`. | Matches Expected | Pass |

---

## 7.7 Academic Requests & workflow approval

| Test Case ID | Test Case | Input/Test Data | Expected Output | Actual Output | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-GUI-REQ-01** | Verify student request submission (Positive) | Open Requests panel, click **Raise Request**, select Type: `"Leave Application"`, input description detail, click **Submit**. | Request record displays in student dashboard status table, with status tag set to `"Submitted"`. | Matches Expected | Pass |
| **TC-GUI-REQ-02** | Verify Faculty sign-off approval step (Positive) | Log in as Faculty Mentor, open Requests, select student leave request, add remarks, click the **Recommend/Approve** button. | Request status in the list updates to `"Faculty Approved"`. Request disappears from Faculty active queue. | Matches Expected | Pass |
| **TC-GUI-REQ-03** | Verify Admin final decision approval step (Positive) | Log in as Admin, open requests queue, click **Final Approve** on a `"Faculty Approved"` status request. | Request status updates to `"Approved"`. The student dashboard displays the updated final status. | Matches Expected | Pass |

---

## 7.8 Mentorship Chat

| Test Case ID | Test Case | Input/Test Data | Expected Output | Actual Output | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-GUI-CHAT-01** | Verify guide messaging chat utility (Positive) | Open Mentorship Chat, type `"Hello guide, project file uploaded."`, click the **Send** button. | The message displays instantly in the chat box thread alongside delivery confirmation checkmark. | Matches Expected | Pass |

---

## 7.9 AI Academic Assistant (Bot)

| Test Case ID | Test Case | Input/Test Data | Expected Output | Actual Output | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-GUI-BOT-01** | Verify standard academic query submission (Positive) | Open AI Assistant chat, type `"What is context switching?"`, click **Send**. | AI chatbot outputs a structured explanation definition of context switching. | Matches Expected | Pass |
| **TC-GUI-BOT-02** | Verify chat prompt keyword filtering rules (Negative/Validation) | Open AI Assistant chat, type `"Do you like to watch movies?"`, click **Send**. | The request is filtered, and bot replies with warning template message: `"This assistant handles academic queries only."` | Matches Expected | Pass |
| **TC-GUI-BOT-03** | Verify daily interaction limit triggering (Negative) | Attempt to send an 11th consecutive academic query in a single day. | Bot response field displays: `"Daily limit reached (10 requests/day). Please try again tomorrow."` further queries are blocked. | Matches Expected | Pass |

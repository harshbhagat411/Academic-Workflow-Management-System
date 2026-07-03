# Data Dictionary: Academic Workflow Management System

This document provides a comprehensive Data Dictionary for all database collections implemented in the Academic Workflow Management System. It details every field, data type, size/length, constraints, references, default values, and description, suitable for inclusion in System Requirements Specification (SRS) documentation.

---

## 1. User Collection
Keeps track of all users in the system including Admins, Students, and Faculty members, along with authorization, profile, and status information.

| Field Name | Data Type | Size / Length | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | - | Primary Key | Unique MongoDB internal identifier. |
| `userId` | String | - | Unique, Required | Internal identifier (Student Roll Number / Faculty Code). |
| `loginId` | String | - | Unique, Required | Login ID / Username. |
| `password` | String | - | Required | Hashed password for authentication. |
| `name` | String | - | Required | User's full name. |
| `email` | String | - | Required, Unique | User's email address. |
| `phone` | String | - | Required | User's contact number. |
| `gender` | String | - | Required, Enum: `['Male', 'Female', 'Other']` | Gender of the user. |
| `role` | String | - | Required, Enum: `['Admin', 'Student', 'Faculty']` | Access level and role in the system. |
| `department` | String | - | Required | Name or code of the academic department. |
| `status` | String | - | Default: `'Active'`, Enum: `['Active', 'Deactivated']` | Account status. |
| `semester` | Number | - | Required conditionally (if `role` is `'Student'`) | The current semester of the student. |
| `maxSemesterReached`| Number | - | Optional | Highest semester reached by the student (for graduation tracking). |
| `specialization` | String | - | Required conditionally (if `role` is `'Faculty'`), Enum: `['Programming', 'Database', 'Networks', 'Artificial Intelligence', 'Mathematics', 'Web Development', 'Cloud Computing', 'Data Science', 'Software Engineering', 'Research & Projects']` | Academic expertise domain. |
| `section` | String | - | Optional | Auto-assigned section (only applicable for Students). |
| `isFirstLogin` | Boolean | - | Default: `true` | Indicates if the user is logging in for the first time. |
| `passwordResetOtp` | String | - | Optional | OTP code generated for password reset requests. |
| `passwordResetOtpExpiry` | Date | - | Optional | Timestamp indicating when the password reset OTP expires. |
| `createdAt` | Date | - | Default: `Date.now` | User registration timestamp. |

---

## 2. Assessment Collection
Maintains records of academic evaluations created by Faculty members for a particular subject and section.

| Field Name | Data Type | Size / Length | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | - | Primary Key | Unique MongoDB internal identifier. |
| `subjectId` | ObjectId | - | Required, Foreign Key (Ref: `Subject`) | Reference to the associated subject. |
| `facultyId` | ObjectId | - | Required, Foreign Key (Ref: `User`) | Reference to the Faculty who created the assessment. |
| `type` | String | - | Required, Enum: `['Test', 'Quiz', 'Assignment', 'Mid-Term', 'Final', 'Project', 'Internal Test 1', 'Internal Test 2', 'Mid Semester', 'End Semester']` | The category of academic evaluation. |
| `title` | String | - | Required, Unique (with `subjectId`) | Title of the assessment (e.g., "Unit Test 1"). |
| `maxMarks` | Number | - | Required, Min: 1 | Maximum score possible for the assessment. |
| `semester` | Number | - | Required | Academic semester (derived from the related Subject). |
| `assessmentTypeId` | ObjectId | - | Foreign Key (Ref: `AssessmentType`), Optional | Reference to custom evaluation weightage settings. |
| `examDate` | Date | - | Optional | Date on which the assessment is scheduled/held. |
| `section` | String | - | Optional | Section name, if this assessment is section-specific. |
| `status` | String | - | Default: `'Active'`, Enum: `['Active', 'Locked']` | Indicates if marks entry is active or locked from editing. |
| `createdAt` | Date | - | Managed by Mongoose | Timestamp indicating when the record was created. |
| `updatedAt` | Date | - | Managed by Mongoose | Timestamp indicating when the record was last updated. |

---

## 3. AssessmentType Collection
Stores configurations for different types of academic assessments along with weightage details.

| Field Name | Data Type | Size / Length | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | - | Primary Key | Unique MongoDB internal identifier. |
| `name` | String | - | Required, Unique | Name of the assessment type (e.g., "Internal Test 1"). |
| `maxMarks` | Number | - | Required | Default maximum marks assigned to this type. |
| `weightage` | Number | - | Required | Contribution weightage percentage towards the final grade. |
| `isActive` | Boolean | - | Default: `true` | Indicates whether this assessment configuration is active. |
| `createdAt` | Date | - | Managed by Mongoose | Timestamp indicating when the record was created. |
| `updatedAt` | Date | - | Managed by Mongoose | Timestamp indicating when the record was last updated. |

---

## 4. Assignment Collection
Stores metadata for homework tasks and assignments posted by Faculty members for students.

| Field Name | Data Type | Size / Length | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | - | Primary Key | Unique MongoDB internal identifier. |
| `title` | String | - | Required | Title of the assignment. |
| `description` | String | - | Required | Detailed guidelines and questions of the assignment. |
| `subjectId` | ObjectId | - | Required, Foreign Key (Ref: `Subject`) | Reference to the associated subject. |
| `semester` | Number | - | Required | Academic semester. |
| `dueDate` | Date | - | Required | Deadline date and time for submission. |
| `createdBy` | ObjectId | - | Required, Foreign Key (Ref: `User`) | Reference to the Faculty user who posted the assignment. |
| `createdAt` | Date | - | Managed by Mongoose | Timestamp indicating when the record was created. |
| `updatedAt` | Date | - | Managed by Mongoose | Timestamp indicating when the record was last updated. |

---

## 5. AttendanceRecord Collection
Contains attendance tracking details for students matching their presence state against class sessions.

| Field Name | Data Type | Size / Length | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | - | Primary Key | Unique MongoDB internal identifier. |
| `sessionId` | ObjectId | - | Required, Foreign Key (Ref: `AttendanceSession`) | Reference to the associated class session. |
| `studentId` | ObjectId | - | Required, Foreign Key (Ref: `User`) | Reference to the student user. |
| `status` | String | - | Required, Enum: `['Present', 'Absent']` | Student's attendance status for that session. |
| `createdAt` | Date | - | Managed by Mongoose | Timestamp indicating when the record was created. |
| `updatedAt` | Date | - | Managed by Mongoose | Timestamp indicating when the record was last updated. |

---

## 6. AttendanceSession Collection
Defines a lecture/lab event for which student attendance is recorded.

| Field Name | Data Type | Size / Length | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | - | Primary Key | Unique MongoDB internal identifier. |
| `subjectId` | ObjectId | - | Required, Foreign Key (Ref: `Subject`) | Reference to the subject taught during the session. |
| `facultyId` | ObjectId | - | Required, Foreign Key (Ref: `User`) | Reference to the Faculty who conducted the session. |
| `date` | Date | - | Required | Date and time when the session occurred. |
| `section` | String | - | Required | The student section targeted during the session. |
| `topic` | String | - | Optional | Brief description of the topic covered in class. |
| `timetableId` | ObjectId | - | Foreign Key (Ref: `Timetable`), Optional | Associated slot reference in the weekly timetable. |
| `createdAt` | Date | - | Managed by Mongoose | Timestamp indicating when the record was created. |
| `updatedAt` | Date | - | Managed by Mongoose | Timestamp indicating when the record was last updated. |

---

## 7. ChatMessage Collection
Stores individual text messages exchanged between students and their assigned project guides.

| Field Name | Data Type | Size / Length | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | - | Primary Key | Unique MongoDB internal identifier. |
| `messageId` | String | - | Unique, Default: `uuidv4` | Public UUID for the message. |
| `chatRoomId` | ObjectId | - | Required, Foreign Key (Ref: `ChatRoom`) | Reference to the chat room container. |
| `senderId` | ObjectId | - | Required, Foreign Key (Ref: `User`) | Reference to the user who sent the message. |
| `senderRole` | String | - | Required, Enum: `['Student', 'Faculty']` | Role of the sender. |
| `message` | String | - | Required | Encrypted/Plain text message content. |
| `isRead` | Boolean | - | Default: `false` | Indicates if the message has been read by the recipient (internal). |
| `isDelivered` | Boolean | - | Default: `true` | Indicates if the message is delivered. |
| `isSeen` | Boolean | - | Default: `false` | Tracks whether the message was opened/seen. |
| `createdAt` | Date | - | Managed by Mongoose | Timestamp indicating when the message was sent. |
| `updatedAt` | Date | - | Managed by Mongoose | Timestamp indicating when the message was updated. |

---

## 8. ChatRoom Collection
Manages one-on-one communication channels between Students and their Faculty Mentors/Guides.

| Field Name | Data Type | Size / Length | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | - | Primary Key | Unique MongoDB internal identifier. |
| `roomId` | String | - | Unique, Default: `uuidv4` | Public UUID for the chat room. |
| `studentId` | ObjectId | - | Required, Foreign Key (Ref: `User`) | Reference to the Student. |
| `guideId` | ObjectId | - | Required, Foreign Key (Ref: `User`) | Reference to the Faculty (Mentor/Guide). |
| `lastMessage` | ObjectId | - | Foreign Key (Ref: `ChatMessage`), Optional | Reference to the most recently sent message. |
| `updatedAt` | Date | - | Default: `Date.now`, Managed by Mongoose | Last activity timestamp. |
| `createdAt` | Date | - | Managed by Mongoose | Creation timestamp. |

## 9. MentorAllocation Collection
Details active mentor and guide allocations assigned to students for specific semesters.

| Field Name | Data Type | Size / Length | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | - | Primary Key | Unique MongoDB internal identifier. |
| `allocationId` | String | - | Unique, Default: `uuidv4` | Public allocation unique key. |
| `studentId` | ObjectId | - | Required, Foreign Key (Ref: `User`) | Reference to the Student. |
| `facultyId` | ObjectId | - | Required, Foreign Key (Ref: `User`) | Reference to the assigned Mentor (Faculty). |
| `semester` | Number | - | Required | Semester for which this allocation is valid. |
| `department` | String | - | Required | Department associated with the allocation. |
| `assignedBy` | ObjectId | - | Required, Foreign Key (Ref: `User`) | Reference to the Admin user who performed this mapping. |
| `assignedAt` | Date | - | Default: `Date.now` | Date and time when mapping was completed. |
| `isActive` | Boolean | - | Default: `true` | Tracks if the allocation is active or historical. |

---

## 10. Notification Collection
Keeps track of in-app alerts and notifications delivered to users.

| Field Name | Data Type | Size / Length | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | - | Primary Key | Unique MongoDB internal identifier. |
| `userId` | ObjectId | - | Required, Foreign Key (Ref: `User`) | Reference to the target recipient user. |
| `message` | String | - | Required | Alert message content. |
| `type` | String | - | Default: `'system'`, Enum: `['request', 'assignment', 'system', 'chat']` | Notification category. |
| `isRead` | Boolean | - | Default: `false` | Unread (false) or read (true) status flag. |
| `createdAt` | Date | - | Default: `Date.now` | Creation timestamp. |

---

## 11. Request Collection
Stores requests raised by students that follow a two-tier verification workflow (Faculty approval first, then Admin approval).

| Field Name | Data Type | Size / Length | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | - | Primary Key | Unique MongoDB internal identifier. |
| `requestId` | String | - | Unique, Required | Public identifier of the request (e.g. `REQ-1002`). |
| `requestType` | String | - | Required, Enum: `['Bonafide Certificate', 'Leave Application', 'Internship Approval', 'Project Topic Approval', 'Section Change', 'Subject Change', 'Timetable Clash', 'Lab Batch Change', 'Attendance Correction Request', 'Re-evaluation Request', 'ID Card Replacement', 'Subject Change Request', 'Project Supervisor Change Request', 'Project Extension Request']` | Type/Nature of the workflow request. |
| `description` | String | - | Required | Student's statement/reason for making the request. |
| `startDate` | Date | - | Optional | Leave start date (structured leave applications only). |
| `endDate` | Date | - | Optional | Leave end date (structured leave applications only). |
| `department` | String | - | Required | Student's academic department. |
| `status` | String | - | Default: `'Submitted'`, Enum: `['Submitted', 'Faculty Approved', 'Approved', 'Rejected']` | Workflow lifecycle status. |
| `isArchived` | Boolean | - | Default: `false` | Indicates if the request has been archived. |
| `archivedAt` | Date | - | Default: `null` | Timestamp when the request was archived. |
| `facultyRemarks` | String | - | Optional | Notes added by the reviewing Faculty member. |
| `facultyActionDate` | Date | - | Optional | Date-time of the faculty decision. |
| `adminRemarks` | String | - | Optional | Notes added by the reviewing Admin user. |
| `adminActionDate` | Date | - | Optional | Date-time of the admin decision. |
| `studentId` | ObjectId | - | Required, Foreign Key (Ref: `User`) | Reference to the submitting Student. |
| `facultyId` | ObjectId | - | Foreign Key (Ref: `User`), Optional | Reference to the reviewing Mentor/Faculty. |
| `createdAt` | Date | - | Default: `Date.now` | Submission date-time. |
| `facultyActionDueAt` | Date | - | Optional | SLA deadline date for Faculty action. |
| `adminActionDueAt` | Date | - | Optional | SLA deadline date for Admin action. |
| `isFacultyDelayed` | Boolean | - | Default: `false` | True if Faculty missed the action SLA. |
| `isAdminDelayed` | Boolean | - | Default: `false` | True if Admin missed the action SLA. |
| `delayReason` | String | - | Default: `'NONE'`, Enum: `['NONE', 'FACULTY_DELAY', 'ADMIN_DELAY']` | Indicates who caused the delayed SLA breach. |

---

## 12. RequestAudit Collection
Documents audit history trails of actions performed on workflow requests.

| Field Name | Data Type | Size / Length | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | - | Primary Key | Unique MongoDB internal identifier. |
| `auditId` | String | - | Unique, Required | Public log unique identifier. |
| `requestId` | String | - | Required, Foreign Key (Ref: `Request.requestId`) | Reference to the associated request ID. |
| `performedBy` | ObjectId | - | Required, Foreign Key (Ref: `User`) | Reference to the actor executing the action. |
| `role` | String | - | Required, Enum: `['Student', 'Faculty', 'Admin']` | Role of the performer at the time of the action. |
| `action` | String | - | Required, Enum: `['Submitted', 'Faculty Approved', 'Faculty Rejected', 'Approved', 'Rejected']` | The action performed. |
| `remarks` | String | - | Optional | Accompanying notes at the time of the audit action. |
| `actionDate` | Date | - | Default: `Date.now` | Audit execution timestamp. |

---

## 13. Section Collection
Stores section allocation configurations and limits per department and semester.

| Field Name | Data Type | Size / Length | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | - | Primary Key | Unique MongoDB internal identifier. |
| `sectionName` | String | - | Required | E.g., 'A', 'B', 'C'. |
| `semester` | Number | - | Required | Academic semester. |
| `department` | String | - | Required | Associated academic department. |
| `maxCapacity` | Number | - | Default: `70` | Maximum student capacity limit. |
| `currentStrength` | Number | - | Default: `0` | Count of students currently enrolled in the section. |
| `status` | String | - | Default: `'Active'`, Enum: `['Active', 'Inactive']` | Section operational status. |
| `createdAt` | Date | - | Managed by Mongoose | Timestamp indicating when the record was created. |
| `updatedAt` | Date | - | Managed by Mongoose | Timestamp indicating when the record was last updated. |

---

## 14. Settings Collection
Maintains application theme, display, and notification configurations custom to every user.

| Field Name | Data Type | Size / Length | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | - | Primary Key | Unique MongoDB internal identifier. |
| `userId` | ObjectId | - | Required, Unique, Foreign Key (Ref: `User`) | Reference to the user whose configuration is represented. |
| `themeMode` | String | - | Default: `'system'` | Configured UI theme (e.g. `'default'` or `'system'`). |
| `colorMode` | String | - | Default: `'dark'` | Configured brightness mode (e.g. `'dark'` or `'light'`). |
| `emailNotifications` | Boolean | - | Default: `true` | Toggle state for receiving system emails. |
| `marksNotifications` | Boolean | - | Default: `true` | Toggle state for receiving marks release alerts. |
| `createdAt` | Date | - | Managed by Mongoose | Creation timestamp. |
| `updatedAt` | Date | - | Managed by Mongoose | Last update timestamp. |

---

## 15. StudentMark Collection
Registers individual assessment scores obtained by students.

| Field Name | Data Type | Size / Length | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | - | Primary Key | Unique MongoDB internal identifier. |
| `assessmentId` | ObjectId | - | Required, Foreign Key (Ref: `Assessment`) | Reference to the associated assessment. |
| `studentId` | ObjectId | - | Required, Foreign Key (Ref: `User`) | Reference to the student user. |
| `marksObtained` | Number | - | Required, Min: 0 | Score achieved by the student. |
| `enteredBy` | ObjectId | - | Foreign Key (Ref: `User`), Optional | Reference to the Faculty who registered the score. |
| `enteredAt` | Date | - | Default: `Date.now` | Timestamp of entry creation. |
| `subjectId` | ObjectId | - | Foreign Key (Ref: `Subject`), Optional | Reference to the associated subject. |
| `createdAt` | Date | - | Managed by Mongoose | Creation timestamp. |
| `updatedAt` | Date | - | Managed by Mongoose | Last modification timestamp. |

---

## 16. Subject Collection
Represents courses/subjects taught under departments in specific semesters.

| Field Name | Data Type | Size / Length | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | - | Primary Key | Unique MongoDB internal identifier. |
| `name` | String | - | Required | Subject name (e.g., "Computer Networks"). |
| `code` | String | - | Required, Unique | Unique subject code (e.g., "CS-302"). |
| `department` | String | - | Required | Academic department hosting the subject. |
| `semester` | Number | - | Required | Target semester. |
| `facultyId` | ObjectId | - | Required, Foreign Key (Ref: `User`) | Reference to Faculty assigned to teach the course. |
| `createdAt` | Date | - | Managed by Mongoose | Subject creation timestamp. |
| `updatedAt` | Date | - | Managed by Mongoose | Last modification timestamp. |

---

## 17. Submission Collection
Registers submissions uploaded by students for assignments.

| Field Name | Data Type | Size / Length | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | - | Primary Key | Unique MongoDB internal identifier. |
| `assignmentId` | ObjectId | - | Required, Foreign Key (Ref: `Assignment`) | Reference to the associated Assignment. |
| `studentId` | ObjectId | - | Required, Foreign Key (Ref: `User`) | Reference to the submitting Student. |
| `fileUrl` | String | - | Required | Public cloud storage URL of the file (Cloudinary). |
| `cloudinaryId` | String | - | Required | Asset ID of the file inside Cloudinary for deletion/updating. |
| `status` | String | - | Default: `'Submitted'`, Enum: `['Submitted', 'Late', 'Accepted', 'Rejected']` | Submission status. |
| `remarks` | String | - | Optional | Remarks left by reviewing faculty member. |
| `reviewedAt` | Date | - | Optional | Timestamp when evaluation remarks were added. |
| `reviewedBy` | ObjectId | - | Foreign Key (Ref: `User`), Optional | Reference to Faculty reviewer user. |
| `createdAt` | Date | - | Managed by Mongoose | Submission timestamp. |
| `updatedAt` | Date | - | Managed by Mongoose | Last update timestamp. |

---

## 18. Timetable Collection
Defines schedule configurations and session slots in a week.

| Field Name | Data Type | Size / Length | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | - | Primary Key | Unique MongoDB internal identifier. |
| `semester` | Number | - | Required | Scheduled semester. |
| `section` | String | - | Required | Target section (e.g., 'A', 'B'). |
| `day` | String | - | Required, Enum: `['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']` | Day of schedule. |
| `startTime` | String | - | Required | Start time formatted as `HH:mm`. |
| `endTime` | String | - | Required | End time formatted as `HH:mm`. |
| `type` | String | - | Required, Default: `'Lecture'`, Enum: `['Lecture', 'Lab', 'Project', 'Theory']` | Format/Category of class. |
| `subjectId` | ObjectId | - | Required, Foreign Key (Ref: `Subject`) | Reference to the Subject being scheduled. |
| `facultyId` | ObjectId | - | Required, Foreign Key (Ref: `User`) | Reference to Faculty assigned to conduct the class. |
| `createdAt` | Date | - | Default: `Date.now` | Creation date of timetable entry. |

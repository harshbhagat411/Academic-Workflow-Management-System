/**
 * ruleEngine.js
 * Validates academic requests against static university policies.
 */

const validateRequest = (student, requestPayload) => {
    const { requestType, startDate, endDate } = requestPayload;

    const semester = parseInt(student.semester, 10) || 1;

    // Internship Approval (Semester >= 4)
    if (requestType === 'Internship Approval') {
        if (semester < 4) {
            return {
                isAllowed: false,
                message: 'Internship requests are allowed only from Semester 4 onwards.'
            };
        }
    }

    // Project Topic Approval (Semester >= 4)
    if (requestType === 'Project Topic Approval') {
        if (semester < 4) {
            return {
                isAllowed: false,
                message: 'Project Topic Approval requests are allowed only from Semester 4 onwards.'
            };
        }
    }
    
    // Project Supervisor Change Request (Semester >= 4)
    if (requestType === 'Project Supervisor Change Request') {
        if (semester < 4) {
            return {
                isAllowed: false,
                message: 'Project Supervisor Change Requests are allowed only from Semester 4 onwards.'
            };
        }
    }

    // Project Extension Request (Semester >= 4)
    if (requestType === 'Project Extension Request') {
        if (semester < 4) {
            return {
                isAllowed: false,
                message: 'Project Extension Requests are allowed only from Semester 4 onwards.'
            };
        }
    }

    // Subject Change Request (Semester >= 3)
    if (requestType === 'Subject Change Request') {
        if (semester < 3) {
            return {
                isAllowed: false,
                message: 'Subject Change Requests are allowed only from Semester 3 onwards.'
            };
        }
    }

    // Bonafide Certificate (Active Status)
    if (requestType === 'Bonafide Certificate') {
        if (student.status !== 'Active') {
            return {
                isAllowed: false,
                message: 'Bonafide Certificates can only be issued to Active students.'
            };
        }
    }

    // Leave Application (Duration <= 7 days)
    if (requestType === 'Leave Application') {
        if (!startDate || !endDate) {
            return {
                isAllowed: false,
                message: 'Start Date and End Date are mandatory for Leave Applications.'
            };
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (end < start) {
            return {
                isAllowed: false,
                message: 'End date must be greater than or equal to start date.'
            };
        }

        // Calculate difference in days (inclusive)
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        if (diffDays > 7) {
            return {
                isAllowed: false,
                message: `Leave duration (${diffDays} days) cannot exceed 7 days as per academic policy.`
            };
        }
    }

    // No restrictions for: Attendance Correction Request, Re-evaluation Request, ID Card Replacement
    
    // Default Allow
    return { isAllowed: true };
};

module.exports = { validateRequest };

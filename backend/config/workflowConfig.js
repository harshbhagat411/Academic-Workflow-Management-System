const REQUEST_WORKFLOW_CONFIG = {
    "Bonafide Certificate": {
        finalApprover: "COUNSELLOR"
    },
    "Leave Application": {
        finalApprover: "COUNSELLOR"
    },
    "Attendance Correction Request": {
        finalApprover: "COUNSELLOR"
    },
    "Subject Change Request": {
        finalApprover: "COUNSELLOR"
    },
    "Internship Approval": {
        finalApprover: "COUNSELLOR"
    },
    "Re-evaluation Request": {
        finalApprover: "FACULTY"
    },
    "Project Topic Approval": {
        finalApprover: "FACULTY"
    },
    "Submission Extension Request": {
        finalApprover: "FACULTY"
    },
    "ID Card Replacement": {
        finalApprover: "ADMIN"
    },
    // Legacy support fallback mappings
    "Section Change": {
        finalApprover: "ADMIN"
    },
    "Subject Change": {
        finalApprover: "ADMIN"
    },
    "Timetable Clash": {
        finalApprover: "ADMIN"
    },
    "Lab Batch Change": {
        finalApprover: "ADMIN"
    },
    "Project Supervisor Change Request": {
        finalApprover: "ADMIN"
    },
    "Project Extension Request": {
        finalApprover: "ADMIN"
    }
};

module.exports = { REQUEST_WORKFLOW_CONFIG };

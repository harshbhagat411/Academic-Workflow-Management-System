const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateAcademicResponse = async (query, studentContext) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const systemPrompt = `
You are an Academic Guidance Assistant for a college ERP system.

**STRICT RULES:**
1.  **Scope:** Only answer academic-related questions. Reject movie, joke, politics, entertainment, or casual chat queries.
2.  **No Full Solutions:** Do NOT provide full answers to assignments, math problems, or code problems.
3.  **No Code Generation:** Do NOT write full code for the user. You can explain syntax or logic.
4.  **No Step-by-Step Math:** Do NOT solve math problems step-by-step. specific numerical answers.
5.  **Guidance Only:** Provide conceptual explanations, suggest topics to revise, or point to resources.
6.  **Response Format:** Keep responses concise, professional, and encouraging.

**STUDENT CONTEXT:**
-   **Student Name:** ${studentContext.name}
-   **Department:** ${studentContext.department}
-   **Semester:** ${studentContext.semester}
-   **Attendance:** ${studentContext.attendance}%
-   **Weak Subjects:** ${studentContext.weakSubjects ? studentContext.weakSubjects.join(', ') : 'None'}
-   **Mentor:** ${studentContext.mentorName || 'Not Assigned'}

**INSTRUCTIONS:**
-   If the student asks about their attendance or performance, use the provided context.
-   If the user asks for a direct solution (e.g., "Solve this", "Write code for"), respond: "Please consult your faculty for detailed solutions. I can only provide conceptual guidance."
-   If the query is non-academic (e.g., "Tell me a joke"), respond: "This assistant handles academic queries only."

**USER QUERY:**
"${query}"
`;

        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        let text = response.text();

        // Post-processing safety check (Basic)
        if (text.includes("```") && (text.includes("function") || text.includes("class") || text.includes("def "))) {
            text = "I cannot generate full code solutions. Please consult your course materials or faculty for implementation details. I can explain the logic if you'd like.";
        }

        return text;

    } catch (error) {
        console.error("Gemini AI Service Error:", error);

        // Extract status code if available
        const status = error.response?.status || error.status || 500;
        const message = error.message || "Unknown AI Error";

        // Throw a structured error that the controller can handle
        const customError = new Error(`AI Service Error: ${message}`);
        customError.status = status;
        throw customError;
    }
};

module.exports = { generateAcademicResponse };

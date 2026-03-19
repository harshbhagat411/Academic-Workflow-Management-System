const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function listModels() {
    console.log("Checking GEMINI_API_KEY...");
    if (!process.env.GEMINI_API_KEY) {
        console.error("ERROR: GEMINI_API_KEY is missing in .env");
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Access existing model to get base client or just try to list if possible via hidden methods or just try standard models
        // actually SDK doesn't have a direct 'listModels' on the main class easily without admin SDK sometimes, 
        // but let's try the model.

        // Wait, the SDK definitely supports listing models? 
        // Actually, for the API key based SDK, it's not always straightforward to list.
        // Let's try to just test multiple common model names.

        const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro", "gemini-1.0-pro"];

        for (const modelName of models) {
            console.log(`\nTesting model: ${modelName}`);
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Test.");
                // const response = await result.response; // wait for response
                console.log(`SUCCESS: ${modelName} works!`);
                return; // Exit on first success
            } catch (error) {
                console.log(`FAILED: ${modelName} - ${error.message.split('\n')[0]}`);
                if (error.message.includes("404")) console.log("  (404 Not Found - likely invalid model name or not enabled)");
                if (error.message.includes("403")) console.log("  (403 Forbidden - API key issue or location)");
            }
        }

    } catch (error) {
        console.error("General Error:", error);
    }
}

listModels();

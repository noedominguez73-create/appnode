
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

async function listModels() {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API KEY found in env variables.");
        return;
    }

    // const genAI = new GoogleGenerativeAI(apiKey);

    try {
        console.log("Attempting to list models via API key starting with: " + apiKey.substring(0, 5) + "...");

        // Using fetch directly for ListModels endpoint
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        let output = "=== AVAILABLE MODELS ===\n";
        if (data.models) {
            data.models.forEach(m => {
                if (m.name.includes("gemini")) {
                    output += `- ${m.name} [${m.supportedGenerationMethods.join(', ')}]\n`;
                }
            });
        } else {
            output += "Error listing models: " + JSON.stringify(data);
        }

        fs.writeFileSync('models.txt', output);
        console.log("Models written to models.txt");

    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();

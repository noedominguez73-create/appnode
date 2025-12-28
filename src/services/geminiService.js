import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

// Initialize GenAI dynamically
const getApiKey = async () => {
    try {
        const { ApiConfig } = await import('../models/index.js');
        const config = await ApiConfig.findOne({ where: { provider: 'google', is_active: true } });
        if (config && config.api_key) {
            console.log("Using API Key from DB");
            return config.api_key;
        }
    } catch (e) {
        console.error("Error fetching API key from DB, using fallback:", e.message);
    }
    return process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
};

export const getGenerativeModel = async (fallbackModelName = 'gemini-2.0-flash-exp', section = 'peinado', forceFallback = false) => {
    const { ApiConfig } = await import('../models/index.js');

    // Fetch active key config for the specific section
    const config = await ApiConfig.findOne({ where: { provider: 'google', is_active: true, section: section } });

    if (!config || !config.api_key) {
        const envKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

        if (!envKey) throw new Error(`API Key configuration missing for section: ${section}`);

        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(envKey);

        // System instruction for general model usage (optional, or specific to image gen)
        // For general getter, we might not want strict image restrictions unless specified.
        // But for consistency, let's keep it simple here and add instructions in generateImage.
        return genAI.getGenerativeModel({ model: fallbackModelName });
    }

    const apiKey = config.api_key;
    const selectedModel = (config.settings && config.settings.model && !forceFallback) ? config.settings.model : fallbackModelName;

    console.log(`Using Gemini Model: ${selectedModel} (Section: ${section})`);

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);

    return genAI.getGenerativeModel({
        model: selectedModel
    });
};

export const generateImageDescription = async (prompt, imageBuffer, mimeType = 'image/png') => {
    try {
        console.log("Analyzing image with Gemini 2.0 Flash (Exp)...");
        const model = await getGenerativeModel('gemini-2.0-flash-exp');
        const imagePart = {
            inlineData: {
                data: imageBuffer.toString('base64'),
                mimeType
            },
        };
        const result = await model.generateContent([prompt, imagePart]);
        const text = result.response.text();
        console.log("Gemini Description Success:", text.substring(0, 30) + "...");
        return { text, usageMetadata: result.response.usageMetadata };
    } catch (e) {
        console.error("Gemini Vision Error Details:", {
            message: e.message,
            stack: e.stack,
            model: 'gemini-1.5-flash'
        });
        throw e;
    }
};

export const generateImage = async (prompt, originalImageBuffer, mimeType = 'image/png', section = 'peinado') => {
    // 1. Prompt de Sistema (System Instruction) - STRICT
    const systemInstruction = `
You are a professional AI Hairstylist and Image Editor.
Your ONLY task is to modify the hairstyle of the person in the input image.

CRITICAL VISUAL RULES (ZERO TOLERANCE):
1. **FACE PRESERVATION**: You must NOT modify the user's face, skin tone, facial features, or makeup. The identity must remain 100% identical to the original image.
2. **CLOTHING PRESERVATION**: You must NOT change the user's clothes, neckline, or accessories.
3. **ONLY HAIR**: Change ONLY the hair pixels to match the requested style.
4. **REALISM**: The new hair must blend naturally with the original lighting and head angle.

OUTPUT FORMAT RULES:
- Do NOT speak. Do NOT explain.
- **Generate the edited image directly.**
`;

    // Note: getGenerativeModel returns a model instance. 
    // We need to pass systemInstruction to the model configuration.
    // However, with GoogleGenerativeAI, systemInstruction is set properly at model instantiation.
    // Since getGenerativeModel helper creates the model, we should probably refactor it to accept systemInstruction 
    // OR create a new model instance here manually using the key from helper.

    // For now, let's implement local model creation here to ensure systemInstruction is applied.
    // We will reuse the helper to get Key/Config logic if possible, or duplicate logic for safety.

    // Better approach: Modify getGenerativeModel to accept optional systemInstruction?
    // Or just fetch key manually here? Let's refactor slightly to be safe.

    // Re-implementing key fetching logic locally for safety in this critical function
    const { ApiConfig } = await import('../models/index.js');
    const config = await ApiConfig.findOne({ where: { provider: 'google', is_active: true, section: section } });

    let apiKey = null;
    if (config && config.api_key) apiKey = config.api_key;

    // 4. Model Selection Logic (STRICT: DB Configuration ONLY)
    // The user explicitly requested NO defaults (fallback strings) in the code.
    // The model must be selected in the Admin Panel.

    // 4. Model Selection Logic (STRICT: DB Configuration ONLY)
    let selectedModel = null;
    let selectionSource = 'UNKNOWN';

    if (config && config.settings && config.settings.model) {
        selectedModel = config.settings.model;
        selectionSource = 'DATABASE_CONFIGURATION';
    }

    console.log(`🤖 AI MODEL SELECTION (STRICT MODE):`);
    console.log(`   - Source: ${selectionSource}`);
    console.log(`   - Model:  ${selectedModel || 'NONE'}`);

    // Critical Check
    if (!selectedModel) {
        throw new Error("⛔ CONFIG ERROR: No AI Model selected in Admin Panel (Section: 'look'). Please select a model and save.");
    }

    if (!apiKey) throw new Error("No API Key found for Gemini Generation");

    // 2. Prompt de Usuario (User Prompt) - Simplified
    const visualPrompt = `Change the person's hairstyle to: ${prompt}. ensure photorealistic integration.`;

    const safetySettings = [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
    ];

    // === LOGIC SWITCH: IMAGEN vs GEMINI ===
    const isImagen = selectedModel.includes('imagen');

    if (isImagen) {
        console.log("🎨 DETECTED IMAGEN MODEL - SWITCHING TO REST API");
        const url = `https://generativelanguage.googleapis.com/v1beta/${selectedModel}:predict?key=${apiKey}`;

        const requestBody = {
            instances: [{ prompt: prompt }], // USE RAW PROMPT
            parameters: { sampleCount: 1, aspectRatio: "1:1" }
        };

        const fetch = (await import('node-fetch')).default;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Imagen API Failed: ${errText} (Status: ${response.status})`);
        }

        const data = await response.json();
        let base64Image = null;

        // Handle various Imagen response formats
        if (data.predictions && data.predictions[0] && data.predictions[0].bytesBase64Encoded) {
            base64Image = data.predictions[0].bytesBase64Encoded;
        } else if (data.images && data.images[0]) {
            base64Image = data.images[0].image || data.images[0];
        } else {
            throw new Error("Imagen response format not recognized.");
        }

        // SAVE BASE64 TO DISK to provide a URL compatible with the frontend
        const fs = await import('fs');
        const path = await import('path');
        const uniqueId = Date.now();
        const filename = `imagen_${uniqueId}.png`;
        const uploadDir = 'c:/appnode/app/static/uploads'; // Ensure this matches your static setup
        const filePath = path.join(uploadDir, filename);

        // Ensure dir exists
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

        fs.writeFileSync(filePath, base64Image, 'base64');
        const publicUrl = `http://localhost:5000/static/uploads/${filename}`;

        console.log(`✅ Imagen 3 Gen Success. Saved to: ${publicUrl}`);

        // Return a mock response object compatible with the existing logic
        return {
            customData: { edited_image: publicUrl },
            text: () => "Image Generated by Imagen 3"
        };

    } else {
        // === STANDARD GEMINI LOGIC ===
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(apiKey);

        const modelInstance = genAI.getGenerativeModel({
            model: selectedModel,
            systemInstruction: systemInstruction // Use the STRICT instruction defined above
        });

        const fs = await import('fs');
        // Validate inputs before usage
        if (!originalImageBuffer) throw new Error("No image buffer provided for Gemini.");

        const imagePart = {
            inlineData: {
                data: originalImageBuffer.toString('base64'),
                mimeType
            }
        };

        const result = await modelInstance.generateContent({
            contents: [{
                role: 'user',
                parts: [{ text: prompt }, imagePart] // USE RAW PROMPT (No wrapper)
            }],
            safetySettings
        });

        const response = await result.response;
        const text = response.text();

        // Parse Result for JSON/URL (Gemini Logic)
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            try {
                const data = JSON.parse(text.substring(firstBrace, lastBrace + 1));
                response.customData = data;
                return response;
            } catch (e) { console.error("JSON Parse Error:", e); }
        }

        // If no JSON, verify if we have parts (some models return image directly in parts)
        // --- VALIDATE GEMINI RESPONSE ---
        let hasImage = false;

        // 1. Check for JSON URL (if customData was set by parsing above)
        if (response.customData && response.customData.edited_image) {
            hasImage = true;
        }

        // 2. Check for Inline Base64
        if (!hasImage && response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    hasImage = true;
                    break;
                }
            }
        }

        if (!hasImage) {
            console.warn("⚠️ Gemini returned response but NO image found.");

            // LOGGING FOR DEBUGGING
            if (response.candidates && response.candidates[0]) {
                const cand = response.candidates[0];
                console.log(`❌ Finish Reason: ${cand.finishReason}`);
                console.log(`🛡️ Safety Ratings: ${JSON.stringify(cand.safetyRatings, null, 2)}`);
                if (cand.content && cand.content.parts && cand.content.parts[0].text) {
                    console.log(`🤖 Model Text Response: "${cand.content.parts[0].text}"`);
                }
            } else {
                console.log("❌ No candidates returned (Complete Block).");
                console.log(`🛡️ Prompt Feedback: ${JSON.stringify(result.promptFeedback, null, 2)}`);
            }

            throw new Error("Gemini produced no image data. (Safety Block or Text Only response). Check logs.");
        }

        return response;
    }
};

// ------------------------------------------------------------------
// TTS LOGIC (Google Cloud Text-to-Speech)
// ------------------------------------------------------------------
export const generateSpeech = async (text, voiceName = 'Puck') => {
    try {
        const apiKey = await getApiKey();
        if (!apiKey) throw new Error("No API Key found for TTS");

        // Map "Gemini" names to actual Google Cloud TTS Neural2 voices
        const voiceMap = {
            'Puck': { name: 'es-ES-Neural2-B', ssmlGender: 'MALE' },    // Optimistic Male
            'Charon': { name: 'es-ES-Neural2-F', ssmlGender: 'MALE' },  // Deep Male
            'Kore': { name: 'es-ES-Neural2-A', ssmlGender: 'FEMALE' },  // Relaxing Female
            'Fenrir': { name: 'es-ES-Neural2-D', ssmlGender: 'MALE' },  // Energetic Male
            'Aoede': { name: 'es-ES-Neural2-E', ssmlGender: 'FEMALE' }, // Elegant Female
            'Microsoft Sabina': { name: 'es-MX-Neural2-A', ssmlGender: 'FEMALE' },
            'Paulina': { name: 'es-MX-Neural2-A', ssmlGender: 'FEMALE' }
        };

        const selectedVoice = voiceMap[voiceName] || { name: 'es-ES-Neural2-A', ssmlGender: 'FEMALE' };

        // SANITIZE TEXT FOR AUDIO (Remove Markdown)
        const cleanText = text
            .replace(/\*\*/g, "")       // Remove bold
            .replace(/__/g, "")         // Remove italic
            .replace(/##/g, "")         // Remove headers
            .replace(/^\s*-\s+/gm, "")   // Remove bullets
            .replace(/`/g, "");          // Remove code ticks

        console.log(`🗣️ Generating Speech: "${text.substring(0, 20)}..." using voice ${voiceName} mapped to ${selectedVoice.name}`);

        const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                input: { text: cleanText },
                voice: { languageCode: 'es-ES', name: selectedVoice.name, ssmlGender: selectedVoice.ssmlGender },
                audioConfig: { audioEncoding: 'MP3' }
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`TTS API Error: ${err}`);
        }

        const data = await response.json();
        return data.audioContent; // Base64 string

    } catch (e) {
        console.error("TTS Generation Error:", e);
        throw e;
    }
};

// ------------------------------------------------------------------
// CHATBOT LOGIC (Imagina IA)
// ------------------------------------------------------------------
export const generateChatResponse = async (userMessage, history = [], section = 'asesoria', systemInstruction = '') => {
    try {
        console.log(`💬 Chat Request (Section: ${section}): "${userMessage}"`);

        // 1. Get Model (Strict Mode: Must be configured in Admin > Asesoria)
        // FORCE 'gemini-2.0-flash' to ignore any broken 1.5 config in DB
        const model = await getGenerativeModel('gemini-2.0-flash', section, true);

        // 2. Format History for Gemini SDK
        const chatHistory = history.map(msg => ({
            role: msg.role === 'ai' ? 'model' : (msg.role === 'model' ? 'model' : 'user'),
            parts: Array.isArray(msg.parts)
                ? msg.parts.map(p => ({ text: typeof p === 'string' ? p : p.text }))
                : [{ text: msg.message || msg.text || '' }]
        }));

        // 3. Start Chat Session
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: `SYSTEM INSTRUCTION: ${systemInstruction}\n\nIMPORTANT: When proposing a specific look/style, you MUST allow the user to visualize it. To do this, include a strictly technical visual description at the end of your response wrapped in [VISUAL_PROMPT]...[/VISUAL_PROMPT] tags.\n\nRULES FOR [VISUAL_PROMPT]:\n1. Combine Face, Hair, and Color details into a SINGLE coherent paragraph.\n2. Do NOT use headers like "--- TRANSFORMACIÓN VISUAL ---".\n3. Do NOT repeat these instructions or the "Act as an expert" prompt.\n4. Describe ONLY the final visual result (e.g. "A 30-year-old woman with...").` }]
                },
                {
                    role: "model",
                    parts: [{ text: "Entendido. A partir de ahora actuaré siguiendo estrictamente esa personalidad y guion." }]
                },
                ...chatHistory
            ],
            generationConfig: {
                maxOutputTokens: 1000,
            }
        });

        // 4. Send Message
        const result = await chat.sendMessage(userMessage);
        const response = await result.response;
        let text = response.text();

        // --- FIREWALL: REMOVE LEAKED SYSTEM PROMPTS (AGGRESSIVE) ---
        // Catch "Act as a...", "You are a...", "Rules:", "Identification:", "Color Analysis:"
        text = text.replace(/(Act as a|You are a|System Instruction|Rules:|Identification:|Color Analysis:)[\s\S]*?(\n\n|$)/gi, "");
        text = text.replace(/--- TRANSFORMACIÓN VISUAL ---/g, "");
        text = text.replace(/\[DETALLES DE ROPA Y ESTILO\]/g, "");
        // ----------------------------------------------
        text = text.replace(/SYSTEM INSTRUCTION:[\s\S]*?tags\./gi, "");
        // ----------------------------------------------

        console.log("💬 Chat Response:", text.substring(0, 50) + "...");
        return { reply: text };

    } catch (e) {
        console.error("Chat Generation Error:", e);
        if (e.message.includes('API Key configuration missing') || e.message.includes('No AI Model selected')) {
            throw new Error("⚠️ Error de Configuración: La IA no está activada en el Admin Panel (Sección: Asesoria).");
        }
        throw e;
    }
};

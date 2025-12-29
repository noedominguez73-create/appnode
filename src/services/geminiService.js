const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Get API Key from DB or Env
const getApiKey = async () => {
    try {
        const { ApiConfig } = require('../models/index.js');
        const config = await ApiConfig.findOne({ where: { provider: 'google', is_active: true } });
        if (config && config.api_key) {
            return config.api_key;
        }
    } catch (e) {
        console.error("Error fetching API key from DB:", e.message);
    }
    return process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
};

const getGenerativeModel = async (fallbackModelName = 'gemini-2.0-flash-exp', section = 'peinado', forceFallback = false) => {
    const config = await ApiConfig.findOne({ where: { provider: 'google', is_active: true, section } });

    if (!config || !config.api_key) {
        const envKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
        if (!envKey) throw new Error(`API Key configuration missing for section: ${section}`);
        const genAI = new GoogleGenerativeAI(envKey);
        return genAI.getGenerativeModel({ model: fallbackModelName });
    }

    const apiKey = config.api_key;
    let selectedModel = fallbackModelName;

    // Robust settings parsing
    if (config.settings && !forceFallback) {
        try {
            const settings = typeof config.settings === 'string'
                ? JSON.parse(config.settings)
                : config.settings;
            if (settings.model) selectedModel = settings.model;
        } catch (e) {
            console.warn("Failed to parse AI settings, using fallback model");
        }
    }

    console.log(`Using Gemini Model: ${selectedModel} (Section: ${section})`);
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({ model: selectedModel });
};

const generateImageDescription = async (prompt, imageBuffer, mimeType = 'image/png', section = 'peinado') => {
    try {
        // Pass section to getGenerativeModel to use the correct active model
        const model = await getGenerativeModel('gemini-2.0-flash-exp', section);
        const imagePart = {
            inlineData: {
                data: imageBuffer.toString('base64'),
                mimeType
            }
        };
        const result = await model.generateContent([prompt, imagePart]);
        const text = result.response.text();
        return { text, usageMetadata: result.response.usageMetadata };
    } catch (e) {
        console.warn(`Gemini Error with primary model: ${e.message}. Retrying with fallback...`);
        try {
            // RETRY WITH STABLE FALLBACK MODEL
            const { ApiConfig } = require('../models/index.js');
            const fallbackModelName = 'gemini-1.5-flash';

            // Get Key again just in case
            const config = await ApiConfig.findOne({ where: { provider: 'google', is_active: true, section } });
            const apiKey = config ? config.api_key : (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY);

            if (!apiKey) throw new Error("No API Key available for fallback");

            const genAI = new GoogleGenerativeAI(apiKey);
            const fallbackModel = genAI.getGenerativeModel({ model: fallbackModelName });

            const imagePart = {
                inlineData: {
                    data: imageBuffer.toString('base64'),
                    mimeType
                }
            };
            const result = await fallbackModel.generateContent([prompt, imagePart]);
            return { text: result.response.text(), usageMetadata: result.response.usageMetadata };

        } catch (fallbackError) {
            console.error("Gemini Vision Validation Error (Fallback also failed):", fallbackError);
            throw fallbackError; // Throw original error to see details
        }
    }
};

const generateImage = async (prompt, originalImageBuffer, mimeType = 'image/png', section = 'peinado') => {
    const { ApiConfig } = require('../models/index.js');
    const config = await ApiConfig.findOne({ where: { provider: 'google', is_active: true, section } });

    let apiKey = config?.api_key;
    let selectedModel = config?.settings?.model;

    if (!selectedModel) {
        throw new Error("No AI Model selected in Admin Panel");
    }
    if (!apiKey) throw new Error("No API Key found");

    const isImagen = selectedModel.includes('imagen');

    if (isImagen) {
        // Using native Node 18 fetch
        const url = `https://generativelanguage.googleapis.com/v1beta/${selectedModel}:predict?key=${apiKey}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                instances: [{ prompt }],
                parameters: { sampleCount: 1, aspectRatio: "1:1" }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Imagen API Failed: ${errText}`);
        }

        const data = await response.json();
        let base64Image = data.predictions?.[0]?.bytesBase64Encoded;

        if (!base64Image) throw new Error("Imagen response not recognized");

        const fs = require('fs');
        const path = require('path');
        const uniqueId = Date.now();
        const filename = `imagen_${uniqueId}.png`;
        const uploadDir = path.join(__dirname, '../../app/static/uploads');
        const filePath = path.join(uploadDir, filename);

        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        fs.writeFileSync(filePath, base64Image, 'base64');

        return {
            customData: { edited_image: `/static/uploads/${filename}` },
            text: () => "Image Generated by Imagen"
        };
    } else {
        const genAI = new GoogleGenerativeAI(apiKey);
        const modelInstance = genAI.getGenerativeModel({ model: selectedModel });

        const imagePart = {
            inlineData: {
                data: originalImageBuffer.toString('base64'),
                mimeType
            }
        };

        const result = await modelInstance.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }, imagePart] }]
        });

        return result.response;
    }
};

const generateSpeech = async (text, voiceName = 'Puck') => {
    const apiKey = await getApiKey();
    if (!apiKey) throw new Error("No API Key for TTS");

    const voiceMap = {
        'Puck': { name: 'es-ES-Neural2-B', ssmlGender: 'MALE' },
        'Aoede': { name: 'es-ES-Neural2-E', ssmlGender: 'FEMALE' }
    };

    const selectedVoice = voiceMap[voiceName] || { name: 'es-ES-Neural2-A', ssmlGender: 'FEMALE' };
    const cleanText = text.replace(/\*\*/g, "").replace(/__/g, "").replace(/##/g, "");

    // Using native Node 18 fetch
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
        throw new Error(`TTS Error: ${err}`);
    }

    const data = await response.json();
    return data.audioContent;
};

const generateChatResponse = async (userMessage, history = [], section = 'asesoria', systemInstruction = '') => {
    try {
        const model = await getGenerativeModel('gemini-2.0-flash', section, true);

        const chatHistory = history.map(msg => ({
            role: msg.role === 'ai' ? 'model' : 'user',
            parts: [{ text: msg.message || msg.text || '' }]
        }));

        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: `SYSTEM: ${systemInstruction}` }] },
                { role: "model", parts: [{ text: "Entendido." }] },
                ...chatHistory
            ]
        });

        const result = await chat.sendMessage(userMessage);
        let text = result.response.text();
        return { reply: text };
    } catch (e) {
        console.error("Chat Error:", e);
        throw e;
    }
};

/**
 * List available Gemini models for a specific section
 * @param {string} section - Configuration section ('peinado', 'look', 'asesoria')
 * @returns {Promise<Array>} Array of model objects with {name, displayName}
 */
const listAvailableModels = async (section = 'peinado') => {
    try {
        const { ApiConfig } = require('../models/index.js');
        const config = await ApiConfig.findOne({
            where: { provider: 'google', is_active: true, section }
        });

        const apiKey = config?.api_key || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.error(`❌ No API key configured for section: ${section}`);
            return [];
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Google Models API Error (${response.status}):`, errorText.substring(0, 150));
            return [];
        }

        const data = await response.json();

        if (!data || !Array.isArray(data.models)) {
            console.error(`❌ Invalid API response structure for section: ${section}`);
            return [];
        }

        const compatibleModels = data.models
            .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
            .map(m => ({
                name: m.name.replace('models/', ''),
                displayName: m.displayName || m.name
            }));

        // Ensure Gemini 1.5 Flash is always present (as requested by user)
        const flashModelName = 'gemini-1.5-flash';
        const hasFlash = compatibleModels.some(m => m.name === flashModelName);

        if (!hasFlash) {
            compatibleModels.unshift({
                name: flashModelName,
                displayName: 'Gemini 1.5 Flash (Recommended/Fast)'
            });
        }

        console.log(`✅ Loaded ${compatibleModels.length} models for ${section}`);
        return compatibleModels;

    } catch (error) {
        console.error(`❌ listAvailableModels failed (${section}):`, error.message);
        return [];
    }
};

module.exports = {
    getApiKey,
    getGenerativeModel,
    generateImageDescription,
    generateImage,
    generateSpeech,
    generateSpeech,
    generateChatResponse,
    listAvailableModels
};

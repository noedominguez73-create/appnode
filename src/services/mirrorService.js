import { generateImage, getGenerativeModel } from './geminiService.js';
import { saveUploadedFile, saveGeneratedImage } from '../utils/fileUtils.js';
import { MirrorUsage, User, SalonConfig } from '../models/index.js';
import fs from 'fs';

// Helper: Exponential Backoff Fetch
const fetchWithExponentialBackoff = async (url, maxRetries = 5, initialDelay = 500) => {
    const fetch = (await import('node-fetch')).default;
    let lastError;
    let delay = initialDelay;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[Fetch Attempt ${attempt}/${maxRetries}] Downloading: ${url.substring(0, 80)}...`);
            const res = await fetch(url, { timeout: 10000 });

            if (res.ok) {
                console.log(`✅ Success attempt ${attempt}. Status: ${res.status}`);
                return res;
            }

            if (res.status === 404) {
                console.warn(`⚠️ [Attempt ${attempt}] 404 Not Found - URL not ready yet`);
                lastError = new Error(`404 Not Found`);
            } else {
                throw new Error(`Status: ${res.status}`);
            }
        } catch (err) {
            console.error(`❌ [Attempt ${attempt}] Network Error: ${err.message}`);
            lastError = err;
        }

        if (attempt < maxRetries) {
            console.log(`⏳ Waiting ${delay}ms before next retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
        }
    }

    throw new Error(`Download failed after ${maxRetries} attempts: ${lastError.message}`);
};

export const buildInpaintingPrompt = (hairstyle, color, instructions) => {
    // Legacy fallback
    const parts = [];
    if (hairstyle) parts.push(hairstyle);
    if (color) parts.push(color);
    if (instructions) parts.push(instructions);
    return parts.join(". ") || "Enhance hairstyle professional look";
};

export const processGeneration = async (user, file, data) => {
    // 1. Quota Check
    if (user.current_month_tokens >= user.monthly_token_limit) {
        throw new Error('Límite mensual de créditos IA excedido');
    }

    // 2. Save Input
    const savedFile = saveUploadedFile(file);

    // 3. Build Prompt with System Containers
    // Fetch configuration
    const config = await SalonConfig.findOne({ where: { user_id: 1 } }); // Default Admin Config

    let promptParts = [];

    // CORE SYSTEM PROMPTS (The Expert Personas) - Always Active
    if (config?.hairstyle_sys_prompt) promptParts.push(config.hairstyle_sys_prompt);
    if (config?.color_sys_prompt) promptParts.push(config.color_sys_prompt);

    // SEPARATOR
    promptParts.push("--- TRANSFORMACIÓN VISUAL ---");

    // P CARA (Look Prompt 1 - Fixed Structure)
    if (config?.look_sys_prompt_1) promptParts.push(config.look_sys_prompt_1);

    // P PEINADOS (Look Prompt 2 - Dynamic)
    // If user selected a hairstyle, use it.
    // If NO selection AND NO custom instructions, use default validation content.
    if (data.hairstyle) {
        promptParts.push(`[PEINADO SELECCIONADO]\n${data.hairstyle}`);
    } else if (config?.look_sys_prompt_2 && !data.instructions) {
        promptParts.push(config.look_sys_prompt_2);
    }

    // P COLORES (Look Prompt 3 - Dynamic)
    if (data.color) { // data.color is the selected color description
        promptParts.push(`[COLOR SELECCIONADO]\n${data.color}`);
    } else if (config?.look_sys_prompt_3 && !data.instructions) {
        promptParts.push(config.look_sys_prompt_3);
    }

    // PERSONALIZACIÓN (User Input Step 4)
    if (data.instructions) {
        promptParts.push(`[DETALLES DE ROPA Y ESTILO]\n${data.instructions}`);
    }

    // COMBINACION (Look Prompt 4 - Final Synthesis)
    // This comes LAST to orchestrate the combination of Face, Hair, Color, and Clothes.
    if (config?.look_sys_prompt_4) promptParts.push(config.look_sys_prompt_4);

    let prompt = promptParts.join("\n\n");

    // Fallback if empty config
    if (promptParts.length === 0 || !config) {
        console.log("⚠️ No Look Config found. Using legacy prompt builder.");
        prompt = buildInpaintingPrompt(data.hairstyle, data.color, data.instructions);
    }

    // 4. Generate
    let resultUrl = savedFile.url; // Fallback
    let aiDescription = "Processing...";
    let promptTokens = 0;
    let completionTokens = 0;
    let totalTokens = 0;

    try {
        const fileBuffer = fs.readFileSync(savedFile.filepath);

        // Get API Key for authentication
        const { ApiConfig } = await import('../models/index.js');
        const config = await ApiConfig.findOne({
            where: { provider: 'google', is_active: true, section: data.section || 'look' }
        });
        const apiKey = config?.api_key || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

        if (!apiKey) {
            throw new Error('No API Key configured for image generation');
        }

        const response = await generateImage(prompt, fileBuffer, file.mimetype, data.section);

        console.log("DEBUG: FULL GEMINI RESPONSE:", JSON.stringify(response, null, 2));

        // --- NEW ROBUST LOGIC WITH AUTHENTICATION ---
        let imageFound = false;

        // A. Try JSON URL (Gemini/Vertex)
        if (response.customData && response.customData.edited_image) {
            const imageUrl = response.customData.edited_image;
            console.log("AI returned Image URL:", imageUrl);

            try {
                const fetch = (await import('node-fetch')).default;

                // CRITICAL: Add authentication headers
                console.log("🔐 Downloading with API Key authentication...");
                const imgReq = await fetch(imageUrl, {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'X-Goog-Api-Key': apiKey
                    },
                    timeout: 10000
                });

                if (!imgReq.ok) {
                    throw new Error(`HTTP ${imgReq.status}: ${imgReq.statusText}`);
                }

                const arrayBuffer = await imgReq.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                resultUrl = saveGeneratedImage(buffer, savedFile.filename);
                aiDescription = "Image Generated Successfully (Authenticated Download)";
                imageFound = true;
                console.log("✅ Image downloaded and saved:", resultUrl);

            } catch (err) {
                console.error("❌ Authenticated download failed:", err.message);
                // Fallback: Use remote URL if download fails (better than nothing)
                resultUrl = imageUrl;
                aiDescription = "Image Generated (Remote URL - Download Failed)";
                imageFound = true;
            }
        }

        // B. Fallback to Inline Base64 (Replicate/Gemini fallback)
        if (!imageFound && response.candidates && response.candidates.length > 0) {
            const parts = response.candidates[0].content.parts;
            for (const part of parts) {
                if (part.inlineData && part.inlineData.data) {
                    console.log("Found inline Base64 image data. Using fallback.");
                    const buffer = Buffer.from(part.inlineData.data, 'base64');
                    // Clean assignment:
                    const savedPath = saveGeneratedImage(buffer, savedFile.filename);
                    if (savedPath) {
                        resultUrl = savedPath;
                        aiDescription = "Image Generated Successfully (Base64 Fallback)";
                        imageFound = true;
                        console.log("✅ Base64 Image Saved to:", resultUrl);
                    }
                    break;
                }
            }
        }

        if (!imageFound) {
            // Check for text refusal
            let refusalText = "No image info found.";
            const parts = response.candidates?.[0]?.content?.parts;
            if (parts && parts.length > 0 && parts[0].text) {
                refusalText = parts[0].text;
            }
            console.warn("AI Refusal/No-Image:", refusalText);
            throw new Error("AI Refusal: " + refusalText);
        }

        // Usage Metadata
        if (response.usageMetadata) {
            promptTokens = response.usageMetadata.promptTokenCount || 0;
            completionTokens = response.usageMetadata.candidatesTokenCount || 0;
            totalTokens = response.usageMetadata.totalTokenCount || 0;
        }

    } catch (err) {
        console.error("Generation failed:", err);
        throw err;
    }

    // 5. Record Usage
    await MirrorUsage.create({
        usage_type: 'generation',
        user_id: user.id,
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: totalTokens
    });

    // Update User
    if (totalTokens > 0) {
        user.current_month_tokens += totalTokens;
        await user.save();
    }

    // FINAL SAFETY CHECK: If resultUrl became undefined somehow, reset to fallback or error
    if (!resultUrl) {
        console.error("CRITICAL: ResultURL is undefined at return. Falling back to input image.");
        resultUrl = savedFile.url;
    }

    return {
        status: 'success',
        result_url: resultUrl,
        ai_description: aiDescription,
        debug_prompt: prompt
    };
};

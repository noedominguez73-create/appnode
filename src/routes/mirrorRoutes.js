import express from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { saveUploadedFile } from '../utils/fileUtils.js';
import { SalonConfig } from '../models/index.js';
import { processGeneration } from '../services/mirrorService.js';
import { generateImageDescription, generateChatResponse } from '../services/geminiService.js';
import { User } from '../models/index.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // Process in memory for Gemini

// Config endpoint
router.get('/config', async (req, res) => {
    try {
        // Fallback to User 1
        let userId = 1;
        const authHeader = req.headers['authorization'];
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            const { verifyToken } = await import('../services/authService.js');
            const user = verifyToken(token);
            if (user) userId = user.user_id;
        }

        const config = await SalonConfig.findOne({ where: { user_id: userId } });
        if (!config) {
            return res.json({
                selection_thickness: 4,
                selection_glow: 10,
                primary_color: '#00ff88',
                secondary_color: '#00ccff',
                stylist_name: 'Asesora IA',
                stylist_voice_name: ''
            });
        }
        res.json(config);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/config', async (req, res) => {
    try {
        // Fallback to User 1
        let userId = 1;
        const authHeader = req.headers['authorization'];
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            const { verifyToken } = await import('../services/authService.js');
            const user = verifyToken(token);
            if (user) userId = user.user_id;
        }

        const data = req.body;
        console.log("📝 RECEIVING Config Update:", JSON.stringify(data, null, 2));

        let config = await SalonConfig.findOne({ where: { user_id: userId } });
        if (!config) {
            console.log("✨ Creating new SalonConfig for user", userId);
            config = await SalonConfig.create({ user_id: userId, ...data });
        } else {
            console.log("🔄 Updating existing SalonConfig ID:", config.id);
            // DEBUG: Check if columns exist in model
            const keys = Object.keys(data);
            console.log("   Keys to update:", keys);

            await config.update(data);

            // Re-fetch to verify
            await config.reload();
            console.log("   Verify look_sys_prompt_1 after save:", config.look_sys_prompt_1);
        }
        res.json(config);
    } catch (e) {
        console.error("❌ Config Save Error:", e);
        res.status(500).json({ error: e.message });
    }
});

// Stats Endpoint
router.get('/stats', async (req, res) => {
    try {
        const { MirrorUsage } = await import('../models/index.js');

        // Total generations count
        const generations = await MirrorUsage.count({ where: { usage_type: 'generation' } });

        // Sums
        const totalTokens = await MirrorUsage.sum('total_tokens') || 0;

        const genTokens = await MirrorUsage.sum('total_tokens', { where: { usage_type: 'generation' } }) || 0;
        const analysisTokens = await MirrorUsage.sum('total_tokens', { where: { usage_type: 'analysis' } }) || 0;

        res.json({
            generations,
            total_tokens: totalTokens,
            generation_tokens: genTokens,
            analysis_tokens: analysisTokens
        });
    } catch (e) {
        console.error("Stats Error:", e);
        res.status(500).json({ error: e.message });
    }
});

// Generate endpoint
router.post('/generate', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No image provided' });

        const user = await User.findByPk(req.current_user_id);
        const result = await processGeneration(user, req.file, req.body);
        console.log("🚀 ROUTE HANDLER RESULT:", JSON.stringify(result, null, 2));
        res.json(result);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// Items endpoint (GET)
router.get('/items', async (req, res) => {
    try {
        const { category } = req.query;
        const { MirrorItem } = await import('../models/index.js');

        const where = { is_active: true };
        if (category) where.category = category;

        const items = await MirrorItem.findAll({
            where,
            order: [['order_index', 'ASC'], ['created_at', 'DESC']]
        });

        res.json(items);
    } catch (e) {
        console.error("Error fetching items:", e);
        res.status(500).json({ error: e.message });
    }
});

// Create Item (POST)
router.post('/items', upload.single('file'), async (req, res) => {
    try {
        const { MirrorItem } = await import('../models/index.js');
        const { name, category, order_index, prompt, color_code } = req.body;


        let image_url = '';
        let finalPrompt = prompt || '';

        if (req.file) {
            const saved = saveUploadedFile(req.file, 'items');
            image_url = saved.url;

            // Generate prompt if missing
            if (!finalPrompt) {
                try {
                    // Simple prompt for description
                    // Robust Prompt Engineering: "The Winning Combination" (Pro Model + Expert Persona)
                    // Expert Prompt Engineering for Hairstyle Analysis
                    // Fetch dynamic system prompt from DB
                    const { SalonConfig } = await import('../models/index.js');
                    const config = await SalonConfig.findOne({ where: { user_id: 1 } }); // Default Admin

                    let descPrompt = "";

                    if (category === 'hairstyle' && config && config.hairstyle_sys_prompt) {
                        console.log("🎨 Using Custom Hairstyle Prompt from DB");
                        descPrompt = config.hairstyle_sys_prompt;
                    } else if (category === 'color' && config && config.color_sys_prompt) {
                        console.log("🎨 Using Custom Color Prompt from DB");
                        descPrompt = config.color_sys_prompt;
                    } else {
                        // Fallback Default Prompt (Minimal / Safe)
                        // If DB is empty, use a very basic instruction to avoid "hidden hallucinations".
                        console.log("⚠️ No System Prompt configured. Using minimal fallback.");
                        descPrompt = "Describe the hairstyle in this image naturally.";
                    }
                    const descResult = await generateImageDescription(descPrompt, req.file.buffer, req.file.mimetype);
                    finalPrompt = descResult.text;

                    // Track Usage for Admin Analysis
                    if (descResult.usageMetadata) {
                        try {
                            const { MirrorUsage } = await import('../models/index.js');
                            await MirrorUsage.create({
                                usage_type: 'analysis',
                                user_id: 1, // Default Admin
                                prompt_tokens: descResult.usageMetadata.promptTokenCount || 0,
                                completion_tokens: descResult.usageMetadata.candidatesTokenCount || 0,
                                total_tokens: descResult.usageMetadata.totalTokenCount || 0,
                                item_id: null // Config items don't have ID yet, or we can update later, but acceptable to act as global usage
                            });
                        } catch (errUsage) {
                            console.error("Failed to save usage stats:", errUsage);
                        }
                    }

                } catch (err) {
                    console.error("Auto-prompt generation failed:", err);
                    finalPrompt = `Sin Prompt (Error: ${err.message})`;
                }
            }
        }

        const newItem = await MirrorItem.create({
            name,
            category,
            order_index: order_index || 0,
            prompt: finalPrompt,
            color_code: color_code || null,
            image_url,
            is_active: true
        });

        res.json(newItem);
    } catch (e) {
        console.error("Error creating item:", e);
        res.status(500).json({ error: e.message });
    }
});

// Update Item (PUT)
router.put('/items/:id', async (req, res) => {
    try {
        const { MirrorItem } = await import('../models/index.js');
        const { id } = req.params;
        const updates = req.body;

        const item = await MirrorItem.findByPk(id);
        if (!item) return res.status(404).json({ error: 'Item not found' });

        await item.update(updates);
        res.json(item);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Bulk Reorder Endpoint
router.post('/items/reorder', async (req, res) => {
    try {
        const { MirrorItem } = await import('../models/index.js');
        const items = req.body; // Array of { id, order_index }

        if (!Array.isArray(items)) {
            return res.status(400).json({ error: 'Expected array of items' });
        }

        console.log("🔄 Bulk reordering items:", items.length);

        // Process in parallel
        await Promise.all(items.map(async (item) => {
            if (item.id && item.order_index !== undefined) {
                await MirrorItem.update(
                    { order_index: item.order_index },
                    { where: { id: item.id } }
                );
            }
        }));

        res.json({ message: 'Reorder successful' });
    } catch (e) {
        console.error("Reorder Error:", e);
        res.status(500).json({ error: e.message });
    }
});

// Delete Item (DELETE) - Soft delete
router.delete('/items/:id', async (req, res) => {
    try {
        const { MirrorItem } = await import('../models/index.js');
        const { id } = req.params;

        const item = await MirrorItem.findByPk(id);
        if (!item) return res.status(404).json({ error: 'Item not found' });

        await item.update({ is_active: false });
        res.json({ message: 'Deleted successfully' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Upload endpoint (generic)
router.post('/upload_logo', authenticateToken, upload.single('file'), (req, res) => {
    // Implement simplistic logic
    res.json({ message: 'Not implemented in migration yet' });
});

// API Config Endpoints

// GET /keys - List all keys
router.get('/keys', async (req, res) => {
    try {
        const { ApiConfig } = await import('../models/index.js');
        const { section } = req.query; // 'peinado' or 'look' (default to 'peinado' if missing, or all)

        const where = {};
        if (section) where.section = section;
        else where.section = 'peinado'; // Default for backward compatibility

        const keys = await ApiConfig.findAll({
            where,
            order: [['created_at', 'ASC']]
        });

        // Mask keys
        const safeKeys = keys.map(k => ({
            id: k.id,
            provider: k.provider,
            section: k.section,
            alias: k.alias || 'Default',
            api_key: k.api_key.substring(0, 4) + '...' + k.api_key.substring(k.api_key.length - 4),
            is_active: k.is_active,
            settings: k.settings, // Expose settings for UI pre-selection
            updated_at: k.updated_at
        }));
        res.json(safeKeys);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /keys - Add new key
router.post('/keys', async (req, res) => {
    try {
        const { ApiConfig } = await import('../models/index.js');
        const { provider, alias, api_key, section } = req.body;

        if (!provider || !api_key) return res.status(400).json({ error: 'Missing provider or key' });

        const targetSection = section || 'peinado';

        // If this is the first key for this provider IN THIS SECTION, make it active
        const existingCount = await ApiConfig.count({ where: { provider, section: targetSection } });
        const is_active = existingCount === 0;

        await ApiConfig.create({
            provider,
            section: targetSection,
            alias: alias || 'New Key',
            api_key,
            is_active
        });

        res.json({ message: 'Key added successfully' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// PUT /keys/:id/active - Set Active
router.put('/keys/:id/active', async (req, res) => {
    try {
        const { ApiConfig } = await import('../models/index.js');
        const { id } = req.params;

        const key = await ApiConfig.findByPk(id);
        if (!key) return res.status(404).json({ error: 'Key not found' });

        // Deactivate all others for this provider AND SECTION
        await ApiConfig.update({ is_active: false }, {
            where: {
                provider: key.provider,
                section: key.section // Scope to current section
            }
        });

        // Activate this one
        key.is_active = true;
        await key.save();

        res.json({ message: 'Key activated' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// DELETE /keys/:id
router.delete('/keys/:id', async (req, res) => {
    try {
        const { ApiConfig } = await import('../models/index.js');
        const { id } = req.params;

        const key = await ApiConfig.findByPk(id);
        if (!key) return res.status(404).json({ error: 'Key not found' });

        await key.destroy();
        res.json({ message: 'Key deleted' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /models - List available models from Google
router.get('/models', async (req, res) => {
    try {
        const { ApiConfig } = await import('../models/index.js');
        const { section } = req.query; // 'peinado' or 'look'

        // Get active Google key FOR THIS SECTION specifically
        const where = { provider: 'google', is_active: true };
        if (section) where.section = section;
        else where.section = 'peinado'; // Default fallback

        const config = await ApiConfig.findOne({ where });

        if (!config || !config.api_key) {
            return res.status(404).json({ error: `No active Google API key found for section: ${section || 'peinado'}` });
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${config.api_key}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            return res.status(400).json({ error: data.error.message });
        }

        // USER REQUESTED CURATED LIST (VIP MENU) - UPDATED WITH GEMINI 2.5
        const CURATED_MODELS = [
            {
                name: 'models/gemini-2.5-flash-image-preview',
                displayName: '✨ Gemini 2.5 Flash (Editor de Imagen)',
                description: 'El "Cirujano". Mantiene identidad. (Experimental)'
            },
            {
                name: 'models/imagen-3.0-generate-001',
                displayName: '🎨 Imagen 3 (Generación de Imágenes)',
                description: 'El pintor de Google. Ideal para crear desde cero.'
            },
            {
                name: 'models/gemini-1.5-flash-002',
                displayName: '📸 Gemini 1.5 Flash (Estándar 002)',
                description: 'Rápido y estable (Texto/Multimodal).'
            },
            {
                name: 'models/gemini-1.5-pro-002',
                displayName: '🧠 Gemini 1.5 Pro (Inteligente 002)',
                description: 'Razonamiento complejo (Texto/Multimodal).'
            }
        ];

        res.json(CURATED_MODELS);
    } catch (e) {
        console.error("Error listing models:", e);
        res.status(500).json({ error: e.message });
    }
});

// PUT /keys/:id/settings - Update key settings (e.g. model selection)
router.put('/keys/:id/settings', async (req, res) => {
    try {
        const { ApiConfig } = await import('../models/index.js');
        const { id } = req.params;
        const newSettings = req.body; // Expects JSON object like { model: 'gemini-1.5-pro' }

        const key = await ApiConfig.findByPk(id);
        if (!key) return res.status(404).json({ error: 'Key not found' });

        // Merge existing settings with new ones
        const updatedSettings = { ...key.settings, ...newSettings };

        await key.update({ settings: updatedSettings });
        res.json({ message: 'Settings updated', settings: updatedSettings });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// POST /chat - Imagina IA Chatbot
router.post('/chat', async (req, res) => {
    try {
        const { message, history } = req.body;

        // 1. Fetch Personality Config from DB (User 1 fallback for now)
        const { SalonConfig } = await import('../models/index.js');
        const config = await SalonConfig.findOne({ where: { user_id: 1 } });
        const systemInstruction = config && config.stylist_personality_prompt
            ? config.stylist_personality_prompt
            : "Eres un asistente de IA útil y amigable.";

        // Strict Mode: 'asesoria' section must be configured in Admin Panel
        const result = await generateChatResponse(message, history, 'asesoria', systemInstruction);
        res.json(result);
    } catch (e) {
        console.error("Chat Error:", e);
        res.status(500).json({ error: e.message });
    }
});

// POST /tts - Generate Audio
router.post('/tts', async (req, res) => {
    try {
        const { text, voice_style } = req.body;
        const { generateSpeech } = await import('../services/geminiService.js');

        const audioContent = await generateSpeech(text, voice_style);

        // Return as JSON with base64 audio
        res.json({ audioContent });
    } catch (e) {
        console.error("TTS Route Error:", e);
        res.status(500).json({ error: e.message });
    }
});

export default router;

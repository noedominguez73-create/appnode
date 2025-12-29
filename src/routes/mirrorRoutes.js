const express = require('express');
const multer = require('multer');
const { authenticateToken } = require('../middleware/authMiddleware.js');
const { saveUploadedFile } = require('../utils/fileUtils.js');
const { SalonConfig, User, MirrorItem, MirrorUsage, ApiConfig } = require('../models/index.js');
const { processGeneration } = require('../services/mirrorService.js');
const { generateImageDescription, generateChatResponse, generateSpeech, listAvailableModels } = require('../services/geminiService.js');
const { verifyToken } = require('../services/authService.js');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Config endpoint
router.get('/config', async (req, res) => {
    try {
        let userId = 1;
        const authHeader = req.headers['authorization'];
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            try {
                const user = verifyToken(token);
                if (user) userId = user.user_id;
            } catch (e) { }
        }

        const config = await SalonConfig.findOne({ where: { user_id: userId } });
        if (!config) {
            return res.json({
                primary_color: '#00ff88',
                secondary_color: '#00ccff',
                stylist_name: 'Asesora IA'
            });
        }
        res.json(config);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/config', async (req, res) => {
    try {
        let userId = 1;
        const authHeader = req.headers['authorization'];
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            try {
                const user = verifyToken(token);
                if (user) userId = user.user_id;
            } catch (e) { }
        }

        const data = req.body;
        let config = await SalonConfig.findOne({ where: { user_id: userId } });
        if (!config) {
            config = await SalonConfig.create({ user_id: userId, ...data });
        } else {
            await config.update(data);
        }
        res.json(config);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Stats
router.get('/stats', async (req, res) => {
    try {
        const generations = await MirrorUsage.count({ where: { usage_type: 'generation' } });
        const totalTokens = await MirrorUsage.sum('total_tokens') || 0;
        res.json({ generations, total_tokens: totalTokens });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Generate
router.post('/generate', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No image provided' });
        const user = await User.findByPk(req.user.user_id);
        const result = await processGeneration(user, req.file, req.body);
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Items CRUD
router.get('/items', async (req, res) => {
    try {
        const { category } = req.query;
        const where = { is_active: true };
        if (category) where.category = category;
        const items = await MirrorItem.findAll({ where, order: [['order_index', 'ASC']] });
        res.json(items);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/items', upload.single('file'), async (req, res) => {
    try {
        const { name, category, order_index, prompt, color_code } = req.body;
        let image_url = '';
        let finalPrompt = prompt || '';

        if (req.file) {
            const saved = saveUploadedFile(req.file, 'items');
            image_url = saved.url;
            if (!finalPrompt) {
                try {
                    const descResult = await generateImageDescription("Describe this hairstyle", req.file.buffer, req.file.mimetype);
                    finalPrompt = descResult.text;
                } catch (err) {
                    finalPrompt = 'Auto-prompt failed';
                }
            }
        }

        const newItem = await MirrorItem.create({
            name, category, order_index: order_index || 0,
            prompt: finalPrompt, color_code, image_url, is_active: true
        });
        res.json(newItem);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.put('/items/:id', async (req, res) => {
    try {
        const item = await MirrorItem.findByPk(req.params.id);
        if (!item) return res.status(404).json({ error: 'Item not found' });
        await item.update(req.body);
        res.json(item);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.delete('/items/:id', async (req, res) => {
    try {
        const item = await MirrorItem.findByPk(req.params.id);
        if (!item) return res.status(404).json({ error: 'Item not found' });
        await item.update({ is_active: false });
        res.json({ message: 'Deleted' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// API Keys Management
router.get('/keys', async (req, res) => {
    try {
        const { section } = req.query;
        const where = { section: section || 'peinado' };
        const keys = await ApiConfig.findAll({ where, order: [['created_at', 'ASC']] });
        const safeKeys = keys.map(k => ({
            id: k.id, provider: k.provider, section: k.section,
            alias: k.alias || 'Default',
            api_key: k.api_key.substring(0, 4) + '...' + k.api_key.slice(-4),
            is_active: k.is_active, settings: k.settings
        }));
        res.json(safeKeys);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/keys', async (req, res) => {
    try {
        const { provider, alias, api_key, section } = req.body;
        if (!provider || !api_key) return res.status(400).json({ error: 'Missing data' });
        const existingCount = await ApiConfig.count({ where: { provider, section: section || 'peinado' } });
        await ApiConfig.create({
            provider, section: section || 'peinado', alias: alias || 'New Key',
            api_key, is_active: existingCount === 0
        });
        res.json({ message: 'Key added' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Update API key settings (e.g., model preference)
router.put('/keys/:id/settings', async (req, res) => {
    try {
        const key = await ApiConfig.findByPk(req.params.id);
        if (!key) return res.status(404).json({ error: 'API key not found' });

        const { model } = req.body;
        if (!model) return res.status(400).json({ error: 'Model name required' });

        // Parse existing settings or create new object
        let settings = {};
        if (key.settings) {
            try {
                settings = typeof key.settings === 'string' ? JSON.parse(key.settings) : key.settings;
            } catch (e) {
                settings = {};
            }
        }

        // Update model in settings
        settings.model = model;

        // Save back to database
        await key.update({ settings: JSON.stringify(settings) });

        res.json({ message: 'Settings updated', settings });
    } catch (e) {
        console.error('Error updating key settings:', e);
        res.status(500).json({ error: e.message });
    }
});

router.put('/keys/:id/active', async (req, res) => {
    try {
        const key = await ApiConfig.findByPk(req.params.id);
        if (!key) return res.status(404).json({ error: 'Not found' });
        await ApiConfig.update({ is_active: false }, { where: { provider: key.provider, section: key.section } });
        key.is_active = true;
        await key.save();
        res.json({ message: 'Activated' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.delete('/keys/:id', async (req, res) => {
    try {
        const key = await ApiConfig.findByPk(req.params.id);
        if (!key) return res.status(404).json({ error: 'Not found' });
        await key.destroy();
        res.json({ message: 'Deleted' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Chat
router.post('/chat', async (req, res) => {
    try {
        const { message, history } = req.body;
        const config = await SalonConfig.findOne({ where: { user_id: 1 } });
        const systemInstruction = config?.stylist_personality_prompt || "Eres un asistente útil.";
        const result = await generateChatResponse(message, history, 'asesoria', systemInstruction);
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// TTS
router.post('/tts', async (req, res) => {
    try {
        const { text, voice_style } = req.body;
        const audioContent = await generateSpeech(text, voice_style);
        res.json({ audioContent });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Generate AI prompt (NEW)
router.post('/generate-prompt', async (req, res) => {
    try {
        const { category, section = 'peinado' } = req.body;

        if (!category || !['hairstyle', 'color'].includes(category)) {
            return res.status(400).json({ error: 'Invalid category. Must be "hairstyle" or "color"' });
        }

        // Get system prompt from config
        const config = await SalonConfig.findOne({ where: { user_id: 1 } });
        if (!config) {
            return res.status(404).json({ error: 'System configuration not found' });
        }

        const systemPrompt = category === 'hairstyle'
            ? config.hairstyle_sys_prompt
            : config.color_sys_prompt;

        if (!systemPrompt) {
            return res.status(400).json({
                error: `System prompt not configured for ${category}`
            });
        }

        // Generate text and image
        const { generateTextAndImage } = require('../services/geminiService.js');
        const result = await generateTextAndImage(systemPrompt, category, section);

        res.json({
            generated_prompt: result.text,
            preview_image_url: result.imageUrl || null,
            model_used: result.modelUsed
        });

    } catch (e) {
        console.error('Generate prompt error:', e);
        res.status(500).json({ error: e.message });
    }
});

// List Models
router.get('/models', async (req, res) => {
    try {
        const { section } = req.query;
        const models = await listAvailableModels(section);
        res.json(models);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;

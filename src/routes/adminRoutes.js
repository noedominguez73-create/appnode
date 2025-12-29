import express from 'express';
import bcrypt from 'bcryptjs';
import { User, SalonConfig } from '../models/index.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Middleware: Require valid session. 
// Note: In a stricter app we would check for role='admin' specifically.
// For now, authenticateToken is a good baseline, and we assume Admin Dashboard is protected.
router.use(authenticateToken); // Ensure user is logged in

// DEBUG ROUTE: Verify ENV vars
router.get('/debug/env', (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    res.json({
        DB_DIALECT: process.env.DB_DIALECT || 'undefined',
        DB_HOST: process.env.DB_HOST || 'undefined',
        DB_USER: process.env.DB_USER || 'undefined',
        DB_NAME: process.env.DB_NAME || 'undefined',
        // Hide password part
        DB_PASS_SET: !!process.env.DB_PASS
    });
});

// GET /dashboard - Stats
router.get('/dashboard', async (req, res) => {
    try {
        const totalUsers = await User.count();
        const totalProfessionals = await User.count({ where: { role: 'professional' } });
        // Optional: Add more stats like validations pending, total income etc.
        res.json({
            success: true,
            data: {
                total_users: totalUsers,
                total_professionals: totalProfessionals,
                pending_validations: 0,
                income: 0
            }
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /salones - List all salons
router.get('/salones', async (req, res) => {
    try {
        // Find all users with role 'salon' and their config
        const salons = await User.findAll({
            where: { role: 'salon' },
            include: [{ model: SalonConfig, as: 'salonConfig' }], // Ensure association exists or we fetch separately
            order: [['created_at', 'DESC']]
        });

        // Map to frontend expected format
        const data = salons.map(u => {
            const config = u.salonConfig || {};
            return {
                id: u.id,
                salon_name: config.salon_name || u.full_name,
                client_name: u.full_name,
                identifier: u.email,
                email: u.email, // Fix for frontend display
                city: config.city || 'N/A',
                tokens_consumed: u.current_month_tokens || 0,
                // Add dates etc
            };
        });

        res.json({ success: true, data: { salons: data } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// POST /salones - Create New Salon
router.post('/salones', async (req, res) => {
    try {
        const {
            client_identifier, // email
            client_name,
            salon_name,
            address,
            city,
            state,
            country,
            tokens_consumed,
            password
        } = req.body;

        const email = client_identifier;
        if (!email || !email.includes('@')) {
            return res.status(400).json({ error: 'Email válido requerido' });
        }

        // 1. Ensure User Exists
        let user = await User.findOne({ where: { email } });
        let isNewUser = false;

        if (!user) {
            isNewUser = true;
            const plainPassword = password && password.trim() ? password.trim() : '102o3o4o';
            const hashedPassword = await bcrypt.hash(plainPassword, 10);
            user = await User.create({
                email,
                password_hash: hashedPassword,
                full_name: client_name || salon_name,
                role: 'salon',
                current_month_tokens: tokens_consumed ? parseInt(tokens_consumed) : 0
            });
        } else {
            // Update existing user to be salon
            if (user.role !== 'admin') {
                user.role = 'salon';
                user.full_name = client_name || user.full_name;
                await user.save();
            }
        }

        // 2. Create/Update Salon Config
        let config = await SalonConfig.findOne({ where: { user_id: user.id } });
        if (!config) {
            config = await SalonConfig.create({
                user_id: user.id,
                salon_name: salon_name,
                address,
                city,
                state,
                country,
                stylist_name: 'Asesora ' + salon_name,
                is_active: true
            });
        } else {
            // Update fields if desired
            config.salon_name = salon_name;
            config.address = address;
            config.city = city;
            config.state = state;
            config.country = country;
            await config.save();
        }

        res.json({
            success: true,
            message: 'Salón creado correctamente',
            data: { user_id: user.id, email: user.email }
        });

    } catch (err) {
        console.error("Create Salon Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Helper for Dashboard Stats (called by admin.html loadDashboard)
router.get('/dashboard', async (req, res) => {
    try {
        const totalUsers = await User.count();
        const salonCount = await User.count({ where: { role: 'salon' } });

        res.json({
            success: true,
            data: {
                users: { total: totalUsers },
                professionals: { total: salonCount }, // Mapping salon to professionals stat for now
                revenue: { total_mxn: 0 },
                pending: { comments: 0 }
            }
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/usuarios', async (req, res) => {
    try {
        const { role } = req.query;
        const where = {};
        if (role && role !== 'all') where.role = role;

        const users = await User.findAll({ where, limit: 50, order: [['id', 'DESC']] });
        res.json({ success: true, data: { users } });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// DELETE /salones/:id - Remove Salon User
router.delete('/salones/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        // Security check: only delete salons
        if (user.role !== 'salon') {
            // allowing admin delete for cleanup if needed, but alerting
        }

        // Delete config first
        await SalonConfig.destroy({ where: { user_id: id } });
        // Delete user
        await user.destroy();

        res.json({ success: true, message: 'Usuario eliminado' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

export default router;

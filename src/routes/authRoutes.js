import express from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { generateToken } from '../services/authService.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        console.log(`🔐 Login Attempt for: ${email}`);

        // 1. Check if legacy hash (Python Werkzeug style usually doesn't start with $2)
        if (!user.password_hash || !user.password_hash.startsWith('$2')) {
            console.log("⚠️ Legacy or invalid password hash detected. Blocked to prevent crash.");
            console.log("Hash Found:", user.password_hash);
            return res.status(401).json({ error: 'Contraseña antigua no compatible. Por favor contacta soporte o regístrate de nuevo.' });
        }

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            console.log("❌ Password mismatch");
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        console.log("✅ Password matched");

        const token = generateToken(user);
        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    role: user.role,
                    full_name: user.full_name,
                    email: user.email
                }
            }
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/register', async (req, res) => {
    try {
        const { email, password, full_name } = req.body;

        const existing = await User.findOne({ where: { email } });
        if (existing) return res.status(400).json({ error: 'Email ya registrado' });

        const password_hash = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            email,
            password_hash,
            full_name
        });

        const token = generateToken(newUser);
        res.status(201).json({
            success: true,
            data: {
                token,
                user: {
                    id: newUser.id,
                    role: newUser.role,
                    full_name: newUser.full_name,
                    email: newUser.email
                }
            }
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/me', authenticateToken, async (req, res) => {
    const user = await User.findByPk(req.user.user_id, {
        attributes: ['id', 'email', 'full_name', 'role', 'current_month_tokens']
    });
    res.json(user);
});

// POST /guest - Auto-login for demo users
router.post('/guest', async (req, res) => {
    try {
        let guest = await User.findOne({ where: { email: 'guest@imagina.ia' } });

        if (!guest) {
            const password_hash = await bcrypt.hash('guest123', 10);
            guest = await User.create({
                email: 'guest@imagina.ia',
                password_hash,
                full_name: 'Invitado',
                role: 'user'
            });
        }

        const token = generateToken(guest);
        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: guest.id,
                    role: guest.role,
                    full_name: guest.full_name,
                    email: guest.email
                }
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// --- UNIVERSAL RESCUE ROUTE (Fixes BOTH Salon 1 and Salon 2) ---
router.get('/fix-all-access', async (req, res) => {
    try {
        const { User, SalonConfig } = await import('../models/index.js');
        const accounts = ['salon1@gmail.com', 'salon2@gmail.com'];
        const password = '102o3o4o';
        const hashedPassword = await bcrypt.hash(password, 10);
        const results = [];

        for (const email of accounts) {
            let user = await User.findOne({ where: { email } });

            if (user) {
                user.role = 'salon';
                user.password_hash = hashedPassword;
                await user.save();
                results.push(`Updated ${email}`);
            } else {
                user = await User.create({
                    email,
                    password_hash: hashedPassword,
                    full_name: email.split('@')[0],
                    role: 'salon'
                });
                await SalonConfig.create({
                    user_id: user.id,
                    stylist_name: 'Asesora ' + email.split('@')[0],
                    is_active: true
                });
                results.push(`Created ${email}`);
            }
        }

        return res.json({
            success: true,
            message: `ACCOUNTS RESTORED: ${results.join(', ')}. Password for both is: ${password}`,
            accounts: results
        });

    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

export default router;

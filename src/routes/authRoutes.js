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

        // In a real migration, we need to check how python hashed passwords.
        // It likely used werkzeug.security.generate_password_hash (scrypt/pbkdf2).
        // bcrypt cannot verify werkzeug hashes directly usually. 
        // For this "Via Libre" rebuild, we assume we might need to reset passwords or 
        // if the user creates a new account.
        // HOWEVER, to be helpful, if the hash format starts with 'scrypt:' or 'pbkdf2:', 
        // we can't verify it with bcrypt simple compare. 
        // For now, I will assume NEW users or reset passwords, OR blindly accept for testing 
        // provided the user knows this. 
        // User said "borra rompe", so I'll stick to standard bcrypt for new system.
        // If I want to support old passwords, I'd need a python-compatible verify function.


        // SAFER LOGIN LOGIC
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

export default router;

import { verifyToken } from '../services/authService.js';

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) return res.status(401).json({ error: 'Token de autenticación requerido' });

    const user = verifyToken(token);
    if (!user) return res.status(403).json({ error: 'Token inválido o expirado' });

    req.user = user;
    // Helper to get ID like in python
    req.current_user_id = user.user_id;
    next();
};

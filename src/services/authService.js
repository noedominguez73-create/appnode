import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

const SECRET_KEY = process.env.SECRET_KEY || 'default_secret_key_change_me';
const JWT_EXPIRATION = '24h';

export const generateToken = (user) => {
    return jwt.sign(
        { user_id: user.id, role: user.role },
        SECRET_KEY,
        { expiresIn: JWT_EXPIRATION }
    );
};

export const verifyToken = (token) => {
    try {
        return jwt.verify(token, SECRET_KEY);
    } catch (err) {
        return null;
    }
};

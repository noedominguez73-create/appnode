import express from 'express';
import authRoutes from './authRoutes.js';
import mirrorRoutes from './mirrorRoutes.js';

export const setupRoutes = (app) => {
    app.use('/api/auth', authRoutes);
    app.use('/api/mirror', mirrorRoutes);

    // Add other routes here
    app.get('/', (req, res) => {
        res.send("<h1>Antigravity Node.js Backend Running</h1>");
    });
};

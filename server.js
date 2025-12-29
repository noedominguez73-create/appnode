import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { sequelize } from './src/config/database.js';
import { setupRoutes } from './src/routes/index.js';
import { User, SalonConfig } from './src/models/index.js';
import bcrypt from 'bcryptjs';

// Configuration
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- HOTFIX FOR BROKEN CACHED URLS ---
app.use((req, res, next) => {
    // Detect " / fotografia " or similar space-polluted URLs
    if (req.url.includes('%20fotografia') || req.url.includes(' fotografia')) {
        console.log("🔥 HOTFIX: Redirecting malformed URL:", req.url);
        // Clean the URL: remove spaces and normalize
        // We know the target is /fotografia + query params
        // Extract query params if any
        const parts = req.url.split('?');
        const query = parts.length > 1 ? '?' + parts[1].replace(/%20/g, '').replace(/\s/g, '') : '';
        // Redirect to clean /fotografia
        return res.redirect('/fotografia' + query);
    }
    next();
});

// Static Files - Preserving existing frontend structure
// "app/static" is where the Python app served static files from
app.use('/static', express.static(path.join(__dirname, 'app/static')));

// View Engine (Optional: if we want to render templates, though the user said "backend only", 
// often the "backend" served the HTML. We will serve static HTML or use EJS if needed.
// For now, let's assume we serve the HTML files from app/templates as static or via endpoints)
// Actually, Flask renders templates. If the frontend relies on Jinja2 {{ logic }}, we might have a problem.
// Let's check a template file later to see if it's heavy on Jinja. 
// For now, we will serve them as static if possible, or sendFile.
app.use('/', express.static(path.join(__dirname, 'app/templates')));


// Initialize DB and SEED Default Admin
// Pre-Sync Check for Permissions
// Initialize DB and SEED Default Admin
// Pre-Sync Check for Permissions
try {
    console.log("🔍 DIAGNOSTIC: Starting Server...");
    console.log("   Process UID:", process.getuid ? process.getuid() : 'N/A (Windows?)');
} catch (e) {
    console.error("Diagnostic Check Failed:", e);
}

sequelize.sync({ alter: true }).then(async () => {
    console.log('Database synced successfully.');

    // --- SEEDER LOGIC ---
    try {
        const userCount = await User.count();
        if (userCount === 0) {
            console.log("🌱 Fresh Database detected. Seeding Default Admin...");
            const hashedPassword = await bcrypt.hash('admin123', 10);

            // Create Admin User (ID 1)
            const admin = await User.create({
                email: 'admin@imagina.ia',
                password_hash: hashedPassword,
                full_name: 'Admin Mirror',
                role: 'admin',
                monthly_token_limit: 1000,
                current_month_tokens: 0
            });
            console.log("✅ Admin User Created:", admin.email);

            // Create Default Salon Config for Admin
            await SalonConfig.create({
                user_id: admin.id, // Should be 1
                stylist_name: 'Asesora IA',
                primary_color: '#00ff88',
                secondary_color: '#00ccff',
                stylist_voice_name: 'Aoede',
                is_active: true
            });
            console.log("✅ Default SalonConfig Created.");
        }
    } catch (seedErr) {
        console.error("⚠️ Error seeding database:", seedErr);
    }

}).catch((err) => {
    console.error('Failed to sync database:', err);
});

// Routes
setupRoutes(app);

// Serve HTML Pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'app/templates/index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'app/templates/login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'app/templates/registro.html'));
});

app.get('/mirror', (req, res) => {
    res.sendFile(path.join(__dirname, 'app/templates/mirror.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'app/templates/admin.html'));
});

app.get('/perfil-usuario', (req, res) => {
    res.sendFile(path.join(__dirname, 'app/templates/perfil-usuario.html'));
});

// Mirror App UI Routes
app.get('/api/mirror/control-pantalla', (req, res) => {
    res.sendFile(path.join(__dirname, 'app/templates/control_pantalla.html'));
});
app.get('/api/mirror/imagina-ia', (req, res) => {
    res.sendFile(path.join(__dirname, 'app/templates/imagina_ia.html'));
});
app.get('/api/mirror/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'app/templates/admin_mirror.html'));
});

// Admin & Dashboard Routes
app.get('/admin-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'app/templates/admin-login.html'));
});
app.get('/dashboard-profesional', (req, res) => {
    res.sendFile(path.join(__dirname, 'app/templates/dashboard-profesional.html'));
});
app.get('/chatbot-config', (req, res) => {
    res.sendFile(path.join(__dirname, 'app/templates/chatbot-config.html'));
});
app.get('/chat-history', (req, res) => {
    res.sendFile(path.join(__dirname, 'app/templates/chat-history.html'));
});

// User Feature Routes
app.get('/closet', (req, res) => {
    res.sendFile(path.join(__dirname, 'app/templates/closet.html'));
});
app.get('/tienda', (req, res) => {
    res.sendFile(path.join(__dirname, 'app/templates/tienda.html'));
});
app.get('/creditos', (req, res) => {
    res.sendFile(path.join(__dirname, 'app/templates/creditos.html'));
});
app.get('/referrals', (req, res) => {
    res.sendFile(path.join(__dirname, 'app/templates/referrals.html'));
});
app.get('/avatar', (req, res) => {
    res.sendFile(path.join(__dirname, 'app/templates/avatar.html'));
});
app.get('/cambio-de-imagen', (req, res) => {
    res.sendFile(path.join(__dirname, 'app/templates/cambio_de_imagen.html'));
});
app.get('/fotografia', (req, res) => {
    res.sendFile(path.join(__dirname, 'app/templates/fotografia.html'));
});
app.get('/profesional', (req, res) => {
    res.sendFile(path.join(__dirname, 'app/templates/profesional.html'));
});

// Finances Routes (Mis Finanzas)
app.get('/mis-finanzas', (req, res) => {
    res.sendFile(path.join(__dirname, 'app/templates/mis_finanzas.html'));
});
app.get('/mis-finanzas/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'app/templates/mis_finanzas_dashboard.html'));
});
app.get('/mis-finanzas/ingresos', (req, res) => {
    res.sendFile(path.join(__dirname, 'app/templates/mis_finanzas_ingresos.html'));
});
app.get('/mis-finanzas/pagos', (req, res) => {
    res.sendFile(path.join(__dirname, 'app/templates/mis_finanzas_pagos.html'));
});
app.get('/mis-finanzas/facturas', (req, res) => {
    res.sendFile(path.join(__dirname, 'app/templates/mis_finanzas_facturas.html'));
});
app.get('/mis-finanzas/pendientes', (req, res) => {
    res.sendFile(path.join(__dirname, 'app/templates/mis_finanzas_pendientes.html'));
});
app.get('/mis-finanzas/reportes', (req, res) => {
    res.sendFile(path.join(__dirname, 'app/templates/mis_finanzas_reportes.html'));
});
app.get('/admin-mirror', (req, res) => {
    res.sendFile(path.join(__dirname, 'app/templates/admin_mirror.html'));
});

// Fallback for any other HTML files in templates if needed, or 404
app.get('/:page', (req, res) => {
    const page = req.params.page;
    // Prevent directory traversal
    const safePath = path.join(__dirname, 'app/templates', `${page}.html`);
    const rootPath = path.join(__dirname, 'app/templates');

    if (safePath.startsWith(rootPath) && fs.existsSync(safePath)) {
        res.sendFile(safePath);
    } else {
        // Maybe it's a file without .html extension in URL?
        if (fs.existsSync(safePath)) {
            res.sendFile(safePath);
        } else {
            res.status(404).send('Página no encontrada');
        }
    }
});

// Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Frontend accessible at http://localhost:${PORT}`);
});

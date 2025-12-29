const express = require('express');
const cors = require('cors');
require('dotenv').config();

// STAGE 1: CORE LIFT - COMMONJS VERSION
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('<h1>Stage 1: Core Lift - ALIVE (CJS)</h1>'));
app.get('/health', (req, res) => res.json({ status: 'ALIVE', stage: '1_CORE_CJS' }));

app.listen(PORT, () => {
    console.log(`✅ Stage 1 CJS Server running on port ${PORT}`);
});

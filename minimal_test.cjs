const http = require('http');

// Hardcoded check for environment port or default to 3000
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK - MINIMAL CJS SERVER ALIVE');
});

server.listen(PORT, () => {
    console.log(`Minimal Server running on port ${PORT}`);
    console.log('Node Version:', process.version);
    console.log('Platform:', process.platform);
});

// Prevent instant exit on unhandled errors
process.on('uncaughtException', (err) => {
    console.error('FATAL:', err);
});

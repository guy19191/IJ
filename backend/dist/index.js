"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("./routes/auth"));
const events_1 = __importDefault(require("./routes/events"));
const users_1 = __importDefault(require("./routes/users"));
const playlists_1 = __importDefault(require("./routes/playlists"));
const music_1 = __importDefault(require("./routes/music"));
const path_1 = __importDefault(require("path"));
// Load environment variables
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Initialize Prisma client
exports.prisma = new client_1.PrismaClient();
// Create Express app
const app = (0, express_1.default)();
// Debug middleware for all requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    next();
});
// Middleware
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000', 'http://localhost:5173'], // Allow both backend and frontend dev servers
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json());
// Serve static files from the public directory
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
// API Routes
app.use('/api/auth', auth_1.default);
app.use('/api/events', events_1.default);
app.use('/api/users', users_1.default);
app.use('/api/playlists', playlists_1.default);
app.use('/api/music', music_1.default);
// Test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working!' });
});
// Serve the React app for all other routes
app.get('*', (req, res) => {
    // Don't serve index.html for /api routes
    if (req.path.startsWith('/api')) {
        res.status(404).json({ error: 'API route not found' });
        return;
    }
    res.sendFile(path_1.default.join(__dirname, '../public/index.html'));
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Something went wrong!' });
});
// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Available routes:');
    console.log('- GET /api/test');
    console.log('- /api/auth/*');
    console.log('- /api/events/*');
    console.log('- /api/users/*');
    console.log('- /api/playlists/*');
});

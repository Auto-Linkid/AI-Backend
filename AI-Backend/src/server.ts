import dotenv from 'dotenv';
dotenv.config(); // Load env BEFORE other imports

import express from 'express';
import cors from 'cors';
import generateRouter from './routes/generate';
import polishRouter from './routes/polish';
import paymentRouter from './routes/payment';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        process.env.CORS_ORIGIN || ''
    ].filter(Boolean),
    credentials: true
}));
app.use(express.json());

// Routes
app.use(generateRouter);
app.use(polishRouter);
app.use(paymentRouter); // Registered new payment route

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'AI Backend is running' });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 AI Backend running on http://localhost:${PORT}`);
    console.log(`📡 CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
});

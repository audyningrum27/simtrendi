import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import routes from './routes/routes.js';

const app = express();

// Configuration CORS
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '20mb' }));

// Rute API
app.get('/', (req, res) => {
    res.status(200).json({ 
        code: 200,
        message: 'Selamat Datang di API S!MATREN' 
    });
});

app.use('/api', routes);

// Load .env
const PORT = process.env.PORT || 9000;
const APP_URL = process.env.APP_URL || 'localhost';

app.listen(PORT, () => {
    console.log(`Server running on http:://${APP_URL}:${PORT}`);
});
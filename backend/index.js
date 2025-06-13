import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import samplesRouter from './routes/samples.js';
import replicateRouter from './routes/replicate.js';
import communityRouter from './routes/community.js';

dotenv.config();

const app = express();

/**
 * Defines CORS policy for accepted origins, headers, and methods.
 * Allows frontend apps (e.g., Vite, localhost, Vercel) to access backend APIs securely.
 */
const corsOptions = {
  origin: [
    'http://localhost:3000', 
    'http://localhost:5173', 
    'https://samply-sigma.vercel.app', 
    'https://*.vercel.app' 
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

/**
 * Applies CORS and body-parsing middleware for JSON and URL-encoded data.
 * Increases payload limit to handle large audio data uploads.
 */
app.use(cors(corsOptions));

app.options('*', cors(corsOptions));

app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

/**
 * Registers route modules for handling:
 * - /api/samples → Sample upload, fetch, delete, like, etc.
 * - /api/replicate → AI music generation using Replicate
 * - /api/community → Comments, usernames, and community features
 */
app.use('/api/samples', samplesRouter);
app.use('/api/replicate', replicateRouter);
app.use('/api/community', communityRouter);

/**
 * Starts the Express server on the defined port.
 * Defaults to port 5000 if not specified in the environment variables.
 */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
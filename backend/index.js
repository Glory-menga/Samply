import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import samplesRouter from './routes/samples.js';
import replicateRouter from './routes/replicate.js';
import communityRouter from './routes/community.js';

dotenv.config();

const app = express();

const corsOptions = {
  origin: [
    'http://localhost:3000', 
    'https://samply-taupe.vercel.app', 
    'https://*.vercel.app' 
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));

app.options('*', cors(corsOptions));

app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/samples', samplesRouter);
app.use('/api/replicate', replicateRouter);
app.use('/api/community', communityRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
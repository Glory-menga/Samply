import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import samplesRouter from './routes/samples.js';
import replicateRouter from './routes/replicate.js';
import communityRouter from './routes/community.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/samples', samplesRouter);
app.use('/api/replicate', replicateRouter);
app.use('/api/community', communityRouter);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
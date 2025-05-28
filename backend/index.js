import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import samplesRouter from './routes/samples.js';
import replicateRouter from './routes/replicate.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/samples', samplesRouter);
app.use('/api/replicate', replicateRouter);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
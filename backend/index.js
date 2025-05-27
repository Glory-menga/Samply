import express from 'express';
import cors from 'cors';
import samplesRouter from './routes/samples.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/samples', samplesRouter);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});

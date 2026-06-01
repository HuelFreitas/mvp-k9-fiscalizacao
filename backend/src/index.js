import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import requestsRoutes from './routes/requests.js';
import { initAppState } from './initState.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// initialize in-memory app state for scaffold
initAppState();

app.use('/api/auth', authRoutes);
app.use('/api/requests', requestsRoutes);

export { app };

if (process.env.NODE_ENV !== 'test') {
  const port = process.env.PORT || 4000;
  app.listen(port, () => console.log(`Backend running on http://localhost:${port}`));
}

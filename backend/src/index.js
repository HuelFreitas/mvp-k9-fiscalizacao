import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import requestsRoutes from './routes/requests.js';
import { initAppState } from './initState.js';
import { hasDatabase } from './db/pool.js';

dotenv.config();

const app = express();
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origem não permitida pelo CORS'));
  },
}));
app.use(express.json({ limit: '100kb' }));
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
}));

if (process.env.NODE_ENV === 'production' && !hasDatabase()) {
  throw new Error('DATABASE_URL is required in production');
}

// Desenvolvimento e testes podem usar o estado demonstrativo em memória.
if (!hasDatabase()) initAppState();

app.use('/api/auth', authRoutes);
app.use('/api/requests', requestsRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use((err, req, res, _next) => {
  if (err?.message === 'Origem não permitida pelo CORS') {
    return res.status(403).json({ error: { code: 'CORS_ORIGIN_DENIED', message: err.message } });
  }
  console.error(err);
  return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor' } });
});

export { app };

if (process.env.NODE_ENV !== 'test') {
  const port = process.env.PORT || 4000;
  app.listen(port, '0.0.0.0', () => console.log(`Backend running on port ${port}`));
}

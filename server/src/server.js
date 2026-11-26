import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { toNodeHandler } from 'better-auth/node';
import { connectDatabase } from './config/db.js';
import { getAuth } from './config/auth.js';
import { runInitialSeedIfEmpty } from './services/seederService.js';
import publicRoutes from './routes/publicRoutes.js';
import posRoutes from './routes/posRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

async function startServer() {
  await connectDatabase();
  await runInitialSeedIfEmpty();

  const app = express();
  const port = Number(process.env.PORT || 5000);
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
  app.use(
    cors({
      origin: [clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
    })
  );
  app.use(morgan('dev'));

  // Better Auth must be mounted BEFORE express.json()
  app.all('/api/auth/*', toNodeHandler(getAuth()));

  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'sch-server', time: new Date().toISOString() });
  });

  app.use('/api/public', publicRoutes);
  app.use('/api/pos', posRoutes);
  app.use('/api/admin', adminRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  app.listen(port, () => {
    console.log(`[Server] Running at http://localhost:${port}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});

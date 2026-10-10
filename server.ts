import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { apiRouter, sseClients } from './src/server/routes';
import { db } from './src/server/db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Request logger in dev
  app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.url}`);
    }
    next();
  });

  // Ensure uploads directory exists
  const uploadsDir = path.resolve(process.cwd(), 'data', 'uploads');
  import('fs').then(fs => {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  });
  app.use('/api/uploads', express.static(uploadsDir));

  // Mount API router
  app.use('/api', apiRouter);

  // Serve Vite in development / SPA in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 RestoQR SaaS Server running on http://0.0.0.0:${PORT}`);
  });

  // Graceful shutdown
  let shuttingDown = false;

  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`\n[shutdown] Received ${signal}, closing server...`);

    // Close SSE connections
    for (const client of sseClients) {
      client.res.write(`data: ${JSON.stringify({ type: 'server-shutdown' })}\n\n`);
      client.res.end();
    }

    server.close(() => {
      console.log('[shutdown] HTTP server closed');
      // Save DB
      try {
        db.save();
        console.log('[shutdown] Database saved');
      } catch (err) {
        console.error('[shutdown] Error saving DB:', err);
      }
      process.exit(0);
    });

    // Force shutdown after 10s
    setTimeout(() => {
      console.error('[shutdown] Force closing after 10s');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

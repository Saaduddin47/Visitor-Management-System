import express from 'express';
import path from 'path';
import fs from 'fs';
import http from 'http';
import https from 'https';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';

import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import managerRoutes from './routes/managerRoutes.js';
import frontDeskRoutes from './routes/frontDeskRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const app = express();

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true
  })
);
app.use(helmet());
app.use(mongoSanitize());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500
  })
);

app.use('/uploads', express.static(path.resolve('src', env.uploadDir)));

app.get('/api/health', (_req, res) => {
  res.json({ message: 'VMS API running', httpsReady: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/frontdesk', frontDeskRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

const start = async () => {
  await connectDb();

  if (env.ssl.enabled && env.ssl.keyPath && env.ssl.certPath) {
    const key = fs.readFileSync(path.resolve(env.ssl.keyPath));
    const cert = fs.readFileSync(path.resolve(env.ssl.certPath));
    https.createServer({ key, cert }, app).listen(env.port, () => {
      console.log(`Server running on https://localhost:${env.port}`);
    });
    return;
  }

  http.createServer(app).listen(env.port, () => {
    console.log(`Server running on http://localhost:${env.port}`);
  });
};

start().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});

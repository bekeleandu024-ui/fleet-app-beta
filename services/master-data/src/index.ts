import express from 'express';
import { config } from './config/config';
import { pool } from './db/client';
import { runMigrations } from './db/init';
import { connectProducer } from './services/kafkaProducer';
import costingRoutes from './routes/costing';

const app = express();
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'master-data' });
});

// Costing API routes
app.use('/api/costing', costingRoutes);

async function startServer() {
  try {
    // Run database migrations
    console.log('Running database migrations...');
    await runMigrations(pool);
    console.log('Database migrations completed');

    // Connect Kafka producer
    console.log('Connecting to Kafka...');
    await connectProducer();
    console.log('Kafka producer connected');

    // Start HTTP server
    app.listen(config.port, () => {
      console.log(`Master-data service listening on port ${config.port}`);
      console.log(`Costing API available at http://localhost:${config.port}/api/costing`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

startServer();

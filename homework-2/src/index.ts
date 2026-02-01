import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import ticketsRouter from './routes/tickets.routes';
import { connectDatabase, disconnectDatabase } from './services/database.service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/tickets', ticketsRouter);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

let server: any;

if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, async () => {
    await connectDatabase();
    console.log(`Server running on port ${PORT}`);
  });
}

async function gracefulShutdown(signal: string) {
  console.log(`${signal} received. Shutting down gracefully...`);

  try {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server.close((err: Error) => {
          if (err) reject(err);
          else resolve();
        });
      });
      console.log('Server closed. No longer accepting connections.');
    }

    await disconnectDatabase();
    console.log('Database disconnected.');

    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export default app;

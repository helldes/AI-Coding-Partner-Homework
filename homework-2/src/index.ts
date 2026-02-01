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

process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await disconnectDatabase();
  if (server) server.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await disconnectDatabase();
  if (server) server.close();
  process.exit(0);
});

export default app;

import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'test' ? [] : ['error', 'warn'],
});

export async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}

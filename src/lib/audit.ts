import { PrismaClient } from '@prisma/client';

// Define a function that returns a new PrismaClient instance
const prismaClientSingleton = () => {
  return new PrismaClient({
    // Optional: Enable query logging in development for debugging enterprise queries
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

// Augment the global scope to include our Prisma singleton
// This prevents TypeScript from complaining about the global variable
declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

// Export the database instance.
// If it exists in the global scope (during hot reloads), use it.
// Otherwise, instantiate a new connection.
export const db = globalThis.prismaGlobal ?? prismaClientSingleton();

// If we are not in production, attach the instance to the global object
// so it survives hot reloads.
if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = db;
}
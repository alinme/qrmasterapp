import { Server } from 'socket.io';
import { Express } from 'express';

let ioInstance: Server | null = null;

export function initializeSocket(app: Express, httpServer: any): Server {
  if (ioInstance) {
    return ioInstance;
  }

  ioInstance = new Server(httpServer, {
    cors: {
      origin: '*', // TODO: restrict in production
      methods: ['GET', 'POST']
    }
  });

  return ioInstance;
}

export function getSocket(): Server {
  if (!ioInstance) {
    throw new Error('Socket.IO not initialized. Call initializeSocket first.');
  }
  return ioInstance;
}

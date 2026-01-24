import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from the server directory
// Works both in dev (ts-node) and production (compiled)
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });
console.log('Loading .env from:', envPath);

// Log environment variables for debugging
console.log('Environment variables loaded:');
console.log('PORT:', process.env.PORT);
console.log('CUSTOMER_APP_URL:', process.env.CUSTOMER_APP_URL);
console.log('ADMIN_APP_URL:', process.env.ADMIN_APP_URL);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

const app = express();

import authRoutes from './auth';
import restaurantRoutes from './restaurant';
import menuRoutes from './menu';
import publicRoutes from './public';
import orderRoutes from './orderRoutes';
import tableRoutes from './tables';
import superAdminRoutes from './superadmin';
import userRoutes from './users';
import billsRoutes from './bills';
import { initializeSocket } from './socket';
import { setupSocket } from './orders';
import { setupUploadRoutes } from './upload';

app.use(cors());
app.use(express.json());
setupUploadRoutes(app);

app.get('/', (req, res) => {
  res.send('QR Menu API is running');
});

app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bills', billsRoutes);

// Initialize Socket.IO after routes are set up
const httpServer = createServer(app);
const io = initializeSocket(app, httpServer);
setupSocket(io);

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

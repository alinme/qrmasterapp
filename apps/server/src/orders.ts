import { Server, Socket } from 'socket.io';

export const setupSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log('User connected:', socket.id);

    // Join room based on restaurantId (for admin dashboard)
    socket.on('join_restaurant', (restaurantId: string) => {
      socket.join(`restaurant_${restaurantId}`);
      console.log(`Socket ${socket.id} joined restaurant_${restaurantId}`);
    });

    // Join room based on tableId (for customer updates)
    socket.on('join_table', (tableId: string) => {
      socket.join(`table_${tableId}`);
      console.log(`Socket ${socket.id} joined table_${tableId}`);
    });

    // Handle new order placement (client -> server -> admin)
    socket.on('place_order', (data: any) => {
      // In real app, we save to DB here or triggered by API
      // Check if data has restaurantId
      if (data.restaurantId) {
        // Emit to restaurant admin
        io.to(`restaurant_${data.restaurantId}`).emit('new_order', data);
      }
    });

    // Handle order status update (admin -> server -> client)
    socket.on('update_order_status', (data: any) => {
        if (data.tableId) {
            io.to(`table_${data.tableId}`).emit('order_status_updated', data);
        }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  RESTAURANT_ADMIN = 'RESTAURANT_ADMIN',
  STAFF = 'STAFF',
  KITCHEN = 'KITCHEN',
  SERVER = 'SERVER'
}

export enum OrderStatus {
  RECEIVED = 'RECEIVED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  SERVED = 'SERVED',
  CANCELLED = 'CANCELLED'
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

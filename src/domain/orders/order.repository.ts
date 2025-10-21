import { OrderStatus } from '@prisma/client';

import { NewOrder } from './new-order';
import { Order } from './order';

export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY');

export interface OrderFilter {
  status?: OrderStatus;
}

export interface OrderListResult {
  orders: Order[];
  totalCount: number;
}

export interface IOrderRepository {
  save(order: NewOrder): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  findAllByUserId(userId: string, page: number, pageSize: number, filter?: OrderFilter): Promise<OrderListResult>;
  updateStatus(id: string, status: OrderStatus): Promise<Order>;
  cancel(id: string): Promise<void>;
}

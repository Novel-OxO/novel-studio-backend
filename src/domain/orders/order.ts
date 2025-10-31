import { OrderStatus } from '@prisma/client';

import { OrderItem } from './order-item';

export class Order {
  id: string;
  userId: string;
  totalAmount: number;
  status: OrderStatus;
  orderItems: OrderItem[];
  createdAt: Date;
  updatedAt: Date;

  constructor(
    id: string,
    userId: string,
    totalAmount: number,
    status: OrderStatus,
    orderItems: OrderItem[],
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.userId = userId;
    this.totalAmount = totalAmount;
    this.status = status;
    this.orderItems = orderItems;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

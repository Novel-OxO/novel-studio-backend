import { NewOrderItem } from './new-order-item';

export class NewOrder {
  userId: string;
  totalAmount: number;
  orderItems: NewOrderItem[];

  constructor(userId: string, totalAmount: number, orderItems: NewOrderItem[]) {
    this.userId = userId;
    this.totalAmount = totalAmount;
    this.orderItems = orderItems;
  }
}

import { NewOrderItem } from './new-order-item';

export class NewOrder {
  userId: string;
  totalPrice: number;
  orderItems: NewOrderItem[];

  constructor(userId: string, totalPrice: number, orderItems: NewOrderItem[]) {
    this.userId = userId;
    this.totalPrice = totalPrice;
    this.orderItems = orderItems;
  }
}

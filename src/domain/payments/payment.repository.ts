import { NewPayment } from './new-payment';
import { Payment } from './payment';

export const PAYMENT_REPOSITORY = Symbol('PAYMENT_REPOSITORY');

export interface IPaymentRepository {
  save(payment: NewPayment): Promise<Payment>;
  findById(id: string): Promise<Payment | null>;
  findByPaymentId(paymentId: string): Promise<Payment | null>;
  findByOrderId(orderId: string): Promise<Payment | null>;
  updateStatus(id: string, status: string, paidAt?: Date, transactionId?: string, portoneData?: any): Promise<Payment>;
  cancel(id: string, cancelledAt: Date, portoneData?: any): Promise<Payment>;
}

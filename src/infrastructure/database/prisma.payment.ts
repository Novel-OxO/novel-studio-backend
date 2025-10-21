import { Injectable } from '@nestjs/common';

import { NewPayment } from '@/domain/payments/new-payment';
import { Payment } from '@/domain/payments/payment';
import { type IPaymentRepository } from '@/domain/payments/payment.repository';

import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaPaymentRepository implements IPaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(newPayment: NewPayment): Promise<Payment> {
    const created = await this.prisma.payment.create({
      data: {
        paymentId: newPayment.paymentId,
        orderId: newPayment.orderId,
        amount: newPayment.amount,
        currency: newPayment.currency,
        paymentMethod: newPayment.paymentMethod,
        pgProvider: newPayment.pgProvider,
        transactionId: newPayment.transactionId,
        status: 'READY',
      },
    });

    return this.toEntity(created);
  }

  async findById(id: string): Promise<Payment | null> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
    });

    return payment ? this.toEntity(payment) : null;
  }

  async findByPaymentId(paymentId: string): Promise<Payment | null> {
    const payment = await this.prisma.payment.findUnique({
      where: { paymentId },
    });

    return payment ? this.toEntity(payment) : null;
  }

  async findByOrderId(orderId: string): Promise<Payment | null> {
    const payment = await this.prisma.payment.findUnique({
      where: { orderId },
    });

    return payment ? this.toEntity(payment) : null;
  }

  async updateStatus(
    id: string,
    status: string,
    paidAt?: Date,
    transactionId?: string,
    portoneData?: any,
  ): Promise<Payment> {
    const updated = await this.prisma.payment.update({
      where: { id },
      data: {
        status,
        ...(paidAt && { paidAt }),
        ...(transactionId && { transactionId }),
        ...(portoneData && { portoneData }),
      },
    });

    return this.toEntity(updated);
  }

  async cancel(id: string, cancelledAt: Date, portoneData?: any): Promise<Payment> {
    const updated = await this.prisma.payment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt,
        ...(portoneData && { portoneData }),
      },
    });

    return this.toEntity(updated);
  }

  private toEntity(payment: any): Payment {
    return new Payment(
      payment.id,
      payment.paymentId,
      payment.orderId,
      payment.transactionId,
      payment.amount,
      payment.currency,
      payment.paymentMethod,
      payment.pgProvider,
      payment.status,
      payment.failureReason,
      payment.paidAt,
      payment.cancelledAt,
      payment.virtualAccountNumber,
      payment.virtualAccountBank,
      payment.virtualAccountHolder,
      payment.virtualAccountExpiry,
      payment.portoneData,
      payment.createdAt,
      payment.updatedAt,
    );
  }
}

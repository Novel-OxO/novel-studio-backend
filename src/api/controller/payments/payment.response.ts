import { ApiProperty } from '@nestjs/swagger';

import { Payment } from '@/domain/payments/payment';

export class PaymentResponse {
  @ApiProperty({
    description: '결제 ID',
    example: 'clx1234567890',
  })
  id: string;

  @ApiProperty({
    description: '포트원 결제 ID',
    example: 'payment_mock_1234567890',
  })
  paymentId: string;

  @ApiProperty({
    description: '주문 ID',
    example: 'clx0987654321',
  })
  orderId: string;

  @ApiProperty({
    description: '트랜잭션 ID',
    example: 'tx_mock_1234567890',
    nullable: true,
  })
  transactionId: string | null;

  @ApiProperty({
    description: '결제 금액',
    example: 150000,
  })
  amount: number;

  @ApiProperty({
    description: '화폐',
    example: 'KRW',
  })
  currency: string;

  @ApiProperty({
    description: '결제 수단',
    example: 'MOCK',
  })
  paymentMethod: string;

  @ApiProperty({
    description: 'PG사',
    example: 'MOCK_PG',
    nullable: true,
  })
  pgProvider: string | null;

  @ApiProperty({
    description: '결제 상태',
    example: 'PAID',
    enum: ['READY', 'PAID', 'FAILED', 'CANCELLED'],
  })
  status: string;

  @ApiProperty({
    description: '결제 완료 시각',
    example: '2024-01-01T00:00:00.000Z',
    nullable: true,
  })
  paidAt: Date | null;

  @ApiProperty({
    description: '생성 시각',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정 시각',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  static from(payment: Payment): PaymentResponse {
    const response = new PaymentResponse();
    response.id = payment.id;
    response.paymentId = payment.paymentId;
    response.orderId = payment.orderId;
    response.transactionId = payment.transactionId;
    response.amount = payment.amount;
    response.currency = payment.currency;
    response.paymentMethod = payment.paymentMethod;
    response.pgProvider = payment.pgProvider;
    response.status = payment.status;
    response.paidAt = payment.paidAt;
    response.createdAt = payment.createdAt;
    response.updatedAt = payment.updatedAt;
    return response;
  }
}

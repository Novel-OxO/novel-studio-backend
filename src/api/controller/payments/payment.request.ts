import { IsNotEmpty, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class VerifyPaymentRequest {
  @ApiProperty({
    description: '포트원 결제 ID (Mock에서는 임의 값)',
    example: 'payment_mock_1234567890',
  })
  @IsString()
  @IsNotEmpty()
  paymentId: string;

  @ApiProperty({
    description: '주문 ID',
    example: 'clx1234567890',
  })
  @IsString()
  @IsNotEmpty()
  orderId: string;
}

export class WebhookRequest {
  @ApiProperty({
    description: '포트원 결제 ID',
    example: 'payment_mock_1234567890',
  })
  @IsString()
  @IsNotEmpty()
  paymentId: string;

  @ApiProperty({
    description: '결제 상태',
    example: 'PAID',
    enum: ['READY', 'PAID', 'FAILED', 'CANCELLED'],
  })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiProperty({
    description: '트랜잭션 ID (선택)',
    example: 'tx_mock_1234567890',
    required: false,
  })
  @IsString()
  transactionId?: string;
}

import { IsNotEmpty, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class VerifyPaymentRequest {
  @ApiProperty({
    description: '포트원 결제 ID',
    example: 'payment_1234567890',
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

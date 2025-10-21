import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { createSuccessResponse, type SuccessResponse } from '@/api/support/response';

import { PaymentService } from '@/domain/payments/payment.service';

import { VerifyPaymentRequest, WebhookRequest } from './payment.request';
import { PaymentResponse } from './payment.response';

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '결제 검증 (Mock - 무조건 성공)',
    description:
      'Mock 환경에서 결제를 검증하고 주문 상태를 변경하며 수강 정보를 등록합니다. 실제 환경에서는 포트원 API를 호출합니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '결제 검증 성공',
    type: PaymentResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '주문을 찾을 수 없음',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '잘못된 요청 (이미 결제된 주문, PENDING 상태가 아닌 주문 등)',
  })
  async verifyPayment(@Body() request: VerifyPaymentRequest): Promise<SuccessResponse<PaymentResponse>> {
    const payment = await this.paymentService.verifyPayment(request.paymentId, request.orderId);
    return createSuccessResponse(PaymentResponse.from(payment));
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '결제 웹훅 (Mock)',
    description: 'Mock 환경에서 결제 웹훅을 처리합니다. 실제 환경에서는 포트원 웹훅 서명을 검증합니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '웹훅 처리 성공',
    type: PaymentResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '결제 정보를 찾을 수 없음',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '지원하지 않는 결제 상태',
  })
  async handleWebhook(@Body() request: WebhookRequest): Promise<SuccessResponse<PaymentResponse>> {
    const payment = await this.paymentService.handleWebhook(request.paymentId, request.status, request.transactionId);
    return createSuccessResponse(PaymentResponse.from(payment));
  }
}

import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { createSuccessResponse, type SuccessResponse } from '@/api/support/response';

import { PaymentService } from '@/domain/payments/payment.service';

import { VerifyPaymentRequest } from './payment.request';
import { PaymentResponse } from './payment.response';

/**
 * PortOne SDK용 컨트롤러
 * 클라이언트에서 결제 완료 후 verify API를 호출하여 결제 검증
 * TODO: 실제 운영 시 웹훅을 통한 결제 정보 동기화 추가 필요 (현재는 클라이언트 호출 방식만 지원)
 */
@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '결제 검증',
    description: '포트원 API를 통해 결제를 검증하고 주문 상태를 변경하며 수강 정보를 등록합니다.',
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
}

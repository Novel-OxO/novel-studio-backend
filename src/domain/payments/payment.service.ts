import { PortOneError } from '@portone/server-sdk';
import type { Payment as PortOnePayment } from '@portone/server-sdk/payment';

import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';

import { OrderStatus } from '@prisma/client';

import { ENROLLMENT_REPOSITORY, type IEnrollmentRepository } from '@/domain/enrollments/enrollment.repository';
import { NewEnrollment } from '@/domain/enrollments/new-enrollment';
import { ORDER_REPOSITORY, type IOrderRepository } from '@/domain/orders/order.repository';

import { PortOneClientService } from '@/infrastructure/portone/portone.client';

import { NewPayment } from './new-payment';
import { Payment } from './payment';
import { PAYMENT_REPOSITORY, type IPaymentRepository } from './payment.repository';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly portoneClient = PortOneClientService.getInstance();

  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: IPaymentRepository,
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    @Inject(ENROLLMENT_REPOSITORY)
    private readonly enrollmentRepository: IEnrollmentRepository,
  ) {}

  // TODO 실제 배포 전 트랜잭션 및 동기화 관련된 내용 검토 필요
  async verifyPayment(paymentId: string, orderId: string): Promise<Payment> {
    // 주문 확인
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('주문을 찾을 수 없습니다.');
    }

    // 주문이 PENDING 상태인지 확인
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('결제 대기 중인 주문이 아닙니다.');
    }

    // 기존 결제가 있는지 확인
    const existingPayment = await this.paymentRepository.findByOrderId(orderId);
    if (existingPayment) {
      throw new BadRequestException('이미 결제가 진행된 주문입니다.');
    }

    // 포트원 서버에서 결제 정보 동기화
    const payment = await this.syncPaymentWithPortOne(paymentId, orderId, order.totalAmount);

    // 결제 상태가 PAID인 경우에만 수강 정보 등록
    if (payment.status === 'PAID') {
      // 주문 상태를 PAID로 업데이트
      await this.orderRepository.updateStatus(orderId, OrderStatus.PAID);

      // 수강 정보 등록
      await this.createEnrollmentsForOrder(
        order.userId,
        order.orderItems.map((item) => item.courseId),
      );
    }

    return payment;
  }

  /**
   * 포트원 서버에서 결제 정보를 가져와 검증하고 DB에 저장
   */
  private async syncPaymentWithPortOne(paymentId: string, orderId: string, expectedAmount: number): Promise<Payment> {
    try {
      // 포트원 서버에서 결제 정보 조회
      const portonePayment = await this.portoneClient.payment.getPayment({ paymentId });

      this.logger.log(`포트원 결제 정보 조회 성공: ${paymentId}, 상태: ${String(portonePayment.status)}`);

      // 결제 정보 검증
      this.validatePayment(portonePayment, orderId, expectedAmount);

      // DB에 결제 정보 저장 또는 업데이트
      let payment = await this.paymentRepository.findByPaymentId(paymentId);

      // PaidPayment 타입인 경우에만 DB에 저장
      if (portonePayment.status === 'PAID') {
        if (!payment) {
          // 새로운 결제 생성
          const newPayment = new NewPayment(
            paymentId,
            orderId,
            portonePayment.amount.total,
            this.extractPaymentMethod(portonePayment),
            portonePayment.currency,
            (portonePayment as any).pgProvider || 'UNKNOWN',
            portonePayment.transactionId,
          );

          payment = await this.paymentRepository.save(newPayment);
        }

        // 결제 상태 업데이트
        const paidAt = portonePayment.paidAt ? new Date(portonePayment.paidAt) : new Date();
        const portoneData = {
          verified: true,
          verifiedAt: new Date().toISOString(),
          channel: portonePayment.channel,
          pgProvider: (portonePayment as any).pgProvider,
          method: portonePayment.method,
        };

        payment = await this.paymentRepository.updateStatus(
          payment.id,
          'PAID',
          paidAt,
          portonePayment.transactionId,
          portoneData,
        );

        this.logger.log(`결제 완료 처리: ${paymentId}`);
      } else if (portonePayment.status === 'FAILED') {
        if (!payment) {
          throw new BadRequestException('결제 실패: DB에 결제 정보가 없습니다.');
        }

        const portoneData = {
          verified: false,
          verifiedAt: new Date().toISOString(),
          failureReason: portonePayment.failure?.reason,
        };

        payment = await this.paymentRepository.updateStatus(payment.id, 'FAILED', undefined, undefined, portoneData);

        this.logger.warn(`결제 실패: ${paymentId}, 사유: ${portonePayment.failure?.reason}`);
      } else {
        throw new BadRequestException('결제가 아직 완료되지 않았습니다.');
      }

      return payment;
    } catch (error) {
      if (error instanceof PortOneError) {
        this.logger.error(`포트원 API 오류: ${error.message}`);
        throw new BadRequestException('결제 정보를 확인할 수 없습니다.');
      }
      throw error;
    }
  }

  /**
   * 포트원에서 받은 결제 정보 검증
   */
  private validatePayment(portonePayment: PortOnePayment, orderId: string, expectedAmount: number): void {
    const payment = portonePayment as any;
    // 프로덕션 환경에서만 엄격한 검증
    if (payment.channel?.type === 'LIVE') {
      // 금액 검증
      if (payment.amount?.total !== expectedAmount) {
        this.logger.error(
          `결제 금액 불일치: 예상 ${expectedAmount}, 실제 ${payment.amount?.total}, paymentId: ${payment.id}`,
        );
        throw new BadRequestException('결제 금액이 일치하지 않습니다.');
      }

      // 화폐 검증
      if (payment.currency !== 'KRW') {
        throw new BadRequestException('지원하지 않는 화폐입니다.');
      }

      // 주문 ID 검증 (customData에 orderId가 있다고 가정)
      if (payment.customData) {
        try {
          const customData = JSON.parse(payment.customData);
          if (customData.orderId !== orderId) {
            this.logger.error(`주문 ID 불일치: 예상 ${orderId}, 실제 ${customData.orderId}, paymentId: ${payment.id}`);
            throw new BadRequestException('주문 정보가 일치하지 않습니다.');
          }
        } catch {
          this.logger.warn(`customData 파싱 실패: ${payment.customData}`);
        }
      }
    } else {
      // 테스트 환경에서는 경고만 출력
      this.logger.warn(`테스트 환경 결제: ${payment.id}`);
    }
  }

  /**
   * 포트원 결제 수단 추출
   */
  private extractPaymentMethod(portonePayment: PortOnePayment): string {
    const payment = portonePayment as any;
    if (!payment.method) {
      return 'UNKNOWN';
    }

    if ('card' in payment.method) {
      return 'CARD';
    } else if ('virtualAccount' in payment.method) {
      return 'VIRTUAL_ACCOUNT';
    } else if ('transfer' in payment.method) {
      return 'TRANSFER';
    } else if ('mobile' in payment.method) {
      return 'MOBILE';
    } else if ('giftCertificate' in payment.method) {
      return 'GIFT_CERTIFICATE';
    } else if ('easyPay' in payment.method) {
      return 'EASY_PAY';
    }

    return 'UNKNOWN';
  }

  /**
   * 주문의 코스들에 대한 수강 정보 생성
   */
  private async createEnrollmentsForOrder(userId: string, courseIds: string[]): Promise<void> {
    for (const courseId of courseIds) {
      // 이미 수강 중인지 확인
      const exists = await this.enrollmentRepository.exists(userId, courseId);
      if (exists) {
        continue; // 이미 등록된 경우 스킵
      }

      // 수강 정보 생성 (평생 수강)
      const newEnrollment = new NewEnrollment(userId, courseId, null);
      await this.enrollmentRepository.save(newEnrollment);
    }
  }

  /**
   * 결제 정보 조회
   */
  async getPaymentByOrderId(orderId: string): Promise<Payment | null> {
    return await this.paymentRepository.findByOrderId(orderId);
  }
}

import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { OrderStatus } from '@prisma/client';

import { ENROLLMENT_REPOSITORY, type IEnrollmentRepository } from '@/domain/enrollments/enrollment.repository';
import { NewEnrollment } from '@/domain/enrollments/new-enrollment';
import { ORDER_REPOSITORY, type IOrderRepository } from '@/domain/orders/order.repository';

import { NewPayment } from './new-payment';
import { Payment } from './payment';
import { PAYMENT_REPOSITORY, type IPaymentRepository } from './payment.repository';

@Injectable()
export class PaymentService {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: IPaymentRepository,
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    @Inject(ENROLLMENT_REPOSITORY)
    private readonly enrollmentRepository: IEnrollmentRepository,
  ) {}

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

    // Mock 결제 생성 (무조건 성공)
    const transactionId = `tx_mock_${Date.now()}`;
    const newPayment = new NewPayment(
      paymentId,
      orderId,
      order.totalPrice,
      'MOCK', // Mock 결제 수단
      'KRW',
      'MOCK_PG', // Mock PG
      transactionId,
    );

    const payment = await this.paymentRepository.save(newPayment);

    // 결제 상태를 즉시 PAID로 업데이트
    const paidAt = new Date();
    const portoneData = {
      gateway: 'MOCK',
      verified: true,
      verifiedAt: paidAt.toISOString(),
    };

    const paidPayment = await this.paymentRepository.updateStatus(
      payment.id,
      'PAID',
      paidAt,
      transactionId,
      portoneData,
    );

    // 주문 상태를 PAID로 업데이트
    await this.orderRepository.updateStatus(orderId, OrderStatus.PAID);

    // 수강 정보 등록
    await this.createEnrollmentsForOrder(
      order.userId,
      order.orderItems.map((item) => item.courseId),
    );

    return paidPayment;
  }

  async handleWebhook(paymentId: string, status: string, transactionId?: string): Promise<Payment> {
    const payment = await this.paymentRepository.findByPaymentId(paymentId);
    if (!payment) {
      throw new NotFoundException('결제 정보를 찾을 수 없습니다.');
    }

    // Mock 웹훅 데이터
    const portoneData = {
      gateway: 'MOCK',
      webhook: true,
      status,
      receivedAt: new Date().toISOString(),
    };

    if (status === 'PAID') {
      // 결제 완료
      const paidAt = new Date();
      const updatedPayment = await this.paymentRepository.updateStatus(
        payment.id,
        status,
        paidAt,
        transactionId || payment.transactionId || undefined,
        portoneData,
      );

      // 주문 상태 업데이트
      await this.orderRepository.updateStatus(payment.orderId, OrderStatus.PAID);

      // 수강 정보 등록
      const order = await this.orderRepository.findById(payment.orderId);
      if (order) {
        await this.createEnrollmentsForOrder(
          order.userId,
          order.orderItems.map((item) => item.courseId),
        );
      }

      return updatedPayment;
    } else if (status === 'FAILED') {
      // 결제 실패
      return await this.paymentRepository.updateStatus(payment.id, status, undefined, undefined, portoneData);
    } else if (status === 'CANCELLED') {
      // 결제 취소
      const cancelledAt = new Date();
      return await this.paymentRepository.cancel(payment.id, cancelledAt, portoneData);
    }

    throw new BadRequestException('지원하지 않는 결제 상태입니다.');
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

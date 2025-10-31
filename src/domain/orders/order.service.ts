import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { OrderStatus } from '@prisma/client';

import { CART_ITEM_REPOSITORY, type ICartItemRepository } from '@/domain/cart/cart-item.repository';

import { NewOrder } from './new-order';
import { NewOrderItem } from './new-order-item';
import { Order } from './order';
import { ORDER_REPOSITORY, type IOrderRepository, type OrderFilter, type OrderListResult } from './order.repository';

@Injectable()
export class OrderService {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    @Inject(CART_ITEM_REPOSITORY)
    private readonly cartItemRepository: ICartItemRepository,
  ) {}

  async createOrder(userId: string): Promise<Order> {
    // 장바구니 아이템 조회
    const cartItems = await this.cartItemRepository.findAllByUserId(userId);

    if (cartItems.length === 0) {
      throw new BadRequestException('장바구니가 비어있습니다.');
    }

    // 장바구니 아이템들을 OrderItem으로 변환 (스냅샷)
    const orderItems = cartItems.map((cartItem) => {
      if (!cartItem.course) {
        throw new Error('Cart item must include course information');
      }

      return new NewOrderItem(
        cartItem.course.id,
        cartItem.course.title,
        cartItem.course.slug,
        cartItem.course.thumbnailUrl,
        cartItem.course.price,
      );
    });

    // 총 금액 계산
    const totalAmount = orderItems.reduce((sum, item) => sum + item.price, 0);

    // 주문 생성
    const newOrder = new NewOrder(userId, totalAmount, orderItems);
    const order = await this.orderRepository.save(newOrder);

    // 장바구니 비우기
    await Promise.all(cartItems.map((item) => this.cartItemRepository.delete(userId, item.courseId)));

    return order;
  }

  async getOrderById(userId: string, orderId: string): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new NotFoundException('주문을 찾을 수 없습니다.');
    }

    // 본인의 주문만 조회 가능
    if (order.userId !== userId) {
      throw new ForbiddenException('다른 사용자의 주문은 조회할 수 없습니다.');
    }

    return order;
  }

  async getOrders(userId: string, page: number, pageSize: number, filter?: OrderFilter): Promise<OrderListResult> {
    return await this.orderRepository.findAllByUserId(userId, page, pageSize, filter);
  }

  async cancelOrder(userId: string, orderId: string): Promise<void> {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new NotFoundException('주문을 찾을 수 없습니다.');
    }

    // 본인의 주문만 취소 가능
    if (order.userId !== userId) {
      throw new ForbiddenException('다른 사용자의 주문은 취소할 수 없습니다.');
    }

    // PENDING 상태일 때만 취소 가능
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('결제 대기 중인 주문만 취소할 수 있습니다.');
    }

    await this.orderRepository.cancel(orderId);
  }
}

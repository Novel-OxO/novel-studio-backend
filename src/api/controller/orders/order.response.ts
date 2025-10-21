import { ApiProperty } from '@nestjs/swagger';

import { OrderStatus } from '@prisma/client';

import { Order } from '@/domain/orders/order';
import { OrderItem } from '@/domain/orders/order-item';

export class OrderItemResponse {
  @ApiProperty({
    description: '주문 아이템 ID',
    example: 'clx1234567890',
  })
  id: string;

  @ApiProperty({
    description: '코스 ID',
    example: 'clx0987654321',
  })
  courseId: string;

  @ApiProperty({
    description: '코스 제목 (주문 시점)',
    example: 'NestJS 완벽 가이드',
  })
  courseTitle: string;

  @ApiProperty({
    description: '코스 슬러그 (주문 시점)',
    example: 'nestjs-fundamentals',
  })
  courseSlug: string;

  @ApiProperty({
    description: '코스 썸네일 (주문 시점)',
    example: 'https://example.com/thumbnail.jpg',
    nullable: true,
  })
  courseThumbnail: string | null;

  @ApiProperty({
    description: '가격 (주문 시점)',
    example: 50000,
  })
  price: number;

  @ApiProperty({
    description: '생성 시각',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  static from(orderItem: OrderItem): OrderItemResponse {
    const response = new OrderItemResponse();
    response.id = orderItem.id;
    response.courseId = orderItem.courseId;
    response.courseTitle = orderItem.courseTitle;
    response.courseSlug = orderItem.courseSlug;
    response.courseThumbnail = orderItem.courseThumbnail;
    response.price = orderItem.price;
    response.createdAt = orderItem.createdAt;
    return response;
  }
}

export class OrderResponse {
  @ApiProperty({
    description: '주문 ID',
    example: 'clx1234567890',
  })
  id: string;

  @ApiProperty({
    description: '사용자 ID',
    example: 'usr_1234567890',
  })
  userId: string;

  @ApiProperty({
    description: '총 주문 금액',
    example: 150000,
  })
  totalPrice: number;

  @ApiProperty({
    description: '주문 상태',
    enum: OrderStatus,
    example: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @ApiProperty({
    description: '주문 아이템 목록',
    type: [OrderItemResponse],
  })
  orderItems: OrderItemResponse[];

  @ApiProperty({
    description: '주문 생성 시각',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '주문 수정 시각',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  static from(order: Order): OrderResponse {
    const response = new OrderResponse();
    response.id = order.id;
    response.userId = order.userId;
    response.totalPrice = order.totalPrice;
    response.status = order.status;
    response.orderItems = order.orderItems.map((item) => OrderItemResponse.from(item));
    response.createdAt = order.createdAt;
    response.updatedAt = order.updatedAt;
    return response;
  }
}

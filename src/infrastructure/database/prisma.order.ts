import { Injectable } from '@nestjs/common';

import { OrderStatus } from '@prisma/client';

import { NewOrder } from '@/domain/orders/new-order';
import { Order } from '@/domain/orders/order';
import { OrderItem } from '@/domain/orders/order-item';
import { type IOrderRepository, type OrderFilter, type OrderListResult } from '@/domain/orders/order.repository';

import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaOrderRepository implements IOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(newOrder: NewOrder): Promise<Order> {
    const createdOrder = await this.prisma.order.create({
      data: {
        userId: newOrder.userId,
        totalPrice: newOrder.totalPrice,
        status: OrderStatus.PENDING,
        orderItems: {
          create: newOrder.orderItems.map((item) => ({
            courseId: item.courseId,
            courseTitle: item.courseTitle,
            courseSlug: item.courseSlug,
            courseThumbnail: item.courseThumbnail,
            price: item.price,
          })),
        },
      },
      include: {
        orderItems: true,
      },
    });

    const orderItems = createdOrder.orderItems.map(
      (item) =>
        new OrderItem(
          item.id,
          item.orderId,
          item.courseId,
          item.courseTitle,
          item.courseSlug,
          item.courseThumbnail,
          item.price,
          item.createdAt,
        ),
    );

    return new Order(
      createdOrder.id,
      createdOrder.userId,
      createdOrder.totalPrice,
      createdOrder.status,
      orderItems,
      createdOrder.createdAt,
      createdOrder.updatedAt,
    );
  }

  async findById(id: string): Promise<Order | null> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!order) {
      return null;
    }

    const orderItems = order.orderItems.map(
      (item) =>
        new OrderItem(
          item.id,
          item.orderId,
          item.courseId,
          item.courseTitle,
          item.courseSlug,
          item.courseThumbnail,
          item.price,
          item.createdAt,
        ),
    );

    return new Order(
      order.id,
      order.userId,
      order.totalPrice,
      order.status,
      orderItems,
      order.createdAt,
      order.updatedAt,
    );
  }

  async findAllByUserId(
    userId: string,
    page: number,
    pageSize: number,
    filter?: OrderFilter,
  ): Promise<OrderListResult> {
    const skip = (page - 1) * pageSize;

    const where = {
      userId,
      ...(filter?.status && { status: filter.status }),
    };

    const [orders, totalCount] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          orderItems: {
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: pageSize,
      }),
      this.prisma.order.count({ where }),
    ]);

    const ordersWithItems = orders.map((order) => {
      const orderItems = order.orderItems.map(
        (item) =>
          new OrderItem(
            item.id,
            item.orderId,
            item.courseId,
            item.courseTitle,
            item.courseSlug,
            item.courseThumbnail,
            item.price,
            item.createdAt,
          ),
      );

      return new Order(
        order.id,
        order.userId,
        order.totalPrice,
        order.status,
        orderItems,
        order.createdAt,
        order.updatedAt,
      );
    });

    return {
      orders: ordersWithItems,
      totalCount,
    };
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: { status },
      include: {
        orderItems: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    const orderItems = updatedOrder.orderItems.map(
      (item) =>
        new OrderItem(
          item.id,
          item.orderId,
          item.courseId,
          item.courseTitle,
          item.courseSlug,
          item.courseThumbnail,
          item.price,
          item.createdAt,
        ),
    );

    return new Order(
      updatedOrder.id,
      updatedOrder.userId,
      updatedOrder.totalPrice,
      updatedOrder.status,
      orderItems,
      updatedOrder.createdAt,
      updatedOrder.updatedAt,
    );
  }

  async cancel(id: string): Promise<void> {
    await this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.CANCELLED },
    });
  }
}

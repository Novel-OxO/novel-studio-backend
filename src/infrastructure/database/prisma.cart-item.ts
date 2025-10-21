import { Injectable } from '@nestjs/common';

import { CartItem } from '@/domain/cart/cart-item';
import { ICartItemRepository } from '@/domain/cart/cart-item.repository';
import { NewCartItem } from '@/domain/cart/new-cart-item';
import { Course } from '@/domain/courses/course';
import { User, UserRole } from '@/domain/users/user';

import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaCartItemRepository implements ICartItemRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(newCartItem: NewCartItem): Promise<CartItem> {
    const createdCartItem = await this.prisma.cartItem.create({
      data: {
        userId: newCartItem.userId,
        courseId: newCartItem.courseId,
      },
    });

    return new CartItem(
      createdCartItem.id,
      createdCartItem.userId,
      createdCartItem.courseId,
      createdCartItem.createdAt,
      createdCartItem.updatedAt,
    );
  }

  async delete(userId: string, courseId: string): Promise<void> {
    await this.prisma.cartItem.deleteMany({
      where: {
        userId,
        courseId,
      },
    });
  }

  async findByUserAndCourse(userId: string, courseId: string): Promise<CartItem | null> {
    const cartItem = await this.prisma.cartItem.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (!cartItem) {
      return null;
    }

    return new CartItem(cartItem.id, cartItem.userId, cartItem.courseId, cartItem.createdAt, cartItem.updatedAt);
  }

  async findAllByUserId(userId: string): Promise<CartItem[]> {
    const cartItems = await this.prisma.cartItem.findMany({
      where: {
        userId,
      },
      include: {
        course: {
          include: {
            instructor: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return cartItems.map((item) => {
      const instructor = new User(
        item.course.instructor.id,
        item.course.instructor.email,
        item.course.instructor.hashedPassword,
        item.course.instructor.nickname,
        item.course.instructor.profileImageUrl,
        item.course.instructor.role as UserRole,
        item.course.instructor.createdAt,
        item.course.instructor.updatedAt,
        item.course.instructor.deletedAt,
      );

      const course = new Course(
        item.course.id,
        item.course.slug,
        item.course.title,
        item.course.description,
        instructor,
        item.course.thumbnailUrl,
        item.course.price,
        item.course.level,
        item.course.status,
        item.course.createdAt,
        item.course.updatedAt,
        item.course.deletedAt,
      );

      return new CartItem(item.id, item.userId, item.courseId, item.createdAt, item.updatedAt, undefined, course);
    });
  }
}

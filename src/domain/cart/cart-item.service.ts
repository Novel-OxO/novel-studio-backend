import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { COURSE_REPOSITORY, type ICourseRepository } from '@/domain/courses/course.repository';

import { CartItem } from './cart-item';
import { CART_ITEM_REPOSITORY, type ICartItemRepository } from './cart-item.repository';
import { NewCartItem } from './new-cart-item';

@Injectable()
export class CartItemService {
  constructor(
    @Inject(CART_ITEM_REPOSITORY)
    private readonly cartItemRepository: ICartItemRepository,
    @Inject(COURSE_REPOSITORY)
    private readonly courseRepository: ICourseRepository,
  ) {}

  async addToCart(userId: string, courseId: string): Promise<CartItem> {
    // 코스 존재 여부 확인
    const course = await this.courseRepository.findById(courseId);
    if (!course) {
      throw new NotFoundException('코스를 찾을 수 없습니다.');
    }

    // 이미 장바구니에 있는지 확인
    const existingCartItem = await this.cartItemRepository.findByUserAndCourse(userId, courseId);
    if (existingCartItem) {
      throw new ConflictException('이미 장바구니에 담긴 코스입니다.');
    }

    const newCartItem = new NewCartItem(userId, courseId);
    return await this.cartItemRepository.save(newCartItem);
  }

  async removeFromCart(userId: string, courseId: string): Promise<void> {
    // 장바구니 아이템 존재 여부 확인
    const cartItem = await this.cartItemRepository.findByUserAndCourse(userId, courseId);
    if (!cartItem) {
      throw new NotFoundException('장바구니에 해당 코스가 없습니다.');
    }

    await this.cartItemRepository.delete(userId, courseId);
  }

  async getCartItems(userId: string): Promise<CartItem[]> {
    return await this.cartItemRepository.findAllByUserId(userId);
  }
}

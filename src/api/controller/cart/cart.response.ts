import { ApiProperty } from '@nestjs/swagger';

import { CourseResponse } from '@/api/controller/courses/course.response';

import { CartItem } from '@/domain/cart/cart-item';

export class CartItemResponse {
  @ApiProperty({
    description: '장바구니 아이템 ID',
    example: 'clx1234567890',
  })
  id: string;

  @ApiProperty({
    description: '사용자 ID',
    example: 'usr_1234567890',
  })
  userId: string;

  @ApiProperty({
    description: '코스 ID',
    example: 'clx0987654321',
  })
  courseId: string;

  @ApiProperty({
    description: '코스 정보 (조회 옵션에 따라 포함)',
    type: CourseResponse,
    required: false,
  })
  course?: CourseResponse;

  @ApiProperty({
    description: '장바구니에 추가된 시각',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '마지막 수정 시각',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  static from(cartItem: CartItem): CartItemResponse {
    const response = new CartItemResponse();
    response.id = cartItem.id;
    response.userId = cartItem.userId;
    response.courseId = cartItem.courseId;
    response.createdAt = cartItem.createdAt;
    response.updatedAt = cartItem.updatedAt;

    if (cartItem.course) {
      response.course = new CourseResponse(
        cartItem.course.id,
        cartItem.course.slug,
        cartItem.course.title,
        cartItem.course.description,
        cartItem.course.thumbnailUrl,
        cartItem.course.price,
        cartItem.course.level,
        cartItem.course.status,
        cartItem.course.createdAt,
      );
    }

    return response;
  }
}

import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AccessTokenGuard } from '@/api/controller/auth/access-token.guard';
import { CurrentUser, type CurrentUserPayload } from '@/api/controller/auth/current-user.decorator';
import { createSuccessResponse, type SuccessResponse } from '@/api/support/response';

import { CartItemService } from '@/domain/cart/cart-item.service';

import { AddToCartRequest } from './cart.request';
import { CartItemResponse } from './cart.response';

@ApiTags('cart')
@Controller('cart')
@UseGuards(AccessTokenGuard)
@ApiBearerAuth()
export class CartController {
  constructor(private readonly cartItemService: CartItemService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '장바구니에 코스 추가' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '장바구니에 코스 추가 성공',
    type: CartItemResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '코스를 찾을 수 없음',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: '이미 장바구니에 담긴 코스',
  })
  async addToCart(
    @CurrentUser() user: CurrentUserPayload,
    @Body() request: AddToCartRequest,
  ): Promise<SuccessResponse<CartItemResponse>> {
    const cartItem = await this.cartItemService.addToCart(user.userId, request.courseId);
    return createSuccessResponse(CartItemResponse.from(cartItem));
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '장바구니 목록 조회' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '장바구니 목록 조회 성공',
    type: [CartItemResponse],
  })
  async getCartItems(@CurrentUser() user: CurrentUserPayload): Promise<SuccessResponse<CartItemResponse[]>> {
    const cartItems = await this.cartItemService.getCartItems(user.userId);
    return createSuccessResponse(cartItems.map((item) => CartItemResponse.from(item)));
  }

  @Delete(':courseId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '장바구니에서 코스 제거' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: '장바구니에서 코스 제거 성공',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '장바구니에 해당 코스가 없음',
  })
  async removeFromCart(@CurrentUser() user: CurrentUserPayload, @Param('courseId') courseId: string): Promise<void> {
    await this.cartItemService.removeFromCart(user.userId, courseId);
  }
}

import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AccessTokenGuard } from '@/api/controller/auth/access-token.guard';
import { CurrentUser, type CurrentUserPayload } from '@/api/controller/auth/current-user.decorator';
import {
  createPaginatedResponse,
  createSuccessResponse,
  type PaginatedResponse,
  type SuccessResponse,
} from '@/api/support/response';

import { OrderService } from '@/domain/orders/order.service';

import { GetOrdersRequest } from './order.request';
import { OrderResponse } from './order.response';

@ApiTags('orders')
@Controller('orders')
@UseGuards(AccessTokenGuard)
@ApiBearerAuth()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '주문 생성 (장바구니 기반)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '주문 생성 성공',
    type: OrderResponse,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '장바구니가 비어있음',
  })
  async createOrder(@CurrentUser() user: CurrentUserPayload): Promise<SuccessResponse<OrderResponse>> {
    const order = await this.orderService.createOrder(user.userId);
    return createSuccessResponse(OrderResponse.from(order));
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '주문 목록 조회' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '주문 목록 조회 성공',
    type: [OrderResponse],
  })
  async getOrders(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: GetOrdersRequest,
  ): Promise<PaginatedResponse<OrderResponse>> {
    const { page = 1, pageSize = 10, status } = query;

    const result = await this.orderService.getOrders(user.userId, page, pageSize, status ? { status } : undefined);

    return createPaginatedResponse(
      result.orders.map((order) => OrderResponse.from(order)),
      result.totalCount,
      page,
      pageSize,
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '주문 상세 조회' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '주문 상세 조회 성공',
    type: OrderResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '주문을 찾을 수 없음',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: '다른 사용자의 주문',
  })
  async getOrderById(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') orderId: string,
  ): Promise<SuccessResponse<OrderResponse>> {
    const order = await this.orderService.getOrderById(user.userId, orderId);
    return createSuccessResponse(OrderResponse.from(order));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '주문 취소' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: '주문 취소 성공',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '주문을 찾을 수 없음',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'PENDING 상태가 아닌 주문',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: '다른 사용자의 주문',
  })
  async cancelOrder(@CurrentUser() user: CurrentUserPayload, @Param('id') orderId: string): Promise<void> {
    await this.orderService.cancelOrder(user.userId, orderId);
  }
}

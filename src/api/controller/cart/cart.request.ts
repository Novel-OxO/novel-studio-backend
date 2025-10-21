import { IsNotEmpty, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class AddToCartRequest {
  @ApiProperty({
    description: '장바구니에 추가할 코스 ID',
    example: 'clx1234567890',
  })
  @IsString()
  @IsNotEmpty()
  courseId: string;
}

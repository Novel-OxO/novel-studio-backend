import { IsBoolean, IsNotEmpty, IsNumber, IsString, IsUUID, Min } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

/**
 * 수강 진행률 업데이트 요청
 */
export class UpdateProgressRequest {
  @ApiProperty({
    description: '강의 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty({ message: 'lectureId는 필수입니다.' })
  @IsUUID('4', { message: 'lectureId는 유효한 UUID여야 합니다.' })
  @IsString({ message: 'lectureId는 문자열이어야 합니다.' })
  lectureId!: string;

  @ApiProperty({
    description: '시청 시간 (초 단위)',
    example: 120,
    minimum: 0,
  })
  @IsNotEmpty({ message: 'watchTime은 필수입니다.' })
  @IsNumber({}, { message: 'watchTime은 숫자여야 합니다.' })
  @Min(0, { message: 'watchTime은 0 이상이어야 합니다.' })
  watchTime!: number;

  @ApiProperty({
    description: '완료 여부',
    example: false,
  })
  @IsNotEmpty({ message: 'isCompleted는 필수입니다.' })
  @IsBoolean({ message: 'isCompleted는 boolean이어야 합니다.' })
  isCompleted!: boolean;
}

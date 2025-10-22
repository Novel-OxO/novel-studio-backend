import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AccessTokenGuard } from '@/api/controller/auth/access-token.guard';
import { CurrentUser, type CurrentUserPayload } from '@/api/controller/auth/current-user.decorator';
import { createSuccessResponse, type SuccessResponse } from '@/api/support/response';

import { MediaService } from '@/domain/media/media.service';

import { GeneratePresignedUrlDto } from './dto/generate-presigned-url.dto';
import { PresignedUrlResponse } from './media.response';

@ApiTags('media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('presigned-url')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Presigned URL 생성' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Presigned URL 생성 성공' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음 (관리자만 가능)' })
  async generatePresignedUrl(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: GeneratePresignedUrlDto,
  ): Promise<SuccessResponse<PresignedUrlResponse>> {
    const { presignedUrl, key, cloudFrontUrl } = await this.mediaService.generatePresignedUrl(
      user.userId,
      dto.fileName,
    );

    return createSuccessResponse(PresignedUrlResponse.create(presignedUrl, key, cloudFrontUrl));
  }
}

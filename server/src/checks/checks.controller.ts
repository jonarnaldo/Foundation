import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards, HttpCode,
  UseInterceptors, UploadedFile,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ChecksService } from './checks.service'
import { OcrService } from './ocr.service'

@ApiTags('checks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('checks')
export class ChecksController {
  constructor(
    private readonly svc: ChecksService,
    private readonly ocr: OcrService,
  ) {}

  @Post('ocr')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('image', { storage: undefined }))
  extractCheckOcr(@UploadedFile() file: Express.Multer.File) {
    return this.ocr.extractCheckFields(file)
  }

  @Post()
  @HttpCode(201)
  create(
    @Body() body: {
      projectId: string
      milestoneId: string
      checkNumber?: string
      amountCents: number
      payorName: string
      memoLine?: string
    },
    @Req() req: { user: { sub: string } },
  ) {
    return this.svc.create(body, req.user.sub)
  }

  @Get()
  findAll(
    @Query('projectId') projectId: string,
    @Query('status') status?: string,
  ) {
    return this.svc.findAll(projectId, status)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.svc.update(id, body as never)
  }

  @Delete(':id')
  @HttpCode(200)
  remove(@Param('id') id: string) {
    return this.svc.remove(id)
  }
}

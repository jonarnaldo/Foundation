import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ProjectsService } from './projects.service'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly svc: ProjectsService) {}

  @Get()
  findAll(@Req() req: { user: { sub: string } }) {
    return this.svc.findAll(req.user.sub)
  }

  @Post()
  create(@Req() req: { user: { sub: string } }, @Body() body: Record<string, unknown>) {
    return this.svc.create(req.user.sub, body as never)
  }

  @Get(':id')
  findOne(@Req() req: { user: { sub: string } }, @Param('id') id: string) {
    return this.svc.findOne(id, req.user.sub)
  }

  @Put(':id')
  update(@Req() req: { user: { sub: string } }, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.svc.update(id, req.user.sub, body as never)
  }

  @Delete(':id')
  remove(@Req() req: { user: { sub: string } }, @Param('id') id: string) {
    return this.svc.remove(id, req.user.sub)
  }

  @Get(':id/summary')
  getSummary(@Req() req: { user: { sub: string } }, @Param('id') id: string) {
    return this.svc.getSummary(id, req.user.sub)
  }
}

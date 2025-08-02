import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('test-protected')
  @UseGuards(JwtAuthGuard)
  getProtected(@Request() req) {
    return { message: 'This is a protected endpoint', user: req.user };
  }
}

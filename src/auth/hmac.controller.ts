import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { HmacGuard } from './hmac.guard';

@Controller('hmac-test')
export class HmacController {
  @Get('protected')
  @UseGuards(HmacGuard)
  getProtected(@Request() req) {
    return {
      message: 'HMAC Authentication Successful!',
      user: {
        name: req.user.name,
        email: req.user.email,
      },
    };
  }

  @Post('protected-post')
  @UseGuards(HmacGuard)
  postProtected(@Request() req, @Body() body: any) {
    return {
      message: 'HMAC Authentication Successful for POST!',
      receivedBody: body,
      user: {
        name: req.user.name,
        email: req.user.email,
      },
    };
  }
}

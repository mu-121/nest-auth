import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User, UserSchema } from './schemas/user.schema';
import { HmacController } from './hmac.controller';
import { HmacGuard } from './hmac.guard';
import { EmailService } from './email.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [AuthService, HmacGuard, EmailService],
  controllers: [AuthController, HmacController],
  exports: [AuthService],
})
export class AuthModule {}
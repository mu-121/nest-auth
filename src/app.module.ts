import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UploadModule } from './upload/upload.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    MongooseModule.forRoot(
      'mongodb+srv://usman:Usman%40123@cluster0.jyo22pp.mongodb.net/nestAuth',
    ),

    AuthModule,

    UploadModule,
    

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

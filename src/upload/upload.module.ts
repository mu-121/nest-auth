import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        cloudinary.config({
          cloud_name: configService.get('CLOUDINARY_CLOUD_NAME'),
          api_key: configService.get('CLOUDINARY_API_KEY'),
          api_secret: configService.get('CLOUDINARY_API_SECRET'),
        });

        return {
          storage: new CloudinaryStorage({
            cloudinary: cloudinary,
            params: {
              folder: 'uploads',
              allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'gif'],
            } as any,
          }),
        };
      },
    }),
  ],
  controllers: [UploadController],
})
export class UploadModule {}
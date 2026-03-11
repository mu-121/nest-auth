import {
  Controller,
  Post,
  Get,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { v2 as cloudinary } from 'cloudinary';

@Controller('upload')
export class UploadController {

  // ================= SINGLE FILE UPLOAD =================
  @Post('single')
  @UseInterceptors(FileInterceptor('file'))
  uploadSingle(@UploadedFile() file: Express.Multer.File) {
    return {
      message: 'Single file uploaded successfully',
      filename: file.originalname,
      url: file.path,        // Cloudinary URL
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  // ================= MULTIPLE FILES UPLOAD =================
  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files', 5))
  uploadMultiple(@UploadedFiles() files: Express.Multer.File[]) {
    return {
      message: 'Multiple files uploaded successfully',
      count: files.length,
      files: files.map((file) => ({
        filename: file.originalname,
        url: file.path,      // Cloudinary URL
        size: file.size,
        mimetype: file.mimetype,
      })),
    };
  }

  // ================= GET FILES FROM CLOUDINARY =================
  @Get('cloudinary')
  async getFilesFromCloudinary() {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'uploads', // folder name in Cloudinary
      max_results: 20,
    });

    return {
      count: result.resources.length,
      files: result.resources.map((file) => ({
        public_id: file.public_id,
        url: file.secure_url,
        format: file.format,
        size: file.bytes,
        created_at: file.created_at,
      })),
    };
  }
}
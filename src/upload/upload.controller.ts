import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';

@Controller('upload')
export class UploadController {

  // ================= Single File Upload =================
  @Post('single')
  @UseInterceptors(FileInterceptor('file'))
  uploadSingle(@UploadedFile() file: Express.Multer.File) {
    return {
      message: 'Single file uploaded successfully',
      filename: file.filename,
      path: file.path,
    };
  }

  // ================= Multiple Files Upload =================
  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files', 5))
  uploadMultiple(@UploadedFiles() files: Express.Multer.File[]) {
    return {
      message: 'Multiple files uploaded successfully',
      count: files.length,
      files: files.map((file) => ({
        filename: file.filename,
        path: file.path,
      })),
    };
  }
}
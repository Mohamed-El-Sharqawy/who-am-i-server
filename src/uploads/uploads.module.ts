import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@Module({
  imports: [
    CloudinaryModule,
    MulterModule.register({
      storage: memoryStorage(),
    }),
  ],
  controllers: [UploadsController],
})
export class UploadsModule {}

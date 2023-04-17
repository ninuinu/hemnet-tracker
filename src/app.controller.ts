import { Controller, Get, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AppService } from './app.service';
import { S3Service } from './services/s3.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly s3Service: S3Service) {}

  @Get('scrape')
  async getListings(@Query('location_ids') location: string) {
    return this.appService.getListings(location);
  }

  @Post('uploadImage')
  async uploadImage(@Query('url') url: string, @Query('key') key: string){
    return this.s3Service.uploadImage(url, key);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    console.log(file);
  }

}

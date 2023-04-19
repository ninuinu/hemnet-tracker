import { Controller, Get, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AppService } from './app.service';
import { S3Service } from './services/s3.service';
import { ScrapingService } from './services/scraping.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly s3Service: S3Service, private readonly scrapingService: ScrapingService) {}

  @Get('scrape')
  async getListings(@Query('location_ids') location: string) {
    return this.scrapingService.scrapeListings(location);
  }

  @Post('uploadImage')
  async uploadImage(@Query('url') url: string){
    return this.s3Service.uploadImage(url);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    console.log(file);
  }

}

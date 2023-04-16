import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { S3Service } from './services/s3.service';
import { ScrapingService } from './services/scraping.service';


@Module({
  imports: [ConfigModule.forRoot(), HttpModule],
  controllers: [AppController],
  providers: [AppService, S3Service, ScrapingService],
})
export class AppModule {}

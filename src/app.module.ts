import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { S3Service } from './services/s3.service';
import { ScrapingService } from './services/scraping.service';
import { ListingModule } from './listing/listing.module';


@Module({
  imports: [ConfigModule.forRoot(), ListingModule],
  providers: [S3Service, ScrapingService],
})
export class AppModule {}

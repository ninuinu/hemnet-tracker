import { Module } from '@nestjs/common';
import { ListingService } from './services/listing.service';
import { ListingController } from './controllers/listing.controller';
import { BucketModule } from 'src/bucket/bucket.module';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [BucketModule, PrismaModule, HttpModule],
  controllers: [ListingController],
  providers: [ListingService],
  exports: [ListingService]
})
export class ListingModule {}

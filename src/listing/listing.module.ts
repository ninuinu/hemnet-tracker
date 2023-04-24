import { Module } from '@nestjs/common';
import { ListingService } from './services/listing.service';
import { ListingController } from './controllers/listing.controller';

@Module({
  controllers: [ListingController],
  providers: [ListingService]
})
export class ListingModule {}

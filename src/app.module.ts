import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ListingModule } from './listing/listing.module';
import { BucketModule } from './bucket/bucket.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ListingModule,
    BucketModule,
    DatabaseModule,
  ],
})
export class AppModule {}

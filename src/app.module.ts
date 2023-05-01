import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ListingModule } from './listing/listing.module';
import { BucketModule } from './bucket/bucket.module';
import { PrismaModule } from './prisma/prisma.module';


@Module({
  imports: [ConfigModule.forRoot(), ListingModule, BucketModule, PrismaModule],
})
export class AppModule {}

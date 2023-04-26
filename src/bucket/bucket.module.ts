import { Module } from '@nestjs/common';
import { BucketService } from './bucket.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot()],
  providers: [BucketService],
  exports: [BucketService]
})
export class BucketModule {}

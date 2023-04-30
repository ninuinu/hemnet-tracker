import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';
import { ClientConfiguration } from 'aws-sdk/clients/acm';
import { PutObjectRequest } from 'aws-sdk/clients/s3';
import axios from 'axios';
import { createHash } from "crypto";

@Injectable()
export class BucketService {
  private readonly s3: S3;
  private readonly bucketName: string;
  private readonly accessKey: string;
  private readonly region: string;
  private readonly secretAccessKey: string;

  constructor(private configService: ConfigService) {
    this.bucketName = configService.get<string>('AWS_S3_BUCKET_NAME');
    this.accessKey = configService.get<string>('AWS_ACCESS_KEY_ID');
    this.region = configService.get<string>('AWS_REGION');
    this.secretAccessKey = configService.get<string>('AWS_SECRET_ACCESS_KEY');

    const s3Config: ClientConfiguration = {
      params: {
        region: this.region,
        bucketName: this.bucketName,
        accessKey: this.accessKey,
        secretAccessKey: this.secretAccessKey,
      },
    };
    this.s3 = new S3(s3Config);
  }

  async uploadImages(listings){
    for(const listing of listings){
      const key = this.generateKey(listing.image);
      listing["imageKey"] = key;
      this.uploadImage(listing);
    }
  }

  generateKey(url: string){
    const saltRounds = 10;
    const key = Date.now() + url;
    const hashedKey = createHash('shake256', { outputLength: 8 }).update(key).digest("hex");
    return hashedKey;
  }

  async uploadImage(listing: any) {
    try {
        const res = await axios.get(listing.image, { responseType: 'arraybuffer' });

        
        const body: Buffer = res.data;

        const params: PutObjectRequest = {
          Bucket: this.bucketName,
          Key: listing.imageKey,
          Body: body,
        };

        await this.s3.putObject(params).promise();

    } catch (error) {
        console.log('Error! ', error);
    }
  }
}

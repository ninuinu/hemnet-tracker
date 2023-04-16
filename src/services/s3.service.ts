import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';

@Injectable()
export class S3Service {
  private readonly s3: S3;
  private readonly bucketName: string;

  constructor(private configService: ConfigService) {
    this.bucketName = configService.get<string>('S3_BUCKET_NAME');
    const region = configService.get<string>('AWS_REGION');

    this.s3 = new S3({ region });
  }

  async uploadImage(key: string, data: Buffer): Promise<void> {
  
    const params: S3.PutObjectRequest = {
      Bucket: this.bucketName,
      Key: key,
      Body: data,
    };

    try {
      await this.s3.putObject(params).promise();
      console.log(`Successfully uploaded ${key} to ${this.bucketName}`);
    } catch (error) {
      console.error('Failed to upload file to S3:', error.message);
    }
  }
}



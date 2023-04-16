import { Injectable } from '@nestjs/common';
import { S3 } from 'aws-sdk';

@Injectable()
export class S3Provider {
  private readonly s3: S3;

  constructor() {
    this.s3 = new S3();
  }

  async uploadImage(key: string, data: Buffer): Promise<void> {
  
    const bucketName = '';

    const params: S3.PutObjectRequest = {
      Bucket: bucketName,
      Key: key,
      Body: data,
    };

    try {
      await this.s3.putObject(params).promise();
      console.log(`Successfully uploaded ${key} to ${bucketName}`);
    } catch (error) {
      console.error('Failed to upload file to S3:', error.message);
    }
  }
}



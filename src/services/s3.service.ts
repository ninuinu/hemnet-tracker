import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';
import { ClientConfiguration } from 'aws-sdk/clients/acm';

@Injectable()
export class S3Service {
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

    const awsConfig: ClientConfiguration = {
      params: {
        region: this.region,
        bucketName: this.bucketName,
        accessKey: this.accessKey,
        secretAccessKey: this.secretAccessKey,
      }
    }
    this.s3 = new S3(awsConfig);
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



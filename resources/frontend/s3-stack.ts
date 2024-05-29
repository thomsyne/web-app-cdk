import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';

export interface S3Resources {
  bucket: s3.Bucket;
  oai: cloudfront.OriginAccessIdentity;
}

export function createS3Resources(scope: Construct, appName: string): S3Resources {
  const bucket = new s3.Bucket(scope, 'WebAppBucket', {
    bucketName: `${appName}`,
    removalPolicy: cdk.RemovalPolicy.DESTROY,
    autoDeleteObjects: true,
    objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
  });

  const oai = new cloudfront.OriginAccessIdentity(scope, 'webAppOAI', {
    comment: `${appName}`,
  });

  bucket.grantRead(oai);

  new cdk.CfnOutput(scope, 'bucketName', {
    value: bucket.bucketName,
    description: 'The name of the s3 bucket',
  });

  return { bucket, oai };
}

import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';
import { S3Resources } from './s3-stack';

export function createCloudFrontDistribution(scope: Construct, s3Resources: S3Resources): cloudfront.Distribution {
  const distribution = new cloudfront.Distribution(scope, 'WebAppDistro', {
    defaultRootObject: 'index.html',
    defaultBehavior: {
      cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
      origin: new origins.S3Origin(s3Resources.bucket, {
        originAccessIdentity: s3Resources.oai,
      }),
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    },
  });

  return distribution;
}

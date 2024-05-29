import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { createS3Resources } from '../resources/frontend/s3-stack';
import { createCloudFrontDistribution } from '../resources/frontend/cloudfront-stack';
import { createECSResources } from '../resources/backend/ecs-stack';
import { createLoadBalancedFargateService } from '../resources/backend/load-balancer-stack';
import { createSecret } from '../resources/backend/secrets-stack';
import { setupAutoScaling } from '../resources/backend/autoscaling-stack';
import { createPostgresResources } from '../resources/database/postgres-stack';
import { createRedisResources } from '../resources/database/redis-stack';

export class WebAppCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const appName = process.env.APP_NAME || 'web-app-tommy-taiwo';

    // Create VPC and Security Group in the main stack
    const vpc = new ec2.Vpc(this, 'VPC', {
      vpcName: appName,
      enableDnsSupport: true,
      enableDnsHostnames: true,
    });

    const securityGroup = new ec2.SecurityGroup(this, 'MySecurityGroup', {
      securityGroupName: appName,
      vpc: vpc,
      allowAllOutbound: true,
    });

    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP access');
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Allow HTTPS access');

    // Frontend Resources
    const s3Resources = createS3Resources(this, appName);
    const cloudFrontDistribution = createCloudFrontDistribution(this, s3Resources);

    // Backend Resources
    const redisResources = createRedisResources(this, vpc, securityGroup);
    const postgresResources = createPostgresResources(this, vpc, securityGroup);
    const secret = createSecret(this);

    const ecsResources = createECSResources(this, vpc, postgresResources.rdsInstance.dbInstanceEndpointAddress, redisResources.redisCluster.attrRedisEndpointAddress, secret);

    const albFargateService = createLoadBalancedFargateService(this, ecsResources.cluster, ecsResources.taskImageRole, secret, vpc, securityGroup, postgresResources.rdsInstance.dbInstanceEndpointAddress, redisResources.redisCluster.attrRedisEndpointAddress);

    setupAutoScaling(this, albFargateService);
  }
}

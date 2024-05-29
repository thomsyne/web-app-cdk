import * as cdk from 'aws-cdk-lib';
import * as redis from 'aws-cdk-lib/aws-elasticache';
import { Construct } from 'constructs';
import { IVpc, SecurityGroup } from 'aws-cdk-lib/aws-ec2';

export interface RedisResources {
  redisCluster: redis.CfnCacheCluster;
}

export function createRedisResources(scope: Construct, vpc: IVpc, securityGroup: SecurityGroup): RedisResources {
  const publicSubnets = vpc.publicSubnets.map((subnet) => subnet.subnetId);

  const redisSubnetGroup = new redis.CfnSubnetGroup(scope, 'RedisSubnetGroup', {
    subnetIds: publicSubnets,
    description: "Subnet group for redis"
  });

  const redisCluster = new redis.CfnCacheCluster(scope, 'RedisCluster', {
    autoMinorVersionUpgrade: true,
    cacheNodeType: 'cache.t4g.small',
    engine: 'redis',
    numCacheNodes: 1,
    cacheSubnetGroupName: redisSubnetGroup.ref,
    clusterName: process.env.REDIS_CLUSTER_NAME || 'redis-cluster',
    vpcSecurityGroupIds: [securityGroup.securityGroupId]
  });

  redisCluster.addDependsOn(redisSubnetGroup);

  return { redisCluster };
}

import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { IVpc, SecurityGroup } from 'aws-cdk-lib/aws-ec2';
import { ISecret } from 'aws-cdk-lib/aws-secretsmanager';

export function createLoadBalancedFargateService(
  scope: Construct,
  cluster: ecs.Cluster,
  taskImageRole: iam.Role,
  secret: ISecret,
  vpc: IVpc,
  securityGroup: SecurityGroup,
  postgresEndpoint: string,
  redisEndpoint: string
): ecs_patterns.ApplicationLoadBalancedFargateService {
  const apiImageForECS = 'amazon/amazon-ecs-sample';

  const albFargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(scope, 'Fargate', {
    serviceName: 'api',
    cluster: cluster,
    cpu: 256,
    desiredCount: 1,
    taskImageOptions: {
      image: ecs.ContainerImage.fromRegistry(apiImageForECS),
      containerPort: 80,
      executionRole: taskImageRole,
      environment: {
        PORT: '80',
        POSTGRES_ENDPOINT: postgresEndpoint,
        REDIS_ENDPOINT: redisEndpoint,
      },
      secrets: {
        TEST_KEY: ecs.Secret.fromSecretsManager(secret, 'TEST_KEY'),
      },
      dockerLabels: {
        "com.datadoghq.ad.check_names": "[\"web\"]",
        "com.datadoghq.ad.init_configs": "[{}]",
        "com.datadoghq.ad.instances": "[{\"host\": \"%%host%%\", \"port\": 8080}]",
        "com.datadoghq.ad.logs": "[{\\\"source\\\": \\\"ecs\\\", \\\"service\\\": \\\"api\\\"}]"
      },
    },
    memoryLimitMiB: 512,
    publicLoadBalancer: true,
    redirectHTTP: false,
    securityGroups: [securityGroup],
  });

  albFargateService.targetGroup.configureHealthCheck({
    path: '/',
    healthyHttpCodes: '200-299',
    timeout: cdk.Duration.seconds(60),
    interval: cdk.Duration.seconds(120),
    port: '80',
  });

  albFargateService.loadBalancer.addSecurityGroup(securityGroup);

  const cfnLoadBalancer = albFargateService.loadBalancer.node.defaultChild as cdk.aws_elasticloadbalancingv2.CfnLoadBalancer;
  cfnLoadBalancer.securityGroups = [securityGroup.securityGroupId];
  cfnLoadBalancer.subnets = vpc.selectSubnets({ onePerAz: true, subnetType: cdk.aws_ec2.SubnetType.PUBLIC }).subnetIds;

  new cdk.CfnOutput(scope, 'fargateServiceName', {
    value: albFargateService.service.serviceName,
    description: 'The name of ECS Fargate Service',
  });

  new cdk.CfnOutput(scope, 'fargateServiceTaskDefARN', {
    value: albFargateService.service.taskDefinition.taskDefinitionArn,
    description: 'The task definition ARN for ECS Fargate Service',
  });

  return albFargateService;
}

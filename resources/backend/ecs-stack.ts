import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { IVpc } from 'aws-cdk-lib/aws-ec2';

export interface ECSResources {
  cluster: ecs.Cluster;
  taskImageRole: iam.Role;
}

export function createECSResources(scope: Construct, vpc: IVpc, postgresEndpoint: string, redisEndpoint: string, secret: cdk.aws_secretsmanager.ISecret): ECSResources {
  const cluster = new ecs.Cluster(scope, 'ECS', {
    clusterName: 'backend-app',
    vpc: vpc,
  });

  const taskImageInlinePolicy = new iam.PolicyDocument({
    statements: [new iam.PolicyStatement({
      actions: [
        'logs:CreateLogStream',
        'logs:PutLogEvents',
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:DescribeImages",
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        'secretsmanager:GetSecretValue',
        'secretsmanager:CreateSecret',
      ],
      resources: ['*'],
    })],
  });

  const taskImageRole = new iam.Role(scope, 'taskImageRole', {
    assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    description: 'Role for Fargate Service Task Image',
    inlinePolicies: {
      "FargateServiceTaskImageInlinePolicy": taskImageInlinePolicy,
    },
  });

  new cdk.CfnOutput(scope, 'clusterName', {
    value: cluster.clusterName,
    description: 'The name of ECS cluster',
  });

  return { cluster, taskImageRole };
}

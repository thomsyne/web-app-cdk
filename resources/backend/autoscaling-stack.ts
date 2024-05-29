import * as cdk from 'aws-cdk-lib';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import { Construct } from 'constructs';
import { Metric } from 'aws-cdk-lib/aws-cloudwatch';

export function setupAutoScaling(scope: Construct, fargateService: ecs_patterns.ApplicationLoadBalancedFargateService) {
  const autoScalingGroup = fargateService.service.autoScaleTaskCount({
    maxCapacity: 4,
    minCapacity: 1,
  });

  autoScalingGroup.scaleOnMetric('CPUUtilization', {
    metric: new Metric({
      namespace: 'AWS/ECS',
      metricName: 'CPUUtilization',
      dimensionsMap: {
        ClusterName: fargateService.cluster.clusterName,
        ServiceName: fargateService.service.serviceName,
      },
      period: cdk.Duration.minutes(1),
    }),
    scalingSteps: [
      { upper: 10, change: -1 },
      { lower: 50, change: +1 },
      { lower: 70, change: +2 },
    ],
    adjustmentType: cdk.aws_autoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
  });
}

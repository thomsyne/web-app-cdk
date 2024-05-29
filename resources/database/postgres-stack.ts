import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface PostgresResources {
  rdsInstance: rds.DatabaseInstance;
}

export function createPostgresResources(scope: Construct, vpc: ec2.IVpc, securityGroup: ec2.SecurityGroup): PostgresResources {
  const databaseName = process.env.POSTGRES_DB || 'postgres';
  const databaseUserName = process.env.POSTGRES_USER || 'postgres';
  const databasePassword = process.env.POSTGRES_PASSWORD || 'postgres';

  const customParameterGroup = new rds.ParameterGroup(scope, 'CustomParameterGroup', {
    engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_16_1 }),
    parameters: {
      "rds.force_ssl": "0"
    },
  });

  const rdsInstance = new rds.DatabaseInstance(scope, "RDSInstance", {
    databaseName: databaseName,
    engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_16_1 }),
    instanceType: ec2.InstanceType.of(
      ec2.InstanceClass.BURSTABLE3,
      ec2.InstanceSize.MEDIUM
    ),
    vpc: vpc,
    vpcSubnets: {
      subnetType: ec2.SubnetType.PUBLIC,
    },
    maxAllocatedStorage: 1000,
    securityGroups: [securityGroup],
    deletionProtection: false,
    multiAz: false,
    removalPolicy: cdk.RemovalPolicy.DESTROY,
    credentials: {
      username: databaseUserName,
      password: cdk.SecretValue.unsafePlainText(databasePassword),
    },
    backupRetention: cdk.Duration.days(7),
    parameterGroup: customParameterGroup
  });

  return { rdsInstance };
}

import * as cdk from 'aws-cdk-lib';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
require('dotenv').config();

export function createSecret(scope: Construct): Secret {
  const secret = new Secret(scope, 'ProductionDBConnectionSecret', {
    secretName: 'api-secrets',
    generateSecretString: {
      secretStringTemplate: JSON.stringify({
        TEST_KEY: process.env.TEST_KEY || 'test-key',
      }),
      generateStringKey: 'api-secrets',
    },
  });

  return secret;
}

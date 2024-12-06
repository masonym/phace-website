#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { CfnUserPoolClient } from 'aws-cdk-lib/aws-cognito';
import * as cdk from 'aws-cdk-lib';

class UpdateCognitoClientStack extends cdk.Stack {
  constructor(scope: App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Update the existing User Pool Client
    const userPoolClient = new cognito.CfnUserPoolClient(this, 'UpdatedUserPoolClient', {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
      clientName: 'phace-admin-client',
      explicitAuthFlows: [
        'ALLOW_USER_PASSWORD_AUTH',
        'ALLOW_REFRESH_TOKEN_AUTH'
      ],
      preventUserExistenceErrors: 'ENABLED',
      accessTokenValidity: 1, // 1 day
      idTokenValidity: 1, // 1 day
      refreshTokenValidity: 30, // 30 days
      tokenValidityUnits: {
        accessToken: 'days',
        idToken: 'days',
        refreshToken: 'days'
      }
    });
  }
}

const app = new App();
new UpdateCognitoClientStack(app, 'UpdateCognitoClientStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-west-2'
  }
});
app.synth();

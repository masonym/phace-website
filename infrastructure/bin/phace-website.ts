#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PhaceStack } from '../lib/phace-stack';

declare const process: {
  env: {
    [key: string]: string | undefined;
    CDK_DEFAULT_ACCOUNT?: string;
    CDK_DEFAULT_REGION?: string;
  };
};

const app = new cdk.App();
const stack = new PhaceStack(app, 'PhaceStack', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION || 'us-west-2',
    },
});
app.synth();

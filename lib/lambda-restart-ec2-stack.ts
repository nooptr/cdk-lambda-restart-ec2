require('dotenv').config();
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import { Rule, RuleTargetInput, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';

export class LambdaRestartEc2Stack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 👇 lambda function definition
    const lambdaFunction = new lambda.Function(this, 'lambda-restart-ec2', {
      runtime: lambda.Runtime.NODEJS_16_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      handler: 'index.main',
      code: lambda.Code.fromAsset(path.join(__dirname, '/../src/lambda-restart-ec2')),
      environment: {
        REGION: cdk.Stack.of(this).region,
        AVAILABILITY_ZONES: JSON.stringify(
          cdk.Stack.of(this).availabilityZones,
        ),
        INSTANCE_IDS: process.env.INSTANCE_IDS ?? '',
      },
    });

    // create a policy statement
    const startStopEC2Policy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'ec2:StartInstances',
        'ec2:StopInstances'
      ],
      resources: ['*'],
    });

    // attach the policy to the function's role
    lambdaFunction.role?.attachInlinePolicy(
      new iam.Policy(this, 'start-stop-ec2', {
        statements: [startStopEC2Policy],
      }),
    );

    // make EventBridge and attach lambda to it
    new Rule(this, 'StopEC2', {
      schedule: Schedule.expression('cron(5 0,6,12,18 * * ? *)'),
      targets: [
        new LambdaFunction(lambdaFunction, {
          event: RuleTargetInput.fromObject({
            actionType: 'stop',
          }),
        }),
      ],
      description: `Stop EC2`,
    });
    new Rule(this, 'StartEC2', {
      schedule: Schedule.expression('cron(20 0,6,12,18 * * ? *)'),
      targets: [
        new LambdaFunction(lambdaFunction, {
          event: RuleTargetInput.fromObject({
            actionType: 'start',
          }),
        }),
      ],
      description: `Start EC2`,
    });
  }
}
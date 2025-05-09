import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda';
import { Rule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { Effect, PolicyStatement, ServicePrincipal } from 'aws-cdk-lib/aws-iam';

export class CdkLambdaEventBridgeStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const lambdaFn = new Function(this, 'EventDemoLambda', {
      runtime: Runtime.NODEJS_22_X,
      handler: 'handler.main',
      code: Code.fromAsset('dist/lambda'),
    });

    const bucket = new Bucket(this, 'EventDemoBucket');

    lambdaFn.addPermission('AllowEventBridgeInvoke', {
      principal: new ServicePrincipal('events.amazonaws.com'),
      action: 'lambda:InvokeFunction',
    });

    lambdaFn.addToRolePolicy(new PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [`${bucket.bucketArn}/*`],
      effect: Effect.ALLOW,
    }));

    const s3Rule = new Rule(this, 'S3PutObjectRule', {
      eventPattern: {
        source: ['aws.s3'],
        detailType: ['Object Created'],
        detail: {
          bucket: { name: [bucket.bucketName] },
        },
      },
    });
    s3Rule.addTarget(new LambdaFunction(lambdaFn));

    const loginRule = new Rule(this, 'ConsoleLoginRule', {
      eventPattern: {
        source: ['aws.signin'],
        detailType: ['AWS Console Sign In via CloudTrail'],
      },
    });
    loginRule.addTarget(new LambdaFunction(lambdaFn));

    const ec2Rule = new Rule(this, 'EC2InstanceChangeRule', {
      eventPattern: {
        source: ['aws.ec2'],
        detailType: ['EC2 Instance State-change Notification'],
        detail: {
          state: ['stopped', 'terminated'],
        },
      },
    });
    ec2Rule.addTarget(new LambdaFunction(lambdaFn));
  }
}

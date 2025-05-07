import { Stack, StackProps, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda';

export class CdkLambdaEventBridgeStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const lambdaFn = new Function(this, 'MyEventLambda', {
      runtime: Runtime.NODEJS_22_X,
      handler: 'handler.main',
      code: Code.fromAsset('lambda'),
    });

    const rule = new Rule(this, 'MyEventBridgeRule', {
      schedule: Schedule.rate(Duration.minutes(5)),
    });

    rule.addTarget(new LambdaFunction(lambdaFn));
  }
}

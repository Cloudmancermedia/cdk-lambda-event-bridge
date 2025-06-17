import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda';
import { Rule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { Instance, InstanceType, InstanceClass, InstanceSize, AmazonLinuxImage, AmazonLinuxGeneration, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Schedule } from 'aws-cdk-lib/aws-events';
import { Alarm, ComparisonOperator, Metric, TreatMissingData } from 'aws-cdk-lib/aws-cloudwatch';
import { Project, LinuxBuildImage, BuildSpec } from 'aws-cdk-lib/aws-codebuild';
import { ServicePrincipal } from 'aws-cdk-lib/aws-iam';

export class CdkLambdaEventBridgeStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Lambda Function
    const lambdaFn = new Function(this, 'EventDemoLambda', {
      runtime: Runtime.NODEJS_22_X,
      handler: 'handler.main',
      code: Code.fromAsset('dist/lambda'),
    });
    // Grant EventBridge permission to invoke the Lambda function
    lambdaFn.addPermission('AllowEventBridgeInvoke', {
      principal: new ServicePrincipal('events.amazonaws.com'),
      action: 'lambda:InvokeFunction',
    });

    // EC2 Instance
    const vpc = Vpc.fromLookup(this, 'DefaultVPC', { isDefault: true });

    new Instance(this, 'DemoInstance', {
      vpc,
      instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MICRO),
      machineImage: new AmazonLinuxImage({
        generation: AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
    });

    // CloudWatch Alarm
    const customMetric = new Metric({
      namespace: 'DemoNamespace',
      metricName: 'DemoErrorCount',
      dimensionsMap: {
        Environment: 'Test'
      },
      period: Duration.minutes(1),
      statistic: 'Sum'
    });

    const demoAlarm = new Alarm(this, 'DemoAlarm', {
      metric: customMetric,
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Triggers when DemoErrorCount > 1'
    });

    // CodeBuild Project
    const codebuildProject = new Project(this, 'DemoCodeBuildProject', {
      projectName: 'EventBridgeCodeBuildDemo',
      environment: {
        buildImage: LinuxBuildImage.STANDARD_7_0,
      },
      buildSpec: BuildSpec.fromObject({
        version: '0.2',
        phases: {
          build: {
            commands: [
              'echo "This is a demo CodeBuild run."',
              'exit 1',  // Fail state
              // 'exit 0',  // Success state
            ]
          }
        }
      })
    });

    // Rule #1: EC2 Instance State Change
    const ec2Rule = new Rule(this, 'EC2InstanceChangeRule', {
      eventPattern: {
        source: ['aws.ec2'],
        detailType: ['EC2 Instance State-change Notification'],
        detail: {
          state: ['stopped', 'running'],
        },
      },
    });
    ec2Rule.addTarget(new LambdaFunction(lambdaFn));

    // Rule #2: CloudWatch Alarm State Change
    const alarmRule = new Rule(this, 'CloudWatchAlarmRule', {
      eventPattern: {
        source: ['aws.cloudwatch'],
        detailType: ['CloudWatch Alarm State Change'],
        detail: {
          state: {
            value: ['ALARM', 'OK']
          },
          alarmName: [demoAlarm.alarmName] 
        }
      }
    });
    alarmRule.addTarget(new LambdaFunction(lambdaFn));

    // Rule #3: CodeBuild Project State Change
    const codeBuildRule = new Rule(this, 'CodeBuildStatusChangeRule', {
      eventPattern: {
        source: ['aws.codebuild'],
        detailType: ['CodeBuild Build State Change'],
        detail: {
          'build-status': ['SUCCEEDED', 'FAILED'],
          'project-name': [codebuildProject.projectName]
        }
      }
    });
    codeBuildRule.addTarget(new LambdaFunction(lambdaFn));

    // Rule #4: Scheduled Cron Job
    const cronRule = new Rule(this, 'ScheduledRule', {
      schedule: Schedule.rate(Duration.minutes(5)),
    });
    cronRule.addTarget(new LambdaFunction(lambdaFn));
  }
}

# EventBridge Lambda Demo (AWS CDK)

This project demonstrates how to use Amazon EventBridge to trigger a Lambda function from multiple sources using the AWS CDK (TypeScript).

## What This Stack Deploys

- A **Lambda function** that logs any incoming EventBridge event
- An **EC2 instance** (free-tier eligible t2.micro) for testing state change events
- A **CloudWatch Alarm** based on a custom metric (easily triggered via CLI)
- A **CodeBuild project** that can succeed or fail on demand
- Four **EventBridge rules**:
  1. **EC2 Instance State Change** — when the instance is stopped or terminated
  2. **CloudWatch Alarm State Change** — fires when the alarm enters `ALARM` or `OK` state
  3. **CodeBuild Build Status** — triggers on `SUCCEEDED` or `FAILED`
  4. **Scheduled Event** — triggers once every minute

## Project Structure

eventbridge-lambda-demo/
├── bin/
│ └── eventbridge-lambda-demo.ts
├── lib/
│ └── eventbridge-lambda-demo-stack.ts
├── lambda/
│ └── handler.ts
├── cdk.json
├── package.json
└── tsconfig.json


## How to Deploy

1. Install dependencies:
```bash
npm install
```
2. Build the lambda function:
```bash
npm run build
```
3. Bootstrap your environment if you haven't already:
```bash
cdk bootstrap
```
4. Deploy the stack:
```bash
cdk deploy
```

## How to Trigger Each Rule

1. EC2 Instance State Change
Go to the EC2 console

Stop or terminate the instance created by CDK

Check CloudWatch Logs for the Lambda output

2. CloudWatch Alarm State Change
A custom metric (DemoNamespace, DemoErrorCount) is created
Alarm triggers when value > 1

Trigger the alarm:
```bash
aws cloudwatch put-metric-data \
  --namespace "DemoNamespace" \
  --metric-name "DemoErrorCount" \
  --dimensions Environment=Test \
  --value 2 
```

Reset the alarm:
```bash
aws cloudwatch put-metric-data \
  --namespace "DemoNamespace" \
  --metric-name "DemoErrorCount" \
  --dimensions Environment=Test \
  --value 0 
```
Alarm will return to OK shortly after metric drops below threshold.

3. CodeBuild Status Change
Start a build manually (project is named EventBridgeCodeBuildDemo):

```bash
aws codebuild start-build --project-name EventBridgeCodeBuildDemo
```
Buildspec includes exit 1 to simulate failure.

Modify the CDK stack if you want to switch to success (exit 0)

4. Scheduled Event (Every 5 Minutes)
Lambda will be triggered once every 5 minutes automatically.

No action required

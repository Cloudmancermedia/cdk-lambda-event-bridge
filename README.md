# EventBridge Lambda Demo (AWS CDK)

This project demonstrates how to use Amazon EventBridge to trigger a Lambda function from multiple sources using the AWS CDK (TypeScript).

## What This Stack Deploys

- A single Lambda function that logs any event it receives
- An S3 bucket
- An EC2 instance (t2.micro - free tier eligible)
- Four EventBridge rules:
  - **S3 PutObject** — triggers when a file is uploaded to the bucket
  - **Console Login** — triggers when someone logs into the AWS Console
  - **EC2 State Change** — triggers when the EC2 instance is stopped or terminated
  - **Scheduled Cron** — triggers every minute

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


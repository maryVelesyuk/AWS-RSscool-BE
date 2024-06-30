import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as s3 from "aws-cdk-lib/aws-s3";
import { LambdaDestination } from "aws-cdk-lib/aws-s3-notifications";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = s3.Bucket.fromBucketName(
      this,
      "ImportServiceBucket",
      "awstask5"
    );

    const importProductsFileFunction = new lambda.Function(
      this,
      "ImportProductsFileFunction",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        environment: {
          PRODUCT_AWS_REGION: 'eu-west-1',
          BUCKET_NAME: bucket.bucketName,
        },
        code: lambda.Code.fromAsset("lambda"),
        handler: "importProductsFile.handler",
      }
    );

    const importFileParserFunction = new lambda.Function(
      this,
      "ImportFileParserFunction",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        environment: {
          PRODUCT_AWS_REGION: 'eu-west-1',
          BUCKET_NAME: bucket.bucketName,
        },
        code: lambda.Code.fromAsset("lambda"),
        handler: "importFileParser.handler",
      }
    );

    bucket.grantReadWrite(importProductsFileFunction);
    bucket.grantReadWrite(importFileParserFunction);

    const api = new apigateway.RestApi(this, "ImportApi", {
      restApiName: "Files Import",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        // allowHeaders: [
        //   "Content-Type",
        //   "X-Amz-Date",
        //   "Authorization",
        //   "X-Api-Key",
        //   "X-Amz-Security-Token",
        // ],
      },
    });

    const importFilesResource = api.root.addResource("import");

    importFilesResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(importProductsFileFunction),
      // {
      //   requestParameters: {
      //     "method.request.querystring.name": true,
      //   },
      // }
    );

    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new LambdaDestination(importFileParserFunction),
      { prefix: "uploaded/" }
    );
    
  }
}

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Role, ServicePrincipal, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as iam from 'aws-cdk-lib/aws-iam';

export class ProductsServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const role = new Role(this, "dynamodbAccessRole", {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
    });

    role.addToPolicy(
      new PolicyStatement({
        actions: ["dynamodb:*", "logs:PutLogEvents"],
        resources: ["*"],
      })
    );
  
    const catalogItemsQueue = new sqs.Queue(this, 'CatalogItemsQueue', {
      queueName: 'aws-rsscool-catalogItemsQueue',
    });

    const createProductTopic = new sns.Topic(this, 'CreateProductTopic', {
      topicName: 'aws-rsscool-createProductTopic',
    });

    const sqsPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['sqs:ReceiveMessage'],
      resources: ['*'],
    });

    const snsPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['sns:Publish'],
      resources: ['*'],
    });

    const dynamodbPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['dynamodb:Scan', 'dynamodb:PutItem', 'dynamodb:GetItem'],
      resources: ['*'],
    });

    const catalogBatchProcessLambda = new lambda.Function(this, 'catalogBatchProcess', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'catalogBatchProcess.handler',
      environment: {
        PRODUCT_AWS_REGION: 'eu-west-1',
        PRODUCTS_TABLE: 'products',
        STOCKS_TABLE: 'stocks',
        SNS_TOPIC_ARN: createProductTopic.topicArn,
      }
    });

    const productsFunction = new lambda.Function(this, 'ProductsFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: {
        PRODUCT_AWS_REGION: 'eu-west-1',
        PRODUCTS_TABLE: 'products',
        STOCKS_TABLE: 'stocks',
      },
      code: lambda.Code.fromAsset('lambda'),
      handler: 'getProductsList.handler',
      role
    });

    const productByIdFunction = new lambda.Function(this, 'ProductByIdFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: {
        PRODUCT_AWS_REGION: 'eu-west-1',
        PRODUCTS_TABLE: "products",
        STOCKS_TABLE: 'stocks',
      },
      code: lambda.Code.fromAsset('lambda'),
      handler: 'getProductsById.handler',
      role
    });

    const createProductFunction = new lambda.Function(this, 'CreateProductFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: {
        PRODUCT_AWS_REGION: 'eu-west-1',
        PRODUCTS_TABLE: "products",
        STOCKS_TABLE: 'stocks',
      },
      code: lambda.Code.fromAsset('lambda'),
      handler: 'createProduct.handler',
      role
    });

    catalogBatchProcessLambda.addToRolePolicy(dynamodbPolicy);
    catalogBatchProcessLambda.addToRolePolicy(sqsPolicy);
    catalogBatchProcessLambda.addToRolePolicy(snsPolicy);

    const api = new apigateway.RestApi(this, 'ProductApi', {
      restApiName: 'Products service',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });
      

    const productsResource = api.root.addResource('products');
    productsResource.addMethod('GET', new apigateway.LambdaIntegration(productsFunction));
    productsResource.addMethod('POST', new apigateway.LambdaIntegration(createProductFunction));

    const productByIDResource = productsResource.addResource('{id}');
    productByIDResource.addMethod('GET', new apigateway.LambdaIntegration(productByIdFunction));

    catalogBatchProcessLambda.addEventSource(new lambdaEventSources.SqsEventSource(catalogItemsQueue, {
      batchSize: 5
    }));

    createProductTopic.addSubscription(new subs.EmailSubscription('maryvelesyuk@gmail.com', {
      filterPolicy: {
        price: sns.SubscriptionFilter.numericFilter({
          greaterThan: 100,
        }),
      },
    }));

  }
}

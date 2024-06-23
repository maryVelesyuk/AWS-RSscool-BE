import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Role, ServicePrincipal, PolicyStatement } from 'aws-cdk-lib/aws-iam';

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

    const api = new apigateway.RestApi(this, 'ProductApi', {
      restApiName: 'Products service',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });
      

    const productsResource = api.root.addResource('products');
    productsResource.addMethod('GET', new apigateway.LambdaIntegration(productsFunction));

    const productByIDResource = productsResource.addResource('{id}');
    productByIDResource.addMethod('GET', new apigateway.LambdaIntegration(productByIdFunction));

  }
}

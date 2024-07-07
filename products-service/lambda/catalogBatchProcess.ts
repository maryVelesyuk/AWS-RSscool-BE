import { SQSEvent } from "aws-lambda";
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: 'eu-west-1' });
const dynamoDB = DynamoDBDocumentClient.from(client);
const sns = new SNSClient({ region: 'eu-west-1' });

export const handler = async (event: SQSEvent) => {
  console.log('Incomig request:', event);

  try {
    const body = JSON.parse(event.Records[0].body);
    const {title, description, price, count } = body;
    
    if( !title 
        || !description 
        ||!price
        ||!count) {
          throw new Error('Invalid data')
    }

    const id = crypto.randomUUID();

    await dynamoDB.send(new PutCommand({
      TableName: 'products',
      Item: {
        title,
        description,
        price,
        id,
      },
    }));

    await dynamoDB.send(new PutCommand({
      TableName: String(process.env.STOCKS_TABLE_NAME),
      Item: {
        count,
        product_id: id,
      },
    }));

    const snsMessage = {
      Subject: 'New Product Created',
      Message: JSON.stringify({
          product: {id, title, description, price},
          stock: {product_id: id, count}
      }),
      TopicArn: 'arn:aws:sns:eu-west-1:637423426971:CreateProductTopic',
      MessageAttributes: {
          price: {
            DataType: 'Number',
            StringValue: String(price)
          }
        }
  };
  const publishCommand = new PublishCommand(snsMessage);

  await sns.send(publishCommand);
  console.log(`Product created: ${body})}`);

  } catch (error) {
    console.error('Error:', error);
  }
}; 
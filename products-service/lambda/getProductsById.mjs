import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { sendResponse } from './utils.mjs';

export const handler = async (
  event
) => {
  console.log(`Request: method - ${event.httpMethod}, path - ${event.path}, id - ${event.pathParameters.id}`);
  
  const productParams = {
    TableName: "products",
    Key: marshall({ id: event.pathParameters.id }),
  };
  const stockParams = {
    TableName: "stocks",
    Key: marshall({ product_id: event.pathParameters.id }),
  };

  try {
    const client = new DynamoDBClient({});
    
    const product = (await client.send(new GetItemCommand(productParams))).Item;
    const stock = (await client.send(new GetItemCommand(stockParams))).Item;

    if (!product|| !stock) {
      throw new Error('Product not found');
    }

    const result = unmarshall({ ...product, count: stock.count });

    return sendResponse(200, result);

  } catch (error) {
    return sendResponse(500, error.message);
  }
};

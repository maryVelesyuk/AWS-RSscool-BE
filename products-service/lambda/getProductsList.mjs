import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from "@aws-sdk/util-dynamodb";

export const handler = async () => {

  const productParams = {
    TableName: "products"
  };
  const stockParams = {
    TableName: "stocks"
  };

  try {
    const client = new DynamoDBClient();
    
    const products = (await client.send(new ScanCommand(productParams))).Items.map((Item) => unmarshall(Item));
    const stocks = (await client.send(new ScanCommand(stockParams))).Items.map((Item) => unmarshall(Item)); 

    const result = products.map((product)=>({
      id: product.id,
      count: stocks.find(stock=>stock.product_id===product.id).count,
      title: product.title,
      description: product.description,
      price: product.price
    }))

    return sendResponse(200, result);
  } catch (err) {
    const error = err;
    return sendResponse(500, error.message);
  }
};

export const sendResponse = (
  statusCode=200,
  body
) => {
  return {
    statusCode,
    body: JSON.stringify(body || {}),
    headers: {
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
  };
};
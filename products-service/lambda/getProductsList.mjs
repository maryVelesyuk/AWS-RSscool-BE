import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { sendResponse } from './utils.mjs';

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
      count: stocks.find(stock=>stock.product_id === product.id).count,
      title: product.title,
      description: product.description,
      price: product.price
    }))

    return sendResponse(200, result);
  } catch (error) {

    return sendResponse(500, error.message);
  }
};
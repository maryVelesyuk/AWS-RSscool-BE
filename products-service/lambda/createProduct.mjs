import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { randomUUID } from "crypto";
import { sendResponse } from './utils.mjs';

export const handler = async ( event) => {
  console.log(`Request: method - ${event.httpMethod}, path - ${event.path}, body - ${event.body}`);
  
  try {
    const {title, description, price, count} = JSON.parse(event.body);

    if ( !title || typeof title !== "string" ||
      !description || typeof description !== "string" ||
      !price || typeof price !== "number" ||
      !count || typeof count !== "number" ||
      count <= 0 || price <= 0
    ) {
      return sendResponse(400, "Invalid product data")
    }

    const id = randomUUID();

    const newProduct = {
      TableName: "products",
      Item: marshall({
          id,
          title,
          description,
          price,
      }),
    };

    const newStock = {
      TableName: "stocks",
      Item: marshall({
          product_id: id,
          count,
      }),
    };

    const client = new DynamoDBClient({});

    await client.send(new PutItemCommand(newProduct));
    await client.send(new PutItemCommand(newStock));

    return sendResponse(200, "Product was created");

  } catch (error) {

    return sendResponse(500, error.message);
  }
};
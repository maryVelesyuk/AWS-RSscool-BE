import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { v4 as uuidv4 } from 'uuid';
import { sendResponse } from './utils.mjs';

export const handler = async ( event) => {

  const newProductData = JSON.parse(event.body);

  const id = uuidv4();

  const newProduct = {
    TableName: "products",
    Item: marshall({
        id: id,
        title: newProductData.title,
        description: newProductData.description,
        price: newProductData.price,
    }),
  };

  const newStock = {
    TableName: "stocks",
    Item: marshall({
        product_id: id,
        count: newProductData.count,
    }),
  };

  try {

    const client = new DynamoDBClient({});

    await client.send(new PutItemCommand(newProduct));
    await client.send(new PutItemCommand(newStock));

    return sendResponse(200, {...newProduct.Item, count: newStock.Item.count});

  } catch (error) {

    return sendResponse(500, error.message);
  }
};
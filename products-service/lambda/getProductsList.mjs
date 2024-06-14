import {products} from './productsMockData.mjs'

export const handler = async (event) => {

  return {
    statusCode: 200,
    headers: { 
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(products),
  };
};
import { products } from './productsMockData.mjs'

export const handler = async (event) => {
  try {
    const productId = event.pathParameters.id;
    const product = products.find((item) => item.id === productId);

    if (product === undefined) {
      throw new Error('Product not found')
    }

    return {
      statusCode: 200,
      headers: { 
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(product),
    };
    
  } catch (err) {
    return {
      statusCode: 404,
      headers: { 
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(err.message),
    };
  }
};
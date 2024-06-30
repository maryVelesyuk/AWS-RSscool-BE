import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3client = new S3Client();

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {

  const parameters = event.queryStringParameters;

  try {
    if (!parameters?.name) {
      throw new Error("File name is requered")
    }

    const putCommand = new PutObjectCommand({
      Bucket: "awstask5",
      Key: `uploaded/${parameters.name}`,
    });

    const signedUrl = await getSignedUrl(s3client, putCommand, { expiresIn: 60 });

    return {
      statusCode: 200,
      body: signedUrl,
      headers: { 
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "text/plain" 
      },
    };
  } catch (e: any) {

    return {
      statusCode: 500,
      body: JSON.stringify({ message: e.message }),
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      }
    };
  }
};
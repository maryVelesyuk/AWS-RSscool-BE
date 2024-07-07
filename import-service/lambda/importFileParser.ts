import type { APIGatewayProxyResult, S3Event } from "aws-lambda";
import { Readable } from "stream";
import * as csvParser from "csv-parser";
import {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";
import { SQS } from 'aws-sdk';

const BUCKET_NAME = "awstask5";

const client = new S3Client();
const sqs = new SQS({ region: 'eu-west-1' });

export const handler = async (
  event: S3Event
): Promise<APIGatewayProxyResult> => {

  for (const record of event.Records) {

    const key = record.s3.object.key;

    try {
      const result = await client.send(
        new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key })
      );

      if (!result.Body) {
        throw new Error("No body")
      }

      const csvData = await new Promise((resolve, reject): void => {
        (result.Body as Readable)
          .pipe(csvParser({ separator: "," }))
          .on("data", async (data) => {
            await sqs.sendMessage({
              QueueUrl: 'https://sqs.eu-west-1.amazonaws.com/637423426971/aws-rsscool-catalogItemsQueue',
              MessageBody: JSON.stringify(data),
            }).promise();
          })
          .on("end", () => resolve)
          .on("error", reject);
      });

      const newKey = key.replace("uploaded", "parsed");

      await client.send(
        new CopyObjectCommand({
          Bucket: BUCKET_NAME,
          CopySource: `${BUCKET_NAME}/${key}`,
          Key: newKey,
        })
      );

      await client.send(
        new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
        })
      );
    } catch (error: any) {

      return {
        statusCode: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PUT,DELETE",
          "Access-Control-Allow-Headers": "Content-Type",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: error.message }),
      };
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "File parsed" }),
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PUT,DELETE",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    },
  };
};
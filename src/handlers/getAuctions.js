import AWS from 'aws-sdk';
import commonMiddleware from "../lib/commonMiddleware";
import validator from "@middy/validator";
import createHttpError from "http-errors";
import getAuctionsSchema from '../lib/schemas/getAuctionsSchema';

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function getAuctions(event, context) {
  let auctions;

  // grab the status from query string parameters
  const {status} = event.queryStringParameters;

  // getting auctions from AuctionsTable in DynamoDB
  try {
    const params = {
      TableName : process.env.AUCTIONS_TABLE_NAME,
      IndexName: 'statusAndEndDate',
      KeyConditionExpression: '#status = :status',
      ExpressionAttributeValues: {
        ':status': status
      },
      ExpressionAttributeNames: {
        '#status': 'status'
      }
    };

    const result = await dynamodb.query(params).promise();

    auctions = result.Items;
  } catch (e) {
    console.log(e);
    throw new createHttpError.InternalServerError(e);
  }

  // returning the data to API Gateway
  return {
    statusCode: 200,
    body: JSON.stringify(auctions),
  };
}

export const handler = commonMiddleware(getAuctions)
  .use(validator({ inputSchema: getAuctionsSchema, useDefaults: true }));

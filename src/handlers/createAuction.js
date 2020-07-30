import { v4 as uuid } from 'uuid';
import AWS from 'aws-sdk';
import commonMiddleware from "../lib/commonMiddleware";
import validator from "@middy/validator";
import createHttpError from "http-errors";
import createAuctionSchema from '../lib/schemas/createAuctionSchema';

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function createAuction(event, context) {
  const { title } = event.body;
  const { email } = event.requestContext.authorizer;

  const now = new Date();
  const endDate = new Date();
  let params;

  // endDate is set to 1hr after now(startTime)
  endDate.setHours(now.getHours() + 1);

  // creating the auction data
  const auction = {
    id: uuid(),
    title,
    status: 'OPEN',
    createdAt: now.toISOString(),
    endingAt: endDate.toISOString(),
    highestBid: {
      amount: 0
    },
    seller: email
  };

  // inserting in AuctionsTable in DynamoDB
  params = {
    TableName : process.env.AUCTIONS_TABLE_NAME,
    Item: auction,
  };
  try {
    await dynamodb.put(params).promise();
  } catch (e) {
    console.log(e);
    throw new createHttpError.InternalServerError(e);
  }

  // returning the data to API Gateway
  return {
    statusCode: 201,
    body: JSON.stringify(auction),
  };
}

export const handler = commonMiddleware(createAuction)
  .use(validator({ inputSchema: createAuctionSchema }));

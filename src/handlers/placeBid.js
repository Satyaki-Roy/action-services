import AWS from 'aws-sdk';
import commonMiddleware from "../lib/commonMiddleware";
import validator from "@middy/validator";
import createHttpError from "http-errors";
import { getAuctionById }  from "./getAuction"
import placeBidSchema from "../lib/schemas/placeBidSchema";

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function placeBid(event, context) {
  const { id } = event.pathParameters;
  const { amount } = event.body;
  const { email } = event.requestContext.authorizer;

  // checking if the id exists
  const auction = await getAuctionById(id);

  // seller shouldn't be allowed to bid
  if (auction.seller === email) {
    throw new createHttpError.Forbidden(`You can't bid on your own auctions`);
  }

  // if the highest bid belongs to a user then he shall not be allowed to bid
  if (auction.highestBid.bidder === email) {
    throw new createHttpError.Forbidden(`You have the highest bid on this item.`);
  }

  // bidding shouldn't be allowed for CLOSED auctions
  if (auction.status === "CLOSED") {
    throw new createHttpError.Forbidden(`Your can't bid on CLOSED auctions.`);
  }

  // bidding amount should be higher then the current amount
  if (amount <= auction.highestBid.amount) {
    throw new createHttpError.Forbidden(`Your bid must be higher than ${auction.highestBid.amount}`);
  }

  let updatedAuction;

  // updating bidding amount in AuctionsTable in DynamoDB
  try {
    const params = {
      TableName : process.env.AUCTIONS_TABLE_NAME,
      Key: { id },
      UpdateExpression: 'set highestBid.amount = :amount, highestBid.bidder = :bidder',
      ExpressionAttributeValues: {
        ':amount': amount,
        ':bidder': email
      },
      ReturnValues: 'ALL_NEW'
    };

    const result = await dynamodb.update(params).promise();

    updatedAuction = result.Attributes;
  } catch (e) {
    console.log(e);
    throw new createHttpError.InternalServerError(e);
  }

  // returning the data to API Gateway
  return {
    statusCode: 200,
    body: JSON.stringify(updatedAuction),
  };
}

export const handler = commonMiddleware(placeBid)
  .use(validator({ inputSchema: placeBidSchema }));

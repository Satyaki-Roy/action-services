import AWS from 'aws-sdk';
import commonMiddleware from "../lib/commonMiddleware";
import createHttpError from "http-errors";

const dynamodb = new AWS.DynamoDB.DocumentClient();

export async function getAuctionById(id) {
  let auction;

  try {
    const params = {
      TableName : process.env.AUCTIONS_TABLE_NAME,
      Key: { id }
    };

    const result = await dynamodb.get(params).promise();

    auction = result.Item;
  } catch (e) {
    console.log(e);
    throw new createHttpError.InternalServerError(e);
  }

  if (!auction) {
    throw new createHttpError.NotFound(`Auction with ID "${id}" not found!`);
  }

  console.log("auction(getAuction function) " + JSON.stringify(auction));

  return auction;
}

async function getAuction(event, context) {
  const { id } = event.pathParameters;

  // getting auctions from AuctionsTable in DynamoDB
  const auction = await getAuctionById(id);

  // returning the data to API Gateway
  return {
    statusCode: 200,
    body: JSON.stringify(auction),
  };
}

export const handler = commonMiddleware(getAuction);

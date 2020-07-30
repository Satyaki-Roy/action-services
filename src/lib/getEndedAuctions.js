import AWS from 'aws-sdk';
import createHttpError from "http-errors";

const dynamodb = new AWS.DynamoDB.DocumentClient();

export async function getEndedAuctions() {
  const now = new Date();

  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    IndexName: 'statusAndEndDate',
    KeyConditionExpression: '#status = :status and endingAt <= :now',
    ExpressionAttributeValues: {
      ':status': 'OPEN',
      ':now': now.toISOString()
    },
    ExpressionAttributeNames : {
      '#status': 'status'
    }
  };

  try {
    const result = await dynamodb.query(params).promise();
    return result.Items;
  } catch (e) {
    console.log(e);
    throw new createHttpError.InternalServerError(e);
  }
}

import AWS from 'aws-sdk';
import createHttpError from "http-errors";

const dynamodb = new AWS.DynamoDB.DocumentClient();

export async function setAuctionPictureUrl(id, pictureUrl) {
  console.log("Type of id: " + typeof id);
  try {
    const params = {
      TableName : process.env.AUCTIONS_TABLE_NAME,
      Key: {id},
      UpdateExpression: 'set pictureUrl = :pictureUrl',
      ExpressionAttributeValues: {
        ':pictureUrl': pictureUrl
      },
      ReturnValues: 'ALL_NEW'
    };

    const result = await dynamodb.update(params).promise();

    return result.Attributes;
  } catch (e) {
    console.log(e);
    throw new createHttpError.InternalServerError(e);
  }
}

import AWS from 'aws-sdk';
import createHttpError from "http-errors";

const dynamodb = new AWS.DynamoDB.DocumentClient();
const sqs = new AWS.SQS();

export async function closeAuction(auction) {

  const params = {
    TableName : process.env.AUCTIONS_TABLE_NAME,
    Key: { id: auction.id },
    UpdateExpression: 'set #status = :status',
    ExpressionAttributeValues: {
      ':status': "CLOSED"
    },
    ExpressionAttributeNames : {
      '#status': 'status'
    },
    ReturnValues: 'ALL_NEW'
  };

  try {
    await dynamodb.update(params).promise();

    const { title, seller, highestBid } = auction;
    const { amount, bidder } = highestBid;

    if (amount === 0) {
      const notifySeller = sqs.sendMessage({
        QueueUrl: process.env.MAIL_QUEUE_URL,
        MessageBody: JSON.stringify({
          subject: 'No bids on your Item',
          recipient: seller,
          body: `Sorry! We didn't receive any bids on your item "${title}".`,
        })
      }).promise();

      return Promise.all([notifySeller])
    } else {
      const notifySeller = sqs.sendMessage({
        QueueUrl: process.env.MAIL_QUEUE_URL,
        MessageBody: JSON.stringify({
          subject: 'Your item has been sold',
          recipient: seller,
          body: `WooHoo! Your item "${title}" has been sold for $${amount}.`,
        })
      }).promise();

      const notifyBidder = sqs.sendMessage({
        QueueUrl: process.env.MAIL_QUEUE_URL,
        MessageBody: JSON.stringify({
          subject: 'Your won an auction',
          recipient: bidder,
          body: `What a great deal! You got yourself a "${title}" for $${amount}.`,
        })
      }).promise();

      return Promise.all([notifySeller, notifyBidder])
    }
  } catch (e) {
    console.log(e);
    throw new createHttpError.InternalServerError(e);
  }
}

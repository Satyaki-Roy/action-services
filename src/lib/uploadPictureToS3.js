import AWS from 'aws-sdk';

const s3 = new AWS.S3();

export async function uploadPictureToS3(key, body) {
  const params = {
    Bucket: process.env.AUCTIONS_BUCKET_NAME,
    Key: key,
    Body: body,
    ContentEncoding: 'base64',
    ContentType: 'image/jpeg'
  };

  return await s3.upload(params).promise();
}

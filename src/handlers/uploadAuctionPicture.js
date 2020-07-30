import {getAuctionById} from './getAuction';
import {uploadPictureToS3} from '../lib/uploadPictureToS3';
import {setAuctionPictureUrl} from '../lib/setAuctionPictureUrl';
import middy from "@middy/core";
import validator from "@middy/validator";
import httpErrorHandler from "@middy/http-error-handler";
import httpCors from "@middy/http-cors";
import createHttpError from "http-errors";
import uploadAuctionPictureSchema from '../lib/schemas/uploadAuctionPictureSchema'

async function uploadAuctionPicture(event, context) {
  const { id } = event.pathParameters;
  const { email } = event.requestContext.authorizer;
  const auction = await getAuctionById(id);

  // seller is only allowed to upload an image
  if (email !== auction.seller) {
    throw new createHttpError.Forbidden("Seller is only allowed to upload an image.");
  }

  const base64 = event.body.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64, 'base64');

  let updatedAuction;

  try {
    const uploadToS3Result = await uploadPictureToS3(auction.id + '.jpeg', buffer);
    const pictureUrl = uploadToS3Result.Location;

    updatedAuction = await setAuctionPictureUrl(auction.id, pictureUrl);
  } catch (e) {
    console.log(e);
    throw new createHttpError.InternalServerError(e);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(updatedAuction)
  }
}

export const handler = middy(uploadAuctionPicture)
  .use(httpErrorHandler())
  .use(validator({ inputSchema: uploadAuctionPictureSchema }))
  .use(httpCors());

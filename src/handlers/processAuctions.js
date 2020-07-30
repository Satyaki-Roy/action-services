import { getEndedAuctions } from '../lib/getEndedAuctions';
import { closeAuction } from '../lib/closeAuction';
import createHttpError from "http-errors";

async function processAuctions(event, context) {
  try {
    // get all the auctions which are ended
    const auctionsToClose = await getEndedAuctions();

    // looping and updating the status
    const closePromises = auctionsToClose.map(auction => closeAuction(auction));
    await Promise.all(closePromises);

    // returning the number of objects which where closed
    return { closed: closePromises.length }
  } catch (e) {
    console.log(e);
    throw new createHttpError.InternalServerError(e);
  }
}

export const handler = processAuctions;

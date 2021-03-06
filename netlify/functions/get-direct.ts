import { Handler } from '@netlify/functions'
import {create} from "domain";
import {Context} from "vm";
import path = require("path");

const youtubedl = require('youtube-dl-exec');
//const { create: createYoutubeDl } = require('youtube-dl-exec')
//const youtubedl = createYoutubeDl(binary);
const binary = require.resolve("../youtube-dl.exe");
console.log("BINARY: " + binary);

const youtubeUrlRegex = "^((?:https?:)?\\/\\/)?((?:www|m)\\.)?((?:youtube(-nocookie)?\\.com|youtu.be))(\\/(?:[\\w\\-]+\\?v=|embed\\/|v\\/)?)([\\w\\-]+)(\\S+)?$";

export const handler: Handler = async (event, context) => {
  try {
    return await execute(event, context);
  } catch (error) {
    console.log(JSON.stringify(error, null, 4));
    return getErrResponse(500, "Internal server error.");
  }
}

async function execute(event, context) {
  let body;

  try {
    body = JSON.parse(event.body);
  } catch (error) {
    body = "";
  }

  /*if (!body.user_id)
    return getErrResponse(400, "User ID is not present.");*/

  if (!body.url)
    return getErrResponse(400, "Youtube video URL is not present.");

  if (!validateYoutubeUrl(body.url))
    return getErrResponse(400, "Youtube video URL is wrong.");

  // TODO: Check the id with database.

  const urls: string = await youtubedl(body.url, {
    getUrl: true,
    //dumpSingleJson: true,
    //noCallHome: true,
    //preferFreeFormats: true,
    //youtubeSkipDashManifest: true,
    noWarnings: true,
    noCheckCertificate: true,
    simulate: true,
    referer: body.url
  });

  const audioUrl = urls.split("\n")[1];

  return {
    statusCode: 200,
    body: JSON.stringify({
      url: audioUrl
    })
  }
}

function validateYoutubeUrl(url: string) {
  return url && new RegExp(youtubeUrlRegex, "i").test(url);
}

// TODO: Add defined error ID with associated text.
function getErrResponse(err: number, msg: string) {
  return {
    statusCode: err,
    body: JSON.stringify({
      error: msg
    })
  }
}

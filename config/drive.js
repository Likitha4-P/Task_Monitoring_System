import fs from "fs";
import { google } from "googleapis";

const credentials = JSON.parse(
  fs.readFileSync("config/credentials.json")
);

const token = JSON.parse(
  fs.readFileSync("config/token.json")
);

const { client_secret, client_id, redirect_uris } =
  credentials.installed || credentials.web;

const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);

oAuth2Client.setCredentials(token);

export const drive = google.drive({
  version: "v3",
  auth: oAuth2Client
});

import { google } from "googleapis";
import fs from "fs";
import readline from "readline";

const credentials = JSON.parse(fs.readFileSync("../config/credentials.json"));
const { client_id, client_secret, redirect_uris } = credentials.installed;

const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: "offline",
  scope: ["https://www.googleapis.com/auth/drive"]
});

console.log("Authorize this app by visiting this url:\n", authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question("Enter the code from that page here: ", async (code) => {
  const { tokens } = await oAuth2Client.getToken(code);
  fs.writeFileSync("../config/token.json", JSON.stringify(tokens));
  console.log("✅ Token stored successfully");
  rl.close();
});

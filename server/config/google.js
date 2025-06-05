import { Issuer, generators } from 'openid-client';
import dotenv from 'dotenv';
dotenv.config();

export const nonce = generators.nonce();

const issuer = await Issuer.discover('https://accounts.google.com');

export const googleClient = new issuer.Client({
  client_id: process.env.GOOGLE_CLIENT_ID,
  client_secret: process.env.GOOGLE_CLIENT_SECRET,
  redirect_uris: ['http://localhost:8000/api/auth/google/callback'],
  response_types: ['code'],
});

export function generateAuthUrl() {

  return googleClient.authorizationUrl({
    scope: 'openid email profile',
    nonce,
  });
}

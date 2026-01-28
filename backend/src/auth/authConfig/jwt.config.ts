import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => {
  return {
    secret: process.env.JWT_SECRET,
    audience: process.env.JWT_TOKEN_AUDIENCE,
    googleClient_id: process.env.GOOGLE_CLIENT_ID,
    googleClient_secret: process.env.GOOGLE_CLIENT_SECRET,
    issuer: process.env.JWT_TOKEN_ISSUER,
    ttl: parseInt(process.env.JWT_ACCESS_TOKEN_TTL ?? '3600'),
  };
});

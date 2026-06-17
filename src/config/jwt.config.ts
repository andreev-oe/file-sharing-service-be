import { registerAs } from '@nestjs/config';

export const DEFAULT_ACCESS_TOKEN_EXPIRES_IN_SECONDS = 900;
export const DEFAULT_REFRESH_TOKEN_EXPIRES_IN_SECONDS = 604800;

export default registerAs('jwt', () => {
  return {
    secret: process.env.JWT_SECRET ?? 'change-me',
    accessExpiresInSeconds: parseInt(
      process.env.JWT_ACCESS_EXPIRES_IN_SECONDS ?? String(DEFAULT_ACCESS_TOKEN_EXPIRES_IN_SECONDS),
      10,
    ),
    refreshExpiresInSeconds: parseInt(
      process.env.JWT_REFRESH_EXPIRES_IN_SECONDS ?? String(DEFAULT_REFRESH_TOKEN_EXPIRES_IN_SECONDS),
      10,
    ),
  };
});

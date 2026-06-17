import { registerAs } from '@nestjs/config';

export const DEFAULT_REDIS_HOST = 'localhost';
export const DEFAULT_REDIS_PORT = 6379;

export default registerAs('redis', () => {
  return {
    host: process.env.REDIS_HOST ?? DEFAULT_REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT ?? String(DEFAULT_REDIS_PORT), 10),
    password: process.env.REDIS_PASSWORD,
  };
});

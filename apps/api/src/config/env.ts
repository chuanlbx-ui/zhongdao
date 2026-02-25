import process from "node:process";
import dotenv from "dotenv";

dotenv.config();

const required = [
  "NODE_ENV",
  "PORT",
  "DATABASE_URL",
  "JWT_SECRET",
  "REDIS_URL",
  "LOG_LEVEL",
  "CORS_ORIGIN"
] as const;

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV as string,
  port: Number(process.env.PORT),
  databaseUrl: process.env.DATABASE_URL as string,
  jwtSecret: process.env.JWT_SECRET as string,
  redisUrl: process.env.REDIS_URL as string,
  logLevel: process.env.LOG_LEVEL as string,
  corsOrigin: process.env.CORS_ORIGIN as string
};

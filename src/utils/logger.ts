import fs from 'node:fs';
import path from 'node:path';
import winston from 'winston';

const LOG_DIR = path.resolve('logs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const level = process.env.LOG_LEVEL ?? 'info';

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp(),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const rest = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${level}] ${timestamp} ${message}${rest}`;
  }),
);

export const logger = winston.createLogger({
  level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console({ format: consoleFormat }),
    new winston.transports.File({ filename: path.join(LOG_DIR, 'error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(LOG_DIR, 'combined.log') }),
  ],
});

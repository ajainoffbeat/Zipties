import winston from 'winston';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

// Safe JSON stringify that handles circular references
const safeStringify = (obj: any): string => {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, val) => {
    if (val != null && typeof val === 'object') {
      if (seen.has(val)) {
        return '[Circular]';
      }
      seen.add(val);
    }
    return val;
  });
};

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || LogLevel.INFO,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          let log = `${timestamp} [${level}]: ${message}`;
          
          // Add user ID if present
          if (meta.userId) log += ` (userId: ${meta.userId})`;
          
          // Add request ID if present
          if (meta.requestId) log += ` (requestId: ${meta.requestId})`;
          
          // Add context if present
          if (Object.keys(meta).length > 0) {
            const context = { ...meta };
            delete context.userId;
            delete context.requestId;
            if (Object.keys(context).length > 0) {
              log += ` | Context: ${safeStringify(context)}`;
            }
          }
          
          return log;
        })
      )
    })
  ],
});

export { logger };

import winston from "winston";

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Format untuk console (lebih enak dibaca manusia)
const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const isTest = process.env.NODE_ENV === "test";
const isProduction = process.env.NODE_ENV === "production";

const transports: winston.transport[] = [];

// Jangan tulis ke file saat testing — memperlambat test dan bikin log tidak perlu
if (!isTest) {
  transports.push(
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  );
}

// Di development & test (jika ada), tambahkan output ke console
if (!isProduction) {
  transports.push(
    new winston.transports.Console({
      // Saat testing, matikan output console agar tidak berisik
      silent: isTest,
      format: combine(colorize(), timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), errors({ stack: true }), consoleFormat),
    }),
  );
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }), // supaya error stack ikut tercatat
    json()
  ),
  transports,
  // Jangan exit saat uncaught exception (opsional)
  exitOnError: false,
});

export default logger;

export const stream = {
  write: (message: string) => logger.http(message.trim()),
};

// import winston from "winston";
// import winstonDaily from "winston-daily-rotate-file";

const winston = require("winston");
const winstonDaily = require("winston-daily-rotate-file");
const config = require("../config");

const logDir = "logs"; // logs 디렉토리 하위에 로그 파일 저장

const { combine, timestamp, printf, colorize, simple, errors } = winston.format;

// Define log format
const logFormat = printf(({ timestamp, level, message, stack }) => {
  if (stack) return `${timestamp} | ${config.logServer.serverName} [ ${level} ] ▶  ${message}\n${stack}`;
  else return `${timestamp} | ${config.logServer.serverName} [ ${level} ] ▶  ${message}`;
});

const colors = {
   error: "red",
   warn: "yellow",
   info: "green",
   http: "magenta",
   debug: "white",
};

winston.addColors(colors);

const levels = {
   error: 0,
   warn: 1,
   http: 2,
   info: 3,
   //info:2, http:3
   debug: 4,
};

/*
 * Log Level
 * error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6
 */
const logger = winston.createLogger({
  levels,
  format: combine(
    errors({ stack: true }),
    timestamp({
      format: "YYYY-MM-DD HH:mm:ss.SSS",
    }),
    logFormat
  ),
  transports: [
    new winston.transports.Http({
      host: config.logServer.ip,
      port: config.logServer.port,
      // 기본적으로 지정하지 않으면 /winston-log route되어짐
      path: `/${config.logServer.projectName}/${config.logServer.serverName}`,
      format: winston.format.json(),
    }),

    // info 레벨 로그를 저장할 파일 설정
    new winstonDaily({
      level: "info",
      datePattern: "YYYY-MM-DD",
      dirname: logDir,
      filename: `%DATE%.log`,
      maxFiles: 30, // 30일치 로그 파일 저장
      zippedArchive: true,
    }),

    // error 레벨 로그를 저장할 파일 설정
    new winstonDaily({
      level: "error",
      datePattern: "YYYY-MM-DD",
      dirname: logDir + "/error", // error.log 파일은 /logs/error 하위에 저장
      filename: `%DATE%.error.log`,
      maxFiles: 30,
      zippedArchive: true,
    }),
  ],
});

logger.stream = {
  // morgan wiston 설정
  write: (message) => {
    logger.http(message);
  },
};

// Production 환경이 아닌 경우(dev 등)
if (process.env.NODE_ENV !== "production") {
   logger.add(
      new winston.transports.Console({
         format: combine(
            colorize({ all: true }), // 색깔 넣어서 출력
            logFormat // `${info.level}: ${info.message} JSON.stringify({ ...rest })` 포맷으로 출력
            //simple()
         ),
      })
   );
}

// export { logger };
module.exports = logger;

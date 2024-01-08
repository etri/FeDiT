const express = require("express");
const config = require("../../config");
const http = require("http");
const port = config.federatedDigitalConnector.port;
const figlet = require("figlet");
const morgan = require("morgan"); // request loggin middleware
// combined format except timestamp
const combined =
   ':remote-addr - :remote-user ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"';
const morganFormat =
   process.env.NODE_ENV !== "production" ? "common" : combined; // NOTE: morgan 출력 형태 server.env에서 NODE_ENV 설정

exports.init = ({ app }) => {
   // body parser
   app.use(express.json());
   app.use(
      express.urlencoded({
         extended: true,
      })
   );

   //logger.info("morgan Format : " + morganFormat);
   app.use(morgan(morganFormat, { stream: logger.stream })); // morgan 로그 설정

   // response format
   app.use((req, res, next) => {
      res.success = function (statusCode = 200, data = {}) {
         res.status(statusCode).json(data);
      };

      res.fail = function (statusCode = 500, data = {}) {
         res.status(statusCode).json(data);
      };

      next();
   });

   // all
   app.all("/*", function (req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header(
         "Access-Control-Allow-Headers",
         "X-Requested-With, Authorization, Content-Type, X-Platform, X-Version"
      );
      res.header(
         "Access-Control-Allow-Methods",
         "POST, GET, PUT, PATCH, DELETE, OPTIONS"
      );
      res.header("Access-Control-Expose-Headers", "Content-Disposition");
      if (req.method === "OPTIONS") {
         return res.status(200).end();
      }
      next();
   });

   app.all("*"),
      function (req, res, next) {
         res.send("Bad Request (Wrong Url)", 404);
      };

   const server = http.createServer(app);
   server.listen(port, () => {
      logger.info(`Server Start on port ${port}`);
   });

   figlet("FederatedTwin", function (err, data) {
      if (err) {
         console.log("Something went wrong...");
         console.dir(err);
         return;
      }
   });

   return app;
};

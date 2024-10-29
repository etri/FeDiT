const colors = require("colors/safe");

class ErrorHandler {
  constructor(statusCode, errorCode, msg) {
    this.statusCode = statusCode || 500;
    this.errorCode = errorCode || 9999;
    this.msg = msg || "Unknown error";
  }

  handle(req, res, option) {
    logger.error(`Error Occur ${this.errorCode}`);
    logger.error(`Message : ${this.msg}`);

    if (req.method === "GET" || req.method === "DELETE") {
      logger.error("Request Query : " + JSON.stringify(req.query));
    } else {
      logger.error("Request Body : " + JSON.stringify(req.body));
    }

    res.fail(this.statusCode, {
      code: this.errorCode,
      msg: this.msg,
    });
  }
}

module.exports = ErrorHandler;

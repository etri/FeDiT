exports.init = () => {
  global.http = require("http");
  global.DateTime = require("luxon").DateTime;
  global.util = require("util");
  global.where = require("lodash.where");
  global.axios = require("axios");
  global.logger = require("../../lib/logger");
  const { v4: uuidv4 } = require("uuid");
  global.uuidv4;
  global.uuid = () => {
    const tokens = uuidv4().split("-");
    return `${tokens[2]}${tokens[1]}${tokens[0]}${tokens[3]}${tokens[4]}`;
  };
};

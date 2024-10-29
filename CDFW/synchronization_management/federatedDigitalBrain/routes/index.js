const fs = require("fs");
const path = require("path");

module.exports = (app) => {
   const dirs = fs.readdirSync(__dirname);
   dirs
      .filter((d) => fs.lstatSync(__dirname + "/" + d).isDirectory())
      .forEach((dir) => {
         const r = require("./" + dir);
         app.use(`/${dir}`, r);
      });
};

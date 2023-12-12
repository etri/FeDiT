const config = require("../../config");
const lib = require("../../lib");

/**
 * sensor table
 * {string} ml_id
 * {string} id
 * {string} data
 * {rowtime} timestamp
 */
class Flink {
   constructor() {
      this.statementUrl = `http://${config.flink.gwOption.host}/v1/sessions/${SESSIONID}/statements`;
      console.log(this.statementUrl);
   }

   async dropTable({ id }) {
      let dropStreamSQL = {
         statement: `drop table ${id}`,
      };
      const res = await lib.request({
         url: this.statementUrl,
         bodyParams: dropStreamSQL,
      });
      console.log("drop res: ", res);
      logger.info(dropStreamSQL, " dropTable.results", res);
      return res;
   }
}

module.exports = Flink;

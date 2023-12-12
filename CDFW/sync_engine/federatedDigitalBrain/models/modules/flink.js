const config = require("../../config");
const { hostname, port } = config.flink.gwOption;
const { default: axios } = require("axios");

class Flink {
   constructor() {
      /*
      if (!global.SESSION_ID) {
         throw "Undefined flink session ID";
      }*/

      this.gwOptions = {
         hostname,
         port,
         path: `v1/sessions/${global.SESSION_ID}/statements`,
         method: "POST",
      };
   }

   /**
    *
    * @param {String} method
    * @param {String} url
    * @param {Json} queryParams
    * @param {Json} bodyParams
    * @returns
    */
   async #request({ method, url, queryParams, bodyParams }) {
      try {
         method = this.gwOptions.method;
         url = `http://${this.gwOptions.hostname}:${this.gwOptions.port}/${this.gwOptions.path}`;

         const response = await axios({
            method,
            url,
            params: queryParams,
            data: bodyParams,
         });

         return response.data;
      } catch (e) {
         logger.error(e.response.data);
      }

      return 0;
   }

   async dropTable({ id }) {
      logger.info(`drop table ${id}`);
      let dropStreamSQL = {
         statement: `drop table ${id}`,
      };
      const result = await this.#request({ bodyParams: dropStreamSQL });
      logger.info(dropStreamSQL, result);
      return 0;
   }
}

module.exports = Flink;

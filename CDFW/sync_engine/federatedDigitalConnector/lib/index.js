/**
 * json object 여부 체크
 * @param {Json} obj (required)
 * @returns {Booelan}
 */
exports.isObject = (obj) => {
   return (
      obj?.constructor === {}.constructor ||
      obj?.constructor.toString().includes("TextRow")
   );
};

/**
 * json 데이터 형태인 string 값을 json으로 변환
 * @param {String} jsonString (required)
 * @returns {Json} obj
 */
exports.tryJSONparse = (jsonString) => {
   try {
      return JSON.parse(jsonString);
   } catch (e) {
      return false;
   }
};

/**
 * @param {String} method
 * @param {String} url
 * @param {Json} headers
 * @param {Json} bodyParams
 * @returns
 */
exports.request = async ({ method, url, headers, bodyParams, timeout = 0 }) => {
   try {
      method = method ? method : "post";
      headers = {
         "Content-Type": "application/json",
      };
      const response = await axios({
         method,
         url,
         headers,
         timeout,
         data: bodyParams,
      });
      return response.data;
   } catch (e) {
      logger.error(url, e);
   }
};

/**
 *
 * @param {String} Mobius_url
 * @param {String} DigitalConnector_url
 * @param {String} digital_twin_id
 * @param {String} sensor_id
 * @returns
 */
exports.oneM2MsubRequest = async ({
   digital_twin_id,
   sensor_id,
   DigitalConnector_url,
   Mobius_url,
}) => {
   try {
      const jsonBody = {
         "m2m:sub": {
            rn: sensor_id,
            enc: {
               net: [3],
            },
            nu: [
               `http://` +
                  DigitalConnector_url +
                  `/mirrorlake/v1/digital-twins/${digital_twin_id}/sensors/${sensor_id}/data/m2m`,
            ],
         },
      };
      const config = {
         method: "post",
         url: Mobius_url,
         headers: {
            Accept: "application/json",
            "X-M2M-RI": "123dfsaf45",
            "X-M2M-Origin": "S20170717074825768bp2l",
            "Content-Type": "application/json;ty=23",
         },
         data: jsonBody,
      };

      console.log(config);
      console.log(JSON.stringify(jsonBody));
      const response = await axios(config);
      console.log(response);
      return response.data;
   } catch (e) {
      logger.error(e);
   }
};

/**
 * arr -> enum
 * ex) [ 'D1' ] -> "D1"
 * postgres) text[] column 에 insert시 유효성 검사 후 아래의 형태로 sql 작성
 * const arr = arr ? `{${funcs.arryToEnum(arr)}}` : `{}`;
 * @param {*} arr
 * @returns enum
 */
exports.arryToEnum = (arr) => {
   const str = JSON.stringify(arr);
   const strToEnum = str.replace(/[[\]\\]/g, "");
   return strToEnum;
};

/**
 * timestamp format: 'YYYY-MM-DD HH:mm:ss.SSS'
 * @returns {String} timestamp
 */
exports.timestamp = () => {
   let today = new Date();
   today.setHours(today.getHours());
   return today.toISOString().replace("T", " ").substring(0, 23);
};

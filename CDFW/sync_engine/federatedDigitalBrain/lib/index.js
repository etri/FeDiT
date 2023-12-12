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
 *
 * @param {String} method
 * @param {String} url
 * @param {Json} headers
 * @param {Json} bodyParams
 * @returns
 */
exports.request = async ({ method, url, headers, bodyParams }) => {
   try {
      method = method ? method : "post";
      headers = {
         "Content-Type": "application/json",
      };
      logger.info("params: ", {
         method,
         url,
         headers,
         data: bodyParams,
      });
      const response = await axios({
         method,
         url,
         headers,
         data: bodyParams,
      });
      return response;
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

exports.arryToString = (arr) => {
   const str = JSON.stringify(arr);
   const strToEnum = str.replace(/[[\]\\]/g, "");
   const strNoQu = strToEnum.replace(/\"/gi, "");

   return strNoQu;
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

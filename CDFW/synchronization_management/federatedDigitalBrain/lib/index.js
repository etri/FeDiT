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

      const response = await axios({
         method,
         url,
         headers,
         data: bodyParams,
      });

      return response;
   } catch (e) {
      // 409 Conflict는 startup 시 이미 존재하는 Kafka 커넥터 재등록 등에서 정상적으로 발생할 수 있어 로그 생략
      if (e.response?.status === 409) return;
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
 * control_execution_result 를 text 로 정규화한다.
 *
 * federated_control_result.federated_digital_object_control_execution_result 는 text 컬럼이고,
 * 이 값은 fdo_control_result 토픽 -> JDBC sink(upsert) 를 거쳐 그 컬럼에 들어간다.
 * joi 는 object 도 허용하지만, object 인 채로 produce 하면 sink 가 text 컬럼에 넣지 못해
 * 컬럼이 NULL 로 upsert 된다. 그러면
 *   - markTimeoutControlResults() 가 (execution_result IS NULL 조건) 그 제어를 TIMEOUT 으로 확정하고
 *     CONTROL_TIMEOUT 알림을 추가 발송하며
 *   - searchControl() 도 같은 컬럼으로 상태를 계산하므로 TIMEOUT 으로 보고한다
 * 즉 성공한 제어가 뒤늦게 실패로 뒤집힌다. 그래서 produce 전에 반드시 문자열로 만든다.
 *
 * @param {*} result object | string
 * @returns {String}
 */
exports.normalizeControlExecutionResult = (result) => {
   if (typeof result === "string") return result;
   try {
      return JSON.stringify(result);
   } catch (e) {
      return String(result);
   }
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

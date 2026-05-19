const ErrorHandler = require("../../../../lib/error-handler");
const { isObject } = require("../../../../lib");

const options = {
   stripUnknown: true, // true: 객체와 배열에서 알 수 없는 요소를 제거. (default=false)
   abortEarly: false, // true: schema 유효성에 맞지 않는 키가 있을 경우 바로 abort. false: schema에 따라 모든 유효성 검사 후 유효성에 맞지 않는 모든 키의 에러 메세지를 포함하여 abort. (default=true)
   allowUnknown: false, // true: schema에 없는 키를 받을 수 있음. (default=false)
};

exports.validate = (schema, req, res, next) => {
   try {
      let testParam = { ...schema, ...req.params, ...req.query };
      let validateData,
         isQuery = false;
      switch (req.method) {
         case "GET":
         case "DELETE":
            validateData = { ...req.params, ...req.query };
            isQuery = true;
            break;

         case "POST":
         case "PUT":
         case "PATCH":
            validateData = { ...req.body };
            break;
      }

      validateData = JSON.parse(JSON.stringify(validateData));
      const { error, value } = schema.validate(validateData, options);

      if (error) {
         throw new ErrorHandler(
            400,
            400,
            error.details.map((index) => index.message).join("\n")
         );
      } else {
         for (let key in value) {
            // 키의 값이 없을 경우 제거
            if (value[key] === undefined) {
               delete value[key];
            }
            // 키의 값이 빈 스트링은 null
            if (value[key] === "") {
               value[key] = null;
            }
            // 키의 값이 string 일 때 공백 문자 치환
            else if (typeof value[key] == "string") {
               value[key] = value[key].replace(/^(\'\s*)|(\s*\'$)/g, "");
            }
            // 키의 값이 json 일 때
            else if (isObject(value[key])) {
               for (let key2 in value[key]) {
                  if (value[key][key2] === undefined) {
                     delete value[key][key2];
                  } else if (value[key][key2] === "") {
                     value[key][key2] = null;
                  } else if (typeof value[key][key2] == "string") {
                     value[key][key2] = value[key][key2].replace(
                        /^(\'\s*)|(\s*\'$)/g,
                        ""
                     );
                  }
               }
            }
            // 키의 값이 array 일 때
            else if (Array.isArray(value[key])) {
               // 2 depth
               value[key] = value[key].filter((index) => {
                  // array 안에 있는 json
                  if (isObject(index)) {
                     // 3 depth
                     for (let key2 in index) {
                        if (
                           index[key2] === undefined ||
                           (Array.isArray(index[key2]) &&
                              index[key2].length == 0)
                        ) {
                           delete index[key2];
                        } else if (index[key2] === "") {
                           index[key2] = null;
                        } else if (typeof index[key2] == "string") {
                           index[key2] = index[key2].replace(
                              /^(\'\s*)|(\s*\'$)/g,
                              ""
                           );
                        }
                     }
                     if (Object.keys(index).length > 0) return 1;
                  } else {
                     if (!(index === undefined || index === "")) {
                        return 1;
                     }
                  }
               });
            }
         }

         if (isQuery) {
            req.query = value;
         } else {
            req.body = value;
         }
         next();
      }
   } catch (e) {
      console.log(e);
      e.handle(req, res, "joi validate");
   }
};

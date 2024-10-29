const Model = require("../models");
const model = new Model();
const ErrorHandler = require("../lib/error-handler");

const PERMISSION = ["ADMIN", "MANAGER", "NORMAL"];

async function check(req, res, next) {
   //const { creator_id } = req.body.creator_id;

   // creator_id로 권한 조회
   // const permission = await model.user.getPermission({ id: creator_id });
   const permission = "MANAGER";
   if (!permission) {
      throw ErrorHandler(403, 5252, "Unahtorized.");
   }

   // 권한 체크
   if (!PERMISSION.includes(permission)) {
      throw Error(` [permission] weird permission ${permission}`);
   }
   next();
}

module.exports = {
   check,
};

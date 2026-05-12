const DB = require("../util/queries");
const UID = require("../util/generateUid");
const serverInfo = require("../server_conf.json");
const mailer = require("./mailer");
const moment = require("moment");

module.exports = {
  checkPassword: async (userInfo) => {
    try {
      // 회원 정보 체크
      const { userId, userEmail } = userInfo;
      const query =
        "SELECT * FROM USERS WHERE USERS.USER_ID_PK=" +
        "'" +
        userId +
        "' AND USERS.EMAIL='" +
        userEmail +
        "'";
      const check = await DB._ByQuery(query);
      const { rows } = check;
      if (rows.length === 0) {
        throw new Error("일치하는 회원정보가 없습니다.");
        // return false;
      }
      // 일치하는 회원정보가 있으면, 생성된 vericode가 있는지 확인

      const verifyQuery = `
      SELECT
        *
      FROM
        vericode
      WHERE
        vericode_fk1='${userId}';
      `;
      let timeFormatOptions = {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      };
      const result = await DB._ByQuery(verifyQuery);
      const { rowCount } = result;
      if (rowCount === 0) {
        return true;
      }
      let expireTime = result.rows[0].expire_time.toLocaleString(
        "ko-KR",
        timeFormatOptions
      );
      let nowTime = new Date(
        moment().format("YYYY-MM-DD HH:mm:ss")
      ).toLocaleString("ko-KR", timeFormatOptions);
      // 이미 발급된 vericode가 있으면, 유효기간 체크.. 유효기간이 지났으면 vericode 삭제
      if (nowTime > expireTime) {
        const query =
          "DELETE FROM VERICODE WHERE VERICODE_FK2='" +
          userEmail +
          "' AND VERICODE='" +
          result.rows[0].vericode +
          "'";
        await DB._ByQuery(query);
        return true;
      }
      return false;
    } catch (error) {
      throw error;
    }
  },
  getNickname: async (userId) => {
    try {
      const query =
        "SELECT NICKNAME FROM USERS WHERE USERS.USER_ID_PK=" +
        "'" +
        userId +
        "'"
      const res = await DB._ByQuery(query);
      const { rows } = res;
      if (rows.length === 0) {
        throw new Error("일치하는 회원정보가 없습니다.");
      }
      const nickname = rows[0].nickname;

    return nickname;

    } catch (error) {
      throw error;
    }
  },
  createVerify: async () => {
    const extendTime = 15; //15 minutes

    let codeExpireTime = new Date();
    codeExpireTime.setMinutes(codeExpireTime.getMinutes() + extendTime);
    console.log(codeExpireTime);
    let verifyCode = UID.getUid(32);
    return { verifyCode, codeExpireTime };
  },

  sendMail: async (mailInfo, nickname) => {
    try {
      // send mail
      const { userEmail, verifyCode } = mailInfo;

      const mailOptions = {
        from: serverInfo.emailAccountId,
        to: userEmail,
        subject:
          "비밀번호 찾기 인증 메일입니다.",
        html:
          "<h1>안녕하세요 [ " + 
          nickname +
          " ] 님!</h1>" +
          "<h3>비밀번호 찾기 인증용 메일입니다. 15분 내로 인증해주세요.</h3>" +
          "<h3>아래의 링크를 클릭하여 비밀번호 변경을 진행해주세요. 본인이 아닌 경우 메일을 삭제하시기 바랍니다.</h3>" +
          "<a href='" +
          serverInfo.emailSendUrl +
          "/accounts/resetPwd?email=" +
          userEmail +
          "&verifyCode=" +
          verifyCode +
          "'>이 글을 클릭하여 비밀번호를 변경해 주세요.</a>",
      };
      const result = await mailer.sendMail(mailOptions);
      return result;
    } catch (error) {
      throw error;
    }
  },
  createVericode: async (verifyInfo) => {
    try {
      const { userId, userEmail, verifyCode, codeExpireTime } = verifyInfo;
      const createQuery = `
      INSERT INTO VERICODE
      (
        vericode_fk1,
        vericode_fk2,
        vericode,
        method,
        expire_time
      ) VALUES (
        $1,
        $2,
        $3,
        'EMAIL',
        $4
      )
      `;
      const result = await DB._ByQuery(createQuery, [
        userId,
        userEmail,
        verifyCode,
        codeExpireTime,
      ]);
      return result;
    } catch (error) {
      throw error;
    }
  },
};

/**
 * 서버 설정.
 *
 * 기존에는 server_conf.json 의 값을 그대로 썼으나, 설치 환경마다 값이 달라지므로
 * 환경변수로 덮어쓸 수 있게 바꿨다. 우선순위는 아래와 같다.
 *
 *   환경변수  >  server_conf.json  >  이 파일의 기본값
 *
 * 환경변수를 주지 않으면 설치가이드 기본값 그대로 동작한다.
 *
 *   SERVER_HOST            이 서버의 주소 (브라우저가 접근하는 IP 또는 도메인)
 *   SECURITY_PORT          인증서버 포트            기본 33000
 *   DB_HOST                PostgreSQL 주소          기본 172.25.0.1 (도커 게이트웨이)
 *   DB_PORT                PostgreSQL 포트          기본 5432
 *   HUBSECURITY_DBNAME     인증 DB 이름             기본 hubsecurity
 *   HUBSECURITY_USERNAME   인증 DB 계정             기본 hubsecurity_manager
 *   HUBSECURITY_PASSWORD   인증 DB 비밀번호         기본 rhksflwk1!
 *   WEB_SERVER_URL         웹 주소                  기본 http://localhost:8084
 *   MAIL_ACCOUNT_ID / MAIL_ACCOUNT_PWD / MAIL_SEND_URL   메일 발송용 (사용 시)
 */

let base = {};
try {
  base = require('./server_conf.json');
} catch (e) {
  // server_conf.json 이 없어도 환경변수와 기본값으로 동작한다
}

// 값이 비어 있거나 {server ip} 같은 자리표시자면 기본값을 쓰도록 걸러낸다
function pick(envValue, fileValue, defaultValue) {
  if (envValue !== undefined && envValue !== '') return envValue;
  if (
    fileValue !== undefined &&
    fileValue !== '' &&
    !(typeof fileValue === 'string' && fileValue.indexOf('{') === 0)
  ) {
    return fileValue;
  }
  return defaultValue;
}

const env = process.env;
const serverPort = Number(pick(env.SECURITY_PORT, base.serverport, 33000));
const serverIp = pick(env.SERVER_HOST, base.serverip, 'localhost');

module.exports = {
  serverip: serverIp,
  serverport: serverPort,

  dbHost: pick(env.DB_HOST, base.dbHost, '172.25.0.1'),
  dbPort: Number(pick(env.DB_PORT, base.dbPort, 5432)),
  dbName: pick(env.HUBSECURITY_DBNAME, base.dbName, 'hubsecurity'),
  dbUserId: pick(env.HUBSECURITY_USERNAME, base.dbUserId, 'hubsecurity_manager'),
  dbUserPwd: pick(env.HUBSECURITY_PASSWORD, base.dbUserPwd, 'rhksflwk1!'),

  emailAccountId: pick(env.MAIL_ACCOUNT_ID, base.emailAccountId, ''),
  emailAccountPwd: pick(env.MAIL_ACCOUNT_PWD, base.emailAccountPwd, ''),
  emailSendUrl: pick(env.MAIL_SEND_URL, base.emailSendUrl, ''),

  token_type: pick(env.TOKEN_TYPE, base.token_type, 'JWS'),
  program_type: pick(env.PROGRAM_TYPE, base.program_type, 'general'),

  // 로그인 후 돌아갈 웹 주소. DB application.redirect_uri 와 같은 값이어야 한다.
  default_url: pick(env.WEB_SERVER_URL, base.default_url, 'http://localhost:8084'),
};

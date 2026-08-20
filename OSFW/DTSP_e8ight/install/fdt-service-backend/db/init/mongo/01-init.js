// -----------------------------------------------------------------------------
// MongoDB 최초 기동 시 1회 실행. .env 의 MONGO_USER / MONGO_PASSWORD / MONGO_DB 로
// 애플리케이션 계정을 만든다. (root 계정은 이미지가 자동 생성)
// -----------------------------------------------------------------------------
const appUser = process.env.APP_USER;
const appPassword = process.env.APP_PASSWORD;
const appDb = process.env.APP_DB;

db = db.getSiblingDB(appDb);
db.createUser({
  user: appUser,
  pwd: appPassword,
  roles: [{ role: 'readWrite', db: appDb }],
});
print(`[init] mongo: ${appDb} 사용자 ${appUser} 생성 완료`);

'use strict';
const oauth2orize = require('@poziworld/oauth2orize');
const passport = require('passport');
const openidorize =require('oauth2orize');
const openid = require('oauth2orize-openid');
const login = require('connect-ensure-login');

const jwt = require('../JWT/jwt_function');
const jwtOption = require('../JWT/jwt_conf');
const uid = require('../util/generateUid');
const ms = require('ms');
const DB = require('../util/queries');

const bcrypt = require('bcrypt');
const server = oauth2orize.createServer();
const openid_server =openidorize.createServer();

const { URL } = require('url');

const bTestLogging = false; // TODO false 로 놓을 것!

// 2026-02-09 redirect uri DB 값 JSON 배열로 변경.
// ---- redirect_uri allowlist helpers (backward compatible) ----
function parseRedirectUris(raw) {
  if (!raw) return [];

  // 1) JSON array 형태면 우선 처리: ["https://...","http://..."]
  const s = String(raw).trim();
  if (s.startsWith('[')) {
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) {
        return parsed.map(x => String(x).trim()).filter(Boolean);
      }
    } catch (e) {
      // JSON 파싱 실패 시 아래 legacy 처리로 fallthrough
    }
  }

  // 2) 콤마 구분 legacy 지원: "a,b,c"
  if (s.includes(',')) {
    return s.split(',').map(x => x.trim()).filter(Boolean);
  }

  // 3) 기존 단일 문자열
  return [s];
}

function normalizeRedirectUri(uri) {
  // OAuth 보안상: protocol/host/port/path 정확히 일치시키기 위한 정규화
  const u = new URL(uri);

  const protocol = u.protocol.toLowerCase(); // "http:" / "https:"
  const hostname = u.hostname.toLowerCase();

  // 기본 포트 보정 (명시 안 됐을 때)
  const port = u.port || (protocol === 'https:' ? '443' : '80');

  // trailing slash 제거(정규화)
  const pathname = (u.pathname || '/').replace(/\/$/, '') || '/';

  return { protocol, hostname, port, pathname };
}

function isRedirectUriAllowed(requestUri, allowedUris) {
  let reqNorm;
  try {
    reqNorm = normalizeRedirectUri(requestUri);
  } catch (e) {
    return false; // 요청 redirect_uri 자체가 URL 형식 아니면 거절
  }

  return allowedUris.some(dbUri => {
    try {
      const a = normalizeRedirectUri(dbUri);
      return (
        reqNorm.protocol === a.protocol &&
        reqNorm.hostname === a.hostname &&
        reqNorm.port === a.port &&
        reqNorm.pathname === a.pathname
      );
    } catch (e) {
      // DB에 잘못된 값이 섞여있으면 무시
      return false;
    }
  });
}
// --------------------------------------------------------------

// Client id serialization function to define user
server.serializeClient(function(client, done){
  return done(null, client.application_id_pk);
});

// Deserialization function to find client by client id
server.deserializeClient(function(client_id_pk, done){
  DB.getInfoByValue('APPLICATION','APPLICATION_ID_PK',client_id_pk, (err, res_client, cnt)=>{
    if(err || !cnt){
      return done(err);
    }
    return done(null, res_client);
  });
});

// A function to get the user's permission before issuing an access token (grant)
server.grant(openid.grant.idToken(function(client,user,done){
  var id_token;
  done(null,id_token);
}));

server.grant(openid.grant.idTokenToken(
  function(client, user, done){
    var token;
    // Do your lookup/token generation.
    // ... token =
    done(null, token);
  },
  function(client, user, req, done){
    var id_token;
    // Do your lookup/token generation.
    // ... id_token =
    console.log(id_token);
    done(null, id_token);
  }
));

openid_server.grant(oauth2orize.grant.code((client, redirectUri, user, ares, areq, done) => {
  if (bTestLogging) console.log("[GRANT:openid] client=", client);
  if (bTestLogging) console.log("[GRANT:openid] client.application_id_pk=", client && client.application_id_pk);
  if (bTestLogging) console.log(ares);

  DB.getClientsByValue('APPLICATION','APPLICATION_ID_PK', client.application_id_pk,(err,app, cnt)=>{
    if(err){
        return done(err);
    }

    if (!cnt || !app || !app[0]) {
      console.log("[GRANT:openid] client not found");
      return done(); // 거절
    }

    console.log("[GRANT:openid] code response")
    console.log('[GRANT:openid] redirectUri:', redirectUri);
    if (bTestLogging) console.log('[GRANT:openid] proto:', areq && areq.protocol, 'secure:', areq && areq.secure);
    if (bTestLogging) console.log('[GRANT:openid] x-forwarded-proto:', areq && areq.headers && areq.headers['x-forwarded-proto']);
    if (bTestLogging) console.log('[GRANT:openid] host:', areq && (areq.get ? areq.get('host') : (areq.headers && areq.headers.host)));


    // redirectUri가 없으면 바로 거절 (방어코드)
    if (!redirectUri || typeof redirectUri !== 'string') {
      console.log("[GRANT:openid] redirect_uri missing");
      return done(); // 거절
    }

    redirectUri = redirectUri.trim();
    // if(redirectUri[redirectUri.length-1]=='/'){
    //   redirectUri = redirectUri.substring(0,redirectUri.length-1);
    // }
    // let compRedirectUri;      
    // if(app[0].redirect_uri[app[0].redirect_uri.length-1]=='/'){
    //   compRedirectUri = app[0].redirect_uri.substring(0,app[0].redirect_uri.length-1);
    // } else {
    //   compRedirectUri = app[0].redirect_uri;
    // }
    // if(redirectUri != compRedirectUri){
    //   console.log("return done");
    //   return done();
    // }

    // DB 값(단일/콤마/JSON) -> 배열로 파싱
    const allowedRedirectUris = parseRedirectUris(app[0].redirect_uri);

    if (bTestLogging) console.log("[GRANT:openid] [REDIRECT CHECK] requested=", redirectUri);
    if (bTestLogging) console.log("[GRANT:openid] [REDIRECT CHECK] db=", app[0].redirect_uri);
    if (bTestLogging) console.log("[GRANT:openid] [REDIRECT CHECK] parsed=", allowedRedirectUris);    

    // 정확 비교(정규화 포함)
    if (!isRedirectUriAllowed(redirectUri, allowedRedirectUris)) {
      console.log("[GRANT:openid] redirect_uri mismatch. requested=", redirectUri);
      console.log("[GRANT:openid] allowed=", allowedRedirectUris);
      return done(); // 거절
    }

    if(client.is_trusted == false && ares.allow == true){
      console.log("[GRANT:openid] client is not trusted");
      DB.getMapInfo(client.application_id_pk, user.user_id_pk,(err,value,cnt)=>{
        if(err)
          return done(err);
        else if(!cnt){
          DB.insertMapinfo(client.application_id_pk,user.user_id_pk,(err,result)=>{
            if(err)
              return done(err);
          });
        }
      })
    }

    DB.deleteAuthCode(client.application_id_pk, user.user_id_pk, (err,result)=>{
      console.log("[GRANT:openid] delete authocode");
      if(err)
        return done(err);
      else{
        let newAuthCode = uid.getUid(32);
        let newAuthCodeInfo = {
          clientId : client.application_id_pk,
          userId : user.user_id_pk,
          code : newAuthCode,
          redirectUri : redirectUri,
        };
        DB.insertAuthCode(newAuthCodeInfo, (err,code)=>{
          if(err){
            return done(err);
          }
          return done(null, code);
        });
      }
    });
   
  });  
}));

// A function that exchanges an access token after receiving authorization from the user
console.log("exchange code ");
openid_server.exchange(oauth2orize.exchange.code((client, code, redirectUri, done) =>{
  console.log("code")
  DB.getInfoByValue('AUTHCODE','CODE',code,(err,res)=>{
    if(err)
      return done(err);
    if(client.application_id_pk !== res.authcode_fk1){
      return done(null, false);
    }
    if(redirectUri !== res.redirect_uri){
      return done(null, false);
    }
    DB.deleteToken(res.authcode_fk1,res.authcode_fk2,(err,result)=>{
      if(err)
        return done(err);
      else{
        DB.getInfoByValue('USERS','user_id_pk',res.authcode_fk2, async (err,user)=>{
        if(err)
          done(err);
        let issued_at_time = Math.floor(Date.now()/1000);
        let expire_time = (issued_at_time + (ms('3h')/1000));//*1000; //3hour
        let rexpire_time = (issued_at_time + (ms('20d')/1000)); //20days
        let type;

        (user.role.indexOf('Admin') > -1)? type = 'adminSystem' : type ='userSystem';

          let payload = {
              type : type,
              userId : user.user_id_pk,
              nickname : user.nickname,
              email : user.email,
              role : user.role
          };
          jwtOption.options.aud = client.application_id_pk;
          jwtOption.options.iat = issued_at_time;

          let token = await jwt.sign(payload,jwtOption.options);

          let idtoken = uid.getUid(50);

          let refreshToken = uid.getUid(128);

          let req = {
            token_fk1 : res.authcode_fk1,
            token_fk2 : res.authcode_fk2,
            token : idtoken,
            issued_at : issued_at_time,
            refresh_token : refreshToken,
            expire_time : expire_time,
            rexpire_time: rexpire_time // 20days
          }
          let params = {
            "access_token" : token,
            "expires_in" : expire_time,
            "refresh_expires_in" : rexpire_time
          };

          DB.insertToken(req,(err,res_token)=>{
            if(err)
              return done(err);
            else{
              DB.deleteAuthCode(res.authcode_fk1, res.authcode_fk2, (err,res)=>{
                if(err)
                  return done(err);
                return done(null,idtoken,refreshToken, params); //err, access_token, refreshtoken, params
              });
            }
          });
        });
      }
    });
  });
}));


server.grant(oauth2orize.grant.code((client, redirectUri, user, ares, areq, done) => {
  if (bTestLogging) console.log("[GRANT:server] client=", client);
  if (bTestLogging) console.log("[GRANT:server] client.application_id_pk=", client && client.application_id_pk);
  if (bTestLogging) console.log(ares);

  DB.getClientsByValue('APPLICATION','APPLICATION_ID_PK', client.application_id_pk,(err,app, cnt)=>{
    if(err){
        return done(err);
    }

    if (!cnt || !app || !app[0]) {
      console.log("[GRANT:server] client not found");
      return done(); // 거절
    }

    console.log("[GRANT:server] code response")
    console.log('[GRANT:server] redirectUri:', redirectUri);
    if (bTestLogging) console.log('[GRANT:server] proto:', areq && areq.protocol, 'secure:', areq && areq.secure);
    if (bTestLogging) console.log('[GRANT:server] x-forwarded-proto:', areq && areq.headers && areq.headers['x-forwarded-proto']);
    if (bTestLogging) console.log('[GRANT:server] host:', areq && (areq.get ? areq.get('host') : (areq.headers && areq.headers.host)));


    // redirectUri가 없으면 바로 거절 (방어코드)
    if (!redirectUri || typeof redirectUri !== 'string') {
      console.log("[GRANT:server] redirect_uri missing");
      return done(); // 거절
    }

    redirectUri = redirectUri.trim();      
    // if(redirectUri[redirectUri.length-1]=='/'){
    //   redirectUri = redirectUri.substring(0,redirectUri.length-1);
    // }
    // let compRedirectUri;
    // if(app[0].redirect_uri[app[0].redirect_uri-1]=='/'){
    //   compRedirectUri = app[0].redirect_uri.substring(0,app[0].redirect_uri.length-1);
    // } else {
    //   compRedirectUri = app[0].redirect_uri;
    // }
    // if(redirectUri != compRedirectUri){
    //   console.log("return done");
    //   return done();
    // }

    // DB 값(단일/콤마/JSON) -> 배열로 파싱
    const allowedRedirectUris = parseRedirectUris(app[0].redirect_uri);
    
    if (bTestLogging) console.log("[GRANT:server] [REDIRECT CHECK] requested=", redirectUri);
    if (bTestLogging) console.log("[GRANT:server] [REDIRECT CHECK] db=", app[0].redirect_uri);
    if (bTestLogging) console.log("[GRANT:server] [REDIRECT CHECK] parsed=", allowedRedirectUris);

    // 정확 비교(정규화 포함)
    if (!isRedirectUriAllowed(redirectUri, allowedRedirectUris)) {
      console.log("[GRANT:server] redirect_uri mismatch. requested=", redirectUri);
      console.log("[GRANT:server] allowed=", allowedRedirectUris);
      return done(); // 거절
    }
    

    if(client.is_trusted == false && ares.allow == true){
      console.log("[GRANT:server] client is not trusted");
      DB.getMapInfo(client.application_id_pk, user.user_id_pk,(err,value,cnt)=>{
        if(err)
          return done(err);
        else if(!cnt){
          DB.insertMapinfo(client.application_id_pk,user.user_id_pk,(err,result)=>{
            if(err)
              return done(err);
          });
        }
      })
    }

    DB.deleteAuthCode(client.application_id_pk, user.user_id_pk, (err,result)=>{
      console.log("[GRANT:server] delete authocode");
      if(err)
        return done(err);
      else{
        let newAuthCode = uid.getUid(32);
        let newAuthCodeInfo = {
          clientId : client.application_id_pk,
          userId : user.user_id_pk,
          code : newAuthCode,
          redirectUri : redirectUri,
        };
        DB.insertAuthCode(newAuthCodeInfo, (err,code)=>{
          if(err){
            return done(err);
          }
          return done(null, code);
        });
      }
    });

  });
}));



server.exchange(oauth2orize.exchange.code((client, code, redirectUri, done) =>{
  DB.getInfoByValue('AUTHCODE','CODE',code,(err,res)=>{
    console.log(code);
    if(err)
      return done(err);
    if(client.application_id_pk !== res.authcode_fk1){
      return done(null, false);
    }
    if(redirectUri !== res.redirect_uri){
      return done(null, false);
    }
    DB.deleteToken(res.authcode_fk1,res.authcode_fk2,(err,result)=>{
      if(err)
        return done(err);
      else{
        DB.getInfoByValue('USERS','user_id_pk',res.authcode_fk2,async (err,user)=>{
          if(err)
            done(err);
          let issued_at_time = Math.floor(Date.now()/1000);
          let expire_time = (issued_at_time + (ms('3h')/1000));//*1000; //3hour
          let rexpire_time = (issued_at_time + (ms('20d')/1000)); //20days
          let type;

          (user.role.indexOf('Admin') > -1)? type = 'adminSystem' : type ='userSystem';

          let payload = {
            type : type,
            userId : user.user_id_pk,
            nickname : user.nickname,
            email : user.email,
            role : user.role
          };
          jwtOption.options.aud = client.application_id_pk;
          jwtOption.options.iat = issued_at_time;

          let token = await jwt.sign(payload,jwtOption.options);
          let idtoken = uid.getUid(20);

          let refreshToken = uid.getUid(128);
          let req = {
            token_fk1 : res.authcode_fk1,
            token_fk2 : res.authcode_fk2,
            token : token,
            issued_at : issued_at_time,
            refresh_token : refreshToken,
            expire_time : expire_time,
            rexpire_time: rexpire_time // 20days
          }
          let params = {
            "access_token" : token,
            "expires_in" : expire_time,
            "refresh_expires_in" : rexpire_time 
          };
          DB.insertToken(req,(err,res_token)=>{
            if(err)
              return done(err);
            else{
              DB.deleteAuthCode(res.authcode_fk1, res.authcode_fk2, (err,res)=>{
                if(err)
                  return done(err);
                return done(null,idtoken,refreshToken, params); //err, access_token, refreshtoken, params
              });
            }
          });
        });
      }
    });
  });
}));

server.exchange(oauth2orize.exchange.refreshToken((client, refreshToken, scope, reqbody, done)=>{
  console.log("refresh token????");
  if(refreshToken == null)
    return done(null,false);
  DB.getRefreshToken(client.application_id_pk, refreshToken,(err,res_token, cnt)=>{
    console.log("refreshtoken")
    if(err)
      return done(err);
    if(!cnt)
      return done(null, false)
    DB.getInfoByValue('USERS','user_id_pk', res_token.token_fk2, async (err,user,cnt)=>{
      if(err)
        return done(err);
      if(!cnt)
        return done(null, false);
      let issued_at_time = Math.floor(Date.now()/1000);
      let expire_time = (issued_at_time + ms('3h')/1000);//*1000; //3hour
      let rexpire_time = (issued_at_time + ms('20d')/1000); //20days
      let type;
      (user.role.indexOf('Admin') > -1)? type = 'adminSystem' : type ='userSystem';

      let payload = {
        type : type,
        userId : user.user_id_pk,
        nickname : user.nickname,
        email : user.email,
        role : user.role
      };
      jwtOption.options.aud = client.application_id_pk;
      jwtOption.options.iat = issued_at_time;

      let token = await jwt.sign(payload,jwtOption.options);

      let req = {
        token : token,
        issued_at : issued_at_time,
        expire_time : expire_time,
        refreshToken : refreshToken
      }
      let params = {
        "expires_in" : expire_time,
        "refresh_expires_in" : rexpire_time
      };
      DB.insertTokenforRefresh(req,(err,res_token)=>{
        if(err)
          return done(err);
        else
          return done(null,token,params); //err, access_token, refreshtoken, params
      });
    });
  });
}));

server.exchange(oauth2orize.exchange.password((client, username, password, scope, done) => {
  console.log("password grant");
  DB.getInfoByValue('APPLICATION','APPLICATION_ID_PK',client.application_id_pk,(err,res_client,cnt)=>{
    if(err)
      return done(err);
    else if(!cnt)
      return done(null,false);
    else if(client.application_secret !== res_client.application_secret)
      return done(null, false);
    DB.getInfoByValue('USERS','USER_ID_PK',username,(err,user,cnt)=>{
    console.log("get info by value");
    if(err){
      console.log('Id no match');
      return done(err);
    }
    else if(!cnt)
    {
      console.log('no ID');
      return done(null, false);
    }
    else{
      // console.log(user);
      bcrypt.compare(password, user.password, function(err, result){
        if(result)
        {
          DB.deleteToken(res_client.application_id_pk, user.user_id_pk, async (err,result)=>{
            console.log(res_client.application_id_pk);
            console.log(user.user_id_pk);
            console.log("delete token result");
            console.log(result);
            if(err)
              return done(err);
            else{
              let issued_at_time = Math.floor(Date.now()/1000);
              let expire_time = (issued_at_time + ms('3h')/1000);//*1000; //3hour
              let rexpire_time = (issued_at_time + ms('20d')/1000); //20days

              let type;
              (user.role.indexOf('Admin') > -1)? type = 'adminSystem' : type ='userSystem';
              let payload = {
                  type : type,
                  userId : user.user_id_pk,
                  nickname : user.nickname,
                  email : user.email,
                  role : user.role
              };
              jwtOption.options.aud = client.application_id_pk;
              jwtOption.options.exp = expire_time;
              jwtOption.options.iat = issued_at_time;

              let token = await jwt.sign(payload,jwtOption.options);

              let refreshToken = uid.getUid(128);
              let req = {
                token_fk1 : res_client.application_id_pk,
                token_fk2 : user.user_id_pk,
                token : token,
                issued_at : issued_at_time,
                refresh_token : refreshToken,
                expire_time : expire_time,
                rexpire_time: rexpire_time // 20days
              }

              let params = {
                "expires_in" : expire_time,
                "refresh_expires_in" : rexpire_time 
              };
              console.log("insert token");

              DB.insertToken(req,(err,res_token)=>{
                // console.log(req);
                if(err)
                  return done(err);
                console.log('token confirm');
                return done(null,token,refreshToken,params); //err, access_token, refreshtoken, params
              });
            }
          });
        }
        else if(!result)
        {
          console.log("password incorrect");
          return done(null, false);
        }
      })
      }
    });
  });
}));

server.exchange(oauth2orize.exchange.clientCredentials((client, scope, done) => {
  console.log("client grand????");
  DB.getInfoByValue('APPLICATION','APPLICATION_ID_PK',client.application_id_pk,async (err,res_client, cnt)=>{
    if(err)
      return done(err);
    if(!cnt)
      return done(null, false);
    if(client.application_secret !== res_client.application_secret)
      return done(null, false);
    let issued_at_time = Math.floor(Date.now()/1000);
    let expire_time = (issued_at_time + ms('3h')/1000);//*1000; //3hour
    let payload = {
      type : 'c',
      userId: null // sign
    };
    jwtOption.options.aud = client.application_id_pk;
    jwtOption.options.iat = issued_at_time;

    let token = await jwt.sign(payload,jwtOption.options);

    let req = {
      token_fk1 : res_client.application_id_pk,
      token_fk2 : null,
      token : token,
      issued_at : issued_at_time,
      refresh_token : null,
      expire_time : expire_time,
      rexpire_time: null,
    }
    let params = {
      "expires_in" : expire_time,
    };
    DB.deleteClientToken(res_client.application_id_pk,(err,result)=>{
      if(err)
        return done(err);
      else{
        DB.insertToken(req,(err,res_token)=>{
        if(err)
          return done(err);
        else
          return done(null,token, params);
        });
      }
    })
  });
}));

module.exports.authorization = [
  login.ensureLoggedIn(),
  server.authorization((clientId, redirectUri, done)=>{
    console.log("ensureed loggendin ");
    DB.getInfoByValue('APPLICATION', 'APPLICATION_ID_PK', clientId,(err, client, cnt)=>{
      if(!cnt){
        return done(null,false);
      }
      if(err){
        return done(err);
      }
      // WARNING: For security purposes, it is highly advisable to check that
      //          redirectUri provided by the client matches one registered with
      //          the server. For simplicity, this example does not. You have
      //          been warned.
      console.log("ClientId mathched");
      return done(null, client, redirectUri);
    });
  },
  (client, user, done)=>{
    DB.getInfoByValue('APPLICATION', 'APPLICATION_ID_PK', client.application_id_pk,(err, res_client, cnt)=>{
    // Check if grant request qualifies for immediate approval
      if(err){
        return done(err);
      }
      //Auto-approve
      if(res_client.is_trusted === true){
        return done(null, true);
      }
      DB.getMapInfo(client.application_id_pk, user.user_id_pk,(err, result, cnt)=>{
        if(err)
          return done(err);
        else if(!cnt)
          return done(null, false);
        else
          return done(null, true);
      })
    });
  }),
  (req, res)=>{
    console.log("res.render(decision)")
    res.render('oauth2.0/decision',{ title: '정보 접근 요청',transactionId: req.oauth2.transactionID, user: req.user, client: req.oauth2.client });
  }
];

module.exports.decision = [
    login.ensureLoggedIn(),
    server.decision(),
];

module.exports.token = [
    passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),
    server.token(),
    server.errorHandler(),
];




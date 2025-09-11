import cookie from 'js-cookie'

import axios from 'axios';
import jwt from 'jwt-decode'
import util from 'util';

import { Base64 } from 'js-base64';

import { isEmpty } from "@/assets/js/common.js";
import router from '@/router'

const enable_logging = false;

var _axios = axios.create({
    baseURL: process.env.VUE_APP_N2M_AUTH_URI
});

const getAuth = async (code) => {

    let body = {
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.VUE_APP_N2M_REDIRECT_URI,
        client_id: process.env.VUE_APP_N2M_AUTH_CLIENT_ID,
        client_secret: process.env.VUE_APP_N2M_AUTH_CLIENT_SECRET
    }
    if (enable_logging) console.log('Get Token Body:')
    if (enable_logging) console.log(body)

    const response = await _axios.post('/oauth2.0/token', body, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        timeout: 60 * 1000,
    });

    if (enable_logging) console.log('Success Token')
    if (enable_logging) console.log(response.data)

    cookie.set('token', response.data.access_token, { expires:  new Date(response.data.expires_in * 1000) });
    // cookie.set('refresh_token', response.data.refresh_token, { expires: response.data.refresh_expires_in });

    // TODO 2024-11-20 고객 요청 임시 로그인 패스용
    if (enable_logging) console.log('sessionStorage token - remove3!');
    sessionStorage.removeItem("meta-tk"); // 정상적인 로그인 경우 삭제
    
    let data = {
        refreshToken : response.data.refresh_token,
        refreshExpires : response.data.refresh_expires_in,
        userId : getLoginUserId(),
        userNm : getUser().name,
    }

    let sendData = await axios.post('/api/admin/session/login',data);
    if(sendData.status != 200) return null;

    return response.data
}

const getRefreshAuth = async () => {
    let body = {
        grant_type: 'refresh_token',
        refresh_token: cookie.get('refresh_token'), //이것도 다시 체크 백엔드 보내서 response 받는 로직 만들기
    }
    if (enable_logging) console.log('1- Get Token Body:')
    if (enable_logging) console.log(body)
    const response = await _axios.post('/oauth2.0/token', body, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + Base64.encode(process.env.VUE_APP_N2M_AUTH_CLIENT_ID + ':' + process.env.VUE_APP_N2M_AUTH_CLIENT_SECRET)
        },
        timeout: 60 * 1000,
    });

    if (enable_logging) console.log('Success Refresh Token')
    if (enable_logging) console.log(response.data)
    
    cookie.set('token', response.data.access_token, { expires: new Date(response.data.expires_in) });
    // cookie.set('refresh_token', response.data.refresh_token, { expires: response.data.refresh_expires_in });

    return response.data;
}

export const hasRefreshToken =async () => {
    //없을 경우 refresh가 있는지 체크 -> 백엔드에서 체크 쿠키 토큰 없음 + 리프레시 토큰 x or 만료
    if (process.env.VUE_APP_USE_REFRESH_TOKEN == 'true') {
        let checkRefreshToken = await axios.get('/api/admin/session/hasRefreshToken');
        return checkRefreshToken.data;
    } else return false;
}

export const isAuthenticated = async() => {
    return (!isEmpty(getToken()));  //토큰이 비어있는가? yes ->false
}

export const redirectLoginView = () => {
    window.location.href = util.format("%s/oauth2.0/authorize?response_type=code&redirect_uri=%s&client_id=%s&state=&"
                    , process.env.VUE_APP_N2M_AUTH_URI
                    , process.env.VUE_APP_N2M_REDIRECT_URI
                    , process.env.VUE_APP_N2M_AUTH_CLIENT_ID
                    , '');
}

export const requestAuthToken = async (code) => {
    let token = getToken();

    if (isEmpty(token)) {
        if (code) {
            if (enable_logging) console.log('Get Token')
            try {
                //새로운 token정보를 가져오는 것이 아닌 백엔드에서 access token정보를 가져와야함.
                const authInfo = await getAuth(code);
                if (enable_logging) console.log(authInfo)
                token = getToken();
            }
            catch (error) {
                console.log('Get Token Error')
                console.log(error)
            }
        }
    }
    return token;
}

export const setAccessToken = async () => {
    let token = getToken();

    if (isEmpty(token)) {
        try{
            let checkRefreshToken = await hasRefreshToken();
            if(checkRefreshToken){    
                const authInfo = await axios.get('/api/admin/session/getAccessTokenCookie', {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': 'Basic ' + Base64.encode(process.env.VUE_APP_N2M_AUTH_CLIENT_ID + ':' + process.env.VUE_APP_N2M_AUTH_CLIENT_SECRET)
                    },
                });
                if (enable_logging) console.log(authInfo);
                token = authInfo.data;
                
            }
        }
        catch(error){
            console.log('Get Access Token Error')
            console.log(error)
        }
    }
    return token;
}

export const getLoginUserId = () => {
    let token = getToken();

    if (isEmpty(token)) return '';

    const tokenInfo = jwt(token);
    if (!tokenInfo || Object.keys(tokenInfo).length <= 0) return '';

    return tokenInfo.userId;
}

export const checkToken = async () => {
    let token = getToken();

    if (isEmpty(token)) { return ''; }
    else {
        const info = jwt(token);
        if (enable_logging) console.log(info);

        const exp = info.exp;
        if (exp < (new Date().getTime() + 1) / 1000) {
            token = '';

            if (enable_logging) console.log('Expired Token');
            if (enable_logging) console.log('expired');

            try {
                const authInfo = await getRefreshAuth();
                token = getToken();
            }
            catch (error) {
                console.log('refresh')
                console.log(error)
                await logout();
            }
        }
    }

    return token;
}

export const logout = async (flagMove) => {
    console.log('logout called');
    // TODO 2024-11-20 고객 요청 임시 로그인 패스용
    if (enable_logging) console.log('sessionStorage token - remove1!');
    sessionStorage.removeItem("meta-tk");

    try {
        let deleteRefreshToken = await axios.delete('/api/admin/session/logout');
        //if (enable_logging) console.log(deleteRefreshToken);    
        if(deleteRefreshToken) {
            if (enable_logging) console.log('logout - deleteRefreshToken 존재');    
            try {
                if(getToken() != null) {
                    const info = jwt( getToken() );
                    console.log('Logout: ' + info.userId)
            
                    let body = { userId: info.userId, }
                    await _axios.post('/security/logout', body, {
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + getToken()
                        },
                        timeout: 60 * 1000,
                    })
                    
                    cookie.remove('token')
                    let pairs = document.cookie.split(";");
                    let cookies = {};
                    for (let i=0; i<pairs.length; i++){
                        let pair = pairs[i].split("=");
                        cookies[(pair[0]+'').trim()] = unescape(pair.slice(1).join('='));
                    }
                    
                    for (let cookieKey in cookies) {
                        if (cookies.hasOwnProperty(cookieKey)) {
                        // Remove the cookie by setting its expiration to a past date
                        document.cookie = cookieKey + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                        }
                    }           

                    
                    if (flagMove) { redirectLoginView(); }
                }
            } catch (error) {
                console.log('Logout error1')
                console.log(error)
                if(getToken() != null) {
                    cookie.remove('token')
                }
                if (flagMove) { redirectLoginView(); }
            }
        } else {
            if (flagMove) { redirectLoginView(); }
        }

    } catch (error) {
        console.log('Logout error')
        console.log(error)
        if(getToken() != null) {
            cookie.remove('token')
        }
        if (flagMove) { redirectLoginView(); }
    }        
}

// 2024-11-20 cookie.get('token') 대신 함수 사용
export const getToken = () => {
    //return cookie.get('token')
    let token = cookie.get('token') || null;

    //if (enable_logging) console.log(`cookie.get('token') : ${cookie.get('token')}`);
    // TODO 2024-11-20 고객 요청 임시 로그인 패스용
    if (!token && process.env.VUE_APP_METADATA_TEMP_LOGIN_PASS_YN === 'Y' && process.env.VUE_APP_METADATA_TEMP_LOGIN_USER_ID) {
        //if (enable_logging) console.log(`sessionStorage token - get! : ${sessionStorage.getItem("meta-tk")}`);
        token = sessionStorage.getItem("meta-tk");
        if (!validateToken(token)) {
            token = null;
        }
    }
    if (sessionStorage.getItem("meta-tk") && (process.env.VUE_APP_METADATA_TEMP_LOGIN_PASS_YN !== 'Y' || !process.env.VUE_APP_METADATA_TEMP_LOGIN_USER_ID)) {
        if (enable_logging) console.log('sessionStorage token - remove!');
        sessionStorage.removeItem("meta-tk");
    }

    return token;
}

// 2024-11-20 token 유효일시 확인. 토큰에 있으면 자연 삭제될 테지만, 스토리지 넣는 경우 체크.
export const validateToken = (token) => {
    if (isEmpty(token)) return false;

    const info = jwt(token);
    if (!info) return false;

    const exp = info.exp;
    const curr = (new Date().getTime() + 1) / 1000;
    if (enable_logging) console.log(`exp: ${exp}  curr: ${curr}`);
    if (exp < curr) {
        if (enable_logging) console.log('Expired Token');
        return false;
    }

    return true;
}

export const getUser = () => {
    const info = jwt( getToken() );
    return { id: info.userId, name: info.nickname }
}

export const getUsers = async () => {
    const { data } = await _axios.get('/security/users', {
        headers: {
            'Authorization': 'Bearer ' + getToken()
        }
    });
    return data;
}

export const setTokenFromRefreshToken = async() =>{
    const data = await getRefreshAuth();
    return data;
}

// TODO 2024-11-06 고객 요청 임시 로그인 패스용 !!!!!!!!!!!!!!!!! 나중에 삭제 할 것 !!!!!!!!!!!!!!!
export const tempLoginPass = async () => {
    if (enable_logging) console.log('tempLoginPass -----------------');
    console.log(`VUE_APP_METADATA_TEMP_LOGIN_PASS_YN : ${process.env.VUE_APP_METADATA_TEMP_LOGIN_PASS_YN}`);
    if (enable_logging) console.log(`VUE_APP_METADATA_TEMP_LOGIN_USER_ID : ${process.env.VUE_APP_METADATA_TEMP_LOGIN_USER_ID}`);

    if (process.env.VUE_APP_METADATA_TEMP_LOGIN_PASS_YN !== 'Y') return;
    if (process.env.VUE_APP_METADATA_TEMP_LOGIN_USER_ID) {

        // 현재 로그인 되어 있다면 로그아웃 처리
        await logout(false);
        if (enable_logging) console.log('sessionStorage token - remove2!');
        sessionStorage.removeItem("meta-tk");
      
        // 임시 로그인 처리
        try {
            const tempId = process.env.VUE_APP_METADATA_TEMP_LOGIN_USER_ID;
            const response = await _axios.get(`/security/token/${tempId}`, { // TODO 2024-11-06 고객 요청 임시 로그인 패스용 !!!!!!!!!!!!!!!!! 나중에 삭제 할 것 !!!!!!!!!!!!!!!
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                timeout: 60 * 1000,
            });
        
            if (enable_logging) console.log('Success Temp Token');
            //if (enable_logging) console.log(response.data);
        
            cookie.set('token', response.data.access_token, { expires:  new Date(response.data.expire_time * 1000) });
            if (enable_logging) console.log('sessionStorage token - set!');
            sessionStorage.setItem("meta-tk", response.data.access_token);
            if (enable_logging) console.log('cookie set');
            //if (enable_logging) console.log(`cookie get : ${getToken()}`);

            let data = {
                refreshToken : response.data.refresh_token,
                refreshExpires : response.data.refresh_expires_in,
                userId : getLoginUserId(),
                userNm : getUser().name,
            }

            let sendData = await axios.post('/api/admin/session/login',data);
            console.log(`임시 로그인 처리`);

        } catch (err) {
            console.error(err);
            console.log(`임시 로그인 처리 중 오류 발생!`);
        }
    } 
}

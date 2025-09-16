/**
 * 메타 - 알림 - 웹소켓 Util
 * 
 * 1개의 연결만 하도록 만듬. 레이아웃(헤더)에서 사용. 여러 곳에서 사용하면 안됨.
 */
import SockJS from "sockjs-client";
import Stomp from 'webstomp-client';
import { getUser, isAuthenticated } from "@/assets/js/auth.js";
import ApiUrls from "@/assets/json/ApiUrls.json";
import { ElNotification } from "element-plus";

const AUTO_DISCONNECT_TIME = 10 * 60 * 1000; // 10분 설정
let _stompClient = null;
let _mySettingList = [];

let _$store = null;
let _$axios = null;
let _$emitter = null;

const myLog = (msg) => {
  console.log(msg); // 필요시 이 부분 주석 처리
}
 
const isConnected = () => {
  return (_stompClient != null && _stompClient.connected);
}

const connect = (myUser, $store, $axios, $emitter) => {
  return new Promise((resolve, reject) => {
    //myLog('connect...');

    try {

      if (!myUser || !myUser.id) {
        alert('사용자 정보가 제대로 설정되지 않았습니다.');
        throw new Error('사용자 정보가 제대로 설정되지 않았습니다.');
      }  
      if (!ApiUrls) {
        alert('URL이 제대로 설정되지 않았습니다.');
        throw new Error('URL이 제대로 설정되지 않았습니다.');
      }
      if (!$store) {
        alert('store가 제대로 설정되지 않았습니다.');
        throw new Error('store가 제대로 설정되지 않았습니다.');
      }      
      if (!$axios) {
        alert('axios가 제대로 설정되지 않았습니다.');
        throw new Error('axios가 제대로 설정되지 않았습니다.');
      }
      if (!$emitter) {
        alert('emitter가 제대로 설정되지 않았습니다.');
        throw new Error('emitter가 제대로 설정되지 않았습니다.');
      }      

      _$store = $store;      
      _$axios = $axios;
      _$emitter = $emitter;
      $store.commit('MetaStore/setStompRequireds', { $axios, $emitter });

      if (isConnected()) {
        myLog(`connect 소켓 연결이 이미 되어있습니다. : ${_stompClient.ws._server}`);
        resolve(true);
      }

      const stompOptions = { debug: false }; // debug 안 찍는 방법1
      const wsServerUrl = ApiUrls.meta.portal.stomp.connect;
      let socket = new SockJS(wsServerUrl);
      _stompClient = Stomp.over(socket, stompOptions);
      //_stompClient.debug = () => {}; // debug 안 찍는 방법2
      myLog(`new _stompClient: ${_stompClient.ws._server}`);
      //myLog(_stompClient);
      $store.commit('MetaStore/pushStompClient', _stompClient);
      myLog(`소켓 연결을 시도합니다. 서버 주소: ${wsServerUrl}`);

      // connect(login, passcode, connectCallback, errorCallback)
      // connect(headers, connectCallback, errorCallback)
      _stompClient.connect(
        {},
        async frame => {
          // 소켓 연결 성공
          myLog('[소켓 연결이 되었습니다.]');

          // 사용자별알림설정 으로 구독
          const res = await $axios.get(ApiUrls.meta.portal.mypage.getMyNotifcSettingList, { params: { isPaging: false } });
          _mySettingList = res.data.list;
          myLog(`내 설정 목록 : ${_mySettingList == null ? 0 : _mySettingList.length} 건`);
          let subCnt = 0;
          if (_mySettingList) {
            subCnt = _mySettingList.filter(x => x.notifcRcvYn === 'Y').length;
          }
          myLog(`내 알림 유형 : ${subCnt} 건`);
          if (subCnt > 0) {
            // 알림 메시지 구독
            _stompClient.subscribe(`/sub/notifc/user/${myUser.id}`, onNotifcMessage);
            myLog(`[구독] /sub/notifc/${myUser.id}`);
          }

          // 전체 알림 구독
          _stompClient.subscribe('/sub/notifc/all', onAllNotifcMessage);
          myLog('[구독] /sub/notifc/all');

          // 일정 시간이 지나고 token 값이 없으면 연결 종료
          setTimeout(disconnectAuto, AUTO_DISCONNECT_TIME);

          resolve(true);
        },
        error => {
          // 소켓 연결 실패
          console.log('[소켓 연결 끊김]', error);        
          //myLog('[소켓 연결이 끊어졌습니다.]');
          reject(new Error(error?.message || JSON.stringify(error)));
        }    
      );

    } catch (e) {
      myLog(e.message);
      reject(new Error(e?.message || JSON.stringify(e)));
    }

  });   
};

const tryConnect = async (myUser, $store, func) => {
  //myLog('tryConnect...');

  // 혹시나 현재 client 를 제외하고 연결된 것이 남아 있으면 제거
  $store.commit('MetaStore/removeAllStompClients', _stompClient);

  if (!isConnected()) {
    if (!_$axios || !_$emitter) {
      myLog('getStompRequireds...');
      const { $axios, $emitter } = $store.getters['MetaStore/getStompRequireds'];
      _$axios = $axios;
      _$emitter = $emitter;
    }

    await connect(myUser, $store, _$axios, _$emitter);
  }

  func();
}

const sendMsg = (myUser, msgCont, $store) => {
  return new Promise((resolve) => {
    //myLog('sendMsg...');
    try {
      tryConnect(myUser, $store, () => {
        myLog(`[발신] >>> ${JSON.stringify(msgCont)}`);  
        // send(destination, body='', headers={})
        _stompClient.send('/pub/notifc/send', JSON.stringify(msgCont), {});

        resolve(true);
      });
    } catch (e) {
      console.error('[sendMsg Error]', e);
 
      resolve(false);
    }
  });   
}

const sendMsgToAll = (myUser, msg, $store) => {
  return new Promise((resolve) => {
    //myLog('sendMsgToAll...');
    try {
      tryConnect(myUser, $store, () => {
        myLog(`[전체 알림 발신] >>> ${msg}`);
        // send(destination, body='', headers={})
        _stompClient.send('/pub/notifc/sendall', msg, {});
        resolve(true);
      });
    } catch (e) {
      console.error('[sendMsgToAll Error]', e);
      resolve(false);
    }
  });   
}

// 알림 메시지 수신
const onNotifcMessage = (res) => {
  myLog('onNotifcMessage...');  
  myLog(`[수신] <<< ${res.body}`);

  const msgBody = JSON.parse(res.body);
  const notifcTypeId = msgBody.notifcTypeId;
  const settingInfo = _mySettingList.find(x => x.notifcTypeId === notifcTypeId);

  // 알림 아이콘 변경
  if (_$emitter) {
    _$emitter.emit("Alarm.onNotifcChanged");
  }

  // 알림 팝업
  if (settingInfo && settingInfo.notifcPopupYn === 'Y') {
    const notifcMsg = msgBody.notifcMsg.replaceAll("\n", "<br>");

    ElNotification({
      // title: "[알림]",
      type: "info",
      message: notifcMsg,
      duration: 4000,
      style: "width:450px;",
      dangerouslyUseHTMLString: true,
    });
  }
};

// 전체 메시지 수신 (단순 전체 알림 팝업)
const onAllNotifcMessage =  (res) => {
  myLog('onAllNotifcMessage...');  
  myLog(`[전체 알림 수신] <<< ${res.body}`);

  const msgBody = JSON.parse(res.body);
  const notifcMsg = msgBody.notifcMsg.replaceAll("\n", "<br>");

  ElNotification({
    title: "[전체 알림]",
    type: "info",
    message: notifcMsg,
    duration: 4000,
    style: "width:450px;",
    dangerouslyUseHTMLString: true,
  });
}

// 일정 시간이 지나고 세션에 token 값이 없으면 연결 종료
const disconnectAuto = async () => {
  myLog('disconnectAuto...');
  if (_stompClient != null) {
    if (await isAuthenticated()) {
      setTimeout(disconnectAuto, AUTO_DISCONNECT_TIME);
    } else {
      disconnectWs();
    }
  }
}

// getUser 시도. 토큰 에러시 메시지 alert
const tryGetUser = () => {
  let user = null;
  try {
    user = getUser();
  } catch (e) {
    console.debug('getUser Error', e);
    alert('사용자 토큰이 유효하지 않습니다. 다시 로그인해 주십시오.');    
  }
  return user;
}

/**
 * 웹소켓 연결
 * @param $axios 
 * @param $store
 * @param $emitter
 */
const connectWs = ($axios, $store, $emitter) => {
  const user = tryGetUser();
  connect(user, $axios, $store, $emitter);
}

/** 
 * 웹소켓 연결 종료
 */
const disconnectWs = () => {
  //myLog('disconnectWs...');
  if (_$store) {
    // 혹시나 현재 client 를 제외하고 연결된 것이 남아 있으면 제거
    _$store.commit('MetaStore/removeAllStompClients', _stompClient);
  }

  if (isConnected()) {
    // disconnect(disconnectCallback, headers={})
    _stompClient.disconnect(() => {
      myLog('[소켓 연결 종료(1)]'); 
      _stompClient = null;
    });
  } else {
    myLog('[소켓 연결 종료(2)]');
    _stompClient = null;
  }
}

/**
 * 알림 메시지 발송 (알림 메시지 저장)
 * @param $store
 * @param notifcData   
 * ex) { notifcTypeId: 'NTP_RES_QNA_DEFAULT',
 *   notifcRqtrDivMtcd: 'user', // auth / user
 *   notifcRqtrId: user.id,
 *   notifcRqtrNm: user.nm
 * }
 * @param notifcParams 
 * @param sendCallback 
 */
const sendNotifc = async ($store, notifcData, notifcParams, sendCallback, failCallback) => {
  myLog('sendNotifc...');
  if (!notifcData.notifcTypeId) { 
    alert('notifcData.notifcTypeId 필수 값입니다.'); 
    return;
  }

  const user = tryGetUser();
  const msgCont = {
    notifcTypeId: notifcData.notifcTypeId,
    connUserId: user.id,
    connUserNm: user.name,
    notifcRqtrDivMtcd: notifcData.notifcRqtrDivMtcd, // auth / user
    notifcRqtrId: notifcData.notifcRqtrId,
    notifcRqtrNm: notifcData.notifcRqtrNm,
    notifcParams: notifcParams
  };

  let isSucc = await sendMsg(user, msgCont, $store);
  if (isSucc) {
    myLog('[sendNotifc 성공]');   
    if (typeof sendCallback === "function") sendCallback();
  } else {
    myLog('[sendNotifc 실패]');   
    if (typeof failCallback === "function") failCallback();
  }
}

/**
 * 전체 알림 메시지 (알림 메시지 저장 되지 않고 알림만 감)
 * @param $store
 * @param msg 
 * @param sendCallback 
 * @param failCallback 
 */
const sendNotifcToAll = async ($store, msg, sendCallback, failCallback) => {
  myLog('sendNotifcToAll...');
  const user = tryGetUser();

  let isSucc = await sendMsgToAll(user, msg, $store);
  if (isSucc) {
    myLog('[sendNotifcToAll 성공]');   
    if (typeof sendCallback === "function") sendCallback();
  } else {
    myLog('[sendNotifcToAll 실패]');   
    if (typeof failCallback === "function") failCallback();
  }
}

export default {
  connectWs,       // 웹소켓 연결
  disconnectWs,    // 웹소켓 연결 종료
  sendNotifc,      // 알림 메시지 발송 (알림 메시지 저장)
  sendNotifcToAll, // 전체 알림 메시지 (알림 메시지 저장 되지 않고 알림만 감)
}
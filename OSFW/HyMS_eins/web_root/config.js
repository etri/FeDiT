// =============================================================================
//  web_root/config.js  -  배포 서버(simulation.fedit.or.kr) 설정
//
//  주의 : 현재 index.html 은 이 파일을 로드하지 않는다(미사용).
//         Keycloak 연동을 활성화할 때 <script src="config.js"></script> 를
//         index.html 의 다른 스크립트보다 먼저 추가하면 된다.
//
//  API / WebSocket 주소는 하드코딩하지 않고 현재 페이지 기준으로 계산한다.
//  (http -> ws, https -> wss / /simulation 경로 프리픽스 유지)
// =============================================================================
(function () {
  var basePath = location.pathname.replace(/\/[^\/]*$/, '');   // 예: /simulation
  var wsProto  = (location.protocol === 'https:') ? 'wss://' : 'ws://';

  window.appConfig = {
    // 배포 서버
    serverHost:   location.hostname,            // simulation.fedit.or.kr
    basePath:     basePath,                     // /simulation
    apiServerip:  location.hostname,
    apiServerUrl: location.origin + basePath,   // https://simulation.fedit.or.kr/simulation
    simServerUrl: location.host + basePath,     // simulation.fedit.or.kr/simulation
    simWsUrl:     wsProto + location.host + basePath + '/sim',
    modelWsUrl:   wsProto + location.host + basePath + '/model',

    // 외부 시스템이 이산사건 시뮬레이터 REST API 를 호출할 때 쓰는 주소
    //   GET <DISCRETE_SIMULATOR_URL>/api/sim/run?id=&projectname=&end_t=
    DISCRETE_SIMULATOR_URL: 'https://simulation.fedit.or.kr',
    SIM_RUN_API: location.origin + basePath + '/api/sim/run',

    // Keycloak (변경 시 Keycloak 서버 설정과 동기화 필요)
    KEYCLOAK_SERVER_URL: 'https://dev.kdtlab.kr',
    CONTENT_URL: 'https://dev.kdtlab.kr',
    KEYCLOAK_REALM: "waiser",
    KEYCLOAK_CLIENT_ID: "waiser-server"
  };
})();

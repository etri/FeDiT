//import $ from 'jquery';

let SHWebSocket = function (view, VIZCore) {
    let scope = this;

    let wsURL = "";
    let clientSocket;
    this.IsConnected = false;
    let sendStatus = undefined;

    // 내 캐릭터 정보 - 자료구조
    let myPlayer;

    // 다른 플레이어 정보
    let playerArray = [];
    let lastPlayerProcessTime = 0;

    // 채팅 수정 추가
    // 보내기
    let charReceiveUserID = 0;
    let chatReceiveBuff = "";
    let chatReceiveBuffArr = [];

    init();

    function init() {
        //wsURL = "127.0.0.1:8901";
        wsURL = "ws://localhost:8989/";
    }

    this.PlayerSocket = function () {
        let item = {
            ID: -1, //접속 이후 반환
            name: "",
            avatarID: -1, //num
            avatarUUID: undefined, //로컬 ID

            fileDataID: undefined, //다운로드 전 ID
            //fileData: undefined, //다운로드 전 ID

            position: new VIZCore.Vector3(),
            zAngle: 0,

            TrgPosition: new VIZCore.Vector3(),
            TrgZAngle: 0,

            MoveOffset: new VIZCore.Vector3(),

            chat: "",
            review: undefined //Chat Review
        };

        return item;
    };



    //////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    //  패킷 전송 함수들
    //
    function SendMyName() // 내 이름 보낸다
    {
        if (!scope.IsConnected) return;

        let sendBuff = new ArrayBuffer(256);
        let dataview = new DataView(sendBuff);

        let offset = 0;

        // 패킷 아이디
        let packetID = 10;    // 내 이름
        {
            dataview.setInt8(offset, packetID, true);
            offset += 1;
        }

        // 캐릭터 이름
        {
            let charNameArr = toUTF8Array(myPlayer.name);
            let arrLen = charNameArr.length;

            dataview.setInt8(offset, arrLen, true);
            offset += 1;

            for (let i = 0; i < arrLen; i++) {
                dataview.setUint8(offset, charNameArr[i]);
                offset++;
            }
        }

        // 메세지  보낸다
        clientSocket.send(dataview);

        //writeToScreen("SENT: Player Name");
    }

    //서버 상태 송신
    function SendMyStatus() {
        if (!scope.IsConnected) return;
        if (myPlayer === undefined) return;
        if (view.Control.GetMode() !== VIZCore.Enum.CONTROL_STATE.WALKTHROUGH) return; //Walkthrough 모드에서만 통신

        let avatar = view.Avatar.GetObject();
        if (avatar === undefined) return; //아바타 없음
        if (avatar.direction.length() === 0) return; // 방향이 없음

        // 보내기 데이터

        // 패킷 아이디 : 1바이트
        // 아바타 아이디 : 1바이트
        // 위치 : 12바이트
        // 방향 : 4바이트

        // 합 : 19바이트

        let sendBuff = new ArrayBuffer(32);
        let offset = 0, strOffset = 0;

        let dataview = new DataView(sendBuff);
        let buffStr = new Uint16Array(sendBuff);

        // 패킷 아이디
        let packetID = 20;
        {
            dataview.setInt8(offset, packetID, true);
            offset += 1;
        }

        // 아바타 아이디
        {
            dataview.setInt8(offset, myPlayer.avatarID, true);
            offset += 1;
        }

        // 위치, 방향
        {
            myPlayer.position.copy(avatar.position);
            //myPlayer.zAngle = new VIZCore.Vector3().angleTo(myPlayer.direction);

            myPlayer.zAngle = avatar.direction.get2DAngle();

            //for (let i = 0; i < 3; i++) {
            //    dataview.setFloat32(offset, myPlayer.vCurrentPos[i], true);
            //    offset += 4;
            //}

            dataview.setFloat32(offset, myPlayer.position.x, true);
            offset += 4;
            dataview.setFloat32(offset, myPlayer.position.y, true);
            offset += 4;
            dataview.setFloat32(offset, myPlayer.position.z, true);
            offset += 4;

            dataview.setFloat32(offset, myPlayer.zAngle, true);
            offset += 4;
        }

        // 메세지  보낸다
        clientSocket.send(dataview);
    }


    function SendMyChatting(szChattingText) {
        // 보내기 데이터

        // 패킷 아이디 : 1바이트
        // 아바타 아이디 : 1바이트
        // 위치 : 12바이트
        // 방향 : 4바이트

        // 합 : 19바이트

        let sendBuff = new ArrayBuffer(256);
        let offset = 0, strOffset = 0;

        let dataview = new DataView(sendBuff);
        let buffStr = new Uint16Array(sendBuff);

        // 패킷 아이디
        let packetID = 30;
        {
            dataview.setInt8(offset, packetID, true);
            offset += 1;
        }

        // 채팅 내용
        {
            let charChatArr = toUTF8Array(szChattingText);
            let arrLen = charChatArr.length;

            dataview.setInt8(offset, arrLen, true);
            offset += 1;

            for (let i = 0; i < arrLen; i++) {
                dataview.setUint8(offset, charChatArr[i]);
                offset++;
            }
        }

        // 메세지  보낸다
        clientSocket.send(dataview);
    }

    // 채팅 수정 추가
    function SendMyChatting2(szChattingText) {
        // 보내기 데이터

        // 패킷 아이디 : 1바이트
        // 아바타 아이디 : 1바이트
        // 위치 : 12바이트
        // 방향 : 4바이트

        // 합 : 19바이트
        let charTestArr = toUTF8Array(szChattingText);
        let packetLen = 1 + 2 + charTestArr.length;

        let sendBuff = new ArrayBuffer(packetLen);
        let offset = 0, strOffset = 0;

        let dataview = new DataView(sendBuff);

        // 패킷 아이디
        let packetID = 50;
        {
            dataview.setInt8(offset, packetID, true);
            offset += 1;
        }

        // 채팅 내용
        {
            let charChatArr = toUTF8Array(szChattingText);
            let arrLen = charChatArr.length;

            dataview.setInt16(offset, arrLen, true);
            offset += 2;

            for (let i = 0; i < arrLen; i++) {
                dataview.setUint8(offset, charChatArr[i]);
                offset++;
            }
        }

        // 메세지  보낸다
        clientSocket.send(dataview);
    }


    function toUTF8Array(str) {
        let utf8 = [];
        for (let i = 0; i < str.length; i++) {
            let charcode = str.charCodeAt(i);
            if (charcode < 0x80) utf8.push(charcode);
            else if (charcode < 0x800) {
                utf8.push(0xc0 | (charcode >> 6),
                    0x80 | (charcode & 0x3f));
            }
            else if (charcode < 0xd800 || charcode >= 0xe000) {
                utf8.push(0xe0 | (charcode >> 12),
                    0x80 | ((charcode >> 6) & 0x3f),
                    0x80 | (charcode & 0x3f));
            }
            // surrogate pair
            else {
                i++;
                charcode = ((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff)
                utf8.push(0xf0 | (charcode >> 18),
                    0x80 | ((charcode >> 12) & 0x3f),
                    0x80 | ((charcode >> 6) & 0x3f),
                    0x80 | (charcode & 0x3f));
            }
        }
        return utf8;
    }

    function getStringUTF8(dataview, offset, length) {
        let s = '';

        for (let i = 0, c; i < length;) {
            c = dataview.getUint8(offset + i++);
            s += String.fromCharCode(
                c > 0xdf && c < 0xf0 && i < length - 1
                    ? (c & 0xf) << 12 | (dataview.getUint8(offset + i++) & 0x3f) << 6
                    | dataview.getUint8(offset + i++) & 0x3f
                    : c > 0x7f && i < length
                        ? (c & 0x1f) << 6 | dataview.getUint8(offset + i++) & 0x3f
                        : c
            );
        }

        return s;
    }


    //////////////////////////////////////////////////////////////////////////////////////////////////////

    function onOpen(evt) {
        //writeToScreen("CONNECTED");
        scope.IsConnected = true;
        console.log("CONNECTED");
    }


    function onClose(evt) {
        //writeToScreen("DISCONNECTED");
        //console.log(evt);
        scope.IsConnected = false;
        console.log("DISCONNECTED");
    }



    ///**
    // * 서버 접속
    // * @param {String} url
    // * @param {SHWebSocket.PlayerSocket()} item
    // */
    this.Connected = function (url, item) {

        // 접속 이전 유저 등록
        if (item !== undefined)
            scope.SetPlayer(item);

        //없는 경우 기본 등록된 URL
        if (url === undefined)
            url = wsURL;

        wsURL = url;

        clientSocket = new WebSocket(wsURL);
        clientSocket.onopen = function (evt) { onOpen(evt) };
        clientSocket.onclose = function (evt) { onClose(evt) };
        clientSocket.onmessage = function (evt) { onMessage(evt) };
        clientSocket.onerror = function (evt) { onError(evt) };

    };

    ///**
    // * 서버 접속 해제
    // * */
    this.Disconnected = function () {

        if (clientSocket === undefined) return;
        if (!scope.IsConnected) return;

        clientSocket.close();

        if (sendStatus !== undefined)
            clearInterval(sendStatus)
        sendStatus = undefined;

    };

    ///**
    // * 현재 유저 등록
    // * @param {SHWebSocket.PlayerSocket()} item
    // */
    this.SetPlayer = function (item) {
        //연결 전 정보 등록
        if (scope.IsConnected) return;

        myPlayer = item;
    };

    //현재 유저 위치 및 방향
    this.UpdatePlayerState = function (position, zAngle) {
        if (myPlayer === undefined) return;

        myPlayer.position.copy(position);
        myPlayer.zAngle = zAngle;
    };

    //현재 유저 채팅박스 위치 업데이트
    this.UpdatePlayerChatBoxPos = function (position) {

        if (myPlayer === undefined) return;

        if (myPlayer.review !== undefined) {

            myPlayer.review.text.position.copy(position);
            myPlayer.review.text.position.z += 2000.0; //아바타 높이보다 올림
        }

    };

    //다른 유저 아바타 등록 (UUID)
    this.UpdatePlayerAvatar = function (dataID, avatarID) {
        if (myPlayer === undefined) return;

        for (let i = 0; i < playerArray.length; i++) {
            if (playerArray[i].fileDataID === undefined) { continue; }
            if (playerArray[i].fileDataID.localeCompare(dataID) !== 0) { continue; }
            //if (playerArray[i].fileDataID.localeCompare(dataID) === false) { continue; }

            playerArray[i].avatarUUID = avatarID;
            break;
        }
    };

    //다른 유저 정보 반환 (아바타 UUID)
    this.GetPlayerDataByAvatar = function (avatarID) {

        for (let i = 0; i < playerArray.length; i++) {
            if (playerArray[i].avatarUUID === undefined) continue;
            if (playerArray[i].avatarUUID.localeCompare(avatarID) !== 0) continue;

            return playerArray[i];
        }

        return undefined;
    };



    // 현재 유저 채팅입력
    this.SetChat = function (chat) {
        //SendMyChatting(chat);
        SendMyChatting2(chat);
    };

    let chatArr = function (target, source) {
        for (let i = 0; i < source.length; i++)
            target.push(source[i]);
    };

    //////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    //  서버 메세지 처리
    //
    function onMessage(evt) {
        //writeToScreen('<span style="color: blue;">RESPONSE: ' + evt.data + '</span>');

        let reader = new FileReader();

        reader.onload = function (e) {
            let buffer = reader.result;
            let dataview = new DataView(buffer); //결과 바이트의 접근 권한을 획득. DataView객체는 하단 참고.

            let packetID = dataview.getInt8(0);

            /////////////////////////////////////////////////////////////////////////////////////////////
            //
            //    패킷 처리
            //
            if (packetID === 1) {
                // ServerID 얻는다
                myPlayer.ID = dataview.getInt32(1, true);


                if (myPlayer.review === undefined) {
                    //리뷰 등록
                    let reviewData = view.Data.ReviewItem();
                    reviewData.itemType = VIZCore.Enum.REVIEW_TYPES.RK_TOOLTIP_NOTE;
                    reviewData.style.border.color.set(255, 255, 255, 255);
                    reviewData.style.background.color.set(255, 255, 255, 255);
                    reviewData.style.line.thickness = 1;
                    reviewData.style.line.color.set(41, 143, 194, 255);

                    reviewData.text.value.length = 0; //초기화
                    reviewData.text.position = new VIZCore.Vector3();

                    view.Data.Reviews.push(reviewData);

                    myPlayer.review = reviewData;
                }

                //writeToScreen("RECEIVE : 내 서버 아이디 받음 : " + myPlayer.ID);

                console.log("CONNECTED ID : " + myPlayer.ID);

                // 플레이어 이름 서버로 전송한다
                SendMyName();

                // 이제부터 타이머로 내 상태 계속 전송
                sendStatus = setInterval(myStatusTimer, 1000);
            }

            if (packetID === 11) {
                // 다른 플레이어 이름 얻는다
                let playerID = dataview.getInt32(1, true);
                let stringLen = dataview.getInt8(5, true);
                let szPlayerName = getStringUTF8(dataview, 6, stringLen);

                //writeToScreen("RECEIVE : 다른 플레이어 이름 받음 [" + playerID + "] : " + szPlayerName);

                let bResist = false;
                if (myPlayer.ID === playerID)
                    bResist = true;

                // 플레이어 이름 등록
                for (let i = 0; i < playerArray.length; i++) {
                    if (playerArray[i].ID === playerID) {
                        playerArray[i].name = szPlayerName;
                        bResist = true;
                        break;
                    }
                }

                if (!bResist) {
                    // 플레이어 새로 등록
                    let newPlayer = new scope.PlayerSocket();
                    newPlayer.ID = playerID;
                    newPlayer.name = szPlayerName;

                    //리뷰 등록
                    let reviewData = view.Data.ReviewItem();
                    reviewData.itemType = VIZCore.Enum.REVIEW_TYPES.RK_TOOLTIP_NOTE;
                    reviewData.style.border.color.set(255, 255, 255, 255);
                    reviewData.style.background.color.set(255, 255, 255, 255);
                    reviewData.style.line.thickness = 1;
                    reviewData.style.line.color.set(41, 143, 194, 255);
                    reviewData.text.value.length = 0; //초기화
                    reviewData.text.position = new VIZCore.Vector3();
                    view.Data.Reviews.push(reviewData);
                    newPlayer.review = reviewData;

                    playerArray.push(newPlayer);

                    //let fileData = view.TestCustomFBX_Player(0);
                    //newPlayer.fileDataID = fileData.ID;
                    //초기 위치 등록
                    //view.CustomObject.AddDownloadInitPosAndDirection(fileData, resultPick[1],
                    //    new VIZCore.Vector3(-1, 0, 0),
                    //    new VIZCore.Vector3(0, 0, 1)
                    //);
                }
            }

            if (packetID === 12) {
                // 다른 플레이어 이름 얻는다 - 여러개
                let playerNum = dataview.getInt8(1, true);

                let offset = 2;
                for (let j = 0; j < playerNum; j++) {

                    let playerID = dataview.getInt32(offset, true);
                    offset += 4;

                    let stringLen = dataview.getInt8(offset, true);
                    offset += 1;

                    let szPlayerName = getStringUTF8(dataview, offset, stringLen);
                    offset += stringLen;

                    //writeToScreen("RECEIVE : 다른 플레이어 이름 받음 [" + playerID + "] : " + szPlayerName);

                    // 플레이어 새로 등록
                    //let newPlayer = new struct_Player();
                    //newPlayer.ID = playerID;
                    //newPlayer.name = szPlayerName;
                    //
                    //playerArray.push(newPlayer);

                    // 플레이어 새로 등록
                    let newPlayer = new scope.PlayerSocket();
                    newPlayer.ID = playerID;
                    newPlayer.name = szPlayerName;

                    //let fileData = view.TestCustomFBX_Player(0);
                    //newPlayer.fileDataID = fileData.ID;

                    //리뷰 등록
                    let reviewData = view.Data.ReviewItem();
                    reviewData.itemType = VIZCore.Enum.REVIEW_TYPES.RK_TOOLTIP_NOTE;
                    reviewData.style.border.color.set(255, 255, 255, 255);
                    reviewData.style.background.color.set(255, 255, 255, 255);
                    reviewData.style.line.thickness = 1;
                    reviewData.style.line.color.set(41, 143, 194, 255);
                    reviewData.text.value.length = 0; //초기화
                    reviewData.text.position = new VIZCore.Vector3();
                    view.Data.Reviews.push(reviewData);
                    newPlayer.review = reviewData;

                    playerArray.push(newPlayer);
                }
            }

            if (packetID === 21) {
                // 모든 유저 상태 메세지 처리
                let userNum = dataview.getInt8(1, true);

                let cnt = 2;
                for (let i = 0; i < userNum; i++) {
                    let playerID = dataview.getInt32(cnt, true);
                    cnt += 4;

                    let avatarID = dataview.getInt8(cnt, true);
                    cnt++;

                    let posX = dataview.getFloat32(cnt, true);
                    cnt += 4;
                    let posY = dataview.getFloat32(cnt, true);
                    cnt += 4;
                    let posZ = dataview.getFloat32(cnt, true);
                    cnt += 4;

                    let angle = dataview.getFloat32(cnt, true);
                    cnt += 4;

                    for (let j = 0; j < playerArray.length; j++) {
                        if (playerArray[j].ID === playerID) {
                            //이전
                            //playerArray[j].position.copy(playerArray[j].TrgPosition);
                            //playerArray[j].zAngle = angle;

                            playerArray[j].avatarID = avatarID;
                            playerArray[j].TrgPosition = new VIZCore.Vector3(posX, posY, posZ);
                            playerArray[j].TrgZAngle = angle;

                            if (playerArray[j].fileDataID === undefined) {
                                //TYPE 모델 다운로드
                                //현재 다운로드된 아바타가 없음

                                let fileData = view.TestCustomFBX_Player(playerArray[j].avatarID);
                                playerArray[j].fileDataID = fileData.ID;

                                //초기 위치 등록
                                view.CustomObject.AddDownloadInitPosAndDirection(playerArray[j].fileDataID, playerArray[j].TrgPosition,
                                    //new VIZCore.Vector3(1, 0, 0), //방향 계산필요
                                    new VIZCore.Vector3(Math.cos(playerArray[j].TrgZAngle), Math.sin(playerArray[j].TrgZAngle), 0),
                                    new VIZCore.Vector3(0, 0, 1)
                                );

                                playerArray[j].position.copy(playerArray[j].TrgPosition);
                                playerArray[j].MoveOffset = new VIZCore.Vector3(0.0, 0.0, 0.0);


                                //let reivewItem = view.Data.GetReview(playerArray[j].reviewID);
                                playerArray[j].review.text.position = new VIZCore.Vector3().copy(playerArray[j].position);
                                playerArray[j].review.text.position.z += 2000.0;
                            }
                            else if (playerArray[j].avatarUUID === undefined) {
                                //다운로드 대기중..

                                //초기 위치 등록
                                view.CustomObject.AddDownloadInitPosAndDirection(playerArray[j].fileDataID, playerArray[j].TrgPosition,
                                    //new VIZCore.Vector3(1, 0, 0), //방향 계산필요
                                    new VIZCore.Vector3(Math.cos(playerArray[j].TrgZAngle), Math.sin(playerArray[j].TrgZAngle), 0),
                                    new VIZCore.Vector3(0, 0, 1)
                                );

                                playerArray[j].position.copy(playerArray[j].TrgPosition);
                                playerArray[j].MoveOffset = new VIZCore.Vector3(0.0, 0.0, 0.0);

                                playerArray[j].review.text.position = new VIZCore.Vector3().copy(playerArray[j].position);
                                playerArray[j].review.text.position.z += 2000.0;
                            }
                            else {
                                //다운로드 된 아바타가 존재하여 위치 변경
                                //view.CustomObject.SetPosAndDirection(playerArray[j].avatarUUID, playerArray[j].TrgPosition,
                                //    new VIZCore.Vector3(1, 0, 0), //방향 계산필요
                                //    new VIZCore.Vector3(0, 0, 1)
                                //);

                                playerArray[j].MoveOffset = new VIZCore.Vector3().subVectors(playerArray[j].TrgPosition, playerArray[j].position);
                            }

                            break;
                        }
                    }
                }

                //writeToScreen("RECEIVE : 상태메세지(나) - " + myPlayer.szPlayerName + " : " + myPlayer.vTrgPos[0] + "," + myPlayer.vTrgPos[1] + "," + myPlayer.vTrgPos[2] + " : " +
                //    myPlayer.vTrgDirZAngle);
                //
                //for (let i = 0; i < playerArray.length; i++) {
                //    writeToScreen("RECEIVE : 상태메세지 - " + playerArray[i].szPlayerName + " : " + playerArray[i].vTrgPos[0] + "," + playerArray[i].vTrgPos[1] + "," + playerArray[i].vTrgPos[2] + " : " +
                //        playerArray[i].vTrgDirZAngle);
                //}
            }

            if (packetID === 31) {
                // 채팅 메세지 처리
                let playerID = dataview.getInt32(1, true);
                let stringLen = dataview.getInt8(5, true);
                let szChatString = getStringUTF8(dataview, 6, stringLen); // <----- 이게 채팅 메세지임...

                let szChatOut = "";
                let reivewData = undefined;

                if (myPlayer.ID === playerID) {
                    szChatOut = szChatOut + myPlayer.name;    // <-- 채팅 보낸사람 이름

                    reivewData = myPlayer.review;
                }
                else {
                    for (let i = 0; i < playerArray.length; i++) {
                        if (playerArray[i].ID === playerID) {
                            szChatOut = szChatOut + playerArray[i].name; // <-- 채팅 보낸사람 이름

                            reivewData = playerArray[i].review;
                            break;
                        }
                    }
                }

                if (reivewData !== undefined) {
                    if (reivewData.text.value.length === 0) {
                        reivewData.text.value.push(szChatOut + " : " + szChatString); //최초의 경우 이름 추가
                    }
                    else {
                        reivewData.text.value.push(szChatString);
                    }

                    setTimeout(function () {
                        reivewData.text.value.shift(); //일정 시간 이후 최초 시작글 제거

                        //다음 줄에 닉네임 전달
                        if (reivewData.text.value.length > 0) {
                            reivewData.text.value[0] = szChatOut + " : " + reivewData.text.value[0];
                        }
                    }, 5000);
                }

                //szChatOut = szChatOut + " : " + szChatString;
                //writeToScreen("RECEIVE : 채팅 메세지 - " + szChatOut);
            }

            if (packetID === 41) {
                // 다른 유저 나감
                let playerID = dataview.getInt32(1, true);

                for (let i = 0; i < playerArray.length; i++) {
                    if (playerArray[i].ID === playerID) {
                        //writeToScreen("RECEIVE : 유저 나감 - " + playerArray[i].szPlayerName);

                        view.CustomObject.DeleteObject(playerArray[i].avatarUUID);
                        view.Data.DeleteReview(playerArray[i].reviewID);
                        playerArray.splice(i, 1);
                        break;
                    }
                }
            }

            // 채팅 수정 추가~ 아래 전부 다~~
            if (packetID === 51) {
                // 채팅 메세지 처리
                let playerID = dataview.getInt32(1, true);
                let szChatOut = "";
                charReceiveUserID = playerID;
                chatReceiveBuff = "";
                chatReceiveBuffArr = [];

                // if (myPlayer.ID == playerID) {
                //     szChatOut = szChatOut + myPlayer.szPlayerName;    // <-- 채팅 보낸사람 이름
                // }
                // else {
                //     for (let i = 0; i < playerArray.length; i++) {
                //         if (playerArray[i].ID == playerID) {
                //             szChatOut = szChatOut + playerArray[i].szPlayerName; // <-- 채팅 보낸사람 이름
                //             break;
                //         }
                //     }
                // }

                // chatReceiveBuffArr.push(szChatOut);

                // 채팅 요청한다
                {
                    let sendBuff = new ArrayBuffer(32);
                    let dataviewChat = new DataView(sendBuff);

                    let offset = 0;

                    // 패킷 아이디
                    let packetID_Name = 52;    // 내 이름
                    {
                        dataviewChat.setInt8(offset, packetID_Name, true);
                        offset += 1;
                    }

                    // 메세지  보낸다
                    clientSocket.send(dataviewChat);
                }
            }

            if (packetID === 53 || packetID === 54) {
                let playerID = dataview.getInt32(1, true);
                let stringLen = dataview.getInt8(5, true);
                let szChatString = getStringUTF8(dataview, 6, stringLen); // <----- 이게 채팅 메세지임...

                if (packetID === 53) {
                    chatReceiveBuff = chatReceiveBuff + szChatString;
                    chatReceiveBuffArr.push(szChatString);

                    // 다시 요청
                    {
                        let sendBuff = new ArrayBuffer(32);
                        let dataviewChat = new DataView(sendBuff);

                        let offset = 0;

                        // 패킷 아이디
                        let packetID_Name = 52;    // 내 이름
                        {
                            dataviewChat.setInt8(offset, packetID_Name, true);
                            offset += 1;
                        }

                        // 메세지  보낸다
                        clientSocket.send(dataviewChat);
                    }
                }

                if (packetID === 54) {
                    let szChatOut = "";



                    let reviewData = undefined;
                    if (myPlayer.ID === playerID) {
                        szChatOut = szChatOut + myPlayer.name;    // <-- 채팅 보낸사람 이름

                        reviewData = myPlayer.review;
                    }
                    else {
                        for (let i = 0; i < playerArray.length; i++) {
                            if (playerArray[i].ID === playerID) {
                                szChatOut = szChatOut + playerArray[i].name; // <-- 채팅 보낸사람 이름

                                reviewData = playerArray[i].review;
                                break;
                            }
                        }
                    }

                    chatReceiveBuffArr.push(szChatString);
                    //szChatOut = szChatOut + " : " + chatReceiveBuff + szChatString;  //<-- 여기가 최종 채팅 메세지임
                    if (chatReceiveBuffArr.length > 0) {
                        chatReceiveBuffArr[0] = szChatOut + " : " + chatReceiveBuffArr[0];
                    }



                    if (reviewData !== undefined) {
                        if (reviewData.text.value.length === 0) {
                            //reviewData.text.value.push(szChatOut + " : " + szChatString); //최초의 경우 이름 추가
                            chatArr(reviewData.text.value, chatReceiveBuffArr);
                        }
                        else {
                            //reviewData.text.value.push(szChatString);
                            reviewData.text.value = [];
                            chatArr(reviewData.text.value, chatReceiveBuffArr);
                        }

                        setTimeout(function () {
                            //reviewData.text.value.shift(); //일정 시간 이후 최초 시작글 제거

                            //다음 줄에 닉네임 전달
                            if (reviewData.text.value.length > 0) {
                                //reviewData.text.value[0] = szChatOut + " : " + reivewData.text.value[0];
                                //chatArr(reviewData.text.value, chatReceiveBuffArr);
                                reviewData.text.value = [];
                            }
                        }, 5000);
                    }

                    chatReceiveBuff = 0;
                    chatReceiveBuffArr = [];

                    //writeToScreen("RECEIVE : 채팅 메세지2 - " + szChatOut);
                    console.log("Receive : 채팅 메세지2 - " + szChatOut);
                }
            }


        };

        reader.readAsArrayBuffer(evt.data);

        lastPlayerProcessTime = new Date().getTime();
    }


    function onError(evt) {
        //writeToScreen('<span style="color: red;">ERROR:</span> ' + evt.data);
        console.log(evt);
    }


    function doSend(message) {
        //writeToScreen("SENT: " + message);
        clientSocket.send(message);
    }


    /////////////////////////////////////////////////////////////////////////////////////
    // 내 상태 보내주는 타이머 (중요)
    function myStatusTimer() {
        SendMyStatus();
        //writeToScreen("SENT: 서버로 내 상태 전송");
    }


};

export default SHWebSocket;
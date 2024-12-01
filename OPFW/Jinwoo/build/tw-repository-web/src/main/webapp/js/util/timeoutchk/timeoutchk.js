var iSecond; //초단위로 환산
var timerchecker = null;

window.onload = function() {
    fncClearTime();
    initTimer();
}
 
function fncClearTime() {
//    iSecond = 2*3600;
    iSecond = 30*60;
    console.log(iSecond +"초 후 자동로그아웃!!");
}
 
Lpad = function(str, len) {
    str = str + "";
    while (str.length < len) {
        str = "0" + str;
    }
    return str;
}
 
initTimer = function() {
//    var timer = document.getElementById("timer");
    rHour = parseInt(iSecond / 3600);
    rHour = rHour % 60;
 
    rMinute = parseInt(iSecond / 60);
    rMinute = rMinute % 60;
 
    rSecond = iSecond % 60;
    
    console.log(iSecond);
    
    if (iSecond > 0) {
//    	timer.innerHTML = "&nbsp;" + Lpad(rHour, 2) + "시간 " + Lpad(rMinute, 2) + "분 " + Lpad(rSecond, 2) + "초 ";
        iSecond--;
        timerchecker = setTimeout("initTimer()", 1000); // 1초 간격으로 체크
    } else {
        logoutUser();
    }
}
 
function refreshTimer() {
    var xhr = initAjax();
    xhr.open("POST", "/jsp_std/kor/util/window_reload2.jsp", false);
    xhr.send();
    fncClearTime();
}
 
function logoutUser() {
    clearTimeout(timerchecker);
    var xhr = initAjax();
    xhr.open("POST", "/logout.mng", false);
    xhr.send();
    location.reload();
}
 
function initAjax() { // 브라우저에 따른 AjaxObject 인스턴스 분기 처리
    var xmlhttp;
    if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();
    } else {// code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    return xmlhttp;
}

//출처: http://devsh.tistory.com/entry/자바스크립트로-구현한-실시간-타임아웃-기능 [날샘 코딩]
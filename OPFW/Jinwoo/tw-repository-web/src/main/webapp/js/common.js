function delRow(line) {
	$(line).parent().parent().remove();
}

/*
 * 경로(servletpath)를 얻어온다.
 * ex)
 * http://localhost:8080/board/notice.do?action=view&articeId=1
 * 결과 : /board/notice.do
 */
function getServletPath() {
	var servletPath = document.URL;
	servletPath = servletPath.substr(servletPath.indexOf("/", servletPath.indexOf("//")+2));
	if(servletPath.indexOf("?") != -1) {
		servletPath = servletPath.substr(0, servletPath.indexOf("?"));
	}
	servletPath = servletPath.replace("#;","");
	return servletPath;
}

/*
 * 경로(servletpath)+쿼리스트링을 얻어온다.
 * ex)
 * http://localhost:8080/board/notice.do?action=view&articeId=1
 * 결과 : /board/notice.do?action=view&articeId=1
 */
function getServletPathQueryString() {
	var servletPath = document.URL;
	servletPath = servletPath.substr(servletPath.indexOf("/", servletPath.indexOf("//")+2));
	servletPath = servletPath.replace("#;","");
	return servletPath;
}

function getSearchCondition (form) {
	if (window.sessionStorage) {
		var query = "";
		var element;
		for(var i=0; i<form.length; i++){
			element = form.elements [form[i].name];
			if(element == null || element.value == '') continue;

			query += form[i].name + "=" + element.value + "&";
		}
		sessionStorage.setItem("searchCondition", query);
	}
}

function setSearchCondition (form) {
	if (window.sessionStorage) {
		var searchCondition = null;
		var searchCondition = sessionStorage.getItem("searchCondition");
		if(searchCondition != null || searchCondition == "object"){
			console.log(searchCondition);
			var searchConditionList = searchCondition.split("&");
			for(idx in searchConditionList) {
				var val = searchConditionList[idx];
				var valArray = val.split("=");
				if(valArray[0] != '') {
					var element = form.elements[valArray[0]];
					element.value = valArray[1];
				}
			}
		}
	}
	sessionStorage.setItem("searchCondition", "");
}

//지정된 폼의 req class 항목들의 값 입력 여부 확인
function checkForm(formId){
	var result = true;
	$("#" + formId).find(".req").each(function(){
		if(isEmptyString ($(this).val())){ //정규식 체크하기
			alert($(this).data("name")+" 입력하세요!");
			result = false;
			$(this).focus();
			return false;
		}
	});
	return result;
}

// 빈문자열 검사
function isEmptyString (value){
	return value == null || (/^\s*$/).test (value) ;
}

// 아이디를 사용한 빈문자열 검사
function isEmptyStringId (id) {
	return isEmptyString ($("#" + id).val ());
}

//Thread.sleep
function sleep(num){	//[1/1000초]
	var now = new Date();
	var stop = now.getTime() + num;
	while(true){
		now = new Date();
		if(now.getTime() > stop)return;
	}
}

//시작일과 종료일이 오늘안에 존재하는지 확인
function checkTodayIn(startDt, endDt) {
	var today = new Date();

	var startDate = new Date(startDt);
	var endDate = new Date(endDt);

	if (today.getTime() > startDate.getTime() && today.getTime() < endDate.getTime()) {
		return true;
	}else {
		return false;
	}
}

//쿠키정보를 조회한다.
function getCookie( name ) {
	var nameOfCookie = name + "=";
	var x = 0;
	while ( x <= document.cookie.length ) {
		var y = (x+nameOfCookie.length);
		if ( document.cookie.substring( x, y ) == nameOfCookie ) {
			if ( (endOfCookie=document.cookie.indexOf( ";", y )) == -1 )
				endOfCookie = document.cookie.length;

			return unescape( document.cookie.substring( y, endOfCookie ) );
		}
		x = document.cookie.indexOf( " ", x ) + 1;
		if ( x == 0 )
			break;
	}
	return "";
}

//쿠키정보를 저장한다.
function setCookie( name, value, expiredays ) {
	var todayDate = new Date();
	todayDate.setDate( todayDate.getDate() + expiredays );
	document.cookie = name + "=" + escape( value ) + "; path=/; expires=" + todayDate.toGMTString() + ";"
}

/**
 * javascript SimpleDateFormat 함수
 * ex)
 * new Date().format("yyyy-MM-dd");
 * new Date().format("yyyy-MM-dd HH:mm:ss");
 * new Date().format("yyyy-MM-dd a/p hh:mm:ss");
 */
Date.prototype.format = function(f) {
	if (!this.valueOf()) return " ";

	var weekName = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
	var d = this;

	return f.replace(/(yyyy|yy|MM|dd|E|hh|mm|ss|a\/p)/gi, function($1) {
		switch ($1) {
			case "yyyy": return d.getFullYear();
			case "yy": return (d.getFullYear() % 1000).zf(2);
			case "MM": return (d.getMonth() + 1).zf(2);
			case "dd": return d.getDate().zf(2);
			case "E": return weekName[d.getDay()];
			case "HH": return d.getHours().zf(2);
			case "hh": return ((h = d.getHours() % 12) ? h : 12).zf(2);
			case "mm": return d.getMinutes().zf(2);
			case "ss": return d.getSeconds().zf(2);
			case "a/p": return d.getHours() < 12 ? "오전" : "오후";
			default: return $1;
		}
	});
};
String.prototype.string = function(len){var s = '', i = 0; while (i++ < len) { s += this; } return s;};
String.prototype.zf = function(len){return "0".string(len - this.length) + this;};
Number.prototype.zf = function(len){return this.toString().zf(len);};

/**
 * 3자리마다 콤마(,)를 찍는다.
 * @param x
 * @returns
 */
function numberWithCommas(x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

//두날짜 차이를 일로 받아온다.
function getGapDt(dt1, dt2) {
	var stDt = new Date(dt1).format("yyyy-MM-dd");
	var edDt = new Date(dt2).format("yyyy-MM-dd");
	return (new Date(edDt).getTime() - new Date(stDt).getTime())/ 1000 / 60 / 60 / 24;
}

$(".content input").keypress(function(event) {
	if (event.which == 13) {
		event.preventDefault();
		datatable.ajax.reload();
	}
});

//전화번호 포맷팅
function checkTelNum(telNum){

	if(telNum != null){
		return telNum.replace(/(^02.{0}|^01.{1}|[0-9]{3})([0-9]+)([0-9]{4})/,"$1-$2-$3");
	}else{
		return "";
	}
}

function ajaxErrorHandlerCim(xhr) {
	let responseJSON = xhr.responseJSON;

	if (responseJSON.message == null || responseJSON.message == undefined) {
		alert('서버와 통신 중 문제가 발생했습니다');
	} else {
		alert(responseJSON.message);
	}

	errorLog = responseJSON.errorLog;
	if(errorLog != null && errorLog != undefined) {
		console.log(errorLog);
	}else{
		console.log(JSON.stringify(responseJSON));
	}
}

function ajaxErrorHandler(xhr) {
	let responseJSON = xhr.responseJSON;
	if( responseJSON != null && responseJSON != undefined ) {
		ajaxErrorHandlerCim(xhr);
		return;
	}

	var servletPath = document.URL;
	servletPath = servletPath.substr(servletPath.indexOf("/", servletPath.indexOf("//")+2));
	if(servletPath.indexOf("?") != -1) {
		servletPath = servletPath.substr(0, servletPath.indexOf("?"));
	}
	servletPath = servletPath.substr(0,7);

	if(xhr.status == 401) {
		if("/system/" == servletPath) {
			alert("인증에 실패 했습니다. 로그인 페이지로 이동합니다.");
			location.href = "<c:url value='/login/loginForm.mng'>";
		} else {
			alert("인증에 실패 했습니다. 로그인 페이지로 이동합니다.");
			location.href = "<c:url value='/login.do'>";
		}
	} else if(xhr.status == 403 || xhr.status == 500) {
		if("/system/" == servletPath){
			alert("세션이 만료가 되었습니다. 로그인 페이지로 이동합니다.");
			location.href = "/login/loginForm.mng";
		} else {
			alert("세션이 만료가 되었습니다. 로그인 페이지로 이동합니다.");
			location.href = "/login/loginForm.mng";
		}
	}
}

$.ajaxSetup({
	beforeSend: function(xhr) {
		xhr.setRequestHeader("AJAX", true);
	},
	error: function(xhr, status, err) {
		ajaxErrorHandler(xhr);
	}
});

// 모달창 dataTable 세션에러처리함수
function dataTablesError(xhr) {
	if(xhr.status == 500) {
		alert("세션이 만료가 되었습니다. 로그인 페이지로 이동합니다.");
		location.href = "/login/loginForm.mng";
	}
}

/*날짜 형변환*/
function date_to_str(format)
{
	var year = format.getFullYear();

	var month = format.getMonth() + 1;

	if(month<10) month = '0' + month;

	var date = format.getDate();

	if(date<10) date = '0' + date;

	var hour = format.getHours();

	if(hour<10) hour = '0' + hour;

	var min = format.getMinutes();

	if(min<10) min = '0' + min;

	var sec = format.getSeconds();

	if(sec<10) sec = '0' + sec;

	return year + "-" + month + "-" + date + " " + hour + ":" + min + ":" + sec;
}

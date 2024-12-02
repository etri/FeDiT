var Browser = {
	a : navigator.userAgent.toLowerCase()
}

Browser = {
	ie : /* @cc_on true || @ */false,
	ie6 : Browser.a.indexOf('msie 6') != -1,
	ie7 : Browser.a.indexOf('msie 7') != -1,
	ie8 : Browser.a.indexOf('msie 8') != -1,
	opera : !!window.opera,
	safari : Browser.a.indexOf('safari') != -1,
	safari3 : Browser.a.indexOf('applewebkit/5') != -1,
	mac : Browser.a.indexOf('mac') != -1,
	chrome : Browser.a.indexOf('chrome') != -1,
	firefox : Browser.a.indexOf('firefox') != -1
}

// 기본 Zoom
var nowZoom = 100;
// 최대 Zoom
var maxZoom = 200;
// 최소 Zoom
var minZoom = 80;

// 화면크기 확대
var jsBrowseSizeUp = function() {
	if (Browser.chrome) {
		if (nowZoom < maxZoom) {
			nowZoom += 10; // 10 = 25%씩 증가
			document.body.style.zoom = nowZoom + "%";
		} else {
			alert('최대 확대입니다.');
		}
	} else if (Browser.opera) {
		alert('오페라는 화면크기 기능을 지원하지 않습니다.\n브라우저 내의 확대/축소 기능을 이용하시기 바랍니다.');
	} else if (Browser.safari || Browser.safari3 || Browser.mac) {
		alert('사파리, 맥은 화면크기 기능을 지원하지 않습니다.\n브라우저 내의 확대/축소 기능을 이용하시기 바랍니다.');
	} else if (Browser.firefox) {
		alert('파이어폭스는 화면크기 기능을 지원하지 않습니다.\n브라우저 내의 확대/축소 기능을 이용하시기 바랍니다.');
	} else {
		if (nowZoom < maxZoom) {
			nowZoom += 10; // 10 = 25%씩 증가
			document.body.style.position = "relative";
			document.body.style.zoom = nowZoom + "%";
		} else {
			alert('최대 확대입니다.');
		}
	}
};

// 화면크기 축소
var jsBrowseSizeDown = function() {
	if (Browser.chrome) {
		if (nowZoom < maxZoom) {
			nowZoom -= 10; // 10 = 25%씩 증가
			document.body.style.zoom = nowZoom + "%";
		} else {
			alert('최대 확대입니다.');
		}
	} else if (Browser.opera) {
		alert('오페라는 화면크기 기능을 지원하지 않습니다.\n브라우저 내의 확대/축소 기능을 이용하시기 바랍니다.');
	} else if (Browser.safari || Browser.safari3 || Browser.mac) {
		alert('사파리, 맥은 화면크기 기능을 지원하지 않습니다.\n브라우저 내의 확대/축소 기능을 이용하시기 바랍니다.');
	} else if (Browser.firefox) {
		alert('파이어폭스는 화면크기 기능을 지원하지 않습니다.\n브라우저 내의 확대/축소 기능을 이용하시기 바랍니다.');
	} else {
		if (nowZoom < maxZoom) {
			nowZoom -= 10; // 10 = 25%씩 증가
			document.body.style.position = "relative";
			document.body.style.zoom = nowZoom + "%";
		} else {
			alert('최대 확대입니다.');
		}
	}
};

// 화면크기 원래대로(100%)
var jsBrowseSizeDefault = function() {

	nowZoom = 100;
	document.body.style.zoom = nowZoom + "%";
};
<%@ page contentType="text/html; charset=utf-8" pageEncoding="utf-8"%>
<%@ taglib prefix="c"      uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="form"   uri="http://www.springframework.org/tags/form" %>
<%@ taglib prefix="ui"     uri="http://egovframework.gov/ctl/ui"%>
<%@ taglib prefix="spring" uri="http://www.springframework.org/tags"%>
<%@ taglib prefix="sec" uri="http://www.springframework.org/security/tags" %>
<!DOCTYPE html>

<html lang="ko">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<meta name="_csrf" content="${_csrf.token}"/>
<meta name="_csrf_header" content="${_csrf.headerName}"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="/css/bootstrap.min.css" rel="stylesheet">
<link href="/css/font-awesome/css/font-awesome.css" rel="stylesheet">
<link href="/css/animate.css" rel="stylesheet">
<link href="/css/style.css" rel="stylesheet">
<!-- Mainly scripts -->
<script src="/js/jquery-3.1.1.min.js"></script>
<script src="/js/popper.min.js"></script>
<script src="/js/bootstrap.js"></script>

<title>연합 디지털트윈 데이터 센터 로그인</title>
</head>
<body class="gray-bg">
<script type="text/javaScript" language="javascript" defer="defer">
	//스프링시큐리티 모든 ajax요청리 csrf토큰 http헤더에 추가
	var token = $("meta[name='_csrf']").attr("content");
	var header = $("meta[name='_csrf_header']").attr("content");
	$(function() {
	  /*   $(document).ajaxSend(function(e, xhr, options) {
	        xhr.setRequestHeader(header, token);
	    }); */
	    
	    $("#loginId").focus();
	    
	    $(".isToolTip").tooltip();
	    
	    $("#currYear").text(new Date().getFullYear()+".");
	});
</script>
<c:if test="${not empty failCause}">
	<script type="text/javaScript" language="javascript" defer="defer">
		alert("${failCause}");
		$("#loginId").focus();
	</script>
</c:if>
<sec:authorize access="isAuthenticated()">
	<script type="text/javaScript" language="javascript" defer="defer">
		location.href = "/udt/main.do";
	</script>
</sec:authorize>
    <div class="middle-box text-center loginscreen animated fadeInDown">
        <div>
            <div>
                <h1 class="logo-name"><img class="loginLogoImg" alt="image" src="/images/mainLogo.png"></h1>
            </div>
            <h3 style="margin-bottom:35px;">연합 디지털트윈 데이터 관리 센터</h3>
            <p>해당 페이지는 인가된 사용자 대상으로 <br>사용이 제한됩니다.
            </p>
            <form class="m-t" role="form" action="${pageContext.request.contextPath}/login" method="post">
                <%-- <sec:csrfInput/> --%>
                <div class="form-group">
                    <input type="text" id="loginId" name="loginId" class="form-control" placeholder="ID를 입력하세요." required="">
                </div>
                <div class="form-group">
                    <input type="password" name="loginPwd" class="form-control" placeholder="비밀번호를 입력하세요." required="">
                </div>
                <!-- 
                <div style="text-align: right!important;">
                    <input type="checkbox" id="autoLogin" name="remember-me" class="pointer"
                    	style="vertical-align: -2.3px;"/>
				    	<label for="autoLogin" class="pointer isToolTip" data-placement="right" title="1주일간 접속이 유지됩니다."><small>자동로그인</small></label>
                </div>
                 -->
                 <div style="margin: 15px 0px;">
	            	<small style="font-size: 85%;">» 불법적인 접근 시도는 민형사상 손해배상을 물을 수 있습니다.</small>
	            </div>
                <button type="submit" class="btn btn-primary block full-width m-b">로그인</button>

                <a href="#" class="isToolTip" title="관리자에게 문의해주세요.(T:000-0000-0000)" data-placement="right"><small>계정관련문의</small></a>
            </form>
            <p class="m-t"> <small>COPYRIGHT © Electronics and Telecommunications Research Institute.</small><br> 
            <small>&copy; <span id ="currYear">2022</span> ALL RIGHTS RESERVED.</small> </p>
        </div>
    </div>
</body>
</html>
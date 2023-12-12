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
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="_csrf" content="${_csrf.token}"/>
<meta name="_csrf_header" content="${_csrf.headerName}"/>
<meta name="_menu_no" content="${menuNo}"/>
<link type="text/css" rel="stylesheet" href="<c:url value='/css/bootstrap.min.css'/>"/>
<link type="text/css" rel="stylesheet" href="<c:url value='/css/font-awesome/css/font-awesome.css'/>"/>
<link type="text/css" rel="stylesheet" href="<c:url value='/css/animate.css'/>"/>
<link type="text/css" rel="stylesheet" href="<c:url value='/css/style.css'/>"/>
<link type="text/css" rel="stylesheet" href="<c:url value='/css/jquery-ui.css'/>"/>
<link type="text/css" rel="stylesheet" href="<c:url value='/css/plugins/footable/footable.core.css'/>"/>

 <!-- Mainly scripts -->
<script src="/js/jquery-3.1.1.min.js"></script>
<script src="/js/jquery.loading.min.js"></script>
<script src="/js/jquery-ui.js"></script>
<script src="/js/popper.min.js"></script>
<script src="/js/bootstrap.js"></script>
<script src="/js/plugins/metisMenu/jquery.metisMenu.js"></script>
<script src="/js/plugins/slimscroll/jquery.slimscroll.min.js"></script>
<script src="/js/udt.common.js"></script>

<!-- Custom and plugin javascript -->
<script src="/js/inspinia.js"></script>
<script src="/js/plugins/pace/pace.min.js"></script>
<script src="/js/plugins/footable/footable.all.min.js"></script>
<!-- xml -> json 변환 라이브러리 추가 -->
<script src="/js/plugins/xml2json/xml2json.js"></script>
<!-- json->tree 변환 라이브러리 추가 -->
<script src="/js/plugins/jsonTree/jsonTree.js"></script>
<link type="text/css" rel="stylesheet" href="<c:url value='/js/plugins/jsonTree/jsonTree.css'/>"/>

<!-- Flot -->
<script src="/js/plugins/flot/jquery.flot.js"></script>
<script src="/js/plugins/flot/jquery.flot.tooltip.min.js"></script>
<script src="/js/plugins/flot/jquery.flot.resize.js"></script>

<!-- ChartJS-->
<script src="/js/plugins/chartJs/Chart.min.js"></script>

<!-- Peity -->
<script src="/js/plugins/peity/jquery.peity.min.js"></script>
<!-- Peity demo -->
<script src="/js/plugins/peity/peity-demo.js"></script>
<title>연합 디지털트윈 데이터 센터</title>
</head>
<body class="top-navigation">

<form action="${pageContext.request.contextPath}/logout" method="post" style="display:none">
		<input id="logoutBtn" type="submit" value="Logout" />
		<%-- <sec:csrfInput/> --%>
</form>
<!-- 헤더 -->
<div id="wrapper">
  <div id="page-wrapper" class="gray-bg">
     <div class="row border-bottom white-bg header">
        <nav class="navbar navbar-expand-lg navbar-static-top" role="navigation">
            <!--<div class="navbar-header">-->
                <!--<button aria-controls="navbar" aria-expanded="false" data-target="#navbar" data-toggle="collapse" class="navbar-toggle collapsed" type="button">-->
                    <!--<i class="fa fa-reorder"></i>-->
                <!--</button>-->

                <a href="#" class="navbar-brand" style="background-color:#fff; padding:10px 0px 10px 5px;"><img alt="image" style="width:140px;" src="/images/mainLogo.png"></a>
                <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbar" aria-expanded="false" aria-label="Toggle navigation">
                    <i class="fa fa-reorder"></i>
                </button>

            <!--</div>-->
            <div class="navbar-collapse collapse" id="navbar">
                <ul class="nav navbar-nav mr-auto menu-navi">
                    <li>
                        <a aria-expanded="false" role="button" href="/udt/main.do"
							style="padding: 14px 24px 13px 5px; color:#285ab5;"> 연합 디지털트윈 데이터 센터</a>
                    </li>
                    <li class="dropdown menu-li-1">
                        <a aria-expanded="false" role="button" href="/udt/main.do"> 대시보드</a>
                    </li>
                    <li class="dropdown menu-li-2">
                        <a aria-expanded="false" role="button" href="/udt/schedule/scheduleManage.do"> OpenAPI 수집</a>
                    </li>
                     
                    <li class="dropdown menu-li-3">
                        <a aria-expanded="false" role="button" href="/udt/storage/main.do"> 저장소 가시화</a>
                    </li>
                    <li class="dropdown menu-li-4">
                         <a aria-expanded="false" role="button" href="/udt/user/main.do"> 사용자 관리</a>
                    </li>
                </ul>
                <ul class="nav navbar-top-links navbar-right">
                    <li> 
                        <a href="#" id="logOutAlink">
                            <i class="fa fa-sign-out"></i> 로그아웃
                        </a>
                    </li>
                </ul>
            </div>
        </nav>
      </div>

<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ include file="/WEB-INF/view/include/tags.jspf" %>
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" name="viewport">

	<title><spring:message code='ui.common.title'/></title>
	<link rel="stylesheet" href="https://code.ionicframework.com/ionicons/2.0.1/css/ionicons.min.css">
	<link href="https://gitcdn.github.io/bootstrap-toggle/2.2.2/css/bootstrap-toggle.min.css" rel="stylesheet">

<!--[if IE 7]>
<![endif]-->
<!--[if IE 9]>
	<script src="http://html5shiv.googlecode.com/svn/trunk/html5.js"></script>
<![endif]-->

	<c:choose>
		<c:when test="${activeProfile == 'dev'}">
			<script src="https://scert.mobile-ok.com/resources/js/index.js"></script>
		</c:when>
		<c:when test="${activeProfile == 'prod'}">
<%--			<script src="https://scert.mobile-ok.com/resources/js/index.js"></script>--%>
			<script src="https://cert.mobile-ok.com/resources/js/index.js"></script>
		</c:when>
	</c:choose>
<%--<script src="/js/jquery/jQuery-2.1.4.min.js"></script>--%>
	<script src="https://code.jquery.com/jquery-2.2.4.min.js" integrity="sha256-BbhdlvQf/xTY9gja0Dq3HiwQF8LaCRTXxZKRutelT44=" crossorigin="anonymous"></script>
	<style>
		.login-page {
			margin: 0;
		}
	</style>
</head>
<body class="hold-transition login-page">
	<tiles:insertAttribute name="content"/>

	<script src="https://code.jquery.com/ui/1.11.4/jquery-ui.min.js"></script>
	<script src="https://gitcdn.github.io/bootstrap-toggle/2.2.2/js/bootstrap-toggle.min.js"></script>
	
	<script>
	$(document).ready(function() {
		$('input').iCheck({
			checkboxClass: 'icheckbox_square-blue',
			radioClass: 'iradio_square-blue',
			increaseArea: '20%' // optional
		});
	});
	</script>
</body>
</html>
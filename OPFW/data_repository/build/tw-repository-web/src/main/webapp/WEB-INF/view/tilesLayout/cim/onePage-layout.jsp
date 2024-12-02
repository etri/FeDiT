<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ include file="/WEB-INF/view/include/tags.jspf" %>
<%@page isELIgnored="false" %>

<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" name="viewport">

    <title><spring:message code='ui.common.title'/></title>

    <link rel="stylesheet" type="text/css" href="/css/main.css">

    <script src="https://code.jquery.com/jquery-2.2.4.min.js" integrity="sha256-BbhdlvQf/xTY9gja0Dq3HiwQF8LaCRTXxZKRutelT44=" crossorigin="anonymous"></script>
    <script src="/js/plugins/placeholder/jquery.placeholder.js"></script>
    <script defer src="<c:url value='/js/util/formUtil.js' />"></script>
</head>
<body class="hold-transition login-page theme--dark">
<tiles:insertAttribute name="content"/>

<script>
</script>
</body>
</html>
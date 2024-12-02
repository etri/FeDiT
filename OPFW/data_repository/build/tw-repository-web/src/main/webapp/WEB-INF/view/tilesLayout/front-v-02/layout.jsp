<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ include file="/WEB-INF/view/include/tags.jspf" %>
<!DOCTYPE html>
<html style="">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" name="viewport">
  <title>Front</title>

  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">

  <link rel="stylesheet" type="text/css" href="/css/main.css">

  <script src="<c:url value='/ckeditor/ckeditor.js' />"></script>
  <script src="/js/front/frontCommon.js"></script>
  <script src="<c:url value='/js/common.js' />"></script>

</head>
<body class="layoutBody theme--dark">
<div class="content g-content">
  <div class="g-header" id="header">
    <tiles:insertAttribute name="header"/>
  </div>
  <div class="g-subheader" id="subHeader">
    <tiles:insertAttribute name="subHeader"/>
  </div>
  <div class="g-side web" id="sidebar-left">
    <tiles:insertAttribute name="main-sidebar"/>
  </div>
  <div class="g-main" id="main">
    <tiles:insertAttribute name="content"/>
  </div>
  <div class="g-footer" id="footer">
    <tiles:insertAttribute name="footer"/>
  </div>
</div>
</body>
</html>
<script>

</script>
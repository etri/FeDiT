<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ include file="/WEB-INF/view/include/tags.jspf" %>
<style>
</style>
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
<header class="main-header"> <a href="/system/index.mng" class="logo">
    <span class="logo-mini"><img src="/images/175_51.svg" style="width: 230px;"></span></a>
    <nav class="navbar navbar-static-top"> 
    <a href="#" class="sidebar-toggleNew" data-toggle="offcanvas" role="button"> <span class="sr-only" >Toggle navigation</span> </a>
      <div class="navbar-custom-menu">
        <ul class="nav navbar-nav">
          <li class="dropdown user user-menu"> <a href="#" class="dropdown-toggle" data-toggle="dropdown"> <span class="hidden-xs">${user.userNm}&nbsp;&nbsp;님&nbsp;&nbsp;&nbsp;&nbsp; </span> </a>
            <ul class="dropdown-menu">
              <li class="user-footer">
                <div style="padding-bottom: 10px;"> <a href="/system/mypage/list.mng" class="btn btn-default btn-flat" style="width: 100%;">마이페이지</a> </div>
                <div> <a href="/logout.mng" class="btn btn-default btn-flat" style="width: 100%;">로그아웃</a> </div>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </nav>
  </header>

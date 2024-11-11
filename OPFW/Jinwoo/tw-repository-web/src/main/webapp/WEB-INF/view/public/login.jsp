<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ include file="/WEB-INF/view/include/tags.jspf" %>
<head>
    <link rel="stylesheet" href="<c:url value="/css/repository/login.css" />" />
</head>
<form name="f" action="/public/login.mng" method="POST">
    <div class="wrap">
        <div class="login">
            <h2>Log-in</h2>
            <div class="login_id">
                <h4>User</h4>
                <input type="text" name="userLoginId" id="userLoginId" placeholder="userid">
            </div>
            <div class="login_pw">
                <h4>Password</h4>
                <input type="password" name="userPwd" id="userPwd" placeholder="Password">
            </div>
            <div class="submit">
                <input type="submit" value="submit">
            </div>
            <div class="login_etc">
                <div class="siginup">
                    <a href="/public/signup.do">회원가입</a>
                </div>
                <div class="forgot_pw">
                    <a href="">비밀번호 찾기</a>
                </div>
            </div>
        </div>
    </div>
</form>

<script>
    $(document).ready(function() {
        $("#userLoginId").focus();

        var error = '<c:out value="${param.error}" />';
        if(error == '-1') {
            alert("<spring:message code='ui.message.error.login.fail'/>");
        } else if(error == '-2') {
            alert("<spring:message code='ui.message.error.login.overFailCount'/>");
        }
    });
</script>
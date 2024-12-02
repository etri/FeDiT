<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ include file="/WEB-INF/view/include/tags.jspf" %>
<%--<script src="/js/jquery/jQuery-2.1.4.min.js"></script>--%>
<script src="https://code.jquery.com/jquery-2.2.4.min.js" integrity="sha256-BbhdlvQf/xTY9gja0Dq3HiwQF8LaCRTXxZKRutelT44=" crossorigin="anonymous"></script>
<script src="/js/jquery/jquery-ui.js"></script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.0/jquery-confirm.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.0/jquery-confirm.min.js"></script>
<!-- ajaxSubmit 사용을 위한 스크립트 -->
<script src="/js/front/ajaxSubmit.js"></script>
<session>
    <div class="headerLogo">
        <span><a href="/front/main.do"><img src="/images/front/jinwooLogo.png" style="height: 50px;"></a></span>
    </div>
    <div class="headerFn">
        <c:choose>
            <c:when test="${user.userId eq null || user.userId eq ''}">
                <span><a onclick="logout()">로그인111</a></span>
            </c:when>
            <c:otherwise>
					<span>
						<a onclick="logout()">로그아웃</a>
						<c:if test="${userRole eq 'ROLE_SYSTEM' || userRole eq 'ROLE_MANAGER'}"><a>/</a>
                            <a onclick="goCms()">관리자페이지</a>
                        </c:if>
					</span>
                <span></span>
            </c:otherwise>
        </c:choose>
    </div>
</session>

<script>
    /* $( window ).resize(function() {
        alert($( window ).width());
    }); */

    function logout(){
        var path = window.location.pathname;
        location.href = '/logout.mng?path='+path;
    }

    function goCms(){
        location.href = "/system/cim/dashboard/main.mng";
    }
</script>
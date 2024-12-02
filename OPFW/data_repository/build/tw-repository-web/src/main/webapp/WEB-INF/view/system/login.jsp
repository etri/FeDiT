<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ include file="/WEB-INF/view/include/tags.jspf"%>

<!-- The Modal (contains the Sign Up form) -->
<div id="id01" class="modal">
    <span class="modal__close" onclick="document.getElementById('id01').style.display='block'"  title="Modal"></span>
    <form class="modal__content" action="/login/login.mng" id="loginForm" name="loginForm" method="post">
        <input type="hidden" value="${path}" name="path">
        <div class="modal__container">
            <h1 class="h1--center"><spring:message code='ui.common.title'/></h1>
            <hr class="modal__hr">
            <label for="id"><b><spring:message code='ui.common.id'/></b></label>
            <input class="modal__input" type="text" id="userLoginId" name="userLoginId" required>

            <label for="psw"><b><spring:message code='ui.common.password'/></b></label>
            <input class="modal__input" type="password" id="userPwd" name="userPwd" required>

            <div class="clearfix">
                <button class="modal__button modal__button--signup-100p" type="button" id="loginButton"><spring:message code='ui.common.login'/></button>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center ">
                <a href="/system/register.do"><spring:message code='ui.common.joinMember'/></a>
                <a href="/system/findPassword.do"><spring:message code='ui.common.findPassword'/></a>
            </div>
        </div>
    </form>
</div>


<script>

    $(document).ready(function() {
        $("#userLoginId").focus();

        var param = '<c:out value="${param}" />';

        var error = '<c:out value="${param.error}" />';
        if(error == '-1') {
            alert("<spring:message code='ui.message.error.login.fail'/>");
        } else if(error == '-2') {
            alert("<spring:message code='ui.message.error.login.overFailCount'/>");
        } else {
            var userInputId = getCookie("userInputId");
            if(userInputId == ""){
                $("#saveID").attr("checked", false);
            }else{
                $("#userLoginId").val(userInputId);
                $("#saveID").attr("checked", true);
            }
        }
    });

    /*
    $("input").on('ifClicked', function (event) {
        alert("111");
        var value = $(this).val();
        if(value == "on"){
            deleteCookie("userInputId");
            $("#saveID").attr("checked", false);
        }else{
            $("#saveID").attr("checked", true);
        }
    });
    */
    $("#loginButton").click(function(){
        var form = document.loginForm;
        if(!formUtil.chkTextDetail(form.userLoginId, "<spring:message code='ui.common.id'/>", 2, 30, true, true)) return;
        if(!formUtil.chkTextDetail(form.userPwd, "<spring:message code='ui.common.password'/>", 2, 32, false, false)) return;

        {
            if($("#saveID").is(":checked")){
                var userInputId = $("#userLoginId").val();
                setCookie("userInputId", userInputId, 7); // 7일 동안 쿠키 보관
            }else{
                deleteCookie("userInputId");
            }
            $("#loginForm").submit();
        }
    });

    $("input").keypress(function(event) {
        if(event.which == 13) {

            var form = document.loginForm;
            if(!formUtil.chkTextDetail(form.userLoginId, "<spring:message code='ui.common.id'/>", 2, 30, true, true)){
                event.preventDefault()
                return;
            }
            if(!formUtil.chkTextDetail(form.userPwd, "<spring:message code='ui.common.password'/>", 2, 200, false, false)) {
                event.preventDefault()
                return;
            }

            {
                if($("#saveID").is(":checked")){
                    var userInputId = $("#userLoginId").val();
                    setCookie("userInputId", userInputId, 7); // 7일 동안 쿠키 보관
                }else{
                    deleteCookie("userInputId");
                }
                event.preventDefault();
                $("#loginForm").submit();
            }
        }
    });

    //쿠키 등록 함수
    function setCookie(cookieName, value, exdays){
        var exdate = new Date();
        exdate.setDate(exdate.getDate() + exdays);
        var cookieValue = escape(value) + ((exdays==null) ? "" : "; expires=" + exdate.toGMTString());
        document.cookie = cookieName + "=" + cookieValue;
    }

    //쿠키 삭제 함수
    function deleteCookie(name){
        today   = new Date();
        today.setDate(today.getDate() - 1);
        document.cookie = name + "=; path=/; expires=" + today.toGMTString() + ";";
    }

    //쿠키 호출 함수
    function getCookie(cookieName) {
        cookieName = cookieName + '=';
        var cookieData = document.cookie;
        var start = cookieData.indexOf(cookieName);
        var cookieValue = '';
        if(start != -1){
            start += cookieName.length;
            var end = cookieData.indexOf(';', start);
            if(end == -1)end = cookieData.length;
            cookieValue = cookieData.substring(start, end);
        }
        return unescape(cookieValue);
    }

    /*
    function loginPage() {
        $.ajax({
            url : "<c:url value='/login/login.mng'/>",
			type : "POST",
			data : $("#loginForm").serialize(),
			dataType : "json",
			success : function(res){
				if ("success" == res.result) {
					alert("실패");
					location.href="/system/main.mng";
				}else {
					alert("실패");
					alert(res.message);
				}
			}
		})
	}
	*/

</script>
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ include file="/WEB-INF/view/include/tags.jspf"%>

<!-- Button to open the modal -->
<script src="<c:url value='/js/common.js' />"></script>

<!-- The Modal (contains the Sign Up form) -->
<div id="id01" class="modal">
    <span class="modal__close" onclick="javascript:history.back();"  title="Close Modal">&times;</span>
    <form class="modal__content" id="insertForm" name="insertForm">
        <div class="modal__container">
            <h1 class="h1--center"><spring:message code='ui.common.findPassword'/></h1>
            <hr class="modal__hr">
            <label for="id"><b><spring:message code='ui.common.id'/>*</b></label>
            <%--            완료--%>
            <input class="modal__input" type="text" name="userLoginId" id="userLoginId" onkeyup="inChk.engNum(this);" required>

            <div class="clearfix">
                <a href="javascript:history.back();"><button class="modal__button modal__button--cancel" type="button"><spring:message code='ui.common.cancel'/></button></a>
                <button class="modal__button modal__button--signup" type="button" onclick="findPw()"><spring:message code='ui.common.find'/></button>
            </div>
        </div>
    </form>
</div>

<script>

    function findPw() {
        let form = document.insertForm;
        if(!formUtil.chkTextDetail(form.userLoginId, "<spring:message code='ui.common.id'/>", 2, 30, true, true)) return;

        $.ajax({
            url : "<c:url value='/system/login/findPassword.json' />" ,
            type : "POST" ,
            data : {"userLoginId": $("#userLoginId").val()} ,
            dataType : "json" ,
            success : function(res) {
                if ("success" == res.result) {
                    alert("<spring:message code='ui.message.success.tempPasswordIssued'/>");
                    history.back();
                }else {
                    alert("<spring:message code='ui.message.error.common.failed'/>");
                }
            }
        });
    }
</script>
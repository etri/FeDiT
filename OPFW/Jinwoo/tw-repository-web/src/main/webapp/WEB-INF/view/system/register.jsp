<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ include file="/WEB-INF/view/include/tags.jspf"%>

<!-- The Modal (contains the Sign Up form) -->
<div id="id01" class="modal">
    <span class="modal__close" onclick="javascript:history.back();"  title="Close Modal">&times;</span>
    <form class="modal__content" id="insertForm" name="insertForm">
        <div class="modal__container">
            <h1 class="h1--center"><spring:message code='ui.common.joinMember'/></h1>
            <hr class="modal__hr">
            <label for="id"><b><spring:message code='ui.common.id'/>*</b></label>
<%--            완료--%>
            <input class="modal__input" type="text" name="userLoginId" id="userLoginId" onkeyup="inChk.engNum(this);" required>

            <button class="modal__button" type="button" onclick="idcheck()"><spring:message code='ui.common.checkIdDuplicate'/></button>
    <%--            완료--%>
            <label for="psw"><b><spring:message code='ui.common.password'/>*</b></label>
            <input class="modal__input" type="password" name="userPwd" id="userPwd" onkeyup="inChk.engNum(this);" required>

<%--            완료--%>
            <label for="psw-repeat"><b><spring:message code='ui.common.reconfirmPassword'/>*</b></label>
            <input class="modal__input" type="password" name="userPwd2" id="userPwd2" onkeyup="inChk.engNum(this);" required>

<%--            완료--%>
            <label for="name"><b><spring:message code='ui.common.name'/>*</b></label>
            <input class="modal__input" type="text" name="userNm" id="userNm" required>

            <label for="email"><b><spring:message code='ui.common.email'/>*</b></label>
            <input class="modal__input" type="text" name="email" id="email" >

            <label for="mobile"><b><spring:message code='ui.common.phoneNumber'/>*</b></label>
            <input class="modal__input" type="text" name="mobile" id="mobile" onkeyup="inChk.snum(this);" >

            <div class="clearfix">
                <a href="javascript:history.back();"><button class="modal__button modal__button--cancel" type="button"><spring:message code='ui.common.cancel'/></button></a>
                <button class="modal__button modal__button--signup" type="button" onclick="insert('insert')"><spring:message code='ui.common.register'/></button>
            </div>
        </div>
    </form>
</div>

    <script>

    $("input").keypress(function(event) {
        if (event.which == 13) {
            insert('insert');
        }
    });

    function idcheck() {
        var form = document.insertForm;
        if(!formUtil.chkTextDetail(form.userLoginId, "<spring:message code='ui.common.id'/>", 2, 30, true, true)) return;

        $.ajax({
            url : "<c:url value='/login/duplicate.json' />" ,
            type : "POST" ,
            data : {"userLoginId": $("#userLoginId").val()} ,
            dataType : "json" ,
            success : function(res) {
                if ("exist" == res.result) {
                    alert("<spring:message code='ui.message.error.register.existId'/>");
                    $("#userLoginId").focus();
                }else {
                    alert("<spring:message code='ui.message.success.availableId'/>");
                }
            }
        })
    }

    function insert(type){

        var form = document.insertForm;
        if(!formUtil.chkTextDetail(form.userLoginId, "<spring:message code='ui.common.id'/>", 2, 30, true, true)) return;
        if(!formUtil.chkPassword(form.userPwd, form.userPwd2, 2, 32)) return;
        if(!formUtil.chkText(form.userNm, "<spring:message code='ui.common.name'/>", 2, 30)) return;
        if(!formUtil.chkEmail(form.email, "<spring:message code='ui.common.email'/>", 2, 40)) return;
        if(!formUtil.chkTel(form.mobile, "<spring:message code='ui.common.phoneNumber'/>", 2, 30)) return;

        if(type == 'insert'){
            $.ajax ({
                url : "<c:url value='/login/duplicate.json' />" ,
                type : "POST" ,
                data : {"userLoginId": $("#userLoginId").val()} ,
                dataType : "json" ,
                success : function(res) {
                    if(res.result == "exist"){
                        alert("<spring:message code='ui.message.error.register.existId'/>");
                        $("#userLoginId").focus();
                        return false;
                    }else if(res.result == "nonExist") {
                        if (confirm ("<spring:message code='ui.message.ask.register'/>")) {
                            $.ajax({
                                url :  "<c:url value='/system/user/insert.json' />" ,
                                type : "POST" ,
                                data : {
                                    //$("#insertForm").serialize(),
                                    "userLoginId" : form.userLoginId.value,
                                    "userPwd" : form.userPwd.value,
                                    "userNm" : form.userNm.value,
                                    "email" : form.email.value,
                                    "mobile" : form.mobile.value.replace(/[^0-9]/g, "").replace(/(^02|^0505|^1[0-9]{3}|^0[0-9]{2})([0-9]+)?([0-9]{4})$/,"$1-$2-$3").replace("--", "-")
                                },
                                dataType : "json" ,
                                success : function(res) {
                                    if ("success" == res.result) {
                                        alert("<spring:message code='ui.message.success.registered'/>.");
                                        reset();
                                        location.href="/login/loginForm.mng";
                                    }else {
                                        alert(res.message);
                                    }
                                }
                            })
                        }
                    }
                }
            })
        }else if(type == 'update'){
            if (confirm ("<spring:message code='ui.message.ask.modify'/>")) {
                $.ajax({
                    url :  "<c:url value='/system/user/register.json' />" ,
                    type : "POST" ,
                    data : $("#insertForm").serialize(),
                    dataType : "json" ,
                    success : function(res) {
                        if ("success" == res.result) {
                            alert("<spring:message code='ui.message.success.modified'/>");
                            reset();
                            location.href="/login/loginForm.mng";
                        }else {
                            alert(res.message);
                        }
                    }
                })
            }
        }
    }

    function reset() {
        $("userId").val("");
        $("#userLoginId").val("");
        $("#userNm").val("");
        $("#userPwd").val("");
        $("#userPwd2").val("");
    }
</script>
$(document).ready(function () {

    $("#saveBtn").on("click", function () {
        var userParams = {
            name: $("#userNm").val(),
            gender: $("#gender").val(),
            birth: $("#birth").val(),
            mobile: $("#mobile").val(),
            addr: $("#addr").val(),
            email: $("#email").val(),
        };

        // 입력값이 형식에 맞는지 확인
        //var userAble = userService.userCheckAll(userParams);
        if(!formUtil.chkText($("#userNm"), "이름", 2, 30)) return;
        if(!formUtil.chkTel($("#mobile"), "연락처", 2, 30)) return;
        if(!formUtil.chkEmail($("#email"), "이메일", 2, 40)) return;

        {
            if(confirm("정보를 수정하시겠습니까?")) {
                $.ajax({
                    url: "/system/mypage/update.json",
                    type: "POST",
                    data : {
                        "userId" : $("#userId").val(),
                        "userNm" : $("#userNm").val(),
                        "email" : $("#email").val(),
                        "mobile" : $("#mobile").val().replace(/[^0-9]/g, "").replace(/(^02|^0505|^1[0-9]{3}|^0[0-9]{2})([0-9]+)?([0-9]{4})$/,"$1-$2-$3").replace("--", "-")
                    },
                    dataType: "json",
                    success: function (res) {
                        if (res.result === "success") {
                            alert("수정되었습니다.");
                            location.reload();
                        } else {
                            alert(res.message);
                            location.reload();
                        }
                    }
                })
            }
        }
    });

    $("#userOutBtn").on("click", function () {
        $('.userOut-modal').modal("show");
        $("#userPwd").val("");
        $("#userOutRsn").val("");
    });

    $("#userPwd").change( function () {
        var userParams = {
            userId: $("#userId").val(),
            userPwd: $("#userPwd").val()
        }
        userService.userPwdCheckClear();
        userService.userPasswordEqualCheck(userParams);
    });
    
    $("#userOut").on("click", function () {
        if($("#userPwd").val() == "") {
            alert("비밀번호를 입력해주세요.");
            $("#userPwd").focus();
        } else if(!userService.userPasswordEqual()) {
            $("#userPwd").focus();
        } else {
            if(confirm ("정말 탈퇴하시겠습니까?")) {
                $.ajax({
                    url : "/system/mypage/userOut.json",
                    type : "POST" ,
                    data : {
                        userId : $("#userId").val(),
                        userOutRsn : $("#userOutRsn").val()
                    },
                    dataType : "json" ,
                    success : function(res) {
                        if ("success" == res.result) {
                            alert("탈퇴되었습니다.");
                            location.href = "/logout.mng";
                        } else {
                            alert(res.message);
                        }
                    }
                })
            }
        }
    });

    $("#passwordChangeBtn").on("click", function () {
        $('.func-modal').modal("show");
        $("#nowUserPwd").val("");
        $("#chgUserPwd").val("");
        $("#userPwdConfirm").val("");
    });

    $("#nowUserPwd").change( function () {
        var userParams = {
            userId: $("#userId").val(),
            userPwd: $("#nowUserPwd").val()
        }
        userService.userPwdCheckClear();
        userService.userPasswordEqualCheck(userParams);
    });

    // 비밀번호 값이 동일한지 비교
    $("#chgUserPwd").keyup(function () {
        userService.comparePasswordEquality($("#chgUserPwd").val(), $("#userPwdConfirm").val());
    })
    $("#userPwdConfirm").keyup(function () {
        userService.comparePasswordEquality($("#chgUserPwd").val(), $("#userPwdConfirm").val());
    })

    $("#passwordChange").on("click", function () {
        if($("#nowUserPwd").val() == "") {
            alert("현재 비밀번호를 입력해주세요.");
            $("#nowUserPwd").focus();
        } else if(!userService.userPasswordEqual()) {
            $("#nowUserPwd").focus();
        } else if($("#chgUserPwd").val() == "") {
            alert("변경할 비밀번호를 입력해주세요.");
            $("#chgUserPwd").focus();
        // } else if(!userService.checkPassword($("#chgUserPwd").val())) {
        //     $("#chgUserPwd").focus();
        } else if($("#userPwdConfirm").val() == "") {
            alert("변경 비밀번호 확인란에 변경 비밀번호와 동일한 값을 입력해주세요.");
            $("#userPwdConfirm").focus();
        } else if(!userService.passwordEqualCheck()) {
            $("#userPwdConfirm").focus();
        } else if(!formUtil.chkPassword($("#chgUserPwd"), $("#userPwdConfirm"), 2, 200)){
            return;
        } else {
            $.ajax({
                url : "/system/mypage/pwdUpdate.json",
                type : "POST",
                data : {
                    userId : $("#userId").val(),
                    userLoginId : $("#userLoginId").val(),
                    userPwd : $("#chgUserPwd").val()
                },
                dataType : "json",
                success : function(res) {
                    if (res.result == "success") {
                        alert("비밀번호가 변경되었습니다.");
                        $('.func-modal').modal("hide");
                    } else {
                        alert(res.message);
                    }
                }

            })
        }
    });

})
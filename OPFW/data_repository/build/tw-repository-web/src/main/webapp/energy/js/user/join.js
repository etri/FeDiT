$(document).ready(function () {
    // 아이디 입력 후 아이디중복체크 값 false로 초기화
    $("#userLoginId").keyup(function () {
        userService.idDuplicateClear();
    })

    // 아이디 입력값이 형식에 맞는지 확인 후 아이디중복체크
    $("#idDuplicateCheckBtn").on("click", function () {
        var userLoginId = $("#userLoginId").val();
        if(userLoginId == ""){
            alert("아이디를 입력해주세요.");
        } else if(userService.checkLoginId(userLoginId)) {
            userService.idDuplicateCheckRequest(userLoginId);
        }
    })

    // 비밀번호 값이 동일한지 비교
    $("#userPwd").keyup(function () {
        userService.comparePasswordEquality($("#userPwd").val(), $("#userPwdConfirm").val());
    })
    $("#userPwdConfirm").keyup(function () {
        userService.comparePasswordEquality($("#userPwd").val(), $("#userPwdConfirm").val());
    })

    $("#joinBtn").on("click", function () {
        var joinParams = {
            id: $("#userLoginId").val(),
            password: $("#userPwd").val(),
            name: $("#userNm").val(),
            gender: $("#gender").val(),
            birth: $("#birth").val(),
            mobile: $("#mobile").val(),
            addr: $("#addr").val(),
            email: $("#email").val(),
        };

        // 아이디중복체크 값과 비밀번호동일 값이 true이고 입력값이 형식에 맞는지 확인
        var joinAble = userService.joinCheckAll(joinParams);

        if(joinAble) {
            $.ajax({
                url: "/login/user/join.json",
                type: "POST",
                data: $("#joinForm").serialize(),
                dataType: "json",
                success: function (res) {
                    if(res.result === "success") {
                        alert("가입이 완료되었습니다.");
                        location.href = "/login/loginForm.mng";
                    } else {
                        alert(res.message);
                        location.href = "/login/join.mng";
                    }
                }
            })
        }
    })

    $("#cancelBtn").on("click", function() {
        if(confirm("회원가입을 취소하시겠습니까?")){
            location.href = "/login/loginForm.mng";
        }
    })

})
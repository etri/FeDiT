var userService = (function () {
    var isIdDuplicated = false;
    var isEqualPassword = false;
    var isEqualUserPwd = false;

    return {
        // 아이디중복체크 : 상태 초기화
        idDuplicateClear : function () {
            isIdDuplicated = false;
        },
        // 아이디중복체크 : 아이디가 중복인 경우 상태 false, 아이디 중복이 없는 경우 true로 상태 변경
        idDuplicateCheckRequest : function(userLoginId) {
            $.ajax({
                url: "/login/duplicate.json",
                type : "POST",
                data : {userLoginId: userLoginId},
                dataType: 'json',
                success: function(res) {
                    if (res.result === "nonExist") {
                        isIdDuplicated = true;
                        alert(res.message);
                    } else {
                        isIdDuplicated = false;
                        alert(res.message);
                        $("#userLoginId").focus();
                    }
                }
            })
        },
        // 아이디중복체크 : 중복인 경우 에러메시지 표출
        idDuplicateCheck : function () {
            if(!isIdDuplicated) {
                alert("아이디 중복 체크를 진행해주세요.");
            }
            return isIdDuplicated;
        },
        // 비밀번호체크 : 비밀번호와 비밀번호 확인값이 동일하면 true, 동일하지 않으면 false
        comparePasswordEquality : function (password, passwordConfirm) {
            return isEqualPassword = password === passwordConfirm;
        },
        // 비밀번호체크 : 비밀번호와 비밀번호 확인값이 동일하지 않으면 에러메시지 표출
        passwordEqualCheck : function () {
            if(!isEqualPassword) {
                alert("비밀번호가 일치하지 않습니다.");
            }
            return isEqualPassword;
        },
        userPwdCheckClear : function () {
            isEqualUserPwd = false;
        },
        // 비밀번호체크 : 입력한 비밀번호가 사용자 비밀번호와 동일하면 true, 동일하지 않으면 false
        userPasswordEqualCheck : function (p) {
            $.ajax({
                url: "/system/mypage/pwdCheck.json",
                type : "POST",
                data : p,
                dataType: 'json',
                success: function(res) {
                    if(res.result == "success") {
                        isEqualUserPwd = true;
                    } else {
                        isEqualUserPwd = false;
                    }
                }
            })
        },
        userPasswordEqual : function () {
            if(!isEqualUserPwd) {
                alert("비밀번호가 틀렸습니다. 비밀번호를 확인해주세요.");
            }
            return isEqualUserPwd;
        },
        // 입력형식체크
        checkLoginId : function (id) {
            var v = commonValidation.loginIdValidation(id);
            if(!v.isValid) {
                alert(v.invalidMessage);
            }
            return v.isValid;
        },
        checkPassword : function (password) {
            var v = commonValidation.passwordValidation(password);
            if(!v.isValid) {
                alert(v.invalidMessage);
            }
            return v.isValid;
        },
        checkName : function (name, nameNick) {
            var v = commonValidation.nameValidation(name, nameNick);
            if(!v.isValid) {
                alert(v.invalidMessage);
            }
            return v.isValid;
        },
        checkGender : function (gender) {
            var v = commonValidation.genderValidation(gender);
            if(!v.isValid) {
                alert(v.invalidMessage);
            }
            return v.isValid;
        },
        checkBirth : function (birth) {
            var v = commonValidation.birthValidation(birth);
            if(!v.isValid) {
                alert(v.invalidMessage);
            }
            return v.isValid;
        },
        checkMobile : function (mobile, mobileNick) {
            var v = commonValidation.mobileValidation(mobile, mobileNick);
            if(!v.isValid) {
                alert(v.invalidMessage);
            }
            return v.isValid;
        },
        checkEmail : function (email) {
            var v = commonValidation.emailValidation(email);
            if(!v.isValid) {
                alert(v.invalidMessage);
            }
            return v.isValid;
        },
        checkAddr : function (addr) {
            var v = commonValidation.addrValidation(addr);
            if(!v.isValid) {
                alert(v.invalidMessage);
            }
            return v.isValid;
        },
        checkBusinessNo : function (businessNo) {
            var v = commonValidation.businessNoValidation(businessNo);
            if(!v.isValid) {
                alert(v.invalidMessage);
            }
            return v.isValid;
        },
        checkUrl : function (url) {
            var v = commonValidation.urlValidation(url);
            if(!v.isValid) {
                alert(v.invalidMessage);
            }
            return v.isValid;
        },
        // 회원가입시 체크사항
        joinCheckAll : function (p) {
            return this.checkLoginId(p.id) &&
                this.idDuplicateCheck() &&
                this.checkPassword(p.password) &&
                this.passwordEqualCheck() &&
                this.checkName(p.name, "사용자 이름은") &&
                this.checkGender(p.gender) &&
                this.checkBirth(p.birth) &&
                this.checkMobile(p.mobile) &&
                this.checkAddr(p.addr) &&
                this.checkEmail(p.email);
        },
        // 회원정보 수정시 체크사항
        userCheckAll : function (p) {
            return this.checkName(p.name, "사용자명은") &&
                this.checkGender(p.gender) &&
                this.checkBirth(p.birth) &&
                this.checkMobile(p.mobile) &&
                this.checkAddr(p.addr) &&
                this.checkEmail(p.email);
        }
    }
}());
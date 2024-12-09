var commonValidation = (function () {
    return {
        loginIdValidation: function (id) {
            var idRegExp = /^[A-Za-z0-9]{4,16}$/;
            return {
                isValid: idRegExp.test(id),
                invalidMessage: "아이디는 4자 이상 16자 이하의 영문자, 숫자 조합만 가능합니다.",
            };
        },
        passwordValidation: function (password) {
            //영대문자(A~Z, 26개), 영소문자(a~z, 26개), 숫자(0~9, 10개) 및 특수문자(32개) 중 3종류 이상으로 구성하여 최소 9자 이상으로 입력
            //~ ․! @ # $ % ^ & * ( ) _ - + =  [ ] [ ] | \ ; :‘ “ < > , . ? /
            //숫자, 특문 각 1회 이상, 영문은 2개 이상 사용하여 8자리 이상 입력
            var passwordRegExp = /(?=.*\d{1,50})(?=.*[~․!@#$%^&*()_\-+=\[\]|\\;:'‘"<>,.?/]{1,50})(?=.*[a-zA-Z]{1,50}).{8,20}$/;
            return {
                isValid: passwordRegExp.test(password),
                invalidMessage: "비밀번호는 영문, 숫자, 특수문자가 혼합된 8~20자 이내로 입력해 주세요.",
            };
        },
        nameValidation: function (name, nameNick) {
            return {
                isValid: name.length < 21 && name.length > 1,
                invalidMessage: nameNick ? nameNick + " 공백이 될 수 없으며 20자 이내로 입력해 주세요." : "이름은 공백이 될 수 없으며 20자 이내로 입력해 주세요.",
            }
        },
        genderValidation: function (gender) {
            return {
                isValid: gender === 'f' || gender === 'm',
                invalidMessage: "성별을 선택해주세요.",
            }
        },
        birthValidation: function (birth) {
            var inValidMessage = "생년월일을 확인하세요.";

            function isBirthday(dateStr) {
                if (dateStr instanceof Number) {
                    dateStr = dateStr.toString();
                }

                var year = Number(dateStr.substr(0, 4)); // 입력한 값의 0~4자리까지 (연)
                var month = Number(dateStr.substr(4, 2)); // 입력한 값의 4번째 자리부터 2자리 숫자 (월)
                var day = Number(dateStr.substr(6, 2)); // 입력한 값 6번째 자리부터 2자리 숫자 (일)
                var today = new Date(); // 날짜 변수 선언
                var yearNow = today.getFullYear(); // 올해 연도 가져옴

                var birthRegExp = /\d{8}/;

                if (birthRegExp.test(dateStr)) {
                    if (1900 > year || year > yearNow) {
                        return false;
                    } else if (month < 1 || month > 12) {
                        return false;
                    } else if (day < 1 || day > 31) {
                        return false;
                        // 31일 체크
                    } else if ((month == 4 || month == 6 || month == 9 || month == 11) && day == 31) {
                        return false;
                        // 윤달 체크
                    } else if (month == 2) {
                        var isleap = (year % 4 == 0 && (year % 100 != 0 || year % 400 == 0));
                        if (day > 29 || (day == 29 && !isleap)) {
                            return false;
                        } else {
                            return true;
                        }
                    } else {
                        return true;
                    }
                } else {
                    inValidMessage = "생년월일을 8자리 숫자로 입력해주세요."
                    return false;
                }
            }
            return {
                isValid: isBirthday(birth),
                invalidMessage: inValidMessage,
            }

        },
        addrValidation: function (addr) {
            return {
                isValid: addr,
                invalidMessage: "주소를 입력해주세요.",
            }
        },
        mobileValidation: function (mobile, mobileNick) {
            var mobileRegExp = /^\d{10,11}$/;
            return {
                isValid: mobileRegExp.test(mobile),
                invalidMessage: mobileNick ? mobileNick + " 숫자로만 입력해주세요." : "연락처는 숫자로만 입력해주세요.",
            }
        },
        emailValidation: function (email, emailNick) {
            var emailRegExp = /^[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z]){0,30}@[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z]){0,30}\.[a-zA-Z]{2,3}$/;
            return {
                isValid: emailRegExp.test(email),
                invalidMessage: emailNick ? email + " 형식에 맞게 입력해주세요." : "이메일 형식에 맞게 입력해주세요.",
            }
        },
        businessNoValidation: function (businessNo) {
            var regExp = /^\d{10}$/;
            return {
                isValid: regExp.test(businessNo),
                invalidMessage: "사업자 등록번호는 -를 제외한 10자리의 숫자만 입력해주세요.",
            }
        },
        urlValidation: function (url) {
            var regExp = /^https?:\/\//;
            return {
                isValid: regExp.test(url),
                invalidMessage: "URL은 http:// 혹은 https://로 시작하여야 합니다."
            }
        }
    }
}());

/**
 * 문자열 관련 클랙스
 * ver : 1.0.1
 */

var strUtil = {
    'isEmpty': function (str) {
        if (str == null || str == undefined) return true;
        try {
            var len = str.trim().length;
            if (len == 0) return true;
        } catch (e) {
        }

        return false;
    },

    'isNotEmpty': function (str) {
        if (str == null || str == undefined) return false;
        try {
            var len = str.trim().length;
            if (len == 0) return false;
        } catch (e) {
        }

        return true;
    }

};

var ckboxUtil = {
    'maxChecked': function (obj, max) {
        if (obj == null || obj == undefined) return;

        var ckbox = document.getElementsByName(obj.name);
        var cnt = 0;
        for (var i = 0; i < ckbox.length; i++) if (ckbox[i].checked) cnt++;
        if (cnt > max) {
            obj.checked = false;
            alert("최대 " + max + "개만 선택 가능합니다.");
        }
    },
    'chkCnt': function (obj) {
        if (obj == null || obj == undefined) return 0;

        var ckbox = document.getElementsByName(obj.name);
        var cnt = 0;
        if (obj.name == null || obj.name == undefined) {
            for (var i = 0; i < obj.length; i++) if (obj[i].checked) cnt++;
        } else {
            for (var i = 0; i < ckbox.length; i++) if (ckbox[i].checked) cnt++;
        }
        return cnt;
    }
}

var formUtil = {
    'chkDate': function (input, title, required = true) {
        if (input == null || input == undefined) {
            frmAlert("'" + title + "' 항목을 입력하십시오.");
            return false;
        }
        try {
            if (required && input.val() == null || input.val() == undefined || strUtil.isEmpty(input.val().trim())) {
                frmAlert("'" + title + "' 항목을 선택하십시오.");
                input.focus();
                return false;
            }
            return true;
        } catch (err) {
            if (input.value == null || input.value == undefined) {
                frmAlert("'" + title + "' 항목을 입력하십시오.");
                return false;
            }
            if (required && strUtil.isEmpty(input.value)) {
                frmAlert("'" + title + "' 항목을 입력하십시오.");
                input.focus();
                return false;
            }
            return true;
        }
    },
    'chkDateOrder': function (startDtInput, startDtTitle, endDtInput, endDtTitle) {
        let startDt = null;
        try {
            if (startDtInput.val() != null && startDtInput.val() != undefined && !strUtil.isEmpty(startDtInput.val().trim())) {
                startDt = startDtInput.val();
            }
        } catch (err) {
            if (startDtInput.value != null && startDtInput.value != undefined && !strUtil.isEmpty(startDtInput.value)) {
                startDt = startDtInput.value;
            }
        }

        let endDt = null;
        try {
            if (endDtInput.val() != null && endDtInput.val() != undefined && !strUtil.isEmpty(endDtInput.val().trim())) {
                endDt = endDtInput.val();
            }
        } catch (err) {
            if (endDtInput.value != null && endDtInput.value != undefined && !strUtil.isEmpty(endDtInput.value)) {
                endDt = endDtInput.value;
            }
        }

        if( startDt == null || endDt == null ) {
            return true;
        }

        if(startDt > endDt){
            frmAlert(`${startDtTitle} 항목 보다 ${endDtTitle} 항목을 더 나중 날짜를 입력해주세요.`);
            return false;
        }

        return true;
    },

    'chkSelect': function (input, title) {
        if (input == null || input == undefined) {
            frmAlert("'" + title + "' 항목을 입력하십시오.");
            return false;
        }
        try {
            if (input.val() == null || input.val() == undefined || strUtil.isEmpty(input.val().trim())) {
                frmAlert("'" + title + "' 항목을 선택하십시오.");
                input.focus();
                return false;
            }
            return true;
        } catch (err) {
            for (var i = 0; i < input.options.length; i++) {
                if (input.options[i].selected && strUtil.isNotEmpty(input.options[i].value)) return true;
            }
            frmAlert("'" + title + "' 항목을 선택하십시오.");
            input.focus();
            return false;
        }
    },
    'chkTextDetail': function (input, title, min, max, checkSpecial, checkBlank, required = true) {
        if (input == null || input == undefined) {
            frmAlert("'" + title + "' 항목을 입력하십시오.");
            return false;
        }

        try {
            input.val(input.val().trim());
            if (strUtil.isEmpty(input.val())) {
                if (required) {
                    frmAlert("'" + title + "' 항목을 입력하십시오.");
                    input.focus();
                    return false;
                }
            }else{
                if (input.val().length < min || input.val().length > max) {
                    frmAlert("'" + title + "' 항목을 " + min + " ~ " + max + "자 길이로 입력하십시오.");
                    input.focus();
                    return false;
                }
                if (checkSpecial && textChk.checkSpecial(input.val())) {
                    frmAlert("'" + title + "' 항목에 특수문자가 포함되어있습니다. 특수문자를 제외하고 입력해 주십시오.");
                    input.focus();
                    return false;
                }
                if (checkBlank && textChk.checkBlank(input.val())) {
                    frmAlert("'" + title + "' 항목에 빈칸이 포함되어있습니다. 빈칸을 제외하고 입력해 주십시오.");
                    input.focus();
                    return false;
                }
            }
            return true;
        } catch (err) {
            if (input.value == null || input.value == undefined) {
                frmAlert("'" + title + "' 항목을 입력하십시오.");
                return false;
            }
            input.value = $.trim(input.value);
            if (strUtil.isEmpty(input.value)) {
                if(required) {
                    frmAlert("'" + title + "' 항목을 입력하십시오.");
                    input.focus();
                    return false;
                }
            }else {
                if (input.value.length < min || input.value.length > max) {
                    frmAlert("'" + title + "' 항목을 " + min + " ~ " + max + "자 길이로 입력하십시오.");
                    input.focus();
                    return false;
                }
                if (checkSpecial && textChk.checkSpecial(input.value)) {
                    frmAlert("'" + title + "' 항목에 특수문자가 포함되어있습니다. 특수문자를 제외하고 입력해 주십시오.");
                    input.focus();
                    return false;
                }
                if (checkBlank && textChk.checkBlank(input.value)) {
                    frmAlert("'" + title + "' 항목에 빈칸이 포함되어있습니다. 빈칸을 제외하고 입력해 주십시오.");
                    input.focus();
                    return false;
                }
            }
            return true;
        }
    },
    'chkText': function (input, title, min, max, required = true) {
        if (input == null || input == undefined) {
            frmAlert("'" + title + "' 항목을 입력하십시오.");
            return false;
        }

        try {
            input.val(input.val().trim());
            if (strUtil.isEmpty(input.val())) {
                if(required) {
                    frmAlert("'" + title + "' 항목을 입력하십시오.");
                    input.focus();
                    return false;
                }
            }else {
                if (input.val().length < min || input.val().length > max) {
                    frmAlert("'" + title + "' 항목을 " + min + " ~ " + max + "자 길이로 입력하십시오.");
                    input.focus();
                    return false;
                }
            }
            return true;
        } catch (err) {
            if (input.value == null || input.value == undefined) {
                frmAlert("'" + title + "' 항목을 입력하십시오.");
                return false;
            }
            input.value = $.trim(input.value);
            if (strUtil.isEmpty(input.value)) {
                if(required) {
                    frmAlert("'" + title + "' 항목을 입력하십시오.");
                    input.focus();
                    return false;
                }
            }else {
                if (input.value.length < min || input.value.length > max) {
                    frmAlert("'" + title + "' 항목을 " + min + " ~ " + max + "자 길이로 입력하십시오.");
                    input.focus();
                    return false;
                }
            }
            return true;
        }
    },
    'chkTextNumber': function (input, title, required = true) {
        if (input == null || input == undefined) {
            frmAlert("'" + title + "' 항목을 입력하십시오.");
            return false;
        }

        try {
            input.val(input.val().trim());
            if (strUtil.isEmpty(input.val())) {
                if(required) {
                    frmAlert("'" + title + "' 항목을 입력하십시오.");
                    input.focus();
                    return false;
                }
            }else {
                if (false == textChk.checkNumber(input.val())) {
                    frmAlert("'" + title + "' 항목을 숫자만 입력해 주십시오.");
                    input.focus();
                    return false;
                }
                // if (input.val() < min || input.val() > max) {
                //     frmAlert("'" + title + "' 항목을 " + min + " ~ " + max + " 사이로 입력하십시오.");
                //     input.focus();
                //     return false;
                // }
            }
            return true;
        } catch (err) {
            if (input.value == null || input.value == undefined) {
                frmAlert("'" + title + "' 항목을 입력하십시오.");
                return false;
            }
            input.value = $.trim(input.value);
            if (strUtil.isEmpty(input.value)) {
                if(required) {
                    frmAlert("'" + title + "' 항목을 입력하십시오.");
                    input.focus();
                    return false;
                }
            }else {
                if (false == textChk.checkNumber(input.value)) {
                    frmAlert("'" + title + "' 항목을 숫자만 입력해 주십시오.");
                    input.focus();
                    return false;
                }
                // if (input.value < min || input.value > max) {
                //     frmAlert("'" + title + "' 항목을 " + min + " ~ " + max + " 사이로 입력하십시오.");
                //     input.focus();
                //     return false;
                // }
            }
            return true;
        }
    },
    'chkTextDecimal': function (input, title, required = true) {
        if (input == null || input == undefined) {
            frmAlert("'" + title + "' 항목을 입력하십시오.");
            return false;
        }

        try {
            input.val(input.val().trim());
            if (strUtil.isEmpty(input.val())) {
                if(required) {
                    frmAlert("'" + title + "' 항목을 입력하십시오.");
                    input.focus();
                    return false;
                }
            }else {
                if (false == textChk.checkDecimal(input.val())) {
                    frmAlert("'" + title + "' 항목을 소수점이하두자리 소수만 입력해 주십시오.");
                    input.focus();
                    return false;
                }
                // if (input.val() < min || input.val() > max) {
                //     frmAlert("'" + title + "' 항목을 " + min + " ~ " + max + " 사이로 입력하십시오.");
                //     input.focus();
                //     return false;
                // }
            }
            return true;
        } catch (err) {
            if (input.value == null || input.value == undefined) {
                frmAlert("'" + title + "' 항목을 입력하십시오.");
                return false;
            }
            input.value = $.trim(input.value);
            if (strUtil.isEmpty(input.value)) {
                if(required) {
                    frmAlert("'" + title + "' 항목을 입력하십시오.");
                    input.focus();
                    return false;
                }
            }else {
                if (false == textChk.checkDecimal(input.value)) {
                    frmAlert("'" + title + "' 항목을 소수점이하두자리 소수만 입력해 주십시오.");
                    input.focus();
                    return false;
                }
                // if (input.value < min || input.value > max) {
                //     frmAlert("'" + title + "' 항목을 " + min + " ~ " + max + " 사이로 입력하십시오.");
                //     input.focus();
                //     return false;
                // }
            }
            return true;
        }
    },
    'chkTextGpsDecimal': function (input, title, required = true) {
        if (input == null || input == undefined) {
            frmAlert("'" + title + "' 항목을 입력하십시오.");
            return false;
        }

        try {
            input.val(input.val().trim());
            if (strUtil.isEmpty(input.val())) {
                if(required) {
                    frmAlert("'" + title + "' 항목을 입력하십시오.");
                    input.focus();
                    return false;
                }
            }else {
                if (false == textChk.checkGpsDecimal(input.val())) {
                    frmAlert("'" + title + "' 항목을 소수점이하열다섯자리 소수만 입력해 주십시오.");
                    input.focus();
                    return false;
                }
                // if (input.val() < min || input.val() > max) {
                //     frmAlert("'" + title + "' 항목을 " + min + " ~ " + max + " 사이로 입력하십시오.");
                //     input.focus();
                //     return false;
                // }
            }
            return true;
        } catch (err) {
            if (input.value == null || input.value == undefined) {
                frmAlert("'" + title + "' 항목을 입력하십시오.");
                return false;
            }
            input.value = $.trim(input.value);
            if (strUtil.isEmpty(input.value)) {
                if(required) {
                    frmAlert("'" + title + "' 항목을 입력하십시오.");
                    input.focus();
                    return false;
                }
            }else {
                if (false == textChk.checkGpsDecimal(input.value)) {
                    frmAlert("'" + title + "' 항목을 소수점이하열두자리 소수만 입력해 주십시오.");
                    input.focus();
                    return false;
                }
                // if (input.value < min || input.value > max) {
                //     frmAlert("'" + title + "' 항목을 " + min + " ~ " + max + " 사이로 입력하십시오.");
                //     input.focus();
                //     return false;
                // }
            }
            return true;
        }
    },
    'chkOnlyText': function (input, title, min, max) {
        if (input == null || input == undefined) {
            frmAlert("'" + title + "' 항목을 입력하십시오.");
            return false;
        }
        try {
            input.val(input.val().trim());
            if (strUtil.isEmpty(input.val())) return true;
            if (input.val().length < min || input.val().length > max) {
                frmAlert("'" + title + "' 항목을 " + min + " ~ " + max + "자 길이로 입력하십시오.");
                input.focus();
                return false;
            }
            return true;
        } catch (err) {
            if (input.value == null || input.value == undefined) {
                frmAlert("'" + title + "' 항목을 입력하십시오.");
                return false;
            }
            input.value = $.trim(input.value);
            if (strUtil.isEmpty(input.value)) return true;
            if (input.value.length < min || input.value.length > max) {
                frmAlert("'" + title + "' 항목을 " + min + " ~ " + max + "자 길이로 입력하십시오.");
                input.focus();
                return false;
            }
            return true;
        }
    },

    'chkTel': function (input, title, required = true) {
        if (input == null || input == undefined) {
            frmAlert("'" + title + "' 항목을 입력하십시오.");
            return false;
        }

        try {
            input.val(input.val().trim());
            if (strUtil.isEmpty(input.val())) {
                if(required) {
                    frmAlert("'" + title + "' 항목을 입력하십시오.");
                    input.focus();
                    return false;
                }
            }else {
                if (false == _ck_telnum(input.val())) {
                    frmAlert("전화번호를 확인하십시오.");
                    input.focus();
                    return false;
                }
            }
            return true;
        } catch (err) {
            if (input.value == null || input.value == undefined) {
                frmAlert("'" + title + "' 항목을 입력하십시오.");
                return false;
            }
            input.value = $.trim(input.value);
            if (strUtil.isEmpty(input.value)) {
                if(required) {
                    frmAlert("'" + title + "' 항목을 입력하십시오.");
                    input.focus();
                    return false;
                }
            }else {
                if (false == _ck_telnum(input.value)) {
                    frmAlert("전화번호를 확인하십시오.");
                    input.focus();
                    return false;
                }
            }
            return true;
        }
    },

    'chkEmail': function (input, title, required = true) {
        if (input == null || input == undefined) {
            frmAlert("'" + title + "' 항목을 입력하십시오.");
            return false;
        }

        try {
            input.val(input.val().trim());
            if (strUtil.isEmpty(input.val())) {
                if(required) {
                    frmAlert("'" + title + "' 항목을 입력하십시오.");
                    input.focus();
                    return false;
                }
            }else {
                if (false == _ck_email(input.val())) {
                    frmAlert("이메일을 확인하십시오.");
                    input.focus();
                    return false;
                }
            }
            return true;
        } catch (err) {
            if (input.value == null || input.value == undefined) {
                frmAlert("'" + title + "' 항목을 입력하십시오.");
                return false;
            }
            input.value = $.trim(input.value);
            if (strUtil.isEmpty(input.value)) {
                if(required) {
                    frmAlert("'" + title + "' 항목을 입력하십시오.");
                    input.focus();
                    return false;
                }
            }else {
                if (false == _ck_email(input.value)) {
                    frmAlert("이메일을 확인하십시오.");
                    input.focus();
                    return false;
                }
            }
            return true;
        }
    },

    'chkPassword': function (input_pw, input_pw_repeat, min, max) {
        var title = "비밀번호";
        var title_repeat = "비밀번호 재확인";

        if (input_pw == null || input_pw == undefined) {
            frmAlert("시스템오류 : " + title + " 항목이 정의되지 않았습니다.");
            return false;
        }

        if (input_pw_repeat == null || input_pw_repeat == undefined) {
            frmAlert("시스템오류 : " + title_repeat + " 항목이 정의되지 않았습니다.");
            return false;
        }

        try {
            input_pw.val(input_pw.val().trim());
            if (strUtil.isEmpty(input_pw.val())) {
                frmAlert("'" + title + "' 항목을 입력하십시오.");
                input_pw.focus();
                return false;
            }
            if (input_pw.val().length < min || input_pw.val().length > max) {
                frmAlert("'" + title + "' 항목을 " + min + " ~ " + max + "자 길이의 문자열로 입력하십시오.");
                input_pw.focus();
                return false;
            }

            input_pw_repeat.val(input_pw_repeat.val().trim());
            if (strUtil.isEmpty(input_pw_repeat.val())) {
                frmAlert("'" + title_repeat + "' 항목을 입력하십시오.");
                input_pw_repeat.focus();
                return false;
            }
            if (input_pw_repeat.val().length < min || input_pw_repeat.val().length > max) {
                frmAlert("'" + title_repeat + "' 항목을 " + min + " ~ " + max + "자 길이의 문자열로 입력하십시오.");
                input_pw_repeat.focus();
                return false;
            }

            if (input_pw.val() != input_pw_repeat.val()) {
                frmAlert("'" + title_repeat + "' 항목값이 다릅니다.");
                input_pw_repeat.focus();
                return false;
            }
            return true;
        } catch (err) {
            if (input_pw.value == null || input_pw.value == undefined) {
                frmAlert("시스템오류 : " + title + " 항목이 정의되지 않았습니다.");
                return false;
            }
            if (input_pw_repeat.value == null || input_pw_repeat.value == undefined) {
                frmAlert("시스템오류 : " + title_repeat + " 항목이 정의되지 않았습니다.");
                return false;
            }

            input_pw.value = $.trim(input_pw.value);
            if (strUtil.isEmpty(input_pw.value)) {
                frmAlert("'" + title + "' 항목을 입력하십시오.");
                input_pw.focus();
                return false;
            }
            if (input_pw.value.length < min || input_pw.value.length > max) {
                frmAlert("'" + title + "' 항목을 " + min + " ~ " + max + "자 길이의 문자열로 입력하십시오.");
                input_pw.focus();
                return false;
            }

            input_pw_repeat.value = $.trim(input_pw_repeat.value);
            if (strUtil.isEmpty(input_pw_repeat.value)) {
                frmAlert("'" + title_repeat + "' 항목을 입력하십시오.");
                input_pw_repeat.focus();
                return false;
            }
            if (input_pw_repeat.value.length < min || input_pw_repeat.value.length > max) {
                frmAlert("'" + title_repeat + "' 항목을 " + min + " ~ " + max + "자 길이의 문자열로 입력하십시오.");
                input_pw_repeat.focus();
                return false;
            }

            if (input_pw.value != input_pw_repeat.value) {
                frmAlert("'" + title_repeat + "' 항목값이 다릅니다.");
                input_pw_repeat.focus();
                return false;
            }
            return true;
        }
    },
    'getSelectVal' : function (input) {
        if(input==null || input==undefined) {
            frmAlert("시스템오류 : Input 항목이 정의되지 않았습니다.");
            return "";
        }
        try {
            if(input.val()==null || input.val()==undefined || strUtil.isEmpty(input.val().trim())) {
                return "";
            }
            return input.val().trim();
        } catch(err) {
            for(var i=0; i<input.options.length; i++) {
                if(input.options[i].selected && strUtil.isNotEmpty(input.options[i].value)) return input.options[i].value;
            }
            return "";
        }
    },
    'setSelect' : function (obj, val) {
        if(obj==null || obj==undefined) {
            frmAlert("시스템오류 : Input 항목이 정의되지 않았습니다.");
            return false;
        }
        try {
            obj.val(val);
            obj.selectpicker('refresh');
        }  catch(err) {

        }
    }
};

function _ck_telnum(num) {
    //var checkReg = /^[-0-9]*$/;
    var checkReg = /^([0-9]{3,4})-?([0-9]{3,4})-?([0-9]{4})$/;
    return checkReg.test(num);
}

function _ck_email(val) {
    var checkReg = /^[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/i;
    return checkReg.test(val);
}

function frmAlert(msg) {
    alert(msg);
}

var textChk = {
    'checkSpecial': function (str) {
        var special_pattern = /[`~!@#$%^&*|\\\'\";:\/?]/gi;

        if (special_pattern.test(str) == true) {
            return true;
        }
        return false;
    },
    'checkBlank': function (str) {
        var blank_pattern = /[\s]/g;
        if (blank_pattern.test(str) == true) {
            return true;
        }
        return false;
    },
    'checkNumber': function (str) {
        const regExp = /^[0-9]+$/;
        if (regExp.test(str)) {
            return true;
        } else {
            return false;
        }
    },
    'checkDecimal': function (str) {
        const regExp =  /^\d*.?\d{0,2}$/;
        if (regExp.test(str)) {
            return true;
        } else {
            return false;
        }
    },
    'checkGpsDecimal': function (str) {
        const regExp =  /^\d*.?\d{0,15}$/;
        if (regExp.test(str)) {
            return true;
        } else {
            return false;
        }
    }
}

var inChk = {
    'engNum': function (obj) {
        if (obj == null || obj == undefined) return "";
        var key = event.KeyCode;
        if (key == 8 || key == 9 || key == 37 || key == 39 || key == 46) return;
        try {
            obj.val(obj.val().replace(/[^a-z|A-Z|0-9]/g, ""));
        } catch (err) {
            obj.value = obj.value.replace(/[^a-z|A-Z|0-9]/g, "");
        }
    },
    'num': function (obj) {
        if (obj == null || obj == undefined) return "";
        var key = event.KeyCode;
        if (key == 8 || key == 9 || key == 37 || key == 39 || key == 46) return;
        try {
            obj.val(obj.val().replace(/[^0-9]/g, ""));
        } catch (err) {
            obj.value = obj.value.replace(/[^0-9]/g, "");
        }
    }
    ,
    'snum': function (obj) {
        if (obj == null || obj == undefined) return "";
        var key = event.KeyCode;
        if (key == 8 || key == 9 || key == 37 || key == 39 || key == 46) return;
        try {
            obj.val(obj.val().replace(/[^0-9|-]/g, ""));
        } catch (err) {
            obj.value = obj.value.replace(/[^0-9|-]/g, "");
        }
    }

};
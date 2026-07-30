(function () {
    'use strict'

    // ===== FE 검증 상수/헬퍼 =====
    const ID_REGEX = /^[a-z0-9]{1,20}$/;                 // 영문 소문자 + 숫자
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;    // 이메일 형식
    const PW_MIN = 8;
    const PW_MAX = 15;

    function isDigits(value, len) {
        return new RegExp(`^[0-9]{${len}}$`).test(value);
    }

    // 휴대폰/전화 3-4-4 자릿수 검증. required=true 면 빈값도 오류.
    function validatePhone(p1, p2, p3, sel1, sel2, sel3, label, required) {
        let v1 = $(sel1).val().trim();
        let v2 = $(sel2).val().trim();
        let v3 = $(sel3).val().trim();

        let allEmpty = v1.length === 0 && v2.length === 0 && v3.length === 0;
        if (!required && allEmpty) {
            return true; // 선택 항목 - 미입력 허용
        }

        if (!isDigits(v1, 3)) {
            $(sel1).focus();
            alert(`${label} 앞 번호 3자리를 정확히 입력하세요.`);
            return false;
        }
        if (!isDigits(v2, 4)) {
            $(sel2).focus();
            alert(`${label} 중간 번호 4자리를 정확히 입력하세요.`);
            return false;
        }
        if (!isDigits(v3, 4)) {
            $(sel3).focus();
            alert(`${label} 뒷 번호 4자리를 정확히 입력하세요.`);
            return false;
        }
        return true;
    }

    function validateCommon() {
        // 이름
        let name = $('#username').val().trim();
        if (name.length === 0) {
            $('#username').focus();
            alert('이름을 입력하세요');
            return false;
        }

        // 이메일
        let email = $('#userEml').val().trim();
        if (email.length === 0) {
            $('#userEml').focus();
            alert('이메일을 입력하세요');
            return false;
        }
        if (!EMAIL_REGEX.test(email)) {
            $('#userEml').focus();
            alert('이메일 형식이 올바르지 않습니다.');
            return false;
        }

        // 휴대폰(필수)
        if (!validatePhone(null, null, null, '#userHp1', '#userHp2', '#userHp3', '휴대폰번호', true)) {
            return false;
        }

        // 전화번호(선택)
        if (!validatePhone(null, null, null, '#userCont1', '#userCont2', '#userCont3', '전화번호', false)) {
            return false;
        }

        // 권한
        let use_auth = document.querySelector('#userAuthCd').dataset.value;
        if (!use_auth || use_auth === '0' || use_auth === '선택 없음') {
            alert('권한을 선택하세요');
            return false;
        }

        return true;
    }

    $(document).ready(function () {
        let userAuthCd = document.querySelector('#userAuthCd');
        if (userAuthCd) {
            if (!userAuthCd.dataset.value) {
                let dropdownBox = userAuthCd.closest('.dropdown-box');
                let firstInput = dropdownBox.querySelector('ul.option-list li:first-child input');
                let firstLabel = dropdownBox.querySelector(`ul.option-list li label[for="${firstInput.id}"]`);
                firstLabel.click();
            }
            observeDataValueChange(userAuthCd, function (targetElement, newValue) {
                if (!newValue || newValue === '선택 없음' || newValue === '0' || newValue === '' || newValue === 0) {
                    return;
                }
                let hiddenInput = document.querySelector(`input[type="hidden"][name="userAuthCd"]`);
                hiddenInput.value = newValue;
            });
        }

        // ===== 등록 =====
        $('.btn-insert-user').on('click', function () {
            // 아이디
            let id = $('#id').val().trim();
            if (id.length === 0) {
                $('#id').focus();
                alert('아이디를 입력하세요');
                return false;
            }
            if (!ID_REGEX.test(id)) {
                $('#id').focus();
                alert('아이디는 영문 소문자와 숫자만 사용할 수 있습니다. (최대 20자)');
                return false;
            }

            if (!validateCommon()) {
                return false;
            }

            // 비밀번호(필수) - 앞뒤 공백 제거 후 필드에 반영(검증값=제출값 일치)
            let password = $('#password').val().trim();
            $('#password').val(password);
            let password_confirm = $('#passwordConfirm').val().trim();
            $('#passwordConfirm').val(password_confirm);

            if (password.length === 0) {
                $('#password').focus();
                alert('비밀번호를 입력하세요.');
                return false;
            }
            if (password.length < PW_MIN || password.length > PW_MAX) {
                $('#password').focus();
                alert(`비밀번호는 ${PW_MIN}~${PW_MAX}자로 입력하세요.`);
                return false;
            }
            if (password_confirm.length === 0) {
                $('#passwordConfirm').focus();
                alert('비밀번호 확인을 입력하세요.');
                return false;
            }
            if (password !== password_confirm) {
                $('#passwordConfirm').val('');
                $('#passwordConfirm').focus();
                alert('패스워드가 일치하지 않습니다.');
                return false;
            }

            if (confirm('사용자를 등록 하시겠습니까?')) {
                document.forms.editForm.submit();
            }
        });

        // ===== 수정 =====
        $('.btn-update-user').on('click', function () {
            if (!validateCommon()) {
                return false;
            }

            // 비밀번호 재설정(선택) - 둘 중 하나라도 입력 시 둘 다 필수
            // 앞뒤 공백 제거 후 필드에 반영(공백만 입력 시 미입력으로 처리)
            let tempPassword = $('#tempPassword').val().trim();
            $('#tempPassword').val(tempPassword);
            let tempPasswordConfirm = $('#tempPasswordConfirm').val().trim();
            $('#tempPasswordConfirm').val(tempPasswordConfirm);

            if (tempPassword.length > 0 || tempPasswordConfirm.length > 0) {
                if (tempPassword.length < PW_MIN || tempPassword.length > PW_MAX) {
                    $('#tempPassword').focus();
                    alert(`비밀번호는 ${PW_MIN}~${PW_MAX}자로 입력하세요.`);
                    return false;
                }
                if (tempPasswordConfirm.length === 0) {
                    $('#tempPasswordConfirm').focus();
                    alert('비밀번호 재설정 확인을 입력하세요.');
                    return false;
                }
                if (tempPassword !== tempPasswordConfirm) {
                    $('#tempPasswordConfirm').val('');
                    $('#tempPasswordConfirm').focus();
                    alert('패스워드가 일치하지 않습니다.');
                    return false;
                }
            }

            if (confirm('사용자를 수정 하시겠습니까?')) {
                document.forms.editForm.submit();
            }
        });
    });
})();

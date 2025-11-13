(function () {
    'use strict'
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
                console.log('observeDataValueChange Callback', targetElement, newValue);
                if (!newValue || newValue === '선택 없음' || newValue === '0' || newValue === '' || newValue === 0) {
                    return;
                }
                let hiddenInput = document.querySelector(`input[type="hidden"][name="userAuthCd"]`);
                hiddenInput.value = newValue;
                console.log('hiddenInput.value', hiddenInput.value);
            });
        }
        $('.btn-insert-user').on('click', function () {
            let name = $('#username').val();

            let hp1 = $('#userHp1').val();
            let hp2 = $('#userHp2').val();
            let hp3 = $('#userHp3').val();

            let password = $('#password').val();
            let password_confirm = $('#passwordConfirm').val();
            let use_auth = document.querySelector('#userAuthCd').dataset.value;

            if (name.length === 0) {
                $('#username').focus();
                alert('이름을 입력하세요');
                return false;
            }

            if (hp1.length === 0) {
                $('#userHp1').focus();
                alert('휴대폰 첫번째 항목에 작성하세요');
                return false;
            }
            if (hp2.length === 0) {
                $('#userHp2').focus();
                alert('휴대폰 두번째 항목에 작성하세요');
                return false;
            }
            if (hp3.length === 0) {
                $('#userHp3').focus();
                alert('휴대폰 세번째 항목에 작성하세요');
                return false;
            }

            if (!use_auth || use_auth === 0 || use_auth === '0' || use_auth === '선택 없음') {
                alert('권한을 선택하세요');
                return false;
            }

            if (password.length > 0) {
                if (password_confirm === 0) {
                    $('#passwordConfirm').focus();
                    alert('비밀번호를 입력하세요.');
                    return false;
                }
                if (password !== password_confirm) {
                    $('#passwordConfirm').val('');
                    $('#passwordConfirm').focus();
                    alert('패스워드가 일치하지 않습니다.');
                    return false;
                }
            }

            if (confirm('사용자를 등록 하시겠습니까?')) {
                document.forms.editForm.submit();
            }

        });
        $('.btn-update-user').on('click', function () {
            let name = $('#username').val();

            let hp1 = $('#userHp1').val();
            let hp2 = $('#userHp2').val();
            let hp3 = $('#userHp3').val();

            let use_auth = document.querySelector('#userAuthCd').dataset.value;

            if (name.length === 0) {
                $('#username').focus();
                alert('이름을 입력하세요');
                return false;
            }

            if (hp1.length === 0) {
                $('#userHp1').focus();
                alert('휴대폰 첫번째 항목에 작성하세요');
                return false;
            }
            if (hp2.length === 0) {
                $('#userHp2').focus();
                alert('휴대폰 두번째 항목에 작성하세요');
                return false;
            }
            if (hp3.length === 0) {
                $('#userHp3').focus();
                alert('휴대폰 세번째 항목에 작성하세요');
                return false;
            }

            if (!use_auth || use_auth === 0 || use_auth === '0' || use_auth === '선택 없음') {
                alert('권한을 선택하세요');
                return false;
            }

            if (confirm('사용자를 수정 하시겠습니까?')) {
                document.forms.editForm.submit();
            }
        });
        $('.btn-delete-user').on('click', function () {
            if (confirm('사용자를 삭제 하시겠습니까?')) {
                document.forms.deleteForm.submit();
            }
        });
    });
})();
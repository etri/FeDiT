$(function() {
    showAlert = function(type) {
        'use strict';
        if (type === null || type === undefined) {
            return;
        }
        var msg = null;
        switch (type) {
            case '1':
                msg = {
                    type: 'success',
                    title: '등록되었습니다.'
                };
                break;
            case '2':
                msg = {
                    type: 'success',
                    title: '수정되었습니다.'
                };
                break;
            case '3':
                msg = {
                    type: 'error',
                    title: '삭제되었습니다.'
                };
                break;
            case '4':
                msg = {
                    type: 'success',
                    title: '저장되었습니다.'
                };
                break;
            case '101':
                msg = {
                    type: 'success',
                    title: '출석되었습니다.'
                };
                break;
            default:
                msg = {
                    type: 'warning',
                    title: type
                };
                break;
        }

        if (msg != null) {
            const Toast = Swal.mixin({
                toast: true,
                position: 'top',
                showConfirmButton: false,
                timer: 3000
            });
            Toast.fire(msg);
        }

    }
});
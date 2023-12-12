(function() {
    'use strict'
    $(document).ready(function() {

        commonSearchPaging();

        $('.btn-delete').on('click', function() {
            if (confirm('해당 사용자를 삭제하시겠습니까?')) {
                var userSeq = $(this).data('userSeq');
                var form = document.forms.deleteForm;
                form.userSeq.value = userSeq;
                form.submit();
            }
        });
    });
})();
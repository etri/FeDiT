(function() {
    'use strict'
    $(document).ready(function() {
        var tree = new Tree('.tree_container', {
            data: menuList,
            closeDepth: 2,
            loaded: function() {
                this.values = values;
            }
        });

        // 권한 등록
        $('.btn-register').on('click', function() {
            // console.log('tree : ', tree.getValues());
            var auth = $('#auth').val();
            if (auth === '') {
                alert('권한을 선택하십시오.');
                return false;
            }
            var values = tree.getValues();
            
            if (values.length === 0) {
                alert('선택된 권한이 없습니다.');
                return false;
            }
            var data = {
            	authCd: auth,
                values: values
            };

            ajaxPost('/setting/auth/register', data, function(result) {
                if (result.result_code === 200) {
                    //showAlert('4');
                    window.location.reload();
                }
            });
        });
    });
})();
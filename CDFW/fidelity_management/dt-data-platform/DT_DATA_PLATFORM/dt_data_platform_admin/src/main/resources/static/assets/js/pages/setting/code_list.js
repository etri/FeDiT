(function() {
    'use strict'
    $(document).ready(function() {

        // 그룹 코드 삭제
        $('.btn-delete-master').on('click', function() {
            if (confirm('해당 그룹 코드를 삭제하시겠습니까?\n그룹 코드 삭제시 상세 코드도 같이 삭제됩니다.')) {
                deleteCode('M', $(this).data('group-code'));
            }
        });

        // 상세 코드 삭제
        $('.btn-delete-detail').on('click', function() {
            if (confirm('해당 코드를 삭제하시겠습니까?')) {
                deleteCode('D', $(this).data('group-code'), $(this).data('code'));
            }
        });

        // 그룹 코드 등록
        $('.btn-add-master').on('click', function() {
            $('#grp_cd').val('');
            $('#grp_cd_nm').val('');
            $('#modal-group').modal('show');
        });

        // 상세 코드 등록
        $('.btn-add-detail').on('click', function() {
            openCodeDeailModal();
        });

        // 그룹 코드 조회
        $('.btn-modify-master').on('click', function() {
            getCodeInfo('M', $(this).data('group-code'));
        });

        // 상세 코드 조회
        $('.btn-modify-detail').on('click', function() {
            var grp_code = $(this).data('group-code');
            var code = $(this).data('code');
            openCodeDeailModal(grp_code, code);
        });

        $('.btn-register-master').on('click', function() {
            saveCodeMaster();
        });

        $('.btn-register-detail').on('click', function() {
            saveCodeDetail();
        });

        function openCodeDeailModal(grp_code, code) {

            ajaxPost('/setting/code/master', {}, function(result) {
                $('#grp_cd_dtl').empty();
                $.each(result.data, function(index, item) {
                    $('#grp_cd_dtl').append($('<option value="' + item.grp_cd + '">' + item.grp_cd_nm + '</option>'))
                });
                if (grp_code) {
                    // 수정인 경우
                    getCodeInfo('D', grp_code, code);
                } else {
                    // 등록
                    var group_code = $('.code-master').find('.table-info').data('group-code');
                    if (group_code) {
                        $('#grp_cd').val(group_code);
                    }
                    $('#dtl_cd').val('');
                    $('#dtl_cd_nm').val('');
                    $('#ordby').val('');
                    $('#use_yn').prop('checked', true).change();
                    $('#modal-detail').modal('show');
                }
            });
        }

        function getCodeInfo(type, grp_code, code) {
            var data = {
                type: type,
                grpCd: grp_code,
                dtlCd: code
            };

            ajaxPost('/setting/code/load', data, function(result) {
                if (type === 'M') {
                    $('#grp_cd').val(result.data.grp_cd);
                    $('#grp_cd_nm').val(result.data.grp_cd_nm);
                    $('#modal-group').modal('show');
                } else {
                    $('#grp_cd_dtl').val(result.data.grp_cd);
                    $('#dtl_cd_dtl').val(result.data.dtl_cd);
                    $('#dtl_cd_nm_dtl').val(result.data.dtl_cd_nm);
                    $('#ordby').val(result.data.ordby);
                    
                    //$('#use_yn').prop('checked', result.data.use_yn).change();
                    if (result.data.use_yn == 'Y') {
                    	$('#use_yn').prop('checked', 1).change()
                    } else {
                    	$('#use_yn').prop('checked', 0).change()
                    }
                    
                    $('#modal-detail').modal('show');
                }
            });
        }

        function saveCodeMaster() {
            var grp_code = $('#grp_cd').val().trim();
            var grp_code_name = $('#grp_cd_nm').val().trim();

            if (grp_code === '') {
                alert('그룹 코드를 입력하세요.');
                return;
            }

            if (grp_code_name === '') {
                alert('그룹 코드명을 입력하세요.');
                return;
            }

            var data = {
                grpCd: grp_code,
                grpCdNm: grp_code_name
            };

            ajaxPost('/setting/code/register/master', data, function(result) {
                if (result.result_code === 200) {
                    //showAlert('4');                    
                    window.location.reload();
                }
            });
        }

        function saveCodeDetail() {
            var grp_code = $('#grp_cd_dtl').val();
            var code = $('#dtl_cd_dtl').val();
            var code_name = $('#dtl_cd_nm_dtl').val();
            var ordby = $('#ordby').val();
            var use_flag = $('#use_yn').is(':checked') ? 'Y' : 'N';

            if (grp_code === '') {
                alert('그룹 코드를 선택하세요.');
                return false;
            }

            if (code === '') {
                alert('코드를 입력하세요.');
                return false;
            }

            if (code_name === '') {
                alert('코드명을 입력하세요.');
                return false;
            }

            var data = {
                grpCd: grp_code,
                dtlCd: code,
                dtlCdNm: code_name,
                ordby: ordby ? ordby : null,
                useYn: use_flag
            };

            ajaxPost('/setting/code/register/detail', data, function(result) {
                if (result.result_code === 200) {
                    //showAlert('4');
                    window.location.reload();
                }
            });
        }

        function deleteCode(type, grp_code, code) {
            var data = {
                type: type,
                grpCd: grp_code,
                dtlCd: code
            };

            ajaxPost('/setting/code/delete', data, function(result) {
                if (result.result_code === 200) {
                    //showAlert('3');
                    window.location.reload();
                }
            });
        }
    });
})();
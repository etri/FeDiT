(function() {
    'use strict'
    $(document).ready(function() {
        // 상세 코드 삭제
        $('.btn-delete-detail').on('click', function() {
            if (confirm('해당 데이터 검증 항목을 삭제하시겠습니까?')) {
                deleteVrfc($(this).data('vrfc-seq'));
            }
        });
        
        // 상세 코드 등록
        $('.btn-add-detail').on('click', function() {
            openVrfcDeailModal();
        });

        // 그룹 코드 조회
        $('.btn-modify-master').on('click', function() {
        	getVrfcInfo('M', $(this).data('group-vrfc'));
        });

        // 상세 코드 조회
        $('.btn-modify-detail').on('click', function() {
            var vrfc_seq = $(this).data('vrfc-seq');
            openVrfcDeailModal(vrfc_seq);
        });
        
        $('.btn-register-detail').on('click', function() {
            saveVrfcDetail();
        });

        function openVrfcDeailModal(vrfc_seq) {
        	ajaxPost('/setting/vrfc/master', {}, function(result) {
                if (vrfc_seq) {
                    // 수정인 경우
                	getVrfcInfo('D', vrfc_seq);
                } else {
                    // 등록
                	var vrfc_tp = $('.unit-master').find('.table-info').data('group-vrfc');
                    if (vrfc_tp) {
                        $('#vrfc_tp').val(vrfc_tp);
                    }
                    
                    $('#vrfc_seq').val('');
                	$('#vrfc_nm').val('');
                    $('#rule_value_1').val('');                    
                    $('#rule_value_2').val('');
                    $('#rule_value_3').val('');
                    $('#rule_value_4').val('');
                    $('#ordby').val('');
                    $('#use_yn').prop('checked', true).change();
                    $('#modal-detail').modal('show');
                }
            });
        }

        function getVrfcInfo(type, vrfc_seq) {
            var data = {
                type: type,                
                vrfcSeq: vrfc_seq
            };
            
            ajaxPost('/setting/vrfc/load', data, function(result) {
                if (type === 'M') {
                    $('#grp_cd').val(result.data.grp_cd);
                    $('#grp_cd_nm').val(result.data.grp_cd_nm);
                    $('#modal-group').modal('show');
                } else {
                	console.log(result.data);
                	
                	$('#vrfc_seq').val(result.data.vrfc_seq);
                	$('#vrfc_tp').val(result.data.vrfc_tp);
                	$('#vrfc_nm').val(result.data.vrfc_nm);
                    $('#rule_value_1').val(result.data.rule_value_1);                    
                    $('#rule_value_2').val(result.data.rule_value_2);
                    $('#rule_value_3').val(result.data.rule_value_3);
                    $('#rule_value_4').val(result.data.rule_value_4);                                       
                    $('#ordby').val(result.data.ordby);                    
                    if (result.data.use_yn == 'Y') {
                    	$('#use_yn').prop('checked', 1).change()
                    } else {
                    	$('#use_yn').prop('checked', 0).change()
                    }
                    
                    $('#modal-detail').modal('show');
                }
            });
        }

        function saveVrfcDetail() {
        	var vrfc_seq = $('#vrfc_seq').val();
        	var vrfc_tp = $('#vrfc_tp').val();
        	var vrfc_nm = $('#vrfc_nm').val();
            var rule_value_1 = $('#rule_value_1').val();
            var rule_value_2 = $('#rule_value_2').val();
            var rule_value_3 = $('#rule_value_3').val();
            var rule_value_4 = $('#rule_value_4').val();            
            var ordby = $('#ordby').val();
            var use_flag = $('#use_yn').is(':checked') ? 'Y' : 'N';
                        
            if (vrfc_nm === '') {
                alert('검증명을 입력하세요.');
                return false;
            }

            if (rule_value_1 === '') {
                alert('기준값 1을 입력하세요.');
                return false;
            }
            
            var data = {
        		vrfcSeq: vrfc_seq,
        		vrfcTp: vrfc_tp,
        		vrfcNm: vrfc_nm,
        		ruleValue1: rule_value_1,
        		ruleValue2: rule_value_2,
        		ruleValue3: rule_value_3,
        		ruleValue4: rule_value_4,
        		ordby: ordby ? ordby : null,
                useYn: use_flag
            };
            
            ajaxPost('/setting/vrfc/register/detail', data, function(result) {
                if (result.result_code === 200) {
                    //showAlert('4');
                    window.location.reload();
                }
            });
        }

        function deleteVrfc(vrfc_seq) {
            var data = {
        		vrfcSeq: vrfc_seq                
            };

            ajaxPost('/setting/vrfc/delete', data, function(result) {
                if (result.result_code === 200) {
                    //showAlert('3');
                    window.location.reload();
                }
            });
        }
    });
})();
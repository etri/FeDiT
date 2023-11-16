(function() {
    'use strict'
    $(document).ready(function() {
        // 상세 코드 삭제
        $('.btn-delete-detail').on('click', function() {
            if (confirm('해당 단위 변환식을 삭제하시겠습니까?')) {
                deleteUnit($(this).data('unit-seq'));
            }
        });
        
        // 상세 코드 등록
        $('.btn-add-detail').on('click', function() {
            openUnitDeailModal();
        });

        // 그룹 코드 조회
        $('.btn-modify-master').on('click', function() {
            getUnitInfo('M', $(this).data('group-unit'));
        });

        // 상세 코드 조회
        $('.btn-modify-detail').on('click', function() {
            var unit_seq = $(this).data('unit-seq');
            openUnitDeailModal(unit_seq);
        });
        
        $('.btn-register-detail').on('click', function() {
            saveUnitDetail();
        });

        function openUnitDeailModal(unit_seq) {

            ajaxPost('/setting/unit/master', {}, function(result) {
                if (unit_seq) {
                    // 수정인 경우
                	getUnitInfo('D', unit_seq);
                } else {
                    // 등록
                	var unit_tp = $('.unit-master').find('.table-info').data('group-unit');
                    if (unit_tp) {
                        $('#unit_tp').val(unit_tp);
                    }
                    
                    $('#unit_seq').val('');
                	$('#unit_nm_1').val('');
                    $('#unit_nm_2').val('');                    
                    $('#unit_formula').val('');
                    $('#formula_derpn').val('');                    
                    $('#ordby').val('');
                    $('#use_yn').prop('checked', true).change();
                    $('#modal-detail').modal('show');
                }
            });
        }

        function getUnitInfo(type, unit_seq) {
            var data = {
                type: type,                
                unitSeq: unit_seq
            };
                        
            ajaxPost('/setting/unit/load', data, function(result) {
                if (type === 'M') {
                    $('#grp_cd').val(result.data.grp_cd);
                    $('#grp_cd_nm').val(result.data.grp_cd_nm);
                    $('#modal-group').modal('show');
                } else {
                	$('#unit_seq').val(result.data.unit_seq);
                	$('#unit_tp').val(result.data.unit_tp);
                	$('#unit_nm_1').val(result.data.unit_cd_1);
                    $('#unit_nm_2').val(result.data.unit_cd_2);                    
                    $('#unit_formula').val(result.data.unit_formula);
                    $('#formula_derpn').val(result.data.formula_derpn);                    
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

        function saveUnitDetail() {
        	var unit_seq = $('#unit_seq').val();
        	var unit_tp = $('#unit_tp').val();
        	var unit_nm_1 = $('#unit_nm_1 option:selected').text();
            var unit_cd_1 = $('#unit_nm_1 option:selected').val();
            var unit_nm_2 = $('#unit_nm_2 option:selected').text();
            var unit_cd_2 = $('#unit_nm_2 option:selected').val();
            var unit_formula = $('#unit_formula').val();
            var formula_derpn = $('#formula_derpn').val();
            var ordby = $('#ordby').val();
            var use_flag = $('#use_yn').is(':checked') ? 'Y' : 'N';
            
            if (unit_nm_1 === '') {
                alert('변경전 단위를 선택하세요.');
                return false;
            }

            if (unit_nm_2 === '') {
                alert('변경후 단위를 선택하세요.');
                return false;
            }

            if (unit_formula === '') {
                alert('변환식을 입력하세요.');
                return false;
            }
            
            var data = {
            	unitSeq: unit_seq,
            	unitTp: unit_tp,
        		unitNm1: unit_nm_1,
        		unitCd1: unit_cd_1,
        		unitNm2: unit_nm_2,
        		unitCd2: unit_cd_2,
        		unitFormula: unit_formula,
        		formulaDerpn: formula_derpn,        		
                ordby: ordby ? ordby : null,
                useYn: use_flag
            };
            
            ajaxPost('/setting/unit/register/detail', data, function(result) {
                if (result.result_code === 200) {
                    //showAlert('4');
                    window.location.reload();
                }
            });
        }

        function deleteUnit(unit_seq) {
            var data = {
                unitSeq: unit_seq                
            };

            ajaxPost('/setting/unit/delete', data, function(result) {
                if (result.result_code === 200) {
                    //showAlert('3');
                    window.location.reload();
                }
            });
        }
    });
})();
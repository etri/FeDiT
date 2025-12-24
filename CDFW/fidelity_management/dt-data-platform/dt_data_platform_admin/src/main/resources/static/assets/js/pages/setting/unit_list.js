(function () {
    'use strict'
    $(document).ready(function () {
        // 상세 코드 삭제
        $('.btn-delete-detail').on('click', function () {
            if (confirm('해당 단위 변환식을 삭제하시겠습니까?')) {
                deleteUnit($(this).data('unit-seq'));
            }
        });

        // 상세 코드 등록
        $('.btn-add-detail').on('click', function () {
            openUnitDetailModal();
        });

        // 그룹 코드 조회
        $('.btn-modify-master').on('click', function () {
            getUnitInfo('M', $(this).data('group-unit'));
        });

        // 상세 코드 조회
        $('.btn-modify-detail').on('click', function () {
            var unit_seq = $(this).data('unit-seq');
            openUnitDetailModal(unit_seq);
        });

        $('.btn-register-detail').on('click', function () {
            saveUnitDetail();
        });

        function openUnitDetailModal(unit_seq) {
            ajaxPost('/setting/unit/master', {}, function (result) {
                if (unit_seq) {
                    // 수정인 경우
                    getUnitInfo('D', unit_seq);
                } else {
                    // 등록
                    let detailModal = document.querySelector('#modal-detail');
                    let unit_tp = $('.unit-master').find('.table-info').data('group-unit');
                    if (unit_tp) {
                        let modal_unit_tp = detailModal.querySelector('#unit_tp');
                        modal_unit_tp.value = unit_tp;
                    }
                    let unit_seq = detailModal.querySelector('#unit_seq');

                    let unit_nm_1 = detailModal.querySelector('#unit_nm_1');
                    let dropdownBox = unit_nm_1.closest('.dropdown-box');
                    let firstInput = dropdownBox.querySelector('ul.option-list li:first-child input');
                    let firstLabel = dropdownBox.querySelector('ul.option-list li:first-child label');
                    firstLabel.click();

                    let unit_nm_2 = detailModal.querySelector('#unit_nm_2');
                    dropdownBox = unit_nm_2.closest('.dropdown-box');
                    firstInput = dropdownBox.querySelector('ul.option-list li:first-child input');
                    firstLabel = dropdownBox.querySelector('ul.option-list li:first-child label');
                    firstLabel.click();

                    let unit_formula = detailModal.querySelector('#unit_formula');
                    let formula_derpn = detailModal.querySelector('#formula_derpn');
                    let ordby = detailModal.querySelector('#ordby');

                    unit_seq.value = '';
                    unit_formula.value = '';
                    formula_derpn.value = '';
                    ordby.value = '';

                    if (result.data.use_yn === 'Y') {
                        // '사용' 라디오 버튼 선택
                        const useY = document.querySelector('#useY');
                        useY.checked = true;
                        useY.dispatchEvent(new Event('change')); // change 이벤트 트리거
                    } else {
                        // '미사용' 라디오 버튼 선택
                        const useN = document.querySelector('#useN');
                        useN.checked = true;
                        useN.dispatchEvent(new Event('change')); // change 이벤트 트리거
                    }
                    if (!detailModal.classList.contains('is-open')) {
                        detailModal.classList.add('is-open');
                    }
                }
            });
        }

        function getUnitInfo(type, unit_seq) {
            let data = {
                type: type, unitSeq: unit_seq
            };

            ajaxPost('/setting/unit/load', data, function (result) {
                if (type === 'M') {
                    let groupModal = document.querySelector('#modal-group');
                    let grp_cd = groupModal.querySelector('#grp_cd');
                    let grp_cd_nm = groupModal.querySelector('#grp_cd_nm');
                    grp_cd.value = `${result.data.grp_cd}`;
                    grp_cd_nm.value = `${result.data.grp_cd_nm}`;
                    if (!groupModal.classList.contains('is-open')) {
                        groupModal.classList.add('is-open');
                    }
                } else {
                    let detailModal = document.querySelector('#modal-detail');
                    let unit_seq = detailModal.querySelector('#unit_seq');
                    let unit_tp = detailModal.querySelector('#unit_tp');

                    let unit_nm_1 = detailModal.querySelector('#unit_nm_1');
                    let dropdownBox = unit_nm_1.closest('.dropdown-box');
                    let targetInput = dropdownBox.querySelector(`ul.option-list li input[value="${result.data.unit_cd_1}"]`);
                    let targetLabel = dropdownBox.querySelector(`ul.option-list li label[for="${targetInput.id}"]`);
                    targetLabel.click();

                    let unit_nm_2 = detailModal.querySelector('#unit_nm_2');
                    dropdownBox = unit_nm_2.closest('.dropdown-box');
                    targetInput = dropdownBox.querySelector(`ul.option-list li input[value="${result.data.unit_cd_2}"]`);
                    targetLabel = dropdownBox.querySelector(`ul.option-list li label[for="${targetInput.id}"]`);
                    targetLabel.click();

                    let unit_formula = detailModal.querySelector('#unit_formula');
                    let formula_derpn = detailModal.querySelector('#formula_derpn');
                    let ordby = detailModal.querySelector('#ordby');
                    unit_seq.value = `${result.data.unit_seq}`;
                    unit_tp.value = `${result.data.unit_tp}`;
                    unit_formula.value = `${result.data.unit_formula}`;
                    formula_derpn.value = `${(result.data.formula_derpn && result.data.formula_derpn !== null && result.data.formula_derpn !== 'null') ? result.data.formula_derpn : ''}`;
                    ordby.value = `${result.data.ordby}`;

                    if (result.data.use_yn === 'Y') {
                        // '사용' 라디오 버튼 선택
                        const useY = document.querySelector('#useY');
                        useY.checked = true;
                        useY.dispatchEvent(new Event('change')); // change 이벤트 트리거
                    } else {
                        // '미사용' 라디오 버튼 선택
                        const useN = document.querySelector('#useN');
                        useN.checked = true;
                        useN.dispatchEvent(new Event('change')); // change 이벤트 트리거
                    }
                    if (!detailModal.classList.contains('is-open')) {
                        detailModal.classList.add('is-open');
                    }
                }
            });
        }

        function saveUnitDetail() {
            let detailModal = document.querySelector('#modal-detail');
            var unit_seq = $('#unit_seq').val();
            var unit_tp = $('#unit_tp').val();
            let unit_cd_1 = document.querySelector('#unit_nm_1');
            let unit_cd_1_value = unit_cd_1.dataset.value;
            let dropdownBox = unit_cd_1.closest('.dropdown-box');
            let targetInput = dropdownBox.querySelector(`ul.option-list li input[value="${unit_cd_1_value}"]`);
            let targetLabel = dropdownBox.querySelector(`ul.option-list li label[for="${targetInput.id}"]`);
            let unit_nm_1 = targetLabel.textContent;

            let unit_cd_2 = document.querySelector('#unit_nm_2');
            let unit_cd_2_value = unit_cd_2.dataset.value;
            dropdownBox = unit_cd_2.closest('.dropdown-box');
            targetInput = dropdownBox.querySelector(`ul.option-list li input[value="${unit_cd_2_value}"]`);
            targetLabel = dropdownBox.querySelector(`ul.option-list li label[for="${targetInput.id}"]`);
            let unit_nm_2 = targetLabel.textContent;

            var unit_formula = $('#unit_formula').val();
            var formula_derpn = $('#formula_derpn').val();
            var ordby = $('#ordby').val();
            let use_flag = detailModal.querySelector('input[name="whetherToUse"]:checked').id === 'useY' ? 'Y' : 'N';

            if (unit_nm_1 === '' || unit_cd_1_value === '0') {
                alert('변경전 단위를 선택하세요.');
                return false;
            }

            if (unit_nm_2 === '' || unit_cd_2_value === '0') {
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
                unitCd1: unit_cd_1_value,
                unitNm2: unit_nm_2,
                unitCd2: unit_cd_2_value,
                unitFormula: unit_formula,
                formulaDerpn: formula_derpn,
                ordby: ordby ? ordby : null,
                useYn: use_flag
            };

            ajaxPost('/setting/unit/register/detail', data, function (result) {
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

            ajaxPost('/setting/unit/delete', data, function (result) {
                if (result.result_code === 200) {
                    //showAlert('3');
                    window.location.reload();
                }
            });
        }
    });
})();
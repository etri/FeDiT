(function () {
    'use strict'
    $(document).ready(function () {
        // 상세 코드 삭제
        $('.btn-delete-detail').on('click', function () {
            if (confirm('해당 데이터 검증 항목을 삭제하시겠습니까?')) {
                deleteVrfc($(this).data('vrfc-seq'));
            }
        });

        // 상세 코드 등록
        $('.btn-add-detail').on('click', function () {
            openVrfcDetailModal();
        });

        // 상세 코드 조회
        $('.btn-modify-detail').on('click', function () {
            var vrfc_seq = $(this).data('vrfc-seq');
            openVrfcDetailModal(vrfc_seq);
        });

        $('.btn-register-detail').on('click', function () {
            saveVrfcDetail();
        });

        function openVrfcDetailModal(vrfc_seq) {
            ajaxPost('/setting/vrfc/master', {}, function (result) {
                if (vrfc_seq) {
                    // 수정인 경우
                    getVrfcInfo('D', vrfc_seq);
                } else {
                    // 등록
                    let detailModal = document.querySelector('#modal-detail');
                    let vrfc_tp = $('.table-info[data-group-vrfc]').data('group-vrfc');
                    if (vrfc_tp) {
                        let modal_vrfc_tp = detailModal.querySelector('#vrfc_tp');
                        modal_vrfc_tp.value = vrfc_tp;
                    }

                    let vrfc_seq = detailModal.querySelector('#vrfc_seq');
                    let vrfc_nm = detailModal.querySelector('#vrfc_nm');
                    let rule_value_1 = detailModal.querySelector('#rule_value_1');
                    let rule_value_2 = detailModal.querySelector('#rule_value_2');
                    let rule_value_3 = detailModal.querySelector('#rule_value_3');
                    let rule_value_4 = detailModal.querySelector('#rule_value_4');
                    let ordby = detailModal.querySelector('#ordby');

                    vrfc_seq.value = '';
                    vrfc_nm.value = '';
                    rule_value_1.value = '';
                    rule_value_2.value = '';
                    rule_value_3.value = '';
                    rule_value_4.value = '';
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

        function getVrfcInfo(type, vrfc_seq) {
            let data = {
                type: type, vrfcSeq: vrfc_seq
            };

            ajaxPost('/setting/vrfc/load', data, function (result) {
                let detailModal = document.querySelector('#modal-detail');
                let vrfc_seq = detailModal.querySelector('#vrfc_seq');
                let vrfc_tp = detailModal.querySelector('#vrfc_tp');
                let vrfc_nm = detailModal.querySelector('#vrfc_nm');
                let rule_value_1 = detailModal.querySelector('#rule_value_1');
                let rule_value_2 = detailModal.querySelector('#rule_value_2');
                let rule_value_3 = detailModal.querySelector('#rule_value_3');
                let rule_value_4 = detailModal.querySelector('#rule_value_4');
                let ordby = detailModal.querySelector('#ordby');

                vrfc_seq.value = `${result.data.vrfc_seq}`;
                vrfc_tp.value = `${result.data.vrfc_tp}`;
                vrfc_nm.value = `${result.data.vrfc_nm}`;
                rule_value_1.value = `${(result.data.rule_value_1 && result.data.rule_value_1 !== null && result.data.rule_value_1 !== 'null') ? result.data.rule_value_1 : ''}`;
                rule_value_2.value = `${(result.data.rule_value_2 && result.data.rule_value_2 !== null && result.data.rule_value_2 !== 'null') ? result.data.rule_value_2 : ''}`;
                rule_value_3.value = `${(result.data.rule_value_3 && result.data.rule_value_3 !== null && result.data.rule_value_3 !== 'null') ? result.data.rule_value_3 : ''}`;
                rule_value_4.value = `${(result.data.rule_value_4 && result.data.rule_value_4 !== null && result.data.rule_value_4 !== 'null') ? result.data.rule_value_4 : ''}`;
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
            });
        }

        function saveVrfcDetail() {
            let detailModal = document.querySelector('#modal-detail');
            var vrfc_seq = $('#vrfc_seq').val();
            var vrfc_tp = $('#vrfc_tp').val();
            if (!vrfc_tp) {
                alert('검증 유형을 먼저 선택하세요.');
                return false;
            }
            var vrfc_nm = $('#vrfc_nm').val().trim();
            var rule_value_1 = $('#rule_value_1').val().trim();
            var rule_value_2 = $('#rule_value_2').val().trim(); // 기준값2: 선택
            var rule_value_3 = $('#rule_value_3').val().trim(); // 기준값3: 선택
            var rule_value_4 = $('#rule_value_4').val().trim(); // 기준값4: 선택
            var ordby = $('#ordby').val().trim();
            let checkedUse = detailModal.querySelector('input[name="whetherToUse"]:checked');

            if (vrfc_nm === '') {
                alert('검증명을 입력하세요.');
                return false;
            }

            if (rule_value_1 === '') {
                alert('기준값 1을 입력하세요.');
                return false;
            }

            // 정렬 순서(필수) - 0~999 정수
            if (ordby === '') {
                alert('정렬 순서를 입력하세요.');
                return false;
            }
            let ordbyNum = Number(ordby);
            if (!Number.isInteger(ordbyNum) || ordbyNum < 0 || ordbyNum > 999) {
                alert('정렬 순서는 0~999 사이의 정수로 입력하세요.');
                return false;
            }

            if (!checkedUse) {
                alert('사용 여부를 선택하세요.');
                return false;
            }
            let use_flag = checkedUse.id === 'useY' ? 'Y' : 'N';

            var data = {
                vrfcSeq: vrfc_seq,
                vrfcTp: vrfc_tp,
                vrfcNm: vrfc_nm,
                ruleValue1: rule_value_1,
                ruleValue2: rule_value_2,
                ruleValue3: rule_value_3,
                ruleValue4: rule_value_4,
                ordby: ordbyNum,
                useYn: use_flag
            };

            ajaxPost('/setting/vrfc/register/detail', data, function (result) {
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

            ajaxPost('/setting/vrfc/delete', data, function (result) {
                if (result.result_code === 200) {
                    //showAlert('3');
                    window.location.reload();
                }
            });
        }
    });
})();
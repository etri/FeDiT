(function () {
    'use strict'
    $(document).ready(function () {
        // 그룹 코드 삭제
        $('.btn-delete-master').on('click', function () {
            if (confirm('해당 그룹 코드를 삭제하시겠습니까?\n그룹 코드 삭제시 상세 코드도 같이 삭제됩니다.')) {
                deleteCode('M', $(this).data('group-code'));
            }
        });

        // 상세 코드 삭제
        $('.btn-delete-detail').on('click', function () {
            if (confirm('해당 코드를 삭제하시겠습니까?')) {
                deleteCode('D', $(this).data('group-code'), $(this).data('code'));
            }
        });

        // 그룹 코드 등록
        $('.btn-add-master').on('click', function () {
            let groupModal = document.querySelector('#modal-group');
            let grp_cd = groupModal.querySelector('#grp_cd');
            let grp_cd_nm = groupModal.querySelector('#grp_cd_nm');
            grp_cd.value = '';
            grp_cd_nm.value = '';
            grp_cd.readOnly = false; // 등록: 그룹 코드 입력 가능
            if (!groupModal.classList.contains('is-open')) {
                groupModal.classList.add('is-open');
            }
        });

        // 상세 코드 등록
        $('.btn-add-detail').on('click', function () {
            openCodeDetailModal();
        });

        // 그룹 코드 조회
        $('.btn-modify-master').on('click', function () {
            getCodeInfo('M', $(this).data('group-code'));
        });

        // 상세 코드 조회
        $('.btn-modify-detail').on('click', function () {
            let grp_code = $(this).data('group-code');
            let code = $(this).data('code');
            openCodeDetailModal(grp_code, code);
        });

        $('.btn-register-master').on('click', function () {
            saveCodeMaster();
        });

        $('.btn-register-detail').on('click', function () {
            saveCodeDetail();
        });

        function openCodeDetailModal(grp_code, code) {
            ajaxPost('/setting/code/master', {}, function (result) {
                let container = document.querySelector('#grp_cd_dtl_label').parentElement;
                let dropdownWrapper = container.querySelector('.dropdown-wrapper');
                dropdownWrapper.innerHTML = ``;
                let dropdown = document.createElement('div');
                ['dropdown-box'].forEach(function (className) {
                    dropdown.classList.add(className);
                });

                let dropdownButton = document.createElement('button');
                dropdownButton.setAttribute('type', 'button');
                ['form-control', 'sm', 'dropdown-toggle'].forEach(function (className) {
                    dropdownButton.classList.add(className);
                });
                dropdownButton.id = 'grp_cd_dtl';

                dropdownButton.addEventListener('click', dropdownToggleButtonClickEventListener);
                dropdown.appendChild(dropdownButton);

                let dropdownLayer = document.createElement('div');
                ['dropdown-layer'].forEach(function (className) {
                    dropdownLayer.classList.add(className);
                });
                dropdownLayer.id = 'grp_cd_dtl_selection';
                dropdownLayer.style.maxHeight = '220px';

                let optionUl = document.createElement('ul');
                ['option-list'].forEach(function (className) {
                    optionUl.classList.add(className);
                });

                result.data.forEach(function (data) {
                    let optionLi = document.createElement('li');
                    let label = document.createElement('label');
                    label.setAttribute('for', `input_grp_cd_dtl_${data.grp_cd}`);
                    label.addEventListener('click', labelClickEventListener);
                    label.innerHTML = `${data.grp_cd_nm}`;

                    let input = document.createElement('input');
                    input.setAttribute('type', 'radio');
                    input.id = `input_grp_cd_dtl_${data.grp_cd}`;
                    input.name = `grp_cd_dtl_input`;
                    input.value = `${data.grp_cd}`;
                    if (data.grp_cd === '0') {
                        input.checked = true;
                        dropdownButton.innerHTML = `${data.grp_cd_nm}`;
                        dropdownButton.dataset.value = `${data.grp_cd}`;
                    }

                    optionLi.appendChild(input);
                    optionLi.appendChild(label);
                    optionUl.appendChild(optionLi);
                });
                dropdownLayer.appendChild(optionUl);
                dropdown.appendChild(dropdownLayer);
                dropdownWrapper.appendChild(dropdown);
                container.appendChild(dropdownWrapper);
                closeLayerOnOutsideClick(Array.from(dropdown ? [dropdown] : []), '.dropdown-layer');
                if (grp_code) {
                    // 수정인 경우
                    getCodeInfo('D', grp_code, code);
                } else {
                    // 등록
                    let group_code = $('.code-master').find('.table-info').data('group-code');
                    if (group_code) {
                        $('#grp_cd').val(group_code);
                    }
                    let detailModal = document.querySelector('#modal-detail');
                    let dtl_cd_dtl = detailModal.querySelector('#dtl_cd_dtl');
                    let dtl_cd_nm_dtl = detailModal.querySelector('#dtl_cd_nm_dtl');
                    let ordby = detailModal.querySelector('#ordby');
                    dtl_cd_dtl.value = ``;
                    dtl_cd_nm_dtl.value = ``;
                    ordby.value = ``;

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

        function getCodeInfo(type, grp_code, code) {
            let data = {
                type: type, grpCd: grp_code, dtlCd: code
            };

            ajaxPost('/setting/code/load', data, function (result) {
                if (type === 'M') {
                    let groupModal = document.querySelector('#modal-group');
                    let grp_cd = groupModal.querySelector('#grp_cd');
                    let grp_cd_nm = groupModal.querySelector('#grp_cd_nm');
                    grp_cd.value = `${result.data.grp_cd}`;
                    grp_cd_nm.value = `${result.data.grp_cd_nm}`;
                    grp_cd.readOnly = true; // 수정: 그룹 코드(PK) 변경 불가
                    if (!groupModal.classList.contains('is-open')) {
                        groupModal.classList.add('is-open');
                    }
                } else {
                    console.log('result', result);
                    let detailModal = document.querySelector('#modal-detail');
                    let grp_cd_dtl = detailModal.querySelector('#grp_cd_dtl');
                    let dropdownBox = grp_cd_dtl.closest('.dropdown-box');
                    let targetInput = dropdownBox.querySelector(`ul.option-list li input[value="${result.data.grp_cd}"]`);
                    let targetLabel = dropdownBox.querySelector(`ul.option-list li label[for="${targetInput.id}"]`);
                    targetLabel.click();
                    grp_cd_dtl.disabled = true; // 수정: 그룹 코드 변경 불가

                    let dtl_cd_dtl = detailModal.querySelector('#dtl_cd_dtl');
                    let dtl_cd_nm_dtl = detailModal.querySelector('#dtl_cd_nm_dtl');
                    let ordby = detailModal.querySelector('#ordby');

                    dtl_cd_dtl.value = `${result.data.dtl_cd}`;
                    dtl_cd_nm_dtl.value = `${result.data.dtl_cd_nm}`;
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
                grpCd: grp_code, grpCdNm: grp_code_name
            };

            ajaxPost('/setting/code/register/master', data, function (result) {
                if (result.result_code === 200) {
                    //showAlert('4');                    
                    window.location.reload();
                }
            });
        }

        function saveCodeDetail() {
            let detailModal = document.querySelector('#modal-detail');
            let grp_code = detailModal.querySelector('#grp_cd_dtl').dataset.value;
            let code = detailModal.querySelector('#dtl_cd_dtl').value.trim();
            let code_name = detailModal.querySelector('#dtl_cd_nm_dtl').value.trim();
            let ordby = detailModal.querySelector('#ordby').value.trim();
            let checkedUse = detailModal.querySelector('input[name="whetherToUse"]:checked');

            // 그룹 코드(선택 필수) - 미선택/기본값('0') 차단
            if (!grp_code || grp_code === '0' || grp_code === '선택 없음') {
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

            let data = {
                grpCd: grp_code, dtlCd: code, dtlCdNm: code_name, ordby: ordbyNum, useYn: use_flag
            };

            ajaxPost('/setting/code/register/detail', data, function (result) {
                if (result.result_code === 200) {
                    window.location.reload();
                }
            });
        }

        function deleteCode(type, grp_code, code) {
            let data = {
                type: type, grpCd: grp_code, dtlCd: code
            };

            ajaxPost('/setting/code/delete', data, function (result) {
                if (result.result_code === 200) {
                    window.location.reload();
                }
            });
        }
    });
})();
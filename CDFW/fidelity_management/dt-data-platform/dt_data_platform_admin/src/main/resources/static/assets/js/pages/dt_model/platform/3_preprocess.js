(function () {
    'use strict'
    $(document).ready(function () {
        /**
         * Validate
         * */
            //변환 유형 1단계 검증 방법 전환 이벤트
        let selectValidMasterTpDropdownButton = document.querySelector('#select_valid_mater_tp');
        if (selectValidMasterTpDropdownButton) {
            observeDataValueChange(selectValidMasterTpDropdownButton, function (targetElement, newValue) {
                console.log('selectValidMasterTpDropdownButton', selectValidMasterTpDropdownButton);
                console.log('observeDataValueChange Callback', targetElement, newValue);
                /**
                 * 범위 값 초기화
                 * */
                let select_valid_range_type = document.querySelector('#select_valid_range_type');
                select_valid_range_type.style.display = 'none'
                select_valid_range_type.querySelectorAll('.range-element-container').forEach(function (element) {
                    element.style.display = 'none';
                });
                select_valid_range_type.querySelector('#valid-range-min').value = 0;
                select_valid_range_type.querySelector('#valid-range-max').value = 10;
                select_valid_range_type.querySelector('#float-valid-range-min').value = 0;
                select_valid_range_type.querySelector('#float-valid-range-max').value = 10;

                let data = {
                    valid_tp: newValue
                }
                showProgressBar({element: null, process_id: 'process-35'});
                $.ajax({
                    type: "POST",
                    url: '/dt/model/make/select_valid_detail_tp',
                    data: JSON.stringify(data),
                    contentType: "application/json; charset=utf-8;",
                    dataType: "json",
                    success: function (result) {
                        if (result.result_code === 200) {
                            let select_valid_detail_tp = document.querySelector('#select_valid_detail_tp');
                            if (select_valid_detail_tp) {
                                Object.keys(select_valid_detail_tp.dataset).forEach((key) => {
                                    delete select_valid_detail_tp.dataset[key];
                                });
                                let dropdownBox = select_valid_detail_tp.closest('.dropdown-box');
                                let optionUl = dropdownBox.querySelector('ul.option-list');
                                let firstOption = optionUl.querySelector('li:first-child');
                                select_valid_detail_tp.dataset.value = firstOption.querySelector('input').value;
                                select_valid_detail_tp.innerHTML = `${firstOption.querySelector('label').textContent}`;
                                let options = optionUl.querySelectorAll('li:not(:first-child)');
                                options.forEach(function (option) {
                                    option.remove();
                                });
                                result.valid_detail_tp.forEach(function (item) {
                                    if (item.use_yn !== 'N' && item.del_yn !== 'Y') {
                                        let optionLi = document.createElement('li');

                                        let label = document.createElement('label');
                                        label.addEventListener('click', labelClickEventListener);
                                        label.setAttribute('for', `input_${select_valid_detail_tp.id}_${item.vrfc_seq}`);
                                        label.innerHTML = `${item.vrfc_nm}`;

                                        let input = document.createElement('input');
                                        input.setAttribute('type', 'radio');
                                        input.id = `input_${select_valid_detail_tp.id}_${item.vrfc_seq}`;
                                        input.name = `${select_valid_detail_tp.id}_input`
                                        input.value = `${item.vrfc_seq}`;
                                        input.dataset.vrfc_tp = item.vrfc_tp;
                                        input.dataset.rule_value_1 = item.rule_value_1;
                                        input.dataset.rule_value_2 = item.rule_value_2;
                                        input.dataset.rule_value_3 = item.rule_value_3;
                                        input.dataset.rule_value_4 = item.rule_value_4;
                                        optionLi.appendChild(input);
                                        optionLi.appendChild(label);
                                        optionUl.appendChild(optionLi);
                                    }
                                });
                            }
                            closeProgressBar({element: null, process_id: 'process-35'});
                        } else {
                            closeProgressBar({element: null, process_id: 'process-35'});
                            if (result.result_code === -100) {
                                let errorModal = document.querySelector('#errorModal');
                                if (errorModal) {
                                    let errTpElement = errorModal.querySelector('#errTp');
                                    let errCdElement = errorModal.querySelector('#errCd');
                                    let errNmElement = errorModal.querySelector('#errNm');
                                    let errLctElement = errorModal.querySelector('#errLct');
                                    let errCnElement = errorModal.querySelector('#errCn');
                                    let errRegDtElement = errorModal.querySelector('#errRegDt');

                                    errTpElement.innerHTML = `${result.errTp}`;
                                    errCdElement.innerHTML = `${result.errCd}`;
                                    errNmElement.innerHTML = `${result.errNm}`;
                                    errLctElement.innerHTML = `${result.errLct}`;
                                    errCnElement.innerHTML = `${result.errCn}`;
                                    errRegDtElement.innerHTML = `${result.errRegDt}`;

                                    if (!errorModal.classList.contains('is-open')) {
                                        errorModal.classList.add('is-open');
                                    }
                                } else {
                                    console.error('errorModal could not find');
                                    alert('에러가 발생하였습니다. 관리자에게 문의해주세요.');
                                }
                            }
                        }
                    },
                    error: function (xhr, status, error) {
                        console.error('error : ', error);
                        closeProgressBar({element: null, process_id: 'process-35'});
                        alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                    }
                });
            });
        }

        //변환 유형 2단계 형식 지정 값 전환 이벤트
        let selectValidDetailTp = document.querySelector('#select_valid_detail_tp');
        if (selectValidDetailTp) {
            observeDataValueChange(selectValidDetailTp, function (targetElement, newValue) {
                console.log('selectValidDetailTp', selectValidDetailTp);
                console.log('observeDataValueChange Callback', targetElement, newValue);

                let select_valid_range_type = document.querySelector('#select_valid_range_type');
                let minElement, maxElement, otherMinElement, otherMaxElement;
                switch (targetElement.dataset.vrfc_tp) {
                    case 'RG' : {
                        if (targetElement.dataset.rule_value_2 === 'MIN' && targetElement.dataset.rule_value_3 === 'MAX') {
                            switch (targetElement.dataset.rule_value_1) {
                                case 'int': {
                                    select_valid_range_type.style.display = 'block';
                                    minElement = select_valid_range_type.querySelector('#valid-range-min');
                                    minElement.parentElement.style.display = 'block';
                                    minElement.closest('.range-element-container').style.display = 'block';
                                    minElement.value = 0;
                                    maxElement = select_valid_range_type.querySelector('#valid-range-max');
                                    maxElement.parentElement.style.display = 'block';
                                    maxElement.closest('.range-element-container').style.display = 'block';
                                    maxElement.value = 10;

                                    otherMinElement = select_valid_range_type.querySelector('#float-valid-range-min');
                                    otherMinElement.parentElement.style.display = 'none';
                                    otherMinElement.closest('.range-element-container').style.display = 'none';
                                    otherMaxElement = select_valid_range_type.querySelector('#float-valid-range-max');
                                    otherMaxElement.parentElement.style.display = 'none';
                                    otherMaxElement.closest('.range-element-container').style.display = 'none';
                                    break;
                                }
                                case 'float': {
                                    select_valid_range_type.style.display = 'block';
                                    minElement = select_valid_range_type.querySelector('#float-valid-range-min');
                                    minElement.parentElement.style.display = 'block';
                                    minElement.closest('.range-element-container').style.display = 'block';
                                    minElement.value = 0;
                                    maxElement = select_valid_range_type.querySelector('#float-valid-range-max');
                                    maxElement.parentElement.style.display = 'block';
                                    maxElement.closest('.range-element-container').style.display = 'block';
                                    maxElement.value = 10.1;

                                    otherMinElement = select_valid_range_type.querySelector('#valid-range-min');
                                    otherMinElement.parentElement.style.display = 'none';
                                    otherMinElement.closest('.range-element-container').style.display = 'none';
                                    otherMaxElement = select_valid_range_type.querySelector('#valid-range-max');
                                    otherMaxElement.parentElement.style.display = 'none';
                                    otherMaxElement.closest('.range-element-container').style.display = 'none';
                                    break;
                                }
                                default: {
                                    break;
                                }
                            }
                        } else {
                            select_valid_range_type.style.display = 'none'
                            select_valid_range_type.querySelectorAll('.range-element-container').forEach(function (element) {
                                element.style.display = 'none';
                            });
                            select_valid_range_type.querySelector('#valid-range-min').parentElement.style.display = 'none';
                            select_valid_range_type.querySelector('#valid-range-min').value = 0;
                            select_valid_range_type.querySelector('#valid-range-max').parentElement.style.display = 'none';
                            select_valid_range_type.querySelector('#valid-range-max').value = 10;
                            select_valid_range_type.querySelector('#float-valid-range-min').parentElement.style.display = 'none';
                            select_valid_range_type.querySelector('#float-valid-range-min').value = 0;
                            select_valid_range_type.querySelector('#float-valid-range-max').parentElement.style.display = 'none';
                            select_valid_range_type.querySelector('#float-valid-range-max').value = 10;
                        }
                        break;
                    }
                    default: {
                        select_valid_range_type.style.display = 'none'
                        select_valid_range_type.querySelectorAll('.range-element-container').forEach(function (element) {
                            element.style.display = 'none';
                        });
                        select_valid_range_type.querySelector('#valid-range-min').parentElement.style.display = 'none';
                        select_valid_range_type.querySelector('#valid-range-min').value = 0;
                        select_valid_range_type.querySelector('#valid-range-max').parentElement.style.display = 'none';
                        select_valid_range_type.querySelector('#valid-range-max').value = 10;
                        select_valid_range_type.querySelector('#float-valid-range-min').parentElement.style.display = 'none';
                        select_valid_range_type.querySelector('#float-valid-range-min').value = 0;
                        select_valid_range_type.querySelector('#float-valid-range-max').parentElement.style.display = 'none';
                        select_valid_range_type.querySelector('#float-valid-range-max').value = 10;
                    }
                }
            });
        }

        /**
         * Outlier
         * */
        let selectOutlierOption = document.querySelector('#select_outlier_option');
        if (selectOutlierOption) {
            observeDataValueChange(selectOutlierOption, function (targetElement, newValue) {
                console.log('observeDataValueChange Callback', targetElement, newValue);
                let dropdownBox = targetElement.closest('.dropdown-box');
                document.querySelector('#preprocTableRangeOutlier').style.display = 'none';
                document.querySelector('#preprocTableExcludeRangeOutlier').style.display = 'none';
                const selectElement = document.querySelector('#select_outlier_target_col');
                const selectDropdownBox = selectElement.closest('.dropdown-box');
                let selectOptionUl = selectDropdownBox.querySelector('ul.option-list');
                let selectFirstOption = selectOptionUl.querySelector('li:first-child');
                const selectOptions = selectOptionUl.querySelectorAll('li > input');
                resetGraphView([5, 6, 7]);
                if (newValue === '0') {
                    selectElement.disabled = false;
                    $('#outlier_column_range').hide();
                    $('#btn_make_outlier').hide();
                    $('#outlier_standard_range').hide();
                    $('#outlier_dbscan_range').hide();
                    $('#outlier_kmean_range').hide();
                    $('#outlier_etc_range').hide();
                } else if (newValue === 'standard') {
                    selectElement.disabled = false;
                    $('#outlier_column_range').show();
                    $('#btn_make_outlier').show();
                    $('#outlier_standard_range').show();
                    $('#outlier_dbscan_range').hide();
                    $('#outlier_kmean_range').hide();
                    $('#outlier_etc_range').hide();
                } else if (newValue === 'dbscan') {
                    selectElement.disabled = false;
                    $('#outlier_column_range').show();
                    $('#btn_make_outlier').show();

                    $('#outlier_standard_range').hide();
                    $('#outlier_dbscan_range').show();
                    $('#outlier_kmean_range').hide();
                    $('#outlier_etc_range').hide();
                } else if (newValue === 'kmean') {
                    selectElement.disabled = false;
                    $('#outlier_column_range').show();
                    $('#btn_make_outlier').show();
                    $('#outlier_standard_range').hide();
                    $('#outlier_dbscan_range').hide();
                    $('#outlier_kmean_range').show();
                    $('#outlier_etc_range').hide();
                } else {
                    // AE 선택하면 자동 선택되야한다.
                    $('#outlier_standard_range').hide();
                    $('#btn_make_outlier').hide();
                    $('#outlier_standard_range').hide();
                    $('#outlier_dbscan_range').hide();
                    $('#outlier_kmean_range').hide();
                    if (newValue !== '0') {
                        $('#outlier_etc_range').show();
                        const [etc_model_tp, etc_model_seq, trgt_col, window_sz] = targetElement.dataset.data.split('|').map(value => value.trim());
                        $('#window_size').val(window_sz);
                        const isOptionExist = selectOptions.values().some(option => option.value === trgt_col);
                        if (isOptionExist) {
                            selectElement.disabled = true;
                            Object.keys(selectElement.dataset).forEach((key) => {
                                if (key !== 'value') {
                                    delete selectElement.dataset[key];
                                }
                            });

                            let selectedInput = selectDropdownBox.querySelector(`ul.option-list > li > input[value="${trgt_col}"]`);
                            let selectedLabel = selectDropdownBox.querySelector(`ul.option-list > li > label[for="${selectedInput.id}"]`);
                            selectElement.dataset.value = selectedInput.value;
                            selectElement.innerHTML = `${selectedLabel.textContent}`;
                            selectedInput.checked = true;
                            $('#btn_make_outlier').show();
                            $('#btn_change_threshold').show();
                        } else {
                            alert(`해당 모델에서 사용된 ${trgt_col} 컬럼이 존재하지 않습니다.\n다른 옵션을 지정하세요`);
                            selectElement.dataset.value = selectFirstOption.querySelector('input').value;
                            selectElement.innerHTML = `${selectFirstOption.querySelector('label').textContent}`;
                            selectFirstOption.querySelector('input').checked = true;
                            selectElement.disabled = false;
                            $('#outlier_column_range').hide();
                            $('#btn_make_outlier').hide();
                            $('#outlier_standard_range').hide();
                            $('#outlier_dbscan_range').hide();
                            $('#outlier_kmean_range').hide();
                            $('#outlier_etc_range').hide();
                            $('#btn_change_threshold').hide();
                        }
                    }
                    return;
                }
                Object.keys(selectElement.dataset).forEach((key) => {
                    if (key !== 'value') {
                        delete selectElement.dataset[key];
                    }
                });
                selectElement.dataset.value = selectFirstOption.querySelector('input').value;
                selectElement.innerHTML = `${selectFirstOption.querySelector('label').textContent}`;
                selectFirstOption.querySelector('input').checked = true;
            });
        }

        let select_interpolate = document.querySelector('#select_interpolate');
        if (select_interpolate) {
            observeDataValueChange(select_interpolate, function (targetElement, newValue) {
                console.log('observeDataValueChange Callback', targetElement, newValue);
                let dropdownBox = targetElement.closest('.dropdown-box');
                let selectedInput = dropdownBox.querySelector(`ul.option-list > li > input[value="${newValue}"]`);
                let selectedLabel = dropdownBox.querySelector(`ul.option-list > li > label[for="${selectedInput.id}"]`);

                let preProcData = JSON.parse($('#preprocProPerty').val());
                let base_file_path = preProcData.preproc_property_info[0].base_dir;
                let base_file_nm = preProcData.preproc_property_info[0].last_step_preproc_file_nm;
                let index_trgt_col = preProcData.preproc_property_info[0].index_trgt_col;

                //랜덤 포레스트 문구
                let rfcommentElement = document.querySelector('#rfcomment');
                if (rfcommentElement) {
                    rfcommentElement.style.display = 'none';
                }

                //브리츠 문구
                let britscommentElement = document.querySelector('#britscomment');
                if (britscommentElement) {
                    britscommentElement.style.display = 'none';
                }

                //나오미 문구
                let naomicommentElement = document.querySelector('#naomicomment');
                if (naomicommentElement) {
                    naomicommentElement.style.display = 'none';
                }

                switch (targetElement.dataset.value) {
                    case 'decisiontree': {
                        let form_type = $('#formType').val();
                        getPreprocessTargetDataSetInfo(base_file_path, base_file_nm, index_trgt_col, form_type, 'interpolate', false, function (data) {
                            console.log('getPreprocessTargetDataSetInfo', JSON.parse(data));
                            let headers = JSON.parse(data).data.columns;
                            let infos = JSON.parse(data).data.info.map((info) => {
                                return JSON.parse(info);
                            });
                            const table = new PreProcessInterpolateTable({
                                container: document.querySelector('#tab_missing_table_range_interpolate'),
                                columns: ['#', 'COLUMN', 'COUNT', '보간 입력 항목', '보간 대상 항목'],
                                headers: headers,
                                infos: infos,
                                case: 'origin',
                                type: 'decision',
                                initialize: function (options) {
                                    console.log('Custom initialize', options);
                                },
                                handleInputChange: function (event, input, options) {
                                    console.log('Custom handleInputChange', event, input, options);
                                    if (input.dataset.type === 'decision') {
                                        switch (input.getAttribute('type')) {
                                            case 'checkbox':
                                                let radio = input.closest('tr').querySelector('input[type="radio"][name="select_radio"]');
                                                if (radio.checked) {
                                                    alert('선택된 보간 대상 항목에는 보간 입력 항목을 선택할 수 없습니다.');
                                                    input.checked = false;
                                                }
                                                break;
                                            case 'radio':
                                                let checkbox = input.closest('tr').querySelector('input[type="checkbox"][name="select_checkbox"]');
                                                if (checkbox.checked) {
                                                    alert('선택된 보간 입력 항목에는 대상 항목을 선택할 수 없습니다.');
                                                    input.checked = false;
                                                }
                                                break;
                                        }
                                    }
                                }
                            });
                            console.log('table', table);
                        });
                        break;
                    }
                    case '0': {
                        let form_type = $('#formType').val();
                        getPreprocessTargetDataSetInfo(base_file_path, base_file_nm, index_trgt_col, form_type, 'interpolate', false, function (data) {
                            console.log('getPreprocessTargetDataSetInfo', JSON.parse(data));
                            let headers = JSON.parse(data).data.columns;
                            let infos = JSON.parse(data).data.info.map((info) => {
                                return JSON.parse(info);
                            });
                            const table = new PreProcessInterpolateTable({
                                container: document.querySelector('#tab_missing_table_range_interpolate'),
                                columns: ['#', 'COLUMN', 'COUNT'],
                                headers: headers,
                                infos: infos,
                                case: 'origin',
                                type: 'basic',
                                initialize: function (options) {
                                    console.log('Custom initialize', options);
                                }
                            });
                            console.log('table', table);
                        });
                        break;
                    }
                    default: {
                        let value = targetElement.dataset.value;
                        if (value.includes('random forest')) {
                            //RF 모델을 이용한 옵션일 때,
                            let form_type = $('#formType').val();
                            getPreprocessTargetDataSetInfo(base_file_path, base_file_nm, index_trgt_col, form_type, 'interpolate', true, function (data) {
                                console.log('getPreprocessTargetDataSetInfo', JSON.parse(data));
                                let headers = JSON.parse(data).data.columns;
                                let infos = JSON.parse(data).data.info.map((info) => {
                                    return JSON.parse(info);
                                });
                                const table = new PreProcessInterpolateTable({
                                    container: document.querySelector('#tab_missing_table_range_interpolate'),
                                    columns: ['#', 'COLUMN', 'COUNT'/*, '컬럼 선택'*/],
                                    headers: headers,
                                    infos: infos,
                                    case: 'origin',
                                    type: 'basic',
                                    initialize: function (options) {
                                        console.log('Custom initialize', options);
                                    }
                                });
                                console.log('table', table);
                                let rfcommentElement = document.querySelector('#rfcomment');
                                if (rfcommentElement) {
                                    const keysArray = infos.map(item => Object.keys(item)).flat();
                                    let outputCheck = false;
                                    keysArray.forEach((key, index, array) => {
                                        if (targetElement.dataset.output_col.trim() === key) {
                                            outputCheck = true;
                                        }
                                    });

                                    // feature_cols 체크
                                    const featureCols = targetElement.dataset.feature_cols.split(',').map(col => col.trim());
                                    let featureCheck = [];
                                    featureCols.forEach((feature, index) => {
                                        featureCheck.push(false);
                                    });
                                    featureCols.forEach((feature, index) => {
                                        if (keysArray.includes(feature)) {
                                            featureCheck[index] = true; // 해당 독립 컬럼이 존재하는 경우 true로 설정
                                        }
                                    });

                                    // 모든 독립 컬럼이 존재하는지 체크
                                    const allFeaturesExist = featureCheck.every(check => check === true);

                                    // outputCheck와 모든 featureCheck가 true일 경우
                                    if (!outputCheck || !allFeaturesExist) {
                                        rfcommentElement.style.display = 'flex';
                                        rfcommentElement.innerHTML = `변환전 필요 선택 컬럼(OC) : ${targetElement.dataset.output_col} | 필요 독립 컬럼(FC) : ${targetElement.dataset.feature_cols} \n각각의 컬럼이 존재해야합니다.`;
                                    } else {
                                        rfcommentElement.style.display = 'flex';
                                        rfcommentElement.innerHTML = `선택 컬럼(OC) : ${targetElement.dataset.output_col} | 독립 컬럼(FC) : ${targetElement.dataset.feature_cols}`;
                                    }
                                }
                            });
                        } else if (value.includes('brits')) {
                            //Brits 모델을 이용한 옵션일 때,
                            let form_type = $('#formType').val();
                            getPreprocessTargetDataSetInfo(base_file_path, base_file_nm, index_trgt_col, form_type, 'interpolate', true, function (data) {
                                console.log('getPreprocessTargetDataSetInfo', JSON.parse(data));
                                let headers = JSON.parse(data).data.columns;
                                let infos = JSON.parse(data).data.info.map((info) => {
                                    return JSON.parse(info);
                                });
                                const table = new PreProcessInterpolateTable({
                                    container: document.querySelector('#tab_missing_table_range_interpolate'),
                                    columns: ['#', 'COLUMN', 'COUNT'/*, '컬럼 선택'*/],
                                    headers: headers,
                                    infos: infos,
                                    case: 'origin',
                                    type: 'basic',
                                    initialize: function (options) {
                                        console.log('Custom initialize', options);
                                    }
                                });
                                console.log('table', table);
                                let britscommentElement = document.querySelector('#britscomment');
                                if (britscommentElement) {
                                    const keysArray = infos.map(item => Object.keys(item)).flat();
                                    let outputCheck = false;
                                    keysArray.forEach((key, index, array) => {
                                        if (targetElement.dataset.output_col.trim() === key) {
                                            outputCheck = true;
                                        }
                                    });

                                    // outputCheck가 true인 경우
                                    if (!outputCheck) {
                                        britscommentElement.style.display = 'flex';
                                        britscommentElement.innerHTML = `변환전 필요 선택 컬럼(OC) : ${targetElement.dataset.output_col} 컬럼이 존재해야합니다.`;
                                    } else {
                                        britscommentElement.style.display = 'flex';
                                        britscommentElement.innerHTML = `선택 컬럼(OC) : ${targetElement.dataset.output_col}`;
                                    }
                                }
                            });
                        } else if (value.includes('naomi')) {
                            //Brits 모델을 이용한 옵션일 때,
                            let form_type = $('#formType').val();
                            getPreprocessTargetDataSetInfo(base_file_path, base_file_nm, index_trgt_col, form_type, 'interpolate', true, function (data) {
                                console.log('getPreprocessTargetDataSetInfo', JSON.parse(data));
                                let headers = JSON.parse(data).data.columns;
                                let infos = JSON.parse(data).data.info.map((info) => {
                                    return JSON.parse(info);
                                });
                                const table = new PreProcessInterpolateTable({
                                    container: document.querySelector('#tab_missing_table_range_interpolate'),
                                    columns: ['#', 'COLUMN', 'COUNT'/*, '컬럼 선택'*/],
                                    headers: headers,
                                    infos: infos,
                                    case: 'origin',
                                    type: 'basic',
                                    initialize: function (options) {
                                        console.log('Custom initialize', options);
                                    }
                                });
                                console.log('table', table);
                                let naomicommentElement = document.querySelector('#naomicomment');
                                if (naomicommentElement) {
                                    const keysArray = infos.map(item => Object.keys(item)).flat();
                                    let outputCheck = false;
                                    keysArray.forEach((key, index, array) => {
                                        if (targetElement.dataset.output_col.trim() === key) {
                                            outputCheck = true;
                                        }
                                    });

                                    // outputCheck가 true인 경우
                                    if (!outputCheck) {
                                        naomicommentElement.style.display = 'flex';
                                        naomicommentElement.innerHTML = `변환전 필요 선택 컬럼(OC) : ${targetElement.dataset.output_col} 컬럼이 존재해야합니다.`;
                                    } else {
                                        naomicommentElement.style.display = 'flex';
                                        naomicommentElement.innerHTML = `선택 컬럼(OC) : ${targetElement.dataset.output_col}`;
                                    }
                                }
                            });
                        } else {
                            //다른 옵션일 때,
                            let form_type = $('#formType').val();
                            getPreprocessTargetDataSetInfo(base_file_path, base_file_nm, index_trgt_col, form_type, 'interpolate', false, function (data) {
                                console.log('getPreprocessTargetDataSetInfo', JSON.parse(data));
                                let headers = JSON.parse(data).data.columns;
                                let infos = JSON.parse(data).data.info.map((info) => {
                                    return JSON.parse(info);
                                });
                                const table = new PreProcessInterpolateTable({
                                    container: document.querySelector('#tab_missing_table_range_interpolate'),
                                    columns: ['#', 'COLUMN', 'COUNT'/*, '컬럼 선택'*/],
                                    headers: headers,
                                    infos: infos,
                                    case: 'origin',
                                    type: 'basic',
                                    initialize: function (options) {
                                        console.log('Custom initialize', options);
                                    }
                                    //해당 부분 주석 처리 (로직 미정 코드)
                                    /*,
                                    handleInputChange: function (event, input, options) {
                                        console.log('Custom handleInputChange', event, input, options);
                                        let inputs = input.closest('tbody').querySelectorAll('tr input');
                                        inputs.forEach(input => {
                                            input.checked = false;
                                        });
                                        input.checked = true;
                                    }*/
                                });
                                console.log('table', table);
                            });
                        }
                        break;
                    }
                }
            });
        }

        let selectResample = document.querySelector('#select_resample');
        if (selectResample) {
            observeDataValueChange(selectResample, function (targetElement, newValue) {
                console.log('observeDataValueChange Callback', targetElement, newValue);
                let resampleOption = targetElement.dataset.value;
                if (resampleOption === 'O' || resampleOption === '2Q' || resampleOption === 'Q') {
                    $('#intvl_term').hide();
                } else {
                    $('#intvl_term').show();
                }
            });
        }

        let selectUnitTp = document.querySelector('#select_unit_tp');
        if (selectUnitTp) {
            observeDataValueChange(selectUnitTp, function (targetElement, newValue) {
                console.log('observeDataValueChange Callback', targetElement, newValue);
                let unit_tp = targetElement.dataset.value;
                if (unit_tp === '0') {
                    let unit_select_box_range = document.querySelector('#unit_select_box_range');
                    unit_select_box_range.innerHTML = ``;
                    return;
                }

                let data = {
                    unit_tp: unit_tp
                }
                showProgressBar({element: null, process_id: 'process-43'});
                $.ajax({
                    type: "POST",
                    url: '/dt/model/make/select_unit_tp',
                    data: JSON.stringify(data),
                    contentType: "application/json; charset=utf-8;",
                    dataType: "json",
                    success: function (result) {
                        if (result.result_code === 200) {
                            let unitSelectBoxRangeContainer = document.querySelector('#unit_select_box_range');
                            unitSelectBoxRangeContainer.innerHTML = ``;
                            makeUnitSelectRangeSelector(unitSelectBoxRangeContainer, result.unit_tp_list);
                            closeProgressBar({element: null, process_id: 'process-43'});
                        } else {
                            closeProgressBar({element: null, process_id: 'process-43'});
                            if (result.result_code === -100) {
                                let errorModal = document.querySelector('#errorModal');
                                if (errorModal) {
                                    let errTpElement = errorModal.querySelector('#errTp');
                                    let errCdElement = errorModal.querySelector('#errCd');
                                    let errNmElement = errorModal.querySelector('#errNm');
                                    let errLctElement = errorModal.querySelector('#errLct');
                                    let errCnElement = errorModal.querySelector('#errCn');
                                    let errRegDtElement = errorModal.querySelector('#errRegDt');

                                    errTpElement.innerHTML = `${result.errTp}`;
                                    errCdElement.innerHTML = `${result.errCd}`;
                                    errNmElement.innerHTML = `${result.errNm}`;
                                    errLctElement.innerHTML = `${result.errLct}`;
                                    errCnElement.innerHTML = `${result.errCn}`;
                                    errRegDtElement.innerHTML = `${result.errRegDt}`;

                                    if (!errorModal.classList.contains('is-open')) {
                                        errorModal.classList.add('is-open');
                                    }
                                } else {
                                    console.error('errorModal could not find');
                                    alert('에러가 발생하였습니다. 관리자에게 문의해주세요.');
                                }
                            } else {
                                console.error('errorModal could not find');
                                alert('에러가 발생하였습니다. 관리자에게 문의해주세요.');
                            }
                        }
                    },
                    error: function (xhr, status, error) {
                        console.error('error : ', error);
                        closeProgressBar({element: null, process_id: 'process-43'});
                        alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                    }
                });
            });
        }

        $(document).on('click', '.btn-view-valid-info', function () {
            let valid_target_col = document.querySelector('#select_valid_target_col').dataset.value;
            let valid_mater_tp = document.querySelector('#select_valid_mater_tp').dataset.value;
            let select_valid_detail_tp = document.querySelector('#select_valid_detail_tp');
            let valid_detail_tp = select_valid_detail_tp.dataset.value;
            let valid_clear_tp = document.querySelector('#select_valid_clear_tp_dropdown').value;

            let preProcData = JSON.parse($('#preprocProPerty').val());
            let indexTrgtCol = preProcData.preproc_property_info[0].index_trgt_col

            let file_path = preProcData.preproc_property_info[0].base_dir
            let file_name = getPreprocLevelLastTargetFileName(1);

            let max_order_num = jsonTemplateArrayNumbering(1);

            let set_order = 0
            if (max_order_num > 0) {
                set_order = max_order_num;
            }

            if (valid_target_col === '0') {
                alert('컬럼을 선택하세요');
                return false;
            }

            if (valid_mater_tp === '0') {
                alert('1단계 형식을 선택하세요');
                return false;
            }

            if (valid_detail_tp === '0') {
                alert('2단계 형식을 선택하세요');
                return false;
            }

            let data = {
                file_path: file_path,
                file_name: file_name,
                verifyColumn: valid_target_col,
                verifyType: valid_detail_tp,
                clearType: valid_clear_tp,
                index_trgt_col: indexTrgtCol
            }

            //범위이고 직접입력이면 특수한 상태의 값처리
            if (select_valid_detail_tp.dataset.vrfc_tp === 'RG') {
                let select_valid_range_type = document.querySelector('#select_valid_range_type');
                if (select_valid_detail_tp.dataset.rule_value_2 === 'MIN' && select_valid_detail_tp.dataset.rule_value_3 === 'MAX') {
                    switch (select_valid_detail_tp.dataset.rule_value_1) {
                        case 'int': {
                            try {
                                let min = parseInt(select_valid_range_type.querySelector('#valid-range-min').value);
                                let max = parseInt(select_valid_range_type.querySelector('#valid-range-max').value);
                                //검증 로직
                                if (min <= max) {
                                    data.max = max;
                                    data.min = min;
                                } else {
                                    alert('최소값이 최대값보다 클 수 없습니다.');
                                    return;
                                }
                            } catch (e) {
                                alert('최소값과 최대값은 숫자형태만 지원합니다.');
                                return;
                            }
                            break;
                        }
                        case 'float': {
                            try {
                                let min = parseFloat(select_valid_range_type.querySelector('#float-valid-range-min').value);
                                let max = parseFloat(select_valid_range_type.querySelector('#float-valid-range-max').value);
                                //검증 로직
                                if (min <= max) {
                                    data.max = max;
                                    data.min = min;
                                } else {
                                    alert('최소값이 최대값보다 클 수 없습니다.');
                                    return;
                                }
                            } catch (e) {
                                alert('최소값과 최대값은 소수점 형태만 지원합니다.');
                                return;
                            }
                            break;
                        }
                        default: {
                            break;
                        }
                    }
                }
            }
            showProgressBar({element: null, process_id: 'process-36'});
            $.ajax({
                type: "POST",
                async: false,
                url: '/dt/model/make/valid_view_set',
                data: JSON.stringify(data),
                contentType: "application/json; charset=utf-8;",
                dataType: "json",
                success: function (result) {
                    if (result.code === 200) {
                        let validTableRangeContainer = document.querySelector('#valid_table_range');
                        let message = JSON.parse(result.data).data;
                        validTableRangeContainer.innerHTML = ``;
                        createValidateCheckResultMessage(validTableRangeContainer, message);

                        $('#btn_make_valid').show();
                        $('.btn-validate-next').show();
                        $('#select_valid_clear_tp').show();

                        closeProgressBar({element: null, process_id: 'process-36'});
                    } else {
                        closeProgressBar({element: null, process_id: 'process-36'});
                        if (result.result_code === -100) {
                            let errorModal = document.querySelector('#errorModal');
                            if (errorModal) {
                                let errTpElement = errorModal.querySelector('#errTp');
                                let errCdElement = errorModal.querySelector('#errCd');
                                let errNmElement = errorModal.querySelector('#errNm');
                                let errLctElement = errorModal.querySelector('#errLct');
                                let errCnElement = errorModal.querySelector('#errCn');
                                let errRegDtElement = errorModal.querySelector('#errRegDt');

                                errTpElement.innerHTML = `${result.errTp}`;
                                errCdElement.innerHTML = `${result.errCd}`;
                                errNmElement.innerHTML = `${result.errNm}`;
                                errLctElement.innerHTML = `${result.errLct}`;
                                errCnElement.innerHTML = `${result.errCn}`;
                                errRegDtElement.innerHTML = `${result.errRegDt}`;

                                if (!errorModal.classList.contains('is-open')) {
                                    errorModal.classList.add('is-open');
                                }
                            } else {
                                console.error('errorModal could not find');
                                alert('에러가 발생하였습니다. 관리자에게 문의해주세요.');
                            }
                        }
                    }
                },
                error: function (xhr, status, error) {
                    console.error('error : ', error);
                    closeProgressBar({element: null, process_id: 'process-36'});
                    alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                }
            });
        });

        $(document).on('click', '.btn-make-valid', function () {
            let valid_target_col = document.querySelector('#select_valid_target_col').dataset.value;
            let valid_mater_tp = document.querySelector('#select_valid_mater_tp').dataset.value;
            let valid_mater_tp_nm = document.querySelector('#select_valid_mater_tp').textContent;
            let select_valid_detail_tp = document.querySelector('#select_valid_detail_tp');
            let valid_detail_tp = select_valid_detail_tp.dataset.value;
            let valid_detail_tp_nm = select_valid_detail_tp.textContent;
            let valid_clear_tp = document.querySelector('#select_valid_clear_tp_dropdown').dataset.value;
            let valid_clear_tp_nm = document.querySelector('#select_valid_clear_tp_dropdown').textContent;


            let preProcData = JSON.parse($('#preprocProPerty').val());
            let indexTrgtCol = preProcData.preproc_property_info[0].index_trgt_col

            let file_path = preProcData.preproc_property_info[0].base_dir

            let file_name = getPreprocLevelLastTargetFileName(1);
            console.log('file_name', file_name);
            let max_order_num = jsonTemplateArrayNumbering(1);

            let set_order = 0
            if (max_order_num > 0) {
                set_order = max_order_num;
            }

            if (valid_target_col === '0') {
                alert('컬럼을 선택하세요');
                return false;
            }

            if (valid_mater_tp === '0') {
                alert('1단계 형식을 선택하세요');
                return false;
            }

            if (valid_detail_tp === '0') {
                alert('2단계 형식을 선택하세요');
                return false;
            }

            if (valid_clear_tp === '0') {
                alert('지정값 또는 지정외값을 선택해주세요.');
                return false;
            }

            let data = {
                file_path: file_path,
                file_name: file_name,
                verifyColumn: valid_target_col,
                verifyType: valid_detail_tp,
                clearType: valid_clear_tp,
                index_trgt_col: indexTrgtCol,
                max_order_num: max_order_num,
                set_order: set_order + 1
            }
            //범위이고 직접입력이면 특수한 상태의 값처리
            if (select_valid_detail_tp.dataset.vrfc_tp === 'RG') {
                let select_valid_range_type = document.querySelector('#select_valid_range_type');
                if (select_valid_detail_tp.dataset.rule_value_2 === 'MIN' && select_valid_detail_tp.dataset.rule_value_3 === 'MAX') {
                    switch (select_valid_detail_tp.dataset.rule_value_1) {
                        case 'int': {
                            try {
                                let min = parseInt(select_valid_range_type.querySelector('#valid-range-min').value);
                                let max = parseInt(select_valid_range_type.querySelector('#valid-range-max').value);
                                //검증 로직
                                if (min <= max) {
                                    data.max = max;
                                    data.min = min;
                                } else {
                                    alert('최소값이 최대값보다 클 수 없습니다.');
                                    return;
                                }
                            } catch (e) {
                                alert('최소값과 최대값은 숫자형태만 지원합니다.');
                                return;
                            }
                            break;
                        }
                        case 'float': {
                            try {
                                let min = parseFloat(select_valid_range_type.querySelector('#float-valid-range-min').value);
                                let max = parseFloat(select_valid_range_type.querySelector('#float-valid-range-max').value);
                                //검증 로직
                                if (min <= max) {
                                    data.max = max;
                                    data.min = min;
                                } else {
                                    alert('최소값이 최대값보다 클 수 없습니다.');
                                    return;
                                }
                            } catch (e) {
                                alert('최소값과 최대값은 소수점 형태만 지원합니다.');
                                return;
                            }
                            break;
                        }
                        default: {
                            break;
                        }
                    }
                }
            }
            console.log('data', data);

            /**
             * 동일 옵션 검증
             * 1. 선택한 옵션 가져오기
             * 2. 설정 목록 가져오기
             * */
            let duplicateCheck = false;
            let duplicatedOption;
            let verifyEqualOptionData = {
                type: select_valid_detail_tp.dataset.vrfc_tp.toLowerCase(),
                sub_type: select_valid_detail_tp.value,
                column: valid_target_col
            }
            console.log('verifyEqualOptionData', verifyEqualOptionData);
            let verifyOptions = document.querySelectorAll('#property_range [data-trgt_col][data-vrfc_tp]');
            verifyOptions.forEach(verifyOption => {
                let verifyOptionData = {
                    type: verifyOption.dataset.vrfc_tp.toLowerCase(),
                    sub_type: verifyOption.dataset.vrfc_sub_tp,
                    column: verifyOption.dataset.trgt_col
                }
                console.log('verifyOptionData', verifyOptionData);
                if (verifyEqualOptionData.type === verifyOptionData.type && verifyEqualOptionData.sub_type === verifyOptionData.sub_type && verifyEqualOptionData.column === verifyOptionData.column) {
                    duplicatedOption = verifyOption;
                    duplicateCheck = true;
                }
            });
            if (duplicateCheck) {
                let confirmResult = confirm('동일한 옵션을 넣을 수 없습니다. 해당 옵션을 삭제하시겠습니까?');
                if (confirmResult === true) {
                    duplicatedOption.closest('div').querySelector('.btn-property-delete').click();
                    return;
                } else {
                    return;
                }
            }
            showProgressBar({element: null, process_id: 'process-37'});
            $.ajax({
                type: "POST",
                url: '/dt/model/make/valid_set',
                data: JSON.stringify(data),
                contentType: "application/json; charset=utf-8;",
                dataType: "json",
                success: function (result) {
                    closeProgressBar({element: null, process_id: 'process-37'});
                    if (result.code === 200) {
                        if (result.param.data_all_yn === 'Y') {
                            alert('유효성 처리 대상의 수가 0 이거나, 전체 데이터 수와 유효성 처리 대상의 수가 동일합니다.');
                            var validateTemplate = validTemplate();
                            validateTemplate.set_order = set_order + 1;
                            validateTemplate.trgt_file_nm = result.param.target_file_name;
                            validateTemplate.trgt_col = result.param.vrfc_trgt_col;
                            validateTemplate.vrfc_tp = result.param.vrfc_tp;
                            validateTemplate.vrfc_tp_nm = valid_mater_tp_nm;
                            validateTemplate.vrfc_sub_tp = valid_detail_tp;
                            validateTemplate.vrfc_sub_tp_nm = valid_detail_tp_nm;
                            validateTemplate.vrfc_clear_tp = result.param.vrfc_clear_type;
                            validateTemplate.vrfc_clear_tp_nm = valid_clear_tp_nm;
                            validateTemplate.rule1 = result.param.rule1;
                            validateTemplate.rule2 = result.param.rule2;
                            validateTemplate.rule3 = result.param.rule3;
                            validateTemplate.rule4 = result.param.rule4;
                            validateTemplate.validate_count = result.removed_count;
                            validateTemplate.validate_data = originDataExtractToRemovedData(result.origin_list, result.removed_data_list);
                            validateTemplate.row_count = result.row_count;
                            let preProcData = JSON.parse($('#preprocProPerty').val());
                            preProcData.preproc_property_info[0].preproc_property[0].preproc_set[set_order] = validateTemplate;
                            preProcData.preproc_property_info[0].last_step_preproc_file_nm = result.param.target_file_name;
                            $('#preprocProPerty').val(JSON.stringify(preProcData));
                            $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));
                            let header_list = result.header_list;
                            let data_list = [];
                            let removed_data = result.removed_data_list;
                            let preprocTableRangeValidate = document.querySelector('#preprocTableRangeValidate');
                            preprocTableRangeValidate.style.display = 'block';
                            preprocTableRangeValidate.innerHTML = '';
                            makeDataTableHTML(header_list, data_list, preprocTableRangeValidate, 'validateDataTableRange', function (table) {
                                $(table).DataTable({
                                    columnDefs: [{
                                        targets: '_all', className: 'text-nowrap', searchable: false
                                    }],
                                    order: [[0, "asc"]],
                                    searching: false,
                                    info: false,
                                    bServerSide: true,
                                    ajax: {
                                        url: "/datatable/server/render/validate",
                                        type: "POST",
                                        dataType: "json",
                                        data: function (data) {
                                            data.target_file_name = result.fileResult.target_file_name;
                                            data.file_name = result.fileResult.file_name;
                                            data.file_path = result.fileResult.file_path;
                                            data.index_trgt_col = result.fileResult.index_trgt_col;
                                            data.vrfc_trgt_col = result.fileResult.vrfc_trgt_col;
                                            return JSON.stringify(data);
                                        }
                                    },
                                    lengthChange: false,
                                    autoWidth: true,
                                    lengthMenu: [[10], [10]],
                                    scrollX: true,
                                    deferRender: true,
                                    destroy: true
                                });
                            });
                            makePropertyListHtml();
                            document.querySelector('#valid_table_range').innerHTML = ``;
                            $('#btn_make_valid').show();
                        } else {
                            var validateTemplate = validTemplate();
                            validateTemplate.set_order = set_order + 1;
                            validateTemplate.trgt_file_nm = result.param.target_file_name;
                            validateTemplate.trgt_col = result.param.vrfc_trgt_col;
                            validateTemplate.vrfc_tp = result.param.vrfc_tp;
                            validateTemplate.vrfc_tp_nm = valid_mater_tp_nm;
                            validateTemplate.vrfc_sub_tp = valid_detail_tp;
                            validateTemplate.vrfc_sub_tp_nm = valid_detail_tp_nm;
                            validateTemplate.vrfc_clear_tp = result.param.vrfc_clear_type;
                            validateTemplate.vrfc_clear_tp_nm = valid_clear_tp_nm;

                            validateTemplate.rule1 = result.param.rule1;
                            validateTemplate.rule2 = result.param.rule2;
                            validateTemplate.rule3 = result.param.rule3;
                            validateTemplate.rule4 = result.param.rule4;
                            validateTemplate.validate_count = result.removed_count;
                            validateTemplate.validate_data = originDataExtractToRemovedData(result.origin_list, result.removed_data_list);
                            validateTemplate.row_count = result.row_count;
                            let preProcData = JSON.parse($('#preprocProPerty').val());
                            preProcData.preproc_property_info[0].preproc_property[0].preproc_set[set_order] = validateTemplate;
                            preProcData.preproc_property_info[0].last_step_preproc_file_nm = result.param.target_file_name;
                            $('#preprocProPerty').val(JSON.stringify(preProcData));
                            $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));

                            /**
                             * 2024-07-26 만든 함수 끼워넣기
                             * */
                            var header_list = result.header_list;
                            let removedCount = result.removed_count;
                            let rowCount = result.row_count;
                            let statusMessage = `총 ${rowCount}개의 데이터에서 ${removedCount}개가 수정되었습니다.`;
                            let removed_data = result.removed_data_list;
                            preProcessMakeHTMLExcludeDataTable('#preprocTableExcludeRangeValidate', 'validateDataTableExcludeRange', header_list, removed_data, statusMessage, function (wrapper, headers, datas) {
                                console.log('wrapper', wrapper);
                                console.log('preProcessMakeHTMLExcludeDataTable is completed');
                                $('#validateDataTableExcludeRange').DataTable({
                                    scrollX: true,
                                    columnDefs: [{
                                        targets: '_all', className: 'text-nowrap'
                                    }],
                                    order: [[0, "asc"]],
                                    searching: false,
                                    info: false,
                                    lengthChange: false,
                                    autoWidth: true,
                                    lengthMenu: [[10], [10]],
                                    initComplete: function (settings, json) {
                                        console.log('DataTable has finished its initialisation.');
                                        wrapper.parentElement.style.display = 'block';
                                    }
                                });
                            });
                            var data_list = result.data_list;
                            let origin_list = result.origin_list;
                            let preprocTableRangeValidate = document.querySelector('#preprocTableRangeValidate');
                            preprocTableRangeValidate.style.display = 'block';
                            preprocTableRangeValidate.innerHTML = '';

                            /**
                             * 테이블 헤더 만들기
                             * */
                            let newHeaderList = []
                            newHeaderList.push(data.index_trgt_col);
                            let dateIndex = 0;
                            header_list.forEach(function (header, index) {
                                if (header !== data.index_trgt_col) {
                                    newHeaderList.push(header);
                                    newHeaderList.push(header + ' BEFORE');
                                } else {
                                    dateIndex = index;
                                }
                            });

                            /**
                             * 테이블 데이터 만들기
                             * */
                            let newDataList = [];
                            data_list.forEach(function (data, index) {
                                let newDataRow = [];
                                data.forEach((_data, _index) => {
                                    if (_index !== dateIndex) {
                                        newDataRow.push(_data);
                                        newDataRow.push('');
                                    } else {
                                        newDataRow.push(_data);
                                    }
                                });
                                newDataList.push(newDataRow);
                            });

                            makeDataTableHTML(newHeaderList, newDataList, preprocTableRangeValidate, 'validateDataTableRange', function (table) {
                                $(table).DataTable({
                                    scrollX: true,
                                    columnDefs: [{
                                        targets: '_all', className: 'text-nowrap', searchable: false
                                    }],
                                    order: [[0, "asc"]],
                                    searching: false,
                                    info: false,
                                    /*bServerSide: true,
                                    ajax: {
                                        url: "/datatable/server/render/validate",
                                        type: "POST",
                                        dataType: "json",
                                        data: function (data) {
                                            data.target_file_name = result.fileResult.target_file_name;
                                            data.file_name = result.fileResult.file_name;
                                            data.file_path = result.fileResult.file_path;
                                            data.index_trgt_col = result.fileResult.index_trgt_col;
                                            data.vrfc_trgt_col = result.fileResult.vrfc_trgt_col;
                                            return JSON.stringify(data);
                                        }
                                    },*/
                                    lengthChange: false,
                                    autoWidth: true,
                                    lengthMenu: [[10], [10]],
                                    deferRender: true,
                                    destroy: true,
                                    createdRow: function (row, data, dataIndex) {
                                        let targetIndex = dateIndex;
                                        //조건 검사
                                        let isExist = false;
                                        if (data.length !== 0) {
                                            //Row의 날짜 컬럼 데이터
                                            let dateStr = data[targetIndex];
                                            //비교 검사 (BEFORE 전용)
                                            let originRow;
                                            for (let i = 0; i < origin_list.length; i++) {
                                                //돌리는 날짜와 오리진 리스트의 날짜가 같은게 있다면
                                                if (extractAndConvertToLong(dateStr) === extractAndConvertToLong(origin_list[i][targetIndex])) {
                                                    originRow = origin_list[i];
                                                    isExist = true;
                                                    break;
                                                }
                                            }
                                            if (originRow) {
                                                let count = 1;
                                                console.log('data', data, 'originRow', originRow);
                                                data.forEach(function (value, index) {
                                                    if (index !== targetIndex && index % 2 === 0) {
                                                        data[index] = originRow[count];
                                                        $('td', row).eq(index).text(originRow[count++]);
                                                    }
                                                });
                                            } else {
                                                //매칭되는 ROW 없음 그대로 로직 전개
                                            }
                                            if (isExist) $(row).addClass('active');
                                        } else {
                                            console.error('$(\'#validateDataTableRange\').DataTable({}) createdRow data is 0');
                                        }
                                    }
                                });
                            });
                            makePropertyListHtml();
                            document.querySelector('#valid_table_range').innerHTML = ``;
                            $('#btn_make_valid').show();
                        }
                    } else {
                        if (result.result_code === -100) {
                            let errorModal = document.querySelector('#errorModal');
                            if (errorModal) {
                                let errTpElement = errorModal.querySelector('#errTp');
                                let errCdElement = errorModal.querySelector('#errCd');
                                let errNmElement = errorModal.querySelector('#errNm');
                                let errLctElement = errorModal.querySelector('#errLct');
                                let errCnElement = errorModal.querySelector('#errCn');
                                let errRegDtElement = errorModal.querySelector('#errRegDt');

                                errTpElement.innerHTML = `${result.errTp}`;
                                errCdElement.innerHTML = `${result.errCd}`;
                                errNmElement.innerHTML = `${result.errNm}`;
                                errLctElement.innerHTML = `${result.errLct}`;
                                errCnElement.innerHTML = `${result.errCn}`;
                                errRegDtElement.innerHTML = `${result.errRegDt}`;

                                if (!errorModal.classList.contains('is-open')) {
                                    errorModal.classList.add('is-open');
                                }
                            } else {
                                console.error('errorModal could not find');
                                alert('에러가 발생하였습니다. 관리자에게 문의해주세요.');
                            }
                        } else {
                            console.error('Internal Api Error');
                            alert('에러가 발생하였습니다. 관리자에게 문의해주세요.');
                        }
                    }
                },
                error: function (xhr, status, error) {
                    console.error('error : ', error);
                    closeProgressBar({element: null, process_id: 'process-37'});
                    alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                }
            });
        });

        $(document).on('click', '.next-preproc-outlier-step', function () {
            $('#preprocCurrent').val('outlier');
            getTotalLastFile();
            let select_valid_mater_tp = document.querySelector('#select_valid_mater_tp').dataset.value;
            let preProcData = JSON.parse($('#preprocProPerty').val());

            if (select_valid_mater_tp === 0 || select_valid_mater_tp === '0') {
                preProcData.preproc_property_info[0].preproc_property[0].preproc_set = [];
                getTotalLastFile();
            }


            $('#preprocProPerty').val(JSON.stringify(preProcData));
            $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));

            $('#inc_tab_validate').hide();
            $('#inc_tab_outlier').show();
            $('#inc_tab_missing').hide();
            $('#inc_tab_interval').hide();
            $('#inc_tab_unit').hide();

            $('#tab_validate').attr('class', 'nav-link');
            $('#tab_outlier').attr('class', 'nav-link active');
            $('#tab_missing').attr('class', 'nav-link');
            $('#tab_interval').attr('class', 'nav-link');
            $('#tab_unit').attr('class', 'nav-link');

            //버튼
            $('#next_button_info_range').hide();
            $('#next_button_column_info_range').hide();
            $('#next_button_outlier_range').show();

            let base_file_path = preProcData.preproc_property_info[0].base_dir;
            let base_file_nm = preProcData.preproc_property_info[0].last_step_preproc_file_nm;
            let index_trgt_col = preProcData.preproc_property_info[0].index_trgt_col;

            let form_type = $('#formType').val();
            getPreprocessTargetDataSetInfo(base_file_path, base_file_nm, index_trgt_col, form_type, 'outlier', false, function (data) {
                console.log('getPreprocessTargetDataSetInfo', JSON.parse(data));
                makePropertyListHtml();
            });
        });

        $(document).on('click', '.next-preproc-interpolate-step', function () {
            $('#preprocCurrent').val('interpolate');
            getTotalLastFile();
            let preProcData = JSON.parse($('#preprocProPerty').val());

            $('#preprocProPerty').val(JSON.stringify(preProcData));
            $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));

            $('#inc_tab_validate').hide();
            $('#inc_tab_outlier').hide();
            $('#inc_tab_missing').show();
            $('#inc_tab_interval').hide();
            $('#inc_tab_unit').hide();

            $('#tab_validate').attr('class', 'nav-link');
            $('#tab_outlier').attr('class', 'nav-link');
            $('#tab_missing').attr('class', 'nav-link active');
            $('#tab_interval').attr('class', 'nav-link');
            $('#tab_unit').attr('class', 'nav-link');

            //버튼
            $('#next_button_info_range').hide();
            $('#next_button_column_info_range').hide();
            $('#next_button_interpolate_range').show();

            let base_file_path = preProcData.preproc_property_info[0].base_dir;
            let base_file_nm = preProcData.preproc_property_info[0].last_step_preproc_file_nm;
            let index_trgt_col = preProcData.preproc_property_info[0].index_trgt_col;

            let form_type = $('#formType').val();
            getPreprocessTargetDataSetInfo(base_file_path, base_file_nm, index_trgt_col, form_type, 'interpolate', false, function (data) {
                console.log('getPreprocessTargetDataSetInfo', JSON.parse(data));
                makePropertyListHtml();

                //select box 초기화
                const selectElement = document.querySelector('#select_interpolate');
                const dropdownBox = selectElement.closest('.dropdown-box');
                const optionList = dropdownBox.querySelector('.dropdown-layer ul.option-list');
                const firstLi = optionList.querySelector('li:first-child');
                const firstInput = firstLi.querySelector('li:first-child > input');
                const firstLabel = firstLi.querySelector('li:first-child > label');

                Object.keys(selectElement.dataset).forEach((key) => {
                    if (key !== 'value') {
                        delete selectElement.dataset[key];
                    }
                });

                firstInput.checked = true;
                selectElement.dataset.value = `${firstInput.value}`;
                selectElement.innerHTML = `${firstLabel.textContent}`;

                let headers = JSON.parse(data).data.columns;
                let infos = JSON.parse(data).data.info.map((info) => {
                    return JSON.parse(info);
                });

                const table = new PreProcessInterpolateTable({
                    container: document.querySelector('#tab_missing_table_range_interpolate'),
                    columns: ['#', 'COLUMN', 'COUNT'],
                    headers: headers,
                    infos: infos,
                    case: 'origin',
                    type: 'basic',
                    initialize: function (options) {
                        console.log('Custom initialize', options);
                    }
                });
            });
        });

        $(document).on('click', '.next-preproc-resample-step', function () {
            $('#preprocCurrent').val('resample');
            var preprocCurrent = $('#preprocCurrent').val();
            var totalNaN = $('#totalNaN').val();

            if (parseInt(totalNaN) > 0) {
                alert('결측치를 제거 후 진행 가능합니다.');
                return false;
            }

            let preProcData1 = JSON.parse($('#preprocProPerty').val());
            getTotalLastFile();
            let select_resample = document.querySelector('#select_resample').dataset.value;
            let preProcData = JSON.parse($('#preprocProPerty').val());

            if (select_resample === 0) {
                preProcData.preproc_property_info[0].preproc_property[2].preproc_set = [];
                getTotalLastFile();
            }


            $('#preprocProPerty').val(JSON.stringify(preProcData));
            $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));

            $('#inc_tab_validate').hide();
            $('#inc_tab_outlier').hide();
            $('#inc_tab_missing').hide();
            $('#inc_tab_interval').show();
            $('#inc_tab_unit').hide();

            $('#tab_validate').attr('class', 'nav-link');
            $('#tab_outlier').attr('class', 'nav-link');
            $('#tab_missing').attr('class', 'nav-link');
            $('#tab_interval').attr('class', 'nav-link active');
            $('#tab_unit').attr('class', 'nav-link');

            //버튼
            $('#next_button_info_range').hide();
            $('#next_button_column_info_range').hide();
            $('#next_button_resample_range').show();

            var base_file_path = preProcData.preproc_property_info[0].base_dir;
            var base_file_nm = preProcData.preproc_property_info[0].last_step_preproc_file_nm;
            var index_trgt_col = preProcData.preproc_property_info[0].index_trgt_col;

            getTargetDataSetTimeCheckCallbackFunction(base_file_path, base_file_nm, index_trgt_col, function (headers, datas) {
                console.log('getTargetDataSetTimeCheckCallbackFunction', headers, datas);
                let counts = datas.data.count;
                let deltas = datas.data.delta;
                let maxIndex = -1;
                let max = 0;
                counts.forEach((count, index) => {
                    if (max <= count) {
                        max = count;
                        maxIndex = index;
                    }
                });
                let delta = parseInt(Math.abs(deltas[maxIndex]));
                console.log('counts', counts, 'deltas', deltas, 'delta', delta);
                let select_origin_term = document.querySelector('#select_origin_term');
                let convertDeltaResult = convertDelta(delta);
                let resmpl_tp_nm = '초';
                let resmpl_intvl_value = 1;
                let resmpl_tp = 'S';
                if (convertDeltaResult.S > 0) {
                    resmpl_tp = 'S';
                    resmpl_tp_nm = '초';
                    resmpl_intvl_value = convertDeltaResult.S;
                } else if (convertDeltaResult.M > 0) {
                    resmpl_tp = 'T';
                    resmpl_tp_nm = '분';
                    resmpl_intvl_value = convertDeltaResult.M;
                } else if (convertDeltaResult.H > 0) {
                    resmpl_tp = 'H';
                    resmpl_tp_nm = '시';
                    resmpl_intvl_value = convertDeltaResult.H;
                } else if (convertDeltaResult.D > 0) {
                    resmpl_tp = 'D';
                    resmpl_tp_nm = '일';
                    resmpl_intvl_value = convertDeltaResult.D;
                }
                select_origin_term.dataset.resmpl_tp = resmpl_tp;
                select_origin_term.dataset.resmpl_tp_nm = resmpl_tp_nm;
                select_origin_term.dataset.resmpl_intvl_value = resmpl_intvl_value;
                select_origin_term.style.fontSize = '13px';
                select_origin_term.style.color = select_origin_term.dataset.type === '불분명' ? 'red' : '#000000';
                makePropertyListHtml();
            });
        });

        $(document).on('click', '.next-preproc-unit-step', function () {
            $('#preprocCurrent').val('unit');
            let select_origin_term = document.querySelector('#select_origin_term');
            let term_type = select_origin_term.dataset.type;
            let resmpl_tp = select_origin_term.dataset.resmpl_tp;
            let resmpl_tp_nm = select_origin_term.dataset.resmpl_tp_nm;
            let resmpl_intvl_value = select_origin_term.dataset.resmpl_intvl_value;

            console.log('term_type', term_type);
            if (term_type && term_type.length > 0) {
                if (term_type === '불분명') {
                    alert('데이터 간격이 불분명합니다.\n데이터의 간격을 변환해주세요.');
                    return;
                }
            } else {
                console.error('select_origin_term is not found');
                return;
            }
            let section = document.querySelector('#property_range');
            let setting = section.querySelector('[data-preproc-order="4"]');
            console.log('setting', setting);
            if (!setting) {
                //분명일때, 세팅이 존재하지 않음
                let preProcData = JSON.parse($('#preprocProPerty').val());
                let lastFile = preProcData.preproc_property_info[0].last_step_preproc_file_nm;
                let template = resampleTemplate();
                //console.log(result);
                template.set_order = 1;
                template.trgt_file_nm = lastFile;
                template.resmpl_tp = resmpl_tp;
                template.resmpl_tp_nm = resmpl_tp_nm;
                template.resmpl_intvl_value = resmpl_intvl_value;

                template.resmpl_removed_data = [];
                template.resmpl_added_data = [];

                template.resmpl_removed_count = 0;
                template.resmpl_added_count = 0;
                template.resmpl_count = 0;
                template.row_count = preProcData.preproc_property_info[0].target_row_count;
                preProcData.preproc_property_info[0].preproc_property[3].preproc_set[0] = template;

                $('#preprocProPerty').val(JSON.stringify(preProcData));
                $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));
            }
            getTotalLastFile();
            var preProcData = JSON.parse($('#preprocProPerty').val());

            $('#preprocProPerty').val(JSON.stringify(preProcData));
            $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));

            $('#inc_tab_validate').hide();
            $('#inc_tab_outlier').hide();
            $('#inc_tab_missing').hide();
            $('#inc_tab_interval').hide();
            $('#inc_tab_unit').show();

            $('#tab_validate').attr('class', 'nav-link');
            $('#tab_outlier').attr('class', 'nav-link');
            $('#tab_missing').attr('class', 'nav-link');
            $('#tab_interval').attr('class', 'nav-link');
            $('#tab_unit').attr('class', 'nav-link active');

            //버튼
            $('#next_button_info_range').hide();
            $('#next_button_column_info_range').hide();
            $('#next_button_unit_range').show();

            var base_file_path = preProcData.preproc_property_info[0].base_dir;
            var base_file_nm = preProcData.preproc_property_info[0].last_step_preproc_file_nm;
            var index_trgt_col = preProcData.preproc_property_info[0].index_trgt_col;

            let form_type = $('#formType').val();
            getPreprocessTargetDataSetInfo(base_file_path, base_file_nm, index_trgt_col, form_type, 'unit', false, function (data) {
                console.log('getPreprocessTargetDataSetInfo', JSON.parse(data));
                makePropertyListHtml();
            });
        });

        $(document).on('click', '.btn-make-outlier', function () {
            let selectOutlierOption = document.querySelector('#select_outlier_option');
            let outlier_type = selectOutlierOption.dataset.value;
            let outlierTargetColOption = document.querySelector('#select_outlier_target_col');
            let outlier_target_col = outlierTargetColOption.dataset.value;
            let etc_model_seq;

            if (outlier_type === '0') {
                outlier_type = '0';
            } else if (outlier_type === 'standard') {
                outlier_type = 'standard';
            } else if (outlier_type === 'kmean') {
                outlier_type = 'kmean';
            } else if (outlier_type === 'dbscan') {
                outlier_type = 'dbscan';
            } else {
                const [etc_model_tp, etc_model_temp_seq, trgt_col, window_sz] = selectOutlierOption.dataset.data?.split('|').map(item => item.trim());
                outlier_type = etc_model_tp;
                etc_model_seq = etc_model_temp_seq;
            }

            if (outlier_type === '0') {
                alert('이상치 처리 옵션을 먼저 선택해 주세요');
                Object.keys(selectOutlierOption.dataset).forEach((key) => {
                    delete selectOutlierOption.dataset[key];
                });
                let dropdownBox = selectOutlierOption.closest('.dropdown-box');
                let optionUl = dropdownBox.querySelector('ul.option-list');
                let firstOption = optionUl.querySelector('li:first-child');
                selectOutlierOption.dataset.value = firstOption.querySelector('input').value;
                selectOutlierOption.innerHTML = `${firstOption.querySelector('label').textContent}`;
                return false;
            }

            if (!outlier_target_col && outlier_target_col.length === 0) {
                alert('컬럼을 선택해주세요.');
                Object.keys(outlierTargetColOption.dataset).forEach((key) => {
                    delete outlierTargetColOption.dataset[key];
                });
                let dropdownBox = outlierTargetColOption.closest('.dropdown-box');
                let optionUl = dropdownBox.querySelector('ul.option-list');
                let firstOption = optionUl.querySelector('li:first-child');
                outlierTargetColOption.dataset.value = firstOption.querySelector('input').value;
                outlierTargetColOption.innerHTML = `${firstOption.querySelector('label').textContent}`;
                return false;
            }

            let freq_selector;
            hideGraphViewGroup([5, 6, 7]);
            switch (outlier_type) {
                case 'standard': {
                    freq_selector = '#outlier_standard_range';
                    showGraphViewGroup([5]);
                    break;
                }
                case 'kmean': {
                    freq_selector = '#outlier_kmean_range';
                    showGraphViewGroup([6]);
                    break;
                }
                case 'dbscan': {
                    freq_selector = '#outlier_dbscan_range';
                    showGraphViewGroup([7]);
                    break;
                }
                case 'autoencoder':
                case 'auto encoder':
                case 'AUTO ENCODER':
                case 'AUTOENCODER': {
                }
            }
            let freq = 0;
            if (freq_selector) {
                try {
                    freq = parseInt(document.querySelector(`${freq_selector} #freq`).value);
                } catch (e) {
                    alert('샘플링 길이를 올바르게 설정해주세요.');
                    $('#select_outlier_target_col option:eq(0)').prop('selected', true);
                    return false;
                }
            } else {
                //autoencoder
            }
            var p_value = $('#p_value').val();
            var eps = $('#eps').val();
            var min_samples = $('#min_samples').val();

            var preProcData = JSON.parse($('#preprocProPerty').val());
            var index_target_col = preProcData.preproc_property_info[0].index_trgt_col;
            var file_path = preProcData.preproc_property_info[0].base_dir;
            let target_row_count = preProcData.preproc_property_info[0].target_row_count;
            var file_name = preProcData.preproc_property_info[0].last_step_preproc_file_nm;
            var max_order_num = jsonTemplateArrayNumbering(2);

            var set_order = 0
            if (max_order_num > 0) {
                set_order = max_order_num;
            }

            var params = {
                outlier_type: outlier_type || null,
                file_path: file_path || null,
                file_name: file_name || null,
                outlier_target_col: outlier_target_col || null,
                index_trgt_col: index_target_col || null,
                freq: freq || null,
                p_value: p_value || null,
                eps: eps || null,
                min_samples: min_samples || null,
                n_clusters: null,
                threshold: null,
                etc_model_seq: etc_model_seq || null,
                target_row_count: target_row_count
            };

            if (outlier_type === 'kmean') {
                var n_clusters = $('#n_clusters').val();
                let n_count = $('#n_count').val();
                if (n_clusters === '') {
                    alert('클러스터 수에 숫자값을 입력해주세요.');
                    return false;
                }
                try {
                    let parsedNClusters = parseInt(n_clusters);
                    if (parsedNClusters <= 0) {
                        alert('클러스터의 제한되는 데이터 개수는 1개 이상이여야합니다.');
                        return;
                    }
                    if (parsedNClusters > 10) {
                        alert('클러스터의 제한되는 데이터 개수는 10개 이하여야합니다.');
                        return;
                    }
                } catch (e) {
                    console.error(e);
                    alert('클러스터 수는 숫자만 가능합니다.');
                    return;
                }
                if (n_count && n_count.length === '') {
                    alert('클러스터의 제한되는 데이터 개수를 입력해주세요.');
                    return;
                }
                try {
                    let parsedNCount = parseInt(n_count);
                    if (n_count && parsedNCount === 0) {
                        alert('클러스터의 제한되는 데이터 개수는 0이 될 수 없습니다.');
                        return;
                    }
                } catch (e) {
                    console.error(e);
                    alert('클러스터의 제한되는 데이터 개수는 숫자만 가능합니다.');
                    return;
                }
                params.n_clusters = n_clusters;
                params.n_count = parseInt(n_count);
            }

            if (outlier_type === 'autoencoder' || outlier_type === 'auto encoder' || outlier_type.trim().toUpperCase() === 'auto encoder'.trim().toUpperCase()) {
                var window_size = $('#window_size').val();
                var threshold = $('#threshold').val();

                if (threshold === '') {
                    alert('threshold에 숫자값을 입력하세요');
                    $('#threshold').val('0.15')
                    return false;
                }
                params.window_size = window_size.length !== 0 ? parseInt(window_size) : 0;
                params.threshold = threshold;
            }

            var data = {
                outlier_type: params.outlier_type,
                file_path: params.file_path,
                file_name: file_name,
                index_trgt_col: params.index_trgt_col,
                outlier_target_col: params.outlier_target_col,
                freq: params.freq,
                p_value: params.p_value,
                eps: params.eps,
                min_samples: params.min_samples,
                n_clusters: params.n_clusters,
                window_size: params.window_size,
                threshold: params.threshold,
                etc_model_seq: params.etc_model_seq,
                set_order: set_order + 1,
                target_row_count: params.target_row_count,
                n_count: params.n_count
            }

            /**
             * 동일 옵션 검증
             * 1. 선택한 옵션 가져오기
             * 2. 설정 목록 가져오기
             * */
            /*let duplicateCheck = false;
            let duplicatedOption;
            let outlierEqualOptionData = {
                type: outlier_type.toLowerCase(), column: outlier_target_col
            }
            console.log('outlierEqualOptionData', outlierEqualOptionData);
            let verifyOptions = document.querySelectorAll('#property_range [data-trgt_col][data-outlier_tp]');
            verifyOptions.forEach(verifyOption => {
                let verifyOptionData = {
                    type: verifyOption.dataset.outlier_tp.toLowerCase(), column: verifyOption.dataset.trgt_col
                }
                console.log('verifyOptionData', verifyOptionData);
                if (outlierEqualOptionData.type === verifyOptionData.type && outlierEqualOptionData.column === verifyOptionData.column) {
                    duplicatedOption = verifyOption;
                    duplicateCheck = true;
                }
            });
            if (duplicateCheck) {
                let confirmResult = confirm('동일한 옵션을 넣을 수 없습니다. 해당 옵션을 삭제하시겠습니까?');
                if (confirmResult === true) {
                    duplicatedOption.closest('div').querySelector('.btn-property-delete').click();
                    return;
                } else {
                    return;
                }
            }*/
            showProgressBar({element: null, process_id: 'process-39'});
            $.ajax({
                type: "POST", //async: false,
                url: '/dt/model/make/outlier_set',
                data: JSON.stringify(data),
                contentType: "application/json; charset=utf-8;",
                dataType: "json",
                success: function (result) {
                    closeProgressBar({element: null, process_id: 'process-39'});
                    if (result.code === 200) {
                        let outlierTemplate = oulierTemplate(params.outlier_type);
                        outlierTemplate.set_order = set_order + 1;
                        outlierTemplate.trgt_file_nm = result.param.target_file_name;
                        outlierTemplate.trgt_col = result.param.feature;
                        outlierTemplate.freq = freq;
                        outlierTemplate.eps = eps;
                        outlierTemplate.p_value = p_value;
                        outlierTemplate.min_samples = min_samples;
                        outlierTemplate.n_clusters = n_clusters;
                        outlierTemplate.n_count = params.n_count;

                        outlierTemplate.etc_model_seq = result.param.etc_model_seq;
                        outlierTemplate.window_size = result.param.window_size;
                        outlierTemplate.threshold = result.param.threshold;
                        let outlier_data = JSON.parse(document.querySelector('#preprocTableExcludeRangeOutlier').dataset.outliers);
                        outlierTemplate.outlier_data = outlier_data;
                        outlierTemplate.outlier_count = outlier_data.length;

                        var preProcData = JSON.parse($('#preprocProPerty').val());
                        outlierTemplate.row_count = preProcData.preproc_property_info[0].target_row_count;
                        preProcData.preproc_property_info[0].preproc_property[1].preproc_set[set_order] = outlierTemplate;
                        preProcData.preproc_property_info[0].last_step_preproc_file_nm = result.param.target_file_name;
                        $('#preprocProPerty').val(JSON.stringify(preProcData));
                        $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));

                        var header_list = result.header_list;
                        var data_list = result.data_list;

                        console.log('data_list', data_list);
                        console.log('header_list', header_list);
                        console.log('outlier_data', outlier_data);

                        let preprocTableRangeOutlierElement = document.querySelector('#preprocTableRangeOutlier');
                        preprocTableRangeOutlierElement.innerHTML = ``;
                        preprocTableRangeOutlierElement.style.display = 'block';

                        /**
                         * 테이블 헤더 만들기
                         * */
                        let newHeaderList = []
                        newHeaderList.push(data.index_trgt_col);
                        let dateIndex = 0;
                        header_list.forEach(function (header, index) {
                            if (header !== data.index_trgt_col) {
                                newHeaderList.push(header);
                                newHeaderList.push(header + ' BEFORE');
                            } else {
                                dateIndex = index;
                            }
                        });

                        /**
                         * 테이블 데이터 만들기
                         * */
                        let newDataList = [];
                        console.log('newHeaderList', newHeaderList);
                        console.log('newDataList', newDataList);
                        let orders = [];
                        newHeaderList.forEach(function (header, index) {
                            if (index === 0) {
                                orders.push(index);
                            } else {
                                orders.push('asc');
                            }
                        });
                        newDataList = [];
                        makeDataTableHTML(newHeaderList, newDataList, preprocTableRangeOutlierElement, 'outlierDataTableRange', function (table) {
                            $(table).DataTable({
                                scrollX: true,
                                columnDefs: [{
                                    targets: '_all', className: 'text-nowrap', searchable: false
                                }],
                                order: [orders],
                                searching: false,
                                info: false,
                                bServerSide: true,
                                ajax: {
                                    url: "/datatable/server/render/outlier",
                                    type: "POST",
                                    dataType: "json",
                                    data: function (data) {
                                        data.file_name = result.fileResult.target_file_name;
                                        data.file_path = result.fileResult.file_path;
                                        data.target_row_count = 0;
                                        return JSON.stringify(data);
                                    }
                                },
                                lengthChange: false,
                                autoWidth: true,
                                lengthMenu: [[10], [10]],
                                deferRender: true,
                                destroy: true,
                                createdRow: function (row, data, dataIndex) {
                                    let targetIndex = dateIndex;
                                    //조건 검사
                                    let isExist = false;
                                    if (data.length !== 0) {
                                        //Row의 날짜 컬럼 데이터
                                        let dateStr = data[targetIndex];
                                        //비교 검사 (BEFORE 전용)
                                        let originRow;
                                        for (let i = 0; i < outlier_data.length; i++) {
                                            //돌리는 날짜와 오리진 리스트의 날짜가 같은게 있다면
                                            if (extractAndConvertToLong(dateStr) === extractAndConvertToLong(outlier_data[i][targetIndex])) {
                                                originRow = outlier_data[i];
                                                isExist = true;
                                                break;
                                            }
                                        }
                                        if (originRow) {
                                            let count = 1;
                                            data.forEach(function (value, index) {
                                                if (index !== targetIndex && index % 2 === 0) {
                                                    data[index] = originRow[count];
                                                    $('td', row).eq(index).text(originRow[count++]);
                                                }
                                            });
                                        } else {
                                            //매칭되는 ROW 없음 그대로 로직 전개
                                        }
                                        if (isExist) $(row).addClass('active');
                                    } else {
                                        console.error('$(\'#outlierDataTableRange\').DataTable({}) createdRow data is 0');
                                    }
                                }
                            });
                        });
                        makePropertyListHtml();
                    } else {
                        if (result.result_code === -100) {
                            let errorModal = document.querySelector('#errorModal');
                            if (errorModal) {
                                let errTpElement = errorModal.querySelector('#errTp');
                                let errCdElement = errorModal.querySelector('#errCd');
                                let errNmElement = errorModal.querySelector('#errNm');
                                let errLctElement = errorModal.querySelector('#errLct');
                                let errCnElement = errorModal.querySelector('#errCn');
                                let errRegDtElement = errorModal.querySelector('#errRegDt');

                                errTpElement.innerHTML = `${result.errTp}`;
                                errCdElement.innerHTML = `${result.errCd}`;
                                errNmElement.innerHTML = `${result.errNm}`;
                                errLctElement.innerHTML = `${result.errLct}`;
                                errCnElement.innerHTML = `${result.errCn}`;
                                errRegDtElement.innerHTML = `${result.errRegDt}`;

                                if (!errorModal.classList.contains('is-open')) {
                                    errorModal.classList.add('is-open');
                                }
                            } else {
                                console.error('errorModal could not find');
                                alert('에러가 발생하였습니다. 관리자에게 문의해주세요.');
                            }
                        } else {
                            console.error('errorModal could not find');
                            alert('에러가 발생하였습니다. 관리자에게 문의해주세요.');
                        }
                    }
                },
                error: function (xhr, status, error) {
                    $('#loading').hide();
                    console.error('error : ', error);
                    closeProgressBar({element: null, process_id: 'process-39'});
                    alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                }
            });
        });

        $(document).on('click', '.btn-make-unit', function () {
            resetProcess({preprocOrder: 5, setOrder: 1});
            let selectUnitTargetCol = document.querySelector('#select_unit_target_col');
            let selectUnitTargetColDropdownBox = selectUnitTargetCol.closest('.dropdown-box');
            let selectUnitTargetColInput = selectUnitTargetColDropdownBox.querySelector(`ul.option-list > li > input[value="${selectUnitTargetCol.dataset.value}"]`);
            let selectUnitTargetColLabel = selectUnitTargetColDropdownBox.querySelector(`ul.option-list > li > label[for="${selectUnitTargetColInput.id}"]`);

            let selectUnitTp = document.querySelector('#select_unit_tp');
            let selectUnitTpDropdownBox = selectUnitTp.closest('.dropdown-box');
            let selectUnitTpInput = selectUnitTpDropdownBox.querySelector(`ul.option-list > li > input[value="${selectUnitTp.dataset.value}"]`);
            let selectUnitTpLabel = selectUnitTpDropdownBox.querySelector(`ul.option-list > li > label[for="${selectUnitTpInput.id}"]`);

            let unit_target_col = selectUnitTargetColInput.value;
            let unit_tp = selectUnitTpInput.value;
            let unit_tp_nm = selectUnitTpLabel.textContent;

            let unitCD1 = document.querySelector('#select_unit_cd1');
            let unitCD1DropdownBox = unitCD1.closest('.dropdown-box');
            let unitCD1Input = unitCD1DropdownBox.querySelector(`ul.option-list > li > input[value="${unitCD1.dataset.value}"]`);
            let unitCD1Label = unitCD1DropdownBox.querySelector(`ul.option-list > li > label[for="${unitCD1Input.id}"]`);

            let unit_cd1 = unitCD1Input.value;
            let unit_cd1_nm = unitCD1Label.textContent;

            let unitCD2 = document.querySelector('#select_unit_cd2');
            let unitCD2DropdownBox = unitCD2.closest('.dropdown-box');
            let unitCD2Input = unitCD2DropdownBox.querySelector(`ul.option-list > li > input[value="${unitCD2.dataset.value}"]`);
            let unitCD2Label = unitCD2DropdownBox.querySelector(`ul.option-list > li > label[for="${unitCD2Input.id}"]`);

            let unit_cd2 = unitCD2Input.value;
            let unit_cd2_nm = unitCD2Label.textContent;

            if (unit_target_col === 0 || unit_target_col === '0') {
                alert('변환할 컬럼을 선택하세요.');
                return false;
            }

            if (unit_tp === 0 || unit_tp === '0') {
                alert('변환 유형을 선택하세요.');
                return false;
            }

            let preProcData = JSON.parse($('#preprocProPerty').val());
            let index_target_col = preProcData.preproc_property_info[0].index_trgt_col;
            let file_path = preProcData.preproc_property_info[0].base_dir;
            let file_name = preProcData.preproc_property_info[0].last_step_preproc_file_nm;

            let max_order_num = jsonTemplateArrayNumbering(5);

            let data = {
                file_path: file_path,
                file_name: file_name,
                index_trgt_col: index_target_col,
                unit_target_col: unit_target_col,
                unit_tp: unit_tp,
                unit_seq: unit_cd1
            }
            showProgressBar({element: null, process_id: 'process-46'});
            $.ajax({
                type: "POST",
                url: '/dt/model/make/unit_set',
                data: JSON.stringify(data),
                contentType: "application/json; charset=utf-8;",
                dataType: "json",
                success: function (result) {
                    closeProgressBar({element: null, process_id: 'process-46'});
                    if (result.code === 200) {
                        let template = unitTemplate();
                        let set_order = 0
                        if (max_order_num > 0) {
                            set_order = max_order_num;
                        }

                        template.set_order = set_order + 1;
                        template.trgt_file_nm = result.param.target_file_name;
                        template.trgt_col = unit_target_col;
                        template.unit_tp = unit_tp;
                        template.unit_tp_nm = unit_tp_nm;

                        template.unit_cd_1 = unit_cd1;
                        template.unit_cd_1_nm = unit_cd1_nm;
                        template.unit_cd_2 = unit_cd2;
                        template.unit_cd_2_nm = unit_cd2_nm;

                        let preProcData = JSON.parse($('#preprocProPerty').val());
                        preProcData.preproc_property_info[0].preproc_property[4].preproc_set[set_order] = template;
                        preProcData.preproc_property_info[0].last_step_preproc_file_nm = result.param.target_file_name;
                        $('#preprocProPerty').val(JSON.stringify(preProcData));
                        $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));

                        let header_list = result.header_list;
                        let data_list = result.data_list;

                        let preprocTableRangeUnit = document.querySelector('#preprocTableRangeUnit');
                        preprocTableRangeUnit.innerHTML = ``;
                        preprocTableRangeUnit.style.display = 'block';
                        data_list = [];
                        makeDataTableHTML(header_list, data_list, preprocTableRangeUnit, 'unitDataTableRange', function (table) {
                            $(table).DataTable({
                                scrollX: true,
                                columnDefs: [{
                                    targets: '_all', className: 'text-nowrap', searchable: false
                                }],
                                order: [[0, "asc"]],
                                searching: false,
                                info: false,
                                bServerSide: true,
                                ajax: {
                                    url: "/datatable/server/render/unit",
                                    type: "POST",
                                    dataType: "json",
                                    data: function (data) {
                                        data.file_name = result.file_name;
                                        data.file_path = result.file_path;
                                        data.target_row_count = 0;
                                        return JSON.stringify(data);
                                    }
                                },
                                lengthChange: false,
                                autoWidth: false,
                                lengthMenu: [[10], [10]],
                                deferRender: true,
                                destroy: true
                            });
                        });
                        makePropertyListHtml();
                    } else {
                        alert('API 내 에러 발생');
                    }
                },
                error: function (xhr, status, error) {
                    console.error('error : ', error);
                    closeProgressBar({element: null, process_id: 'process-46'});
                    alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                }
            });
        });

        $(document).on('click', '.btn-make-interpolate', function () {
            let max_order_num = jsonTemplateArrayNumbering(3);
            let set_order = 0
            if (max_order_num > 0) {
                set_order = max_order_num;
            }
            let preProcData = JSON.parse($('#preprocProPerty').val());
            let index_target_col = preProcData.preproc_property_info[0].index_trgt_col;
            let file_path = preProcData.preproc_property_info[0].base_dir;

            let file_name = preProcData.preproc_property_info[0].last_step_preproc_file_nm;
            let interpolate_option = document.querySelector('#select_interpolate').dataset.value;
            console.log('interpolate_option', interpolate_option, 'set_order', set_order, 'max_order_num', max_order_num);

            if (interpolate_option === '0' || interpolate_option === 0) {
                alert('변환 처리 옵션을 선택해주세요.');
                return;
            }

            /**
             * 옵션 별로 파라미터를 다르게 던지도록 함
             * */
            let section = document.querySelector('#tab_missing_table_range_interpolate');
            let checkbox, feature, outputs = [], features = [], checkboxes;
            let select_interpolate, selectedOption;
            //RANDOM FOREST 특수 로직
            if (interpolate_option.includes('random forest')) {
                interpolate_option = 'random forest';
            }
            if (interpolate_option.includes('brits')) {
                interpolate_option = 'brits';
            }
            if (interpolate_option.includes('naomi')) {
                interpolate_option = 'naomi';
            }
            switch (interpolate_option) {
                case 'decisiontree': {
                    checkbox = section.querySelector('input[type="radio"]:checked');
                    if (!checkbox) {
                        alert('보간 대상 항목을 선택해주세요.');
                        return;
                    }
                    feature = checkbox.closest('tr').dataset.column;
                    checkboxes = section.querySelectorAll('input[type="checkbox"]:checked');
                    if (checkboxes.length === 0) {
                        alert('보간 입력 항목을 선택해주세요.');
                        return;
                    }
                    //보간 입력 대상 COUNT 검증
                    let check = false;
                    let countCheck = false;
                    for (let i = 0; i < checkboxes.length; i++) {
                        let countTd = checkboxes[i].closest('tr[data-column]').querySelector('[data-empty-count]');
                        let count = parseInt(countTd.dataset.emptyCount);
                        if (count) {
                            if (count !== 0) {
                                countCheck = true;
                                break;
                            }
                        }
                    }
                    if (check) {
                        alert('보간 입력 항목을 다시 선택해주세요.');
                        return;
                    }
                    if (countCheck) {
                        alert('보간 입력 항목(들) 중 보간이 안된 컬럼이 존재합니다.');
                        return;
                    }
                    checkboxes.forEach(function (checkbox) {
                        outputs.push(checkbox.closest('tr').dataset.column.trim());
                    });
                    break;
                }
                case 'random forest': {
                    select_interpolate = document.querySelector('#select_interpolate');

                    // 선택된 옵션의 텍스트 추출
                    selectedOption = select_interpolate;
                    outputs = [];
                    features = [];

                    // outputs와 features 배열 설정
                    outputs.push(selectedOption.dataset.output_col.trim());
                    selectedOption.dataset.feature_cols.split(',').forEach(value => {
                        features.push(value.trim());
                    });

                    // 테이블의 모든 data-column 속성을 배열로 추출
                    let tableRows = document.querySelectorAll('#tab_missing_table_range_interpolate tbody tr');
                    let tableColumns = Array.from(tableRows).map(row => row.dataset.column);

                    console.log('features', features, 'outputs', outputs);

                    // outputs와 features가 모두 data-column에 존재하는지 확인
                    let allExist = outputs.concat(features).every(col => tableColumns.includes(col));

                    // outputs와 features 사이에 중복이 있는지 확인
                    let hasNoDuplicates = outputs.every(output => !features.includes(output));

                    if (allExist && hasNoDuplicates) {
                        console.log('해당 RF 모델은 모든 컬럼이 존재하며, 중복이 없습니다.');
                    } else if (!allExist) {
                        console.log('해당 RF모델은 일부 컬럼이 테이블에 존재하지 않습니다.');
                        alert('해당 RF모델은 일부 컬럼이 테이블에 존재하지 않습니다.');
                        return;
                    } else if (!hasNoDuplicates) {
                        console.log('outputs와 features에 중복된 값이 있습니다.');
                        alert('해당 RF 모델은 컬럼이 중복됩니다.');
                        return;
                    }

                    let countCheck = false;
                    let countCheckName;
                    features.forEach(function (feature) {
                        let countTd = document.querySelector(`#tab_missing_table_range_interpolate tbody tr[data-column="${feature}"] [data-empty-count]`);
                        let count = parseInt(countTd.dataset.emptyCount);
                        if (count && !countCheck) {
                            if (count !== 0) {
                                countCheck = true;
                                countCheckName = feature;
                            }
                        }
                    });

                    if (countCheck) {
                        alert(`보간 대상 ${countCheckName} 이 비어있는 데이터가 존재합니다.`);
                        return;
                    }
                    break;
                }
                case 'brits': {
                    select_interpolate = document.querySelector('#select_interpolate');

                    // 선택된 옵션의 텍스트 추출
                    selectedOption = select_interpolate;
                    outputs = [];
                    features = [];

                    // outputs와 features 배열 설정
                    outputs.push(selectedOption.dataset.output_col.trim());

                    // 테이블의 모든 data-column 속성을 배열로 추출
                    let tableRows = document.querySelectorAll('#tab_missing_table_range_interpolate tbody tr');
                    let tableColumns = Array.from(tableRows).map(row => row.dataset.column);

                    // outputs와 features가 모두 data-column에 존재하는지 확인
                    let allExist = outputs.every(col => tableColumns.includes(col));

                    if (allExist) {
                        console.log('해당 Brits 모델은 모든 컬럼이 존재하며, 중복이 없습니다.');
                    } else {
                        console.log('해당 Brits 모델은 일부 컬럼이 테이블에 존재하지 않습니다.');
                        alert('해당 Brits 모델은 일부 컬럼이 테이블에 존재하지 않습니다.');
                        return;
                    }
                    break;
                }
                case 'naomi': {
                    select_interpolate = document.querySelector('#select_interpolate');

                    // 선택된 옵션의 텍스트 추출
                    selectedOption = select_interpolate;
                    outputs = [];
                    features = [];

                    // outputs와 features 배열 설정
                    outputs.push(selectedOption.dataset.output_col.trim());

                    // 테이블의 모든 data-column 속성을 배열로 추출
                    let tableRows = document.querySelectorAll('#tab_missing_table_range_interpolate tbody tr');
                    let tableColumns = Array.from(tableRows).map(row => row.dataset.column);

                    // outputs와 features가 모두 data-column에 존재하는지 확인
                    let allExist = outputs.every(col => tableColumns.includes(col));

                    if (allExist) {
                        console.log('해당 Naomi 모델은 모든 컬럼이 존재하며, 중복이 없습니다.');
                    } else {
                        console.log('해당 Naomi 모델은 일부 컬럼이 테이블에 존재하지 않습니다.');
                        alert('해당 Naomi 모델은 일부 컬럼이 테이블에 존재하지 않습니다.');
                        return;
                    }
                    break;
                }
                default:
                    break;
            }

            console.log('feature', feature, 'outputs', outputs);

            /**
             * 동일 옵션 검증
             * 1. Random Forest 일시, output_col 까지 검사
             * 1. 선택한 옵션 가져오기
             * 2. 설정 목록 가져오기
             * */
            let duplicateCheck = false;
            let duplicatedOption;
            let interpolateEqualOptionData = {
                type: interpolate_option.toLowerCase()
            }
            console.log('interpolateEqualOptionData', interpolateEqualOptionData);
            let verifyOptions = document.querySelectorAll('#property_range [data-interpl_tp]');
            switch (interpolate_option) {
                case 'brits':
                    break;
                case 'random forest':
                    break;
                case 'naomi':
                    break;
                default:
                    verifyOptions.forEach(verifyOption => {
                        let verifyOptionData = {
                            type: verifyOption.dataset.interpl_tp.toLowerCase()
                        }
                        console.log('verifyOptionData', verifyOptionData);
                        if (interpolateEqualOptionData.type === verifyOptionData.type) {
                            duplicatedOption = verifyOption;
                            duplicateCheck = true;
                        }
                    });
                    if (duplicateCheck) {
                        let confirmResult = confirm('동일한 옵션을 넣을 수 없습니다. 해당 옵션을 삭제하시겠습니까?');
                        if (confirmResult === true) {
                            duplicatedOption.closest('div').querySelector('.btn-property-delete').click();
                            return;
                        } else {
                            return;
                        }
                    }
                    break;
            }

            if (interpolate_option !== 0) {
                let data = {
                    interpolate_option: interpolate_option,
                    index_trgt_col: index_target_col,
                    file_path: file_path,
                    file_name: file_name,
                    feature: feature,
                    outputs: outputs,
                    set_order
                }
                if (data.interpolate_option === 'decisiontree') {
                    data.prev_file_name = findLastFileAndPrevFile(preProcData).prev;
                    showProgressBar({element: null, process_id: 'process-41'});
                    $.ajax({
                        type: "POST",
                        url: '/dt/model/make/interpolate_set/decision',
                        data: JSON.stringify(data),
                        contentType: "application/json; charset=utf-8;",
                        dataType: "json",
                        success: function (result) {
                            if (result.code === 200) {
                                let template = interpolateTemplate();
                                template.set_order = set_order + 1;
                                template.trgt_file_nm = result.param.target_file_name;
                                template.interpl_tp = interpolate_option;
                                template.interpl_feature = result.param.feature;
                                template.interpl_outputs = result.param.outputs;
                                template.interpl_labels = result.labels;
                                template.interpl_decision_model_file_name = result.decision_model_file_name;
                                template.interpl_decision_model_file_path = result.decision_model_file_path;
                                var preProcData = JSON.parse($('#preprocProPerty').val());

                                template.missing_data = [];
                                let missing_count = 0;
                                //보간 데이터 보여주는 작업 Validate 부분 합산
                                if (preProcData.preproc_property_info[0].preproc_property[0].preproc_set && preProcData.preproc_property_info[0].preproc_property[0].preproc_set.length !== 0) {
                                    console.log('preProcData.preproc_property_info[0].preproc_property[0].preproc_set', preProcData.preproc_property_info[0].preproc_property[0].preproc_set);
                                    preProcData.preproc_property_info[0].preproc_property[0].preproc_set.forEach((property) => {
                                        try {
                                            missing_count += parseInt(property.validate_count);
                                        } catch (e) {
                                            missing_count = 0;
                                            console.error(e);
                                            alert('데이터의 정합성이 일치하지 않습니다.');
                                            return;
                                        }
                                        template.missing_data = [...template.missing_data, ...property.validate_data];
                                    });
                                }

                                //보간 데이터 보여주는 작업 Outlier 부분 합산
                                if (preProcData.preproc_property_info[0].preproc_property[1].preproc_set && preProcData.preproc_property_info[0].preproc_property[1].preproc_set.length !== 0) {
                                    console.log('preProcData.preproc_property_info[0].preproc_property[1].preproc_set', preProcData.preproc_property_info[0].preproc_property[1].preproc_set);
                                    preProcData.preproc_property_info[0].preproc_property[1].preproc_set.forEach((property) => {
                                        try {
                                            missing_count += parseInt(property.outlier_count);
                                        } catch (e) {
                                            missing_count = 0;
                                            console.error(e);
                                            alert('데이터의 정합성이 일치하지 않습니다.');
                                            return;
                                        }
                                        template.missing_data = [...template.missing_data, ...property.outlier_data];
                                    });
                                }
                                template.row_count = preProcData.preproc_property_info[0].target_row_count;
                                template.missing_count = missing_count;
                                preProcData.preproc_property_info[0].preproc_property[2].preproc_set[set_order] = template;
                                preProcData.preproc_property_info[0].last_step_preproc_file_nm = result.param.target_file_name;

                                $('#preprocProPerty').val(JSON.stringify(preProcData));
                                $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));

                                var header_list = result.header_list;
                                var data_list = result.data_list;
                                let missing_data = preProcData.preproc_property_info[0].preproc_property[2].preproc_set[set_order].missing_data;

                                //let statusMessage = missing_data.length === 0 ? null : `총 ${data_list.length}개의 데이터에서 ${missing_data.length}개의 결측치가 존재합니다.`;
                                let statusMessage = `총 ${data_list.length}개의 데이터에서 ${missing_data.length}개의 결측치가 존재합니다.`;
                                if (statusMessage) {
                                    preProcessMakeHTMLExcludeDataTable('#preprocTableExcludeRangeMissing', 'missingDataTableExcludeRange', header_list, missing_data, statusMessage, function (wrapper, headers, datas) {
                                        console.log('wrapper', wrapper);
                                        console.log('preProcessMakeHTMLExcludeDataTable is completed');
                                        $('#missingDataTableExcludeRange').DataTable({
                                            scrollX: true,
                                            columnDefs: [{
                                                targets: '_all', className: 'text-nowrap'
                                            }],
                                            order: [[0, "asc"]],
                                            searching: false,
                                            info: false,
                                            lengthChange: false,
                                            autoWidth: true,
                                            lengthMenu: [[10], [10]],
                                            initComplete: function (settings, json) {
                                                console.log('DataTable has finished its initialisation.');
                                                wrapper.parentElement.style.display = 'block';
                                            }
                                        });
                                    }, true);
                                }

                                let preprocTableRangeMissing = document.querySelector('#preprocTableRangeMissing');
                                preprocTableRangeMissing.style.display = 'block';
                                preprocTableRangeMissing.innerHTML = '';

                                let newHeaderList = []
                                newHeaderList.push(data.index_trgt_col);
                                let dateIndex = 0;
                                header_list.forEach(function (header, index) {
                                    if (header !== data.index_trgt_col) {
                                        newHeaderList.push(header);
                                        newHeaderList.push(header + ' BEFORE');
                                    } else {
                                        dateIndex = index;
                                    }
                                });

                                let newDataList = [];
                                let orders = [];
                                newHeaderList.forEach(function (header, index) {
                                    if (index === 0) {
                                        orders.push(index);
                                    } else {
                                        orders.push('asc');
                                    }
                                });
                                newDataList = [];
                                makeDataTableHTML(newHeaderList, newDataList, preprocTableRangeMissing, 'interpolateDataTableRange', function (table) {
                                    $(table).DataTable({
                                        scrollX: true,
                                        columnDefs: [{
                                            targets: '_all', className: 'text-nowrap', searchable: false
                                        }],
                                        order: [orders],
                                        searching: false,
                                        info: false,
                                        bServerSide: true,
                                        ajax: {
                                            url: "/datatable/server/render/interpolate",
                                            type: "POST",
                                            dataType: "json",
                                            data: function (data) {
                                                data.file_name = result.file_name;
                                                data.file_path = result.file_path;
                                                data.target_row_count = 0;
                                                console.log('data', data);
                                                return JSON.stringify(data);
                                            }
                                        },
                                        lengthChange: false,
                                        autoWidth: true,
                                        lengthMenu: [[10], [10]],
                                        deferRender: true,
                                        destroy: true,
                                        createdRow: function (row, data, dataIndex) {
                                            let targetIndex = 0;
                                            //조건 검사
                                            let isExist = false;
                                            if (data.length !== 0) {
                                                //Row의 날짜 컬럼 데이터
                                                let dateStr = data[targetIndex];
                                                //비교 검사 (BEFORE 전용)
                                                let originRow;
                                                for (let i = 0; i < missing_data.length; i++) {
                                                    //돌리는 날짜와 오리진 리스트의 날짜가 같은게 있다면
                                                    if (extractAndConvertToLong(dateStr) === extractAndConvertToLong(missing_data[i][targetIndex])) {
                                                        originRow = missing_data[i];
                                                        isExist = true;
                                                        break;
                                                    }
                                                }

                                                if (originRow) {
                                                    let count = 1;
                                                    data.forEach(function (value, index) {
                                                        if (index !== targetIndex && index % 2 === 0) {
                                                            data[index] = originRow[count];
                                                            $('td', row).eq(index).text(originRow[count++]);
                                                        }
                                                    });
                                                } else {
                                                    //매칭되는 ROW 없음 그대로 로직 전개
                                                }
                                                if (isExist) $(row).addClass('active');
                                            } else {
                                                console.error('$(\'#interpolateDataTableRange\').DataTable({}) createdRow data is 0');
                                            }
                                        }
                                    });
                                });
                                closeProgressBar({element: null, process_id: 'process-41'});

                                let base_file_path = preProcData.preproc_property_info[0].base_dir;
                                let base_file_nm = preProcData.preproc_property_info[0].last_step_preproc_file_nm;
                                let index_trgt_col = preProcData.preproc_property_info[0].index_trgt_col;
                                let form_type = $('#formType').val();
                                getPreprocessTargetDataSetInfo(base_file_path, base_file_nm, index_trgt_col, form_type, 'interpolate', false, function (data) {
                                    console.log('getPreprocessTargetDataSetInfo', JSON.parse(data));
                                    makePropertyListHtml();
                                });
                            } else {
                                closeProgressBar({element: null, process_id: 'process-41'});
                                if (result.result_code === -100) {
                                    let errorModal = document.querySelector('#errorModal');
                                    if (errorModal) {
                                        let errTpElement = errorModal.querySelector('#errTp');
                                        let errCdElement = errorModal.querySelector('#errCd');
                                        let errNmElement = errorModal.querySelector('#errNm');
                                        let errLctElement = errorModal.querySelector('#errLct');
                                        let errCnElement = errorModal.querySelector('#errCn');
                                        let errRegDtElement = errorModal.querySelector('#errRegDt');

                                        errTpElement.innerHTML = `${result.errTp}`;
                                        errCdElement.innerHTML = `${result.errCd}`;
                                        errNmElement.innerHTML = `${result.errNm}`;
                                        errLctElement.innerHTML = `${result.errLct}`;
                                        errCnElement.innerHTML = `${result.errCn}`;
                                        errRegDtElement.innerHTML = `${result.errRegDt}`;

                                        if (!errorModal.classList.contains('is-open')) {
                                            errorModal.classList.add('is-open');
                                        }
                                    } else {
                                        console.error('errorModal could not find');
                                        alert('에러가 발생하였습니다. 관리자에게 문의해주세요.');
                                    }
                                } else {
                                    console.error('errorModal could not find');
                                    alert('에러가 발생하였습니다. 관리자에게 문의해주세요.');
                                }
                            }
                        },
                        error: function (xhr, status, error) {
                            console.error('error : ', error);
                            closeProgressBar({element: null, process_id: 'process-41'});
                            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                        }
                    });
                } else if (data.interpolate_option === 'random forest') {
                    console.log('data', data);
                    data.features = features;
                    data.etc_model_seq = selectedOption.dataset.etc_model_seq;
                    showProgressBar({element: null, process_id: 'process-41'});
                    $.ajax({
                        type: "POST",
                        url: '/dt/model/make/interpolate_set/rf',
                        data: JSON.stringify(data),
                        contentType: "application/json; charset=utf-8;",
                        dataType: "json",
                        success: function (result) {
                            if (result.code === 200) {
                                console.log('random forest result', result);
                                let template = interpolateTemplate();
                                template.set_order = set_order + 1;
                                template.trgt_file_nm = result.param.output_file;
                                template.interpl_tp = interpolate_option;
                                template.interpl_outputs = result.param.outputs;
                                template.interpl_labels = result.param.features;
                                template.interpl_etc_model_seq = parseInt(result.param.etc_model_seq);
                                template.interpl_etc_model_file_path = result.param.model_file_path;
                                template.interpl_etc_model_file_name = result.param.model_file_name;

                                var preProcData = JSON.parse($('#preprocProPerty').val());

                                template.missing_data = [];
                                let missing_count = 0;
                                //보간 데이터 보여주는 작업 Validate 부분 합산
                                if (preProcData.preproc_property_info[0].preproc_property[0].preproc_set && preProcData.preproc_property_info[0].preproc_property[0].preproc_set.length !== 0) {
                                    console.log('preProcData.preproc_property_info[0].preproc_property[0].preproc_set', preProcData.preproc_property_info[0].preproc_property[0].preproc_set);
                                    preProcData.preproc_property_info[0].preproc_property[0].preproc_set.forEach((property) => {
                                        try {
                                            missing_count += parseInt(property.validate_count);
                                        } catch (e) {
                                            missing_count = 0;
                                            console.error(e);
                                            alert('데이터의 정합성이 일치하지 않습니다.');
                                            return;
                                        }
                                        template.missing_data = [...template.missing_data, ...property.validate_data];
                                    });
                                }

                                //보간 데이터 보여주는 작업 Outlier 부분 합산
                                if (preProcData.preproc_property_info[0].preproc_property[1].preproc_set && preProcData.preproc_property_info[0].preproc_property[1].preproc_set.length !== 0) {
                                    console.log('preProcData.preproc_property_info[0].preproc_property[1].preproc_set', preProcData.preproc_property_info[0].preproc_property[1].preproc_set);
                                    preProcData.preproc_property_info[0].preproc_property[1].preproc_set.forEach((property) => {
                                        try {
                                            missing_count += parseInt(property.outlier_count);
                                        } catch (e) {
                                            missing_count = 0;
                                            console.error(e);
                                            alert('데이터의 정합성이 일치하지 않습니다.');
                                            return;
                                        }
                                        template.missing_data = [...template.missing_data, ...property.outlier_data];
                                    });
                                }
                                template.row_count = preProcData.preproc_property_info[0].target_row_count;
                                template.missing_count = missing_count;
                                preProcData.preproc_property_info[0].preproc_property[2].preproc_set[set_order] = template;
                                preProcData.preproc_property_info[0].last_step_preproc_file_nm = result.param.output_file;

                                $('#preprocProPerty').val(JSON.stringify(preProcData));
                                $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));

                                var header_list = result.header_list;
                                var data_list = result.data_list;
                                let missing_data = preProcData.preproc_property_info[0].preproc_property[2].preproc_set[set_order].missing_data;

                                /**
                                 * 만약 0개일때는 제외된 테이블을 생성하도록 하지 않는 경우
                                 * */
                                let statusMessage = `총 ${data_list.length}개의 데이터에서 ${missing_data.length}개의 결측치가 존재합니다.`;
                                if (statusMessage) {
                                    preProcessMakeHTMLExcludeDataTable('#preprocTableExcludeRangeMissing', 'missingDataTableExcludeRange', header_list, missing_data, statusMessage, function (wrapper, headers, datas) {
                                        console.log('wrapper', wrapper);
                                        console.log('preProcessMakeHTMLExcludeDataTable is completed');
                                        $('#missingDataTableExcludeRange').DataTable({
                                            scrollX: true,
                                            columnDefs: [{
                                                targets: '_all', className: 'text-nowrap'
                                            }],
                                            order: [[0, "asc"]],
                                            searching: false,
                                            info: false,
                                            lengthChange: false,
                                            autoWidth: true,
                                            lengthMenu: [[10], [10]],
                                            initComplete: function (settings, json) {
                                                console.log('DataTable has finished its initialisation.');
                                                wrapper.parentElement.style.display = 'block';
                                            }
                                        });
                                    }, true);
                                }

                                let preprocTableRangeMissing = document.querySelector('#preprocTableRangeMissing');
                                preprocTableRangeMissing.style.display = 'block';
                                preprocTableRangeMissing.innerHTML = '';

                                /**
                                 * 테이블 헤더 만들기
                                 * */
                                let newHeaderList = []
                                newHeaderList.push(data.index_trgt_col);
                                let dateIndex = 0;
                                header_list.forEach(function (header, index) {
                                    if (header !== data.index_trgt_col) {
                                        newHeaderList.push(header);
                                        newHeaderList.push(header + ' BEFORE');
                                    } else {
                                        dateIndex = index;
                                    }
                                });

                                /**
                                 * 테이블 데이터 만들기
                                 * */
                                let newDataList = [];
                                let orders = [];
                                newHeaderList.forEach(function (header, index) {
                                    if (index === 0) {
                                        orders.push(index);
                                    } else {
                                        orders.push('asc');
                                    }
                                });
                                newDataList = [];
                                makeDataTableHTML(newHeaderList, newDataList, preprocTableRangeMissing, 'interpolateDataTableRange', function (table) {
                                    $(table).DataTable({
                                        scrollX: true,
                                        columnDefs: [{
                                            targets: '_all', className: 'text-nowrap', searchable: false
                                        }],
                                        order: [orders],
                                        searching: false,
                                        info: false,
                                        bServerSide: true,
                                        ajax: {
                                            url: "/datatable/server/render/interpolate",
                                            type: "POST",
                                            dataType: "json",
                                            data: function (data) {
                                                data.file_name = result.file_name;
                                                data.file_path = result.file_path;
                                                data.target_row_count = 0;
                                                return JSON.stringify(data);
                                            }
                                        },
                                        lengthChange: false,
                                        autoWidth: true,
                                        lengthMenu: [[10], [10]],
                                        deferRender: true,
                                        destory: true,
                                        createdRow: function (row, data, dataIndex) {
                                            let targetIndex = 0;
                                            //조건 검사
                                            let isExist = false;
                                            if (data.length !== 0) {
                                                //Row의 날짜 컬럼 데이터
                                                let dateStr = data[targetIndex];
                                                //비교 검사 (BEFORE 전용)
                                                let originRow;
                                                for (let i = 0; i < missing_data.length; i++) {
                                                    //돌리는 날짜와 오리진 리스트의 날짜가 같은게 있다면
                                                    if (extractAndConvertToLong(dateStr) === extractAndConvertToLong(missing_data[i][targetIndex])) {
                                                        originRow = missing_data[i];
                                                        isExist = true;
                                                        break;
                                                    }
                                                }

                                                if (originRow) {
                                                    let count = 1;
                                                    data.forEach(function (value, index) {
                                                        if (index !== targetIndex && index % 2 === 0) {
                                                            data[index] = originRow[count];
                                                            $('td', row).eq(index).text(originRow[count++]);
                                                        }
                                                    });
                                                } else {
                                                    //매칭되는 ROW 없음 그대로 로직 전개
                                                }
                                                if (isExist) $(row).addClass('active');
                                            } else {
                                                console.error('$(\'#interpolateDataTableRange\').DataTable({}) createdRow data is 0');
                                            }
                                        }
                                    });
                                });
                                closeProgressBar({element: null, process_id: 'process-41'});

                                let base_file_path = preProcData.preproc_property_info[0].base_dir;
                                let base_file_nm = preProcData.preproc_property_info[0].last_step_preproc_file_nm;
                                let index_trgt_col = preProcData.preproc_property_info[0].index_trgt_col;
                                let form_type = $('#formType').val();
                                getPreprocessTargetDataSetInfo(base_file_path, base_file_nm, index_trgt_col, form_type, 'interpolate', false, function (data) {
                                    console.log('getPreprocessTargetDataSetInfo', JSON.parse(data));
                                    makePropertyListHtml();
                                });
                            } else {
                                closeProgressBar({element: null, process_id: 'process-41'});
                                if (result.result_code === -100) {
                                    let errorModal = document.querySelector('#errorModal');
                                    if (errorModal) {
                                        let errTpElement = errorModal.querySelector('#errTp');
                                        let errCdElement = errorModal.querySelector('#errCd');
                                        let errNmElement = errorModal.querySelector('#errNm');
                                        let errLctElement = errorModal.querySelector('#errLct');
                                        let errCnElement = errorModal.querySelector('#errCn');
                                        let errRegDtElement = errorModal.querySelector('#errRegDt');

                                        errTpElement.innerHTML = `${result.errTp}`;
                                        errCdElement.innerHTML = `${result.errCd}`;
                                        errNmElement.innerHTML = `${result.errNm}`;
                                        errLctElement.innerHTML = `${result.errLct}`;
                                        errCnElement.innerHTML = `${result.errCn}`;
                                        errRegDtElement.innerHTML = `${result.errRegDt}`;

                                        if (!errorModal.classList.contains('is-open')) {
                                            errorModal.classList.add('is-open');
                                        }
                                    } else {
                                        console.error('errorModal could not find');
                                        alert('에러가 발생하였습니다. 관리자에게 문의해주세요.');
                                    }
                                } else {
                                    console.error('errorModal could not find');
                                    alert('에러가 발생하였습니다. 관리자에게 문의해주세요.');
                                }
                            }
                        },
                        error: function (xhr, status, error) {
                            console.error('error : ', error);
                            closeProgressBar({element: null, process_id: 'process-41'});
                            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                        }
                    });
                } else if (data.interpolate_option === 'brits') {
                    data.etc_model_seq = selectedOption.dataset.etc_model_seq;
                    delete data.feature;
                    showProgressBar({element: null, process_id: 'process-41'});
                    console.log('data', data);
                    $.ajax({
                        type: "POST",
                        url: '/dt/model/make/interpolate_set/brits',
                        data: JSON.stringify(data),
                        contentType: "application/json; charset=utf-8;",
                        dataType: "json",
                        success: function (result) {
                            if (result.code === 200) {
                                console.log('brits result', result);
                                let template = interpolateTemplate();
                                template.set_order = set_order + 1;
                                template.trgt_file_nm = result.param.output_file;
                                template.interpl_tp = interpolate_option;
                                template.interpl_outputs = result.param.outputs;
                                template.interpl_etc_model_seq = parseInt(result.param.etc_model_seq);
                                template.interpl_etc_model_file_path = result.param.model_file_path;
                                template.interpl_etc_model_file_name = result.param.model_file_name;

                                var preProcData = JSON.parse($('#preprocProPerty').val());

                                template.missing_data = [];
                                let missing_count = 0;
                                //보간 데이터 보여주는 작업 Validate 부분 합산
                                if (preProcData.preproc_property_info[0].preproc_property[0].preproc_set && preProcData.preproc_property_info[0].preproc_property[0].preproc_set.length !== 0) {
                                    console.log('preProcData.preproc_property_info[0].preproc_property[0].preproc_set', preProcData.preproc_property_info[0].preproc_property[0].preproc_set);
                                    preProcData.preproc_property_info[0].preproc_property[0].preproc_set.forEach((property) => {
                                        try {
                                            missing_count += parseInt(property.validate_count);
                                        } catch (e) {
                                            missing_count = 0;
                                            console.error(e);
                                            alert('데이터의 정합성이 일치하지 않습니다.');
                                            return;
                                        }
                                        template.missing_data = [...template.missing_data, ...property.validate_data];
                                    });
                                }

                                //보간 데이터 보여주는 작업 Outlier 부분 합산
                                if (preProcData.preproc_property_info[0].preproc_property[1].preproc_set && preProcData.preproc_property_info[0].preproc_property[1].preproc_set.length !== 0) {
                                    console.log('preProcData.preproc_property_info[0].preproc_property[1].preproc_set', preProcData.preproc_property_info[0].preproc_property[1].preproc_set);
                                    preProcData.preproc_property_info[0].preproc_property[1].preproc_set.forEach((property) => {
                                        try {
                                            missing_count += parseInt(property.outlier_count);
                                        } catch (e) {
                                            missing_count = 0;
                                            console.error(e);
                                            alert('데이터의 정합성이 일치하지 않습니다.');
                                            return;
                                        }
                                        template.missing_data = [...template.missing_data, ...property.outlier_data];
                                    });
                                }
                                template.row_count = preProcData.preproc_property_info[0].target_row_count;
                                template.missing_count = missing_count;
                                preProcData.preproc_property_info[0].preproc_property[2].preproc_set[set_order] = template;
                                preProcData.preproc_property_info[0].last_step_preproc_file_nm = result.param.output_file;

                                $('#preprocProPerty').val(JSON.stringify(preProcData));
                                $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));

                                var header_list = result.header_list;
                                var data_list = result.data_list;
                                let missing_data = preProcData.preproc_property_info[0].preproc_property[2].preproc_set[set_order].missing_data;

                                /**
                                 * 만약 0개일때는 제외된 테이블을 생성하도록 하지 않는 경우
                                 * */
                                let statusMessage = `총 ${data_list.length}개의 데이터에서 ${missing_data.length}개의 결측치가 존재합니다.`;
                                if (statusMessage) {
                                    preProcessMakeHTMLExcludeDataTable('#preprocTableExcludeRangeMissing', 'missingDataTableExcludeRange', header_list, missing_data, statusMessage, function (wrapper, headers, datas) {
                                        console.log('wrapper', wrapper);
                                        console.log('preProcessMakeHTMLExcludeDataTable is completed');
                                        $('#missingDataTableExcludeRange').DataTable({
                                            scrollX: true,
                                            columnDefs: [{
                                                targets: '_all', className: 'text-nowrap'
                                            }],
                                            order: [[0, "asc"]],
                                            searching: false,
                                            info: false,
                                            lengthChange: false,
                                            autoWidth: true,
                                            lengthMenu: [[10], [10]],
                                            initComplete: function (settings, json) {
                                                console.log('DataTable has finished its initialisation.');
                                                wrapper.parentElement.style.display = 'block';
                                            }
                                        });
                                    }, true);
                                }

                                let preprocTableRangeMissing = document.querySelector('#preprocTableRangeMissing');
                                preprocTableRangeMissing.style.display = 'block';
                                preprocTableRangeMissing.innerHTML = '';

                                /**
                                 * 테이블 헤더 만들기
                                 * */
                                let newHeaderList = []
                                newHeaderList.push(data.index_trgt_col);
                                let dateIndex = 0;
                                header_list.forEach(function (header, index) {
                                    if (header !== data.index_trgt_col) {
                                        newHeaderList.push(header);
                                        newHeaderList.push(header + ' BEFORE');
                                    } else {
                                        dateIndex = index;
                                    }
                                });

                                /**
                                 * 테이블 데이터 만들기
                                 * */
                                let newDataList = [];
                                let orders = [];
                                newHeaderList.forEach(function (header, index) {
                                    if (index === 0) {
                                        orders.push(index);
                                    } else {
                                        orders.push('asc');
                                    }
                                });
                                newDataList = [];
                                makeDataTableHTML(newHeaderList, newDataList, preprocTableRangeMissing, 'interpolateDataTableRange', function (table) {
                                    $(table).DataTable({
                                        scrollX: true,
                                        columnDefs: [{
                                            targets: '_all', className: 'text-nowrap', searchable: false
                                        }],
                                        order: [orders],
                                        searching: false,
                                        info: false,
                                        bServerSide: true,
                                        ajax: {
                                            url: "/datatable/server/render/interpolate",
                                            type: "POST",
                                            dataType: "json",
                                            data: function (data) {
                                                data.file_name = result.file_name;
                                                data.file_path = result.file_path;
                                                data.target_row_count = 0;
                                                return JSON.stringify(data);
                                            }
                                        },
                                        lengthChange: false,
                                        autoWidth: true,
                                        lengthMenu: [[10], [10]],
                                        deferRender: true,
                                        destroy: true,
                                        createdRow: function (row, data, dataIndex) {
                                            let targetIndex = 0;
                                            //조건 검사
                                            let isExist = false;
                                            if (data.length !== 0) {
                                                //Row의 날짜 컬럼 데이터
                                                let dateStr = data[targetIndex];
                                                //비교 검사 (BEFORE 전용)
                                                let originRow;
                                                for (let i = 0; i < missing_data.length; i++) {
                                                    //돌리는 날짜와 오리진 리스트의 날짜가 같은게 있다면
                                                    if (extractAndConvertToLong(dateStr) === extractAndConvertToLong(missing_data[i][targetIndex])) {
                                                        originRow = missing_data[i];
                                                        isExist = true;
                                                        break;
                                                    }
                                                }

                                                if (originRow) {
                                                    let count = 1;
                                                    data.forEach(function (value, index) {
                                                        if (index !== targetIndex && index % 2 === 0) {
                                                            data[index] = originRow[count];
                                                            $('td', row).eq(index).text(originRow[count++]);
                                                        }
                                                    });
                                                } else {
                                                    //매칭되는 ROW 없음 그대로 로직 전개
                                                }
                                                if (isExist) $(row).addClass('active');
                                            } else {
                                                console.error('$(\'#interpolateDataTableRange\').DataTable({}) createdRow data is 0');
                                            }
                                        }
                                    });
                                });
                                closeProgressBar({element: null, process_id: 'process-41'});

                                let base_file_path = preProcData.preproc_property_info[0].base_dir;
                                let base_file_nm = preProcData.preproc_property_info[0].last_step_preproc_file_nm;
                                let index_trgt_col = preProcData.preproc_property_info[0].index_trgt_col;
                                let form_type = $('#formType').val();
                                getPreprocessTargetDataSetInfo(base_file_path, base_file_nm, index_trgt_col, form_type, 'interpolate', false, function (data) {
                                    console.log('getPreprocessTargetDataSetInfo', JSON.parse(data));
                                    makePropertyListHtml();
                                });
                            } else {
                                closeProgressBar({element: null, process_id: 'process-41'});
                                if (result.result_code === -100) {
                                    let errorModal = document.querySelector('#errorModal');
                                    if (errorModal) {
                                        let errTpElement = errorModal.querySelector('#errTp');
                                        let errCdElement = errorModal.querySelector('#errCd');
                                        let errNmElement = errorModal.querySelector('#errNm');
                                        let errLctElement = errorModal.querySelector('#errLct');
                                        let errCnElement = errorModal.querySelector('#errCn');
                                        let errRegDtElement = errorModal.querySelector('#errRegDt');

                                        errTpElement.innerHTML = `${result.errTp}`;
                                        errCdElement.innerHTML = `${result.errCd}`;
                                        errNmElement.innerHTML = `${result.errNm}`;
                                        errLctElement.innerHTML = `${result.errLct}`;
                                        errCnElement.innerHTML = `${result.errCn}`;
                                        errRegDtElement.innerHTML = `${result.errRegDt}`;

                                        if (!errorModal.classList.contains('is-open')) {
                                            errorModal.classList.add('is-open');
                                        }
                                    } else {
                                        console.error('errorModal could not find');
                                        alert('에러가 발생하였습니다. 관리자에게 문의해주세요.');
                                    }
                                } else {
                                    console.error('errorModal could not find');
                                    alert('에러가 발생하였습니다. 관리자에게 문의해주세요.');
                                }
                            }
                        },
                        error: function (xhr, status, error) {
                            console.error('error : ', error);
                            closeProgressBar({element: null, process_id: 'process-41'});
                            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                        }
                    });
                } else if (data.interpolate_option === 'naomi') {
                    data.etc_model_seq = selectedOption.dataset.etc_model_seq;
                    delete data.feature;
                    showProgressBar({element: null, process_id: 'process-41'});
                    console.log('data', data);
                    $.ajax({
                        type: "POST",
                        url: '/dt/model/make/interpolate_set/naomi',
                        data: JSON.stringify(data),
                        contentType: "application/json; charset=utf-8;",
                        dataType: "json",
                        success: function (result) {
                            if (result.code === 200) {
                                console.log('naomi result', result);
                                let template = interpolateTemplate();
                                template.set_order = set_order + 1;
                                template.trgt_file_nm = result.param.output_file;
                                template.interpl_tp = interpolate_option;
                                template.interpl_outputs = result.param.outputs;
                                template.interpl_window_size = result.param.windowSize;
                                template.interpl_etc_model_seq = parseInt(result.param.etc_model_seq);
                                template.interpl_etc_model_file_path = result.param.model_file_path;
                                template.interpl_etc_model_file_name = result.param.model_file_name;

                                var preProcData = JSON.parse($('#preprocProPerty').val());

                                template.missing_data = [];
                                let missing_count = 0;
                                //보간 데이터 보여주는 작업 Validate 부분 합산
                                if (preProcData.preproc_property_info[0].preproc_property[0].preproc_set && preProcData.preproc_property_info[0].preproc_property[0].preproc_set.length !== 0) {
                                    console.log('preProcData.preproc_property_info[0].preproc_property[0].preproc_set', preProcData.preproc_property_info[0].preproc_property[0].preproc_set);
                                    preProcData.preproc_property_info[0].preproc_property[0].preproc_set.forEach((property) => {
                                        try {
                                            missing_count += parseInt(property.validate_count);
                                        } catch (e) {
                                            missing_count = 0;
                                            console.error(e);
                                            alert('데이터의 정합성이 일치하지 않습니다.');
                                            return;
                                        }
                                        template.missing_data = [...template.missing_data, ...property.validate_data];
                                    });
                                }

                                //보간 데이터 보여주는 작업 Outlier 부분 합산
                                if (preProcData.preproc_property_info[0].preproc_property[1].preproc_set && preProcData.preproc_property_info[0].preproc_property[1].preproc_set.length !== 0) {
                                    console.log('preProcData.preproc_property_info[0].preproc_property[1].preproc_set', preProcData.preproc_property_info[0].preproc_property[1].preproc_set);
                                    preProcData.preproc_property_info[0].preproc_property[1].preproc_set.forEach((property) => {
                                        try {
                                            missing_count += parseInt(property.outlier_count);
                                        } catch (e) {
                                            missing_count = 0;
                                            console.error(e);
                                            alert('데이터의 정합성이 일치하지 않습니다.');
                                            return;
                                        }
                                        template.missing_data = [...template.missing_data, ...property.outlier_data];
                                    });
                                }
                                template.row_count = preProcData.preproc_property_info[0].target_row_count;
                                template.missing_count = missing_count;
                                preProcData.preproc_property_info[0].preproc_property[2].preproc_set[set_order] = template;
                                preProcData.preproc_property_info[0].last_step_preproc_file_nm = result.param.output_file;

                                $('#preprocProPerty').val(JSON.stringify(preProcData));
                                $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));

                                var header_list = result.header_list;
                                var data_list = result.data_list;
                                let missing_data = preProcData.preproc_property_info[0].preproc_property[2].preproc_set[set_order].missing_data;

                                /**
                                 * 만약 0개일때는 제외된 테이블을 생성하도록 하지 않는 경우
                                 * */
                                let statusMessage = `총 ${data_list.length}개의 데이터에서 ${missing_data.length}개의 결측치가 존재합니다.`;
                                if (statusMessage) {
                                    preProcessMakeHTMLExcludeDataTable('#preprocTableExcludeRangeMissing', 'missingDataTableExcludeRange', header_list, missing_data, statusMessage, function (wrapper, headers, datas) {
                                        console.log('wrapper', wrapper);
                                        console.log('preProcessMakeHTMLExcludeDataTable is completed');
                                        $('#missingDataTableExcludeRange').DataTable({
                                            scrollX: true,
                                            columnDefs: [{
                                                targets: '_all', className: 'text-nowrap'
                                            }],
                                            order: [[0, "asc"]],
                                            searching: false,
                                            info: false,
                                            lengthChange: false,
                                            autoWidth: true,
                                            lengthMenu: [[10], [10]],
                                            initComplete: function (settings, json) {
                                                console.log('DataTable has finished its initialisation.');
                                                wrapper.parentElement.style.display = 'block';
                                            }
                                        });
                                    }, true);
                                }

                                let preprocTableRangeMissing = document.querySelector('#preprocTableRangeMissing');
                                preprocTableRangeMissing.style.display = 'block';
                                preprocTableRangeMissing.innerHTML = '';

                                /**
                                 * 테이블 헤더 만들기
                                 * */
                                let newHeaderList = []
                                newHeaderList.push(data.index_trgt_col);
                                let dateIndex = 0;
                                header_list.forEach(function (header, index) {
                                    if (header !== data.index_trgt_col) {
                                        newHeaderList.push(header);
                                        newHeaderList.push(header + ' BEFORE');
                                    } else {
                                        dateIndex = index;
                                    }
                                });

                                /**
                                 * 테이블 데이터 만들기
                                 * */
                                let newDataList = [];
                                let orders = [];
                                newHeaderList.forEach(function (header, index) {
                                    if (index === 0) {
                                        orders.push(index);
                                    } else {
                                        orders.push('asc');
                                    }
                                });
                                console.log('newHeaderList', newHeaderList, 'newDataList', newDataList);
                                newDataList = [];
                                makeDataTableHTML(newHeaderList, newDataList, preprocTableRangeMissing, 'interpolateDataTableRange', function (table) {
                                    $(table).DataTable({
                                        scrollX: true,
                                        searching: false,
                                        searchable: false,
                                        info: false,
                                        bServerSide: true,
                                        ajax: {
                                            url: "/datatable/server/render/interpolate",
                                            type: "POST",
                                            dataType: "json",
                                            data: function (data) {
                                                data.file_name = result.file_name;
                                                data.file_path = result.file_path;
                                                data.target_row_count = 0;
                                                return JSON.stringify(data);
                                            }
                                        },
                                        lengthChange: false,
                                        autoWidth: true,
                                        deferRender: true,
                                        destroy: true,
                                        createdRow: function (row, data, dataIndex) {
                                            let targetIndex = 0;
                                            //조건 검사
                                            let isExist = false;
                                            if (data.length !== 0) {
                                                //Row의 날짜 컬럼 데이터
                                                let dateStr = data[targetIndex];
                                                //비교 검사 (BEFORE 전용)
                                                let originRow;
                                                for (let i = 0; i < missing_data.length; i++) {
                                                    //돌리는 날짜와 오리진 리스트의 날짜가 같은게 있다면
                                                    if (extractAndConvertToLong(dateStr) === extractAndConvertToLong(missing_data[i][targetIndex])) {
                                                        originRow = missing_data[i];
                                                        isExist = true;
                                                        break;
                                                    }
                                                }

                                                if (originRow) {
                                                    let count = 1;
                                                    data.forEach(function (value, index) {
                                                        if (index !== targetIndex && index % 2 === 0) {
                                                            data[index] = originRow[count];
                                                            $('td', row).eq(index).text(originRow[count++]);
                                                        }
                                                    });
                                                } else {
                                                    //매칭되는 ROW 없음 그대로 로직 전개
                                                }
                                                if (isExist) $(row).addClass('active');
                                            } else {
                                                console.error('$(\'#interpolateDataTableRange\').DataTable({}) createdRow data is 0');
                                            }
                                        }
                                    });
                                });

                                let base_file_path = preProcData.preproc_property_info[0].base_dir;
                                let base_file_nm = preProcData.preproc_property_info[0].last_step_preproc_file_nm;
                                let index_trgt_col = preProcData.preproc_property_info[0].index_trgt_col;
                                closeProgressBar({element: null, process_id: 'process-41'});
                                let form_type = $('#formType').val();
                                getPreprocessTargetDataSetInfo(base_file_path, base_file_nm, index_trgt_col, form_type, 'interpolate', false, function (data) {
                                    console.log('getPreprocessTargetDataSetInfo', JSON.parse(data));
                                    makePropertyListHtml();
                                });
                            } else {
                                closeProgressBar({element: null, process_id: 'process-41'});
                                if (result.result_code === -100) {
                                    let errorModal = document.querySelector('#errorModal');
                                    if (errorModal) {
                                        let errTpElement = errorModal.querySelector('#errTp');
                                        let errCdElement = errorModal.querySelector('#errCd');
                                        let errNmElement = errorModal.querySelector('#errNm');
                                        let errLctElement = errorModal.querySelector('#errLct');
                                        let errCnElement = errorModal.querySelector('#errCn');
                                        let errRegDtElement = errorModal.querySelector('#errRegDt');

                                        errTpElement.innerHTML = `${result.errTp}`;
                                        errCdElement.innerHTML = `${result.errCd}`;
                                        errNmElement.innerHTML = `${result.errNm}`;
                                        errLctElement.innerHTML = `${result.errLct}`;
                                        errCnElement.innerHTML = `${result.errCn}`;
                                        errRegDtElement.innerHTML = `${result.errRegDt}`;

                                        if (!errorModal.classList.contains('is-open')) {
                                            errorModal.classList.add('is-open');
                                        }
                                    } else {
                                        console.error('errorModal could not find');
                                        alert('에러가 발생하였습니다. 관리자에게 문의해주세요.');
                                    }
                                } else {
                                    console.error('errorModal could not find');
                                    alert('에러가 발생하였습니다. 관리자에게 문의해주세요.');
                                }
                            }
                        },
                        error: function (xhr, status, error) {
                            console.error('error : ', error);
                            closeProgressBar({element: null, process_id: 'process-41'});
                            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                        }
                    });
                } else {
                    showProgressBar({element: null, process_id: 'process-41'});
                    $.ajax({
                        type: "POST",
                        url: '/dt/model/make/interpolate_set',
                        data: JSON.stringify(data),
                        contentType: "application/json; charset=utf-8;",
                        dataType: "json",
                        success: function (result) {
                            if (result.code === 200) {
                                let template = interpolateTemplate();
                                template.set_order = set_order + 1;
                                template.trgt_file_nm = result.param.target_file_name;
                                template.interpl_tp = interpolate_option;
                                template.interpl_target = result.param.interpolate_target;
                                template.interpl_features = result.param.features;

                                var preProcData = JSON.parse($('#preprocProPerty').val());

                                template.missing_data = [];
                                let missing_count = 0;
                                //보간 데이터 보여주는 작업 Validate 부분 합산
                                if (preProcData.preproc_property_info[0].preproc_property[0].preproc_set && preProcData.preproc_property_info[0].preproc_property[0].preproc_set.length !== 0) {
                                    console.log('preProcData.preproc_property_info[0].preproc_property[0].preproc_set', preProcData.preproc_property_info[0].preproc_property[0].preproc_set);
                                    preProcData.preproc_property_info[0].preproc_property[0].preproc_set.forEach((property) => {
                                        try {
                                            missing_count += parseInt(property.validate_count);
                                        } catch (e) {
                                            missing_count = 0;
                                            console.error(e);
                                            alert('데이터의 정합성이 일치하지 않습니다.');
                                            return;
                                        }
                                        template.missing_data = [...template.missing_data, ...property.validate_data];
                                    });
                                }

                                //보간 데이터 보여주는 작업 Outlier 부분 합산
                                if (preProcData.preproc_property_info[0].preproc_property[1].preproc_set && preProcData.preproc_property_info[0].preproc_property[1].preproc_set.length !== 0) {
                                    console.log('preProcData.preproc_property_info[0].preproc_property[1].preproc_set', preProcData.preproc_property_info[0].preproc_property[1].preproc_set);
                                    preProcData.preproc_property_info[0].preproc_property[1].preproc_set.forEach((property) => {
                                        try {
                                            missing_count += parseInt(property.outlier_count);
                                        } catch (e) {
                                            missing_count = 0;
                                            console.error(e);
                                            alert('데이터의 정합성이 일치하지 않습니다.');
                                            return;
                                        }
                                        template.missing_data = [...template.missing_data, ...property.outlier_data];
                                    });
                                }
                                template.row_count = preProcData.preproc_property_info[0].target_row_count;
                                template.missing_count = missing_count;
                                preProcData.preproc_property_info[0].preproc_property[2].preproc_set[set_order] = template;
                                preProcData.preproc_property_info[0].last_step_preproc_file_nm = result.param.target_file_name;

                                $('#preprocProPerty').val(JSON.stringify(preProcData));
                                $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));

                                var header_list = result.header_list;
                                var data_list = result.data_list;
                                let missing_data = preProcData.preproc_property_info[0].preproc_property[2].preproc_set[set_order].missing_data;

                                /**
                                 * 만약 0개일때는 제외된 테이블을 생성하도록 하지 않는 경우
                                 * */
                                let statusMessage = `총 ${data_list.length}개의 데이터에서 ${missing_data.length}개의 결측치가 존재합니다.`;
                                if (statusMessage) {
                                    preProcessMakeHTMLExcludeDataTable('#preprocTableExcludeRangeMissing', 'missingDataTableExcludeRange', header_list, missing_data, statusMessage, function (wrapper, headers, datas) {
                                        console.log('wrapper', wrapper);
                                        console.log('preProcessMakeHTMLExcludeDataTable is completed');
                                        $('#missingDataTableExcludeRange').DataTable({
                                            scrollX: true,
                                            columnDefs: [{
                                                targets: '_all', className: 'text-nowrap'
                                            }],
                                            order: [[0, "asc"]],
                                            searching: false,
                                            info: false,
                                            lengthChange: false,
                                            autoWidth: true,
                                            lengthMenu: [[10], [10]],
                                            initComplete: function (settings, json) {
                                                console.log('DataTable has finished its initialisation.');
                                                wrapper.parentElement.style.display = 'block';
                                            }
                                        });
                                    }, true);
                                }

                                let preprocTableRangeMissing = document.querySelector('#preprocTableRangeMissing');
                                preprocTableRangeMissing.style.display = 'block';
                                preprocTableRangeMissing.innerHTML = '';

                                /**
                                 * 테이블 헤더 만들기
                                 * */
                                let newHeaderList = []
                                newHeaderList.push(data.index_trgt_col);
                                let dateIndex = 0;
                                header_list.forEach(function (header, index) {
                                    if (header !== data.index_trgt_col) {
                                        newHeaderList.push(header);
                                        newHeaderList.push(header + ' BEFORE');
                                    } else {
                                        dateIndex = index;
                                    }
                                });

                                /**
                                 * 테이블 데이터 만들기
                                 * */
                                let newDataList = [];
                                let orders = [];
                                newHeaderList.forEach(function (header, index) {
                                    if (index === 0) {
                                        orders.push(index);
                                    } else {
                                        orders.push('asc');
                                    }
                                });
                                newDataList = [];
                                makeDataTableHTML(newHeaderList, newDataList, preprocTableRangeMissing, 'interpolateDataTableRange', function (table) {
                                    $(table).DataTable({
                                        scrollX: true,
                                        columnDefs: [{
                                            targets: '_all', className: 'text-nowrap', searching: false,
                                        }],
                                        order: [orders],
                                        searching: false,
                                        info: false,
                                        bServerSide: true,
                                        ajax: {
                                            url: "/datatable/server/render/interpolate",
                                            type: "POST",
                                            dataType: "json",
                                            data: function (data) {
                                                data.file_name = result.file_name;
                                                data.file_path = result.file_path;
                                                data.target_row_count = 0;
                                                return JSON.stringify(data);
                                            }
                                        },
                                        lengthChange: false,
                                        autoWidth: true,
                                        lengthMenu: [[10], [10]],
                                        deferRender: true,
                                        destroy: true,
                                        createdRow: function (row, data, dataIndex) {
                                            let targetIndex = 0;
                                            //조건 검사
                                            let isExist = false;
                                            if (data.length !== 0) {
                                                //Row의 날짜 컬럼 데이터
                                                let dateStr = data[targetIndex];
                                                //비교 검사 (BEFORE 전용)
                                                let originRow;
                                                for (let i = 0; i < missing_data.length; i++) {
                                                    //돌리는 날짜와 오리진 리스트의 날짜가 같은게 있다면
                                                    if (extractAndConvertToLong(dateStr) === extractAndConvertToLong(missing_data[i][targetIndex])) {
                                                        originRow = missing_data[i];
                                                        isExist = true;
                                                        break;
                                                    }
                                                }

                                                if (originRow) {
                                                    let count = 1;
                                                    data.forEach(function (value, index) {
                                                        if (index !== targetIndex && index % 2 === 0) {
                                                            data[index] = originRow[count];
                                                            $('td', row).eq(index).text(originRow[count++]);
                                                        }
                                                    });
                                                } else {
                                                    //매칭되는 ROW 없음 그대로 로직 전개
                                                }
                                                if (isExist) $(row).addClass('active');
                                            } else {
                                                console.error('$(\'#interpolateDataTableRange\').DataTable({}) createdRow data is 0');
                                            }
                                        }
                                    });
                                });
                                closeProgressBar({element: null, process_id: 'process-41'});

                                let base_file_path = preProcData.preproc_property_info[0].base_dir;
                                let base_file_nm = preProcData.preproc_property_info[0].last_step_preproc_file_nm;
                                let index_trgt_col = preProcData.preproc_property_info[0].index_trgt_col;
                                let form_type = $('#formType').val();
                                getPreprocessTargetDataSetInfo(base_file_path, base_file_nm, index_trgt_col, form_type, 'interpolate', false, function (data) {
                                    console.log('getPreprocessTargetDataSetInfo', JSON.parse(data));
                                    makePropertyListHtml();
                                });
                            } else {
                                closeProgressBar({element: null, process_id: 'process-41'});
                                if (result.result_code === -100) {
                                    let errorModal = document.querySelector('#errorModal');
                                    if (errorModal) {
                                        let errTpElement = errorModal.querySelector('#errTp');
                                        let errCdElement = errorModal.querySelector('#errCd');
                                        let errNmElement = errorModal.querySelector('#errNm');
                                        let errLctElement = errorModal.querySelector('#errLct');
                                        let errCnElement = errorModal.querySelector('#errCn');
                                        let errRegDtElement = errorModal.querySelector('#errRegDt');

                                        errTpElement.innerHTML = `${result.errTp}`;
                                        errCdElement.innerHTML = `${result.errCd}`;
                                        errNmElement.innerHTML = `${result.errNm}`;
                                        errLctElement.innerHTML = `${result.errLct}`;
                                        errCnElement.innerHTML = `${result.errCn}`;
                                        errRegDtElement.innerHTML = `${result.errRegDt}`;

                                        if (!errorModal.classList.contains('is-open')) {
                                            errorModal.classList.add('is-open');
                                        }
                                    } else {
                                        console.error('errorModal could not find');
                                        alert('에러가 발생하였습니다. 관리자에게 문의해주세요.');
                                    }
                                } else {
                                    console.error('errorModal could not find');
                                    alert('에러가 발생하였습니다. 관리자에게 문의해주세요.');
                                }
                            }
                        },
                        error: function (xhr, status, error) {
                            console.error('error : ', error);
                            closeProgressBar({element: null, process_id: 'process-41'});
                            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                        }
                    });
                }
            } else {
                let preprocTableRangeMissing = document.querySelector('#preprocTableRangeMissing');
                preprocTableRangeMissing.style.display = 'block';
                preprocTableRangeMissing.innerHTML = '';
            }
        });

        $(document).on('click', '.btn-make-resample', function () {
            resetProcess({preprocOrder: 4, setOrder: 1});
            let preProcData = JSON.parse($('#preprocProPerty').val());
            let index_target_col = preProcData.preproc_property_info[0].index_trgt_col;
            let file_path = preProcData.preproc_property_info[0].base_dir;
            let selectResample = document.querySelector('#select_resample');
            let selectDropdownBox = selectResample.closest('.dropdown-box');
            let selectedInput = selectDropdownBox.querySelector(`ul.option-list > li > input[value="${selectResample.dataset.value}"]`);
            let selectedLabel = selectDropdownBox.querySelector(`ul.option-list > li > label[for="${selectedInput.id}"]`);

            let resmpl_tp = selectedInput.value;
            let resmpl_tp_nm = selectedLabel.textContent;
            let resmpl_intvl_value = $('.resmpl_intvl_value').val();

            let file_name = preProcData.preproc_property_info[0].last_step_preproc_file_nm;
            let target_file;

            let resampel_first_check = $('#resampel_first_check').val();
            if (resampel_first_check === 'N') {
                target_file = file_name;
            } else {
                target_file = preProcData.preproc_property_info[0].last_step_preproc_file_nm;
            }
            if (resmpl_tp !== 'O') {
                if (resmpl_intvl_value.length === 0) {
                    alert('데이터 간격 수치는 0이 될 수 없습니다.');
                    return;
                }
                let data = {
                    resmpl_tp: resmpl_tp,
                    resmpl_intvl_value: resmpl_intvl_value,
                    index_trgt_col: index_target_col,
                    file_path: file_path,
                    file_name: target_file
                }

                /**
                 * 2024-08-26 DECISION TREE Interval Conversion 로직 수행 할 때
                 * */
                    //files가 있다면 decisionTree가 적용된 전처리
                let decisionPreProcSet = findDecisionPreProcSet(preProcData);
                if (decisionPreProcSet) {
                    data.decision = {
                        model_file_path: decisionPreProcSet.interpl_decision_model_file_path,
                        model_file_name: decisionPreProcSet.interpl_decision_model_file_name,
                        decision_file_name: decisionPreProcSet.trgt_file_nm,
                        outputs: decisionPreProcSet.interpl_outputs,
                        feature: decisionPreProcSet.interpl_feature,
                        labels: decisionPreProcSet.interpl_labels,
                        index_column: preProcData.preproc_property_info[0].index_trgt_col
                    }
                    $.ajax({
                        type: "POST",
                        url: '/dt/model/make/resample_set',
                        data: JSON.stringify(data),
                        contentType: "application/json; charset=utf-8;",
                        dataType: "json",
                        beforeSend: function () {
                            let wrap_loading = document.querySelector('.wrap-loading');
                            if (wrap_loading.classList.contains('display-none')) {
                                wrap_loading.classList.remove('display-none');
                            }
                        },
                        complete: function () {
                            let wrap_loading = document.querySelector('.wrap-loading');
                            if (!wrap_loading.classList.contains('display-none')) {
                                wrap_loading.classList.add('display-none');
                            }
                        },
                        success: function (result) {
                            if (result.code === 200) {
                                var text = JSON.parse(result.data);
                                var template = resampleTemplate();
                                //console.log(result);
                                var set_order = 0

                                let header_list = result.header_list;
                                let data_list = result.data_list;
                                let prev_header_list = result.prev_header_list;
                                let prev_data_list = result.prev_data_list;
                                let added_data_list = result.added_data;
                                let removed_data_list = result.removed_data;
                                template.set_order = 1;
                                template.trgt_file_nm = result.param.target_file_name;
                                template.resmpl_tp = resmpl_tp;
                                template.resmpl_tp_nm = resmpl_tp_nm;
                                template.resmpl_intvl_value = resmpl_intvl_value;

                                template.resmpl_removed_data = removed_data_list;
                                template.resmpl_added_data = added_data_list;

                                template.resmpl_removed_count = removed_data_list.length;
                                template.resmpl_added_count = added_data_list.length;
                                template.resmpl_count = data_list.length;

                                var preProcData = JSON.parse($('#preprocProPerty').val());
                                preProcData.preproc_property_info[0].preproc_property[3].preproc_set[0] = [];
                                template.row_count = preProcData.preproc_property_info[0].target_row_count;
                                preProcData.preproc_property_info[0].preproc_property[3].preproc_set[0] = template;
                                preProcData.preproc_property_info[0].last_step_preproc_file_nm = result.param.target_file_name;

                                $('#preprocProPerty').val(JSON.stringify(preProcData));
                                $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));

                                /**
                                 * Resample로직은 추가와 유지 삭제가 동시에 일어나기 떄문에 추가건과 삭제건을 둘다 보여준다.
                                 * */

                                let addedStatusMessage = `총 ${prev_data_list.length}건에서 ${added_data_list.length}건이 추가되었습니다.`;
                                preProcessMakeHTMLExcludeDataTable('#preprocTableExcludeAddedRangeResample', 'resampleDataTableAddedExcludeRange', header_list, added_data_list, addedStatusMessage, function (wrapper, headers, datas) {
                                    console.log('wrapper', wrapper);
                                    console.log('preProcessMakeHTMLExcludeDataTable is completed');
                                    $('#resampleDataTableAddedExcludeRange').DataTable({
                                        scrollX: true,
                                        columnDefs: [{
                                            targets: '_all', className: 'text-nowrap'
                                        }],
                                        order: [[0, "asc"]],
                                        searching: false,
                                        info: false,
                                        lengthChange: false,
                                        autoWidth: true,
                                        lengthMenu: [[10], [10]],
                                        initComplete: function (settings, json) {
                                            console.log('DataTable has finished its initialisation.');
                                            wrapper.parentElement.style.display = 'block';
                                        }
                                    });
                                }, true);

                                let removedStatusMessage = `총 ${prev_data_list.length}건에서 ${removed_data_list.length}건이 삭제되었습니다.`;
                                preProcessMakeHTMLExcludeDataTable('#preprocTableExcludeRemovedRangeResample', 'resampleDataTableRemovedExcludeRange', header_list, removed_data_list, removedStatusMessage, function (wrapper, headers, datas) {
                                    console.log('wrapper', wrapper);
                                    console.log('preProcessMakeHTMLExcludeDataTable is completed');
                                    $('#resampleDataTableRemovedExcludeRange').DataTable({
                                        scrollX: true,
                                        columnDefs: [{
                                            targets: '_all', className: 'text-nowrap'
                                        }],
                                        order: [[0, "asc"]],
                                        searching: false,
                                        info: false,
                                        lengthChange: false,
                                        autoWidth: true,
                                        lengthMenu: [[10], [10]],
                                        initComplete: function (settings, json) {
                                            console.log('DataTable has finished its initialisation.');
                                            wrapper.parentElement.style.display = 'block';
                                        }
                                    });
                                }, true);

                                let preprocTableRangeResample = document.querySelector('#preprocTableRangeResample');
                                preprocTableRangeResample.innerHTMl = '';
                                preprocTableRangeResample.style.display = 'block';
                                data_list = [];
                                makeDataTableHTML(header_list, data_list, preprocTableRangeResample, 'resampleDataTableRange', function (table) {
                                    $(table).DataTable({
                                        scrollX: true,
                                        columnDefs: [{
                                            targets: '_all', className: 'text-nowrap', searchable: false
                                        }],
                                        order: [[0, "asc"]],
                                        searching: false,
                                        info: false,
                                        bServerSide: true,
                                        ajax: {
                                            url: "/datatable/server/render/resample",
                                            type: "POST",
                                            dataType: "json",
                                            data: function (data) {
                                                data.file_name = result.file_name;
                                                data.file_path = result.file_path;
                                                data.target_row_count = 0;
                                                return JSON.stringify(data);
                                            }
                                        },
                                        lengthChange: false,
                                        autoWidth: false,
                                        lengthMenu: [[10], [10]],
                                        deferRender: true,
                                        destroy: true
                                    });
                                });
                                makePropertyListHtml();
                                $('#resampel_first_check').val('Y');

                                /**
                                 * 데이터 간격 체크
                                 * */
                                let select_origin_term = document.querySelector('#select_origin_term');
                                select_origin_term.dataset.type = '분명';
                                select_origin_term.innerHTML = '분명';
                                select_origin_term.style.fontSize = '13px';
                                select_origin_term.style.color = select_origin_term.dataset.type === '불분명' ? 'red' : '#000000';
                            } else {
                                if (result.result_code === -100) {
                                    let errorModal = document.querySelector('#errorModal');
                                    if (errorModal) {
                                        let errTpElement = errorModal.querySelector('#errTp');
                                        let errCdElement = errorModal.querySelector('#errCd');
                                        let errNmElement = errorModal.querySelector('#errNm');
                                        let errLctElement = errorModal.querySelector('#errLct');
                                        let errCnElement = errorModal.querySelector('#errCn');
                                        let errRegDtElement = errorModal.querySelector('#errRegDt');

                                        errTpElement.innerHTML = `${result.errTp}`;
                                        errCdElement.innerHTML = `${result.errCd}`;
                                        errNmElement.innerHTML = `${result.errNm}`;
                                        errLctElement.innerHTML = `${result.errLct}`;
                                        errCnElement.innerHTML = `${result.errCn}`;
                                        errRegDtElement.innerHTML = `${result.errRegDt}`;

                                        if (!errorModal.classList.contains('is-open')) {
                                            errorModal.classList.add('is-open');
                                        }
                                    } else {
                                        console.error('errorModal could not find');
                                        alert('에러가 발생하였습니다. 관리자에게 문의해주세요.');
                                    }
                                } else {
                                    console.error('errorModal could not find');
                                    alert('에러가 발생하였습니다. 관리자에게 문의해주세요.');
                                }
                            }
                        },
                        error: function (xhr, status, error) {
                            console.error('error : ', error);
                            let wrap_loading = document.querySelector('.wrap-loading');
                            if (!wrap_loading.classList.contains('display-none')) {
                                wrap_loading.classList.add('display-none');
                            }
                            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                        }
                    });
                } else {
                    $.ajax({
                        type: "POST",
                        url: '/dt/model/make/resample_set',
                        data: JSON.stringify(data),
                        contentType: "application/json; charset=utf-8;",
                        dataType: "json",
                        beforeSend: function () {
                            let wrap_loading = document.querySelector('.wrap-loading');
                            if (wrap_loading.classList.contains('display-none')) {
                                wrap_loading.classList.remove('display-none');
                            }
                        },
                        complete: function () {
                            let wrap_loading = document.querySelector('.wrap-loading');
                            if (!wrap_loading.classList.contains('display-none')) {
                                wrap_loading.classList.add('display-none');
                            }
                        },
                        success: function (result) {
                            if (result.code === 200) {
                                var text = JSON.parse(result.data);
                                var template = resampleTemplate();
                                //console.log(result);
                                var set_order = 0

                                let header_list = result.header_list;
                                let data_list = result.data_list;
                                let prev_header_list = result.prev_header_list;
                                let prev_data_list = result.prev_data_list;
                                let added_data_list = result.added_data;
                                let removed_data_list = result.removed_data;
                                template.set_order = 1;
                                template.trgt_file_nm = result.param.target_file_name;
                                template.resmpl_tp = resmpl_tp;
                                template.resmpl_tp_nm = resmpl_tp_nm;
                                template.resmpl_intvl_value = resmpl_intvl_value;

                                template.resmpl_removed_data = removed_data_list;
                                template.resmpl_added_data = added_data_list;

                                template.resmpl_removed_count = removed_data_list.length;
                                template.resmpl_added_count = added_data_list.length;
                                template.resmpl_count = data_list.length;

                                var preProcData = JSON.parse($('#preprocProPerty').val());
                                preProcData.preproc_property_info[0].preproc_property[3].preproc_set[0] = [];
                                template.row_count = preProcData.preproc_property_info[0].target_row_count;
                                preProcData.preproc_property_info[0].preproc_property[3].preproc_set[0] = template;
                                preProcData.preproc_property_info[0].last_step_preproc_file_nm = result.param.target_file_name;

                                $('#preprocProPerty').val(JSON.stringify(preProcData));
                                $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));

                                /**
                                 * Resample로직은 추가와 유지 삭제가 동시에 일어나기 떄문에 추가건과 삭제건을 둘다 보여준다.
                                 * */

                                let addedStatusMessage = `총 ${prev_data_list.length}건에서 ${added_data_list.length}건이 추가되었습니다.`;
                                preProcessMakeHTMLExcludeDataTable('#preprocTableExcludeAddedRangeResample', 'resampleDataTableAddedExcludeRange', header_list, added_data_list, addedStatusMessage, function (wrapper, headers, datas) {
                                    console.log('wrapper', wrapper);
                                    console.log('preProcessMakeHTMLExcludeDataTable is completed');
                                    $('#resampleDataTableAddedExcludeRange').DataTable({
                                        scrollX: true,
                                        columnDefs: [{
                                            targets: '_all', className: 'text-nowrap'
                                        }],
                                        order: [[0, "asc"]],
                                        searching: false,
                                        info: false,
                                        lengthChange: false,
                                        autoWidth: true,
                                        lengthMenu: [[10], [10]],
                                        initComplete: function (settings, json) {
                                            console.log('DataTable has finished its initialisation.');
                                            wrapper.parentElement.style.display = 'block';
                                        }
                                    });
                                }, true);

                                let removedStatusMessage = `총 ${prev_data_list.length}건에서 ${removed_data_list.length}건이 삭제되었습니다.`;
                                preProcessMakeHTMLExcludeDataTable('#preprocTableExcludeRemovedRangeResample', 'resampleDataTableRemovedExcludeRange', header_list, removed_data_list, removedStatusMessage, function (wrapper, headers, datas) {
                                    console.log('wrapper', wrapper);
                                    console.log('preProcessMakeHTMLExcludeDataTable is completed');
                                    $('#resampleDataTableRemovedExcludeRange').DataTable({
                                        scrollX: true,
                                        columnDefs: [{
                                            targets: '_all', className: 'text-nowrap'
                                        }],
                                        order: [[0, "asc"]],
                                        searching: false,
                                        info: false,
                                        lengthChange: false,
                                        autoWidth: true,
                                        lengthMenu: [[10], [10]],
                                        initComplete: function (settings, json) {
                                            console.log('DataTable has finished its initialisation.');
                                            wrapper.parentElement.style.display = 'block';
                                        }
                                    });
                                }, true);

                                let preprocTableRangeResample = document.querySelector('#preprocTableRangeResample');
                                preprocTableRangeResample.innerHTMl = '';
                                preprocTableRangeResample.style.display = 'block';
                                data_list = [];
                                makeDataTableHTML(header_list, data_list, preprocTableRangeResample, 'resampleDataTableRange', function (table) {
                                    $(table).DataTable({
                                        scrollX: true,
                                        columnDefs: [{
                                            targets: '_all', className: 'text-nowrap', searchable: false
                                        }],
                                        order: [[0, "asc"]],
                                        searching: false,
                                        info: false,
                                        bServerSide: true,
                                        ajax: {
                                            url: "/datatable/server/render/resample",
                                            type: "POST",
                                            dataType: "json",
                                            data: function (data) {
                                                data.file_name = result.file_name;
                                                data.file_path = result.file_path;
                                                data.target_row_count = 0;
                                                return JSON.stringify(data);
                                            }
                                        },
                                        lengthChange: false,
                                        autoWidth: false,
                                        lengthMenu: [[10], [10]],
                                        deferRender: true,
                                        destroy: true
                                    });
                                });
                                makePropertyListHtml();
                                $('#resampel_first_check').val('Y');

                                /**
                                 * 데이터 간격 체크
                                 * */
                                let select_origin_term = document.querySelector('#select_origin_term');
                                select_origin_term.dataset.type = '분명';
                                select_origin_term.innerHTML = '분명';
                                select_origin_term.style.fontSize = '13px';
                                select_origin_term.style.color = select_origin_term.dataset.type === '불분명' ? 'red' : '#000000';
                            } else {
                                if (result.result_code === -100) {
                                    let errorModal = document.querySelector('#errorModal');
                                    if (errorModal) {
                                        let errTpElement = errorModal.querySelector('#errTp');
                                        let errCdElement = errorModal.querySelector('#errCd');
                                        let errNmElement = errorModal.querySelector('#errNm');
                                        let errLctElement = errorModal.querySelector('#errLct');
                                        let errCnElement = errorModal.querySelector('#errCn');
                                        let errRegDtElement = errorModal.querySelector('#errRegDt');

                                        errTpElement.innerHTML = `${result.errTp}`;
                                        errCdElement.innerHTML = `${result.errCd}`;
                                        errNmElement.innerHTML = `${result.errNm}`;
                                        errLctElement.innerHTML = `${result.errLct}`;
                                        errCnElement.innerHTML = `${result.errCn}`;
                                        errRegDtElement.innerHTML = `${result.errRegDt}`;

                                        if (!errorModal.classList.contains('is-open')) {
                                            errorModal.classList.add('is-open');
                                        }
                                    } else {
                                        console.error('errorModal could not find');
                                        alert('에러가 발생하였습니다. 관리자에게 문의해주세요.');
                                    }
                                } else {
                                    console.error('errorModal could not find');
                                    alert('에러가 발생하였습니다. 관리자에게 문의해주세요.');
                                }
                            }
                        },
                        error: function (xhr, status, error) {
                            console.error('error : ', error);
                            let wrap_loading = document.querySelector('.wrap-loading');
                            if (!wrap_loading.classList.contains('display-none')) {
                                wrap_loading.classList.add('display-none');
                            }
                            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                        }
                    });
                }
            } else {
                alert('현재 상태 유지를 선택하셨습니다.');
            }
        });

        $(document).on('click', '.next-model-step', function () {
            var con = confirm('모델을 생성 단계로 이동 하시겠습니까?');
            if (con === true) {
                var preProcData = JSON.parse($('#preprocProPerty').val());
                console.log('preProcData', preProcData);
                goModelProperty(preProcData);
            } else {
                var con1 = confirm('전처리 모델이 생성 됩니다.');
                if (con1 === true) {
                    var preProcData = JSON.parse($('#preprocProPerty').val());
                    console.log('preProcData', preProcData);
                    savePreproc(preProcData);
                }
            }

        });

        /**
         * 각 이벤트 설정
         * 등록 할 때 Outlier 수치 변경 버튼에 대한 이벤트
         * 각 부분은 컬럼을 선택했을 때와 동일하게 작동한다.
         * */
        let btn_change_standard = document.querySelector('#btn_change_standard');
        btn_change_standard?.addEventListener('click', function (event) {
            console.log('btn_change_standard event', event);
            reInitializeOutlierExecute();
        });

        let btn_change_kmean = document.querySelector('#btn_change_kmean');
        btn_change_kmean?.addEventListener('click', function (event) {
            console.log('btn_change_kmean event', event);
            reInitializeOutlierExecute();
        });

        let btn_change_dbscan = document.querySelector('#btn_change_dbscan');
        btn_change_dbscan?.addEventListener('click', function (event) {
            console.log('btn_change_dbscan event', event);
            reInitializeOutlierExecute();
        });

        let btn_change_threshold = document.querySelector('#btn_change_threshold');
        btn_change_threshold?.addEventListener('click', function (event) {
            console.log('btn_change_threshold event', event);
            reInitializeOutlierExecute();
        });

        let restrictMaxInput = document.querySelector('input[data-event-validate-max]')
        restrictMaxInput?.addEventListener('keyup', function (event) {
            let input = this;
            let max = input.dataset.eventValidateMax;
            let value = input.value;
            try {
                max = parseInt(max);
                if (parseInt(value) > max) {
                    input.value = max;
                }
                if (parseInt(value) <= 0) {
                    input.value = 1;
                }
            } catch (error) {
                console.error(error);
            }
        });
    });
})();

function reInitializeOutlierExecute() {
    let selectOutlierOption = document.querySelector('#select_outlier_option');
    let outlier_type = selectOutlierOption.dataset.value;
    let outlierTargetColOption = document.querySelector('#select_outlier_target_col');
    let outlier_target_col = outlierTargetColOption.dataset.value;
    let etc_model_seq;

    switch (outlier_type) {
        case '0': {
            outlier_type = '0';
            alert('이상치 처리 옵션을 먼저 선택해 주세요');
            $("#select_outlier_target_col option:eq(0)").prop("selected", true);
            return false;
            break;
        }
        case 'standard': {
            outlier_type = 'standard';
            break;
        }
        case 'kmean': {
            outlier_type = 'kmean';
            break;
        }
        case 'dbscan': {
            outlier_type = 'dbscan';
            break;
        }
        default: {
            const [etc_model_tp, etc_model_temp_seq, trgt_col, window_sz] = selectOutlierOption.dataset.data?.split('|').map(item => item.trim());
            outlier_type = etc_model_tp;
            etc_model_seq = etc_model_temp_seq;
        }
    }

    if (outlier_type === '0' || outlier_type === 0) {
        alert('이상치 처리 옵션을 먼저 선택해 주세요');
        return false;
    }

    if (outlier_target_col === '0' || outlier_target_col === 0) {
        alert('컬럼을 선택해주세요.');
        return false;
    }
    let freq_selector;
    hideGraphViewGroup([5, 6, 7]);
    switch (outlier_type) {
        case 'standard': {
            freq_selector = '#outlier_standard_range';
            showGraphViewGroup([5]);
            break;
        }
        case 'kmean': {
            freq_selector = '#outlier_kmean_range';
            showGraphViewGroup([6]);
            break;
        }
        case 'dbscan': {
            freq_selector = '#outlier_dbscan_range';
            showGraphViewGroup([7]);
            break;
        }
        case 'autoencoder':
        case 'auto encoder':
        case 'AUTOENCODER':
        case 'AUTO ENCODER': {
            showGraphViewGroup([7]);
            break;
        }
    }
    let freq = 0;
    if (freq_selector) {
        try {
            freq = parseInt(document.querySelector(`${freq_selector} #freq`).value);
        } catch (e) {
            alert('샘플링 길이를 올바르게 설정해주세요.');
            return false;
        }
    } else {
        //autoencoder
    }
    let p_value = $('#p_value').val();
    /**
     * -------------------------
     *  2025-08-18, Outlier STANDARD 옵션 버그 수정
     * -------------------------
     * */
    if (p_value < 0.05) {
        alert('정규분포 경계(p-value)는 0.05 이상이어야 합니다.');
        return false;
    }

    let eps = $('#eps').val();
    let min_samples = $('#min_samples').val();

    let preProcData = JSON.parse($('#preprocProPerty').val());
    let index_target_col = preProcData.preproc_property_info[0].index_trgt_col;
    let file_path = preProcData.preproc_property_info[0].base_dir;
    let target_row_count = preProcData.preproc_property_info[0].target_row_count;
    let file_name = preProcData.preproc_property_info[0].last_step_preproc_file_nm;
    let params = {
        outlier_type: outlier_type || null,
        file_path: file_path || null,
        file_name: file_name || null,
        outlier_target_col: outlier_target_col || null,
        index_target_col: index_target_col || null,
        freq: freq || null,
        p_value: p_value || null,
        eps: eps || null,
        min_samples: min_samples || null,
        n_clusters: null,
        window_size: null,
        threshold: null,
        etc_model_seq: etc_model_seq || null,
        target_row_count: target_row_count
    };
    if (outlier_type === 'kmean') {
        var n_clusters = $('#n_clusters').val();
        let n_count = $('#n_count').val();
        if (n_clusters === '') {
            alert('클러스터 수에 숫자값을 입력해주세요.');
            return false;
        }
        try {
            let parsedNClusters = parseInt(n_clusters);
            if (parsedNClusters <= 0) {
                alert('클러스터의 제한되는 데이터 개수는 1개 이상이여야합니다.');
                return;
            }
            if (parsedNClusters > 10) {
                alert('클러스터의 제한되는 데이터 개수는 10개 이하여야합니다.');
                return;
            }
        } catch (e) {
            console.error(e);
            alert('클러스터 수는 숫자만 가능합니다.');
            return;
        }
        if (n_count && n_count.length === '') {
            alert('클러스터의 제한되는 데이터 개수를 입력해주세요.');
            return;
        }
        try {
            let parsedNCount = parseInt(n_count);
            if (n_count && parsedNCount === 0) {
                alert('클러스터의 제한되는 데이터 개수는 0이 될 수 없습니다.');
                return;
            }
        } catch (e) {
            console.error(e);
            alert('클러스터의 제한되는 데이터 개수는 숫자만 가능합니다.');
            return;
        }
        params.n_clusters = n_clusters;
        params.n_count = parseInt(n_count);
    }
    if (outlier_type === 'autoencoder' || outlier_type === 'auto encoder' || outlier_type === 'AUTOENCODER' || outlier_type === 'AUTO ENCODER') {
        let window_size = $('#window_size').val();
        let threshold = $('#threshold').val();

        if (threshold === '' || threshold === 0 || threshold === '0') {
            alert('threshold에 숫자값을 입력하세요');
            $('#threshold').val('0.15')
            return false;
        }
        params.window_size = window_size;
        params.threshold = threshold;
    }

    outlierInfoResult(params).then(function (result) {
        console.log('result', result);
        if (result.code === 200) {
            switch (outlier_type) {
                case 'standard': {
                    //VIEW 초기화
                    let view = document.getElementById('view5');
                    initializeViewGroup(view);
                    outLierHistogramView(outlier_target_col, result.hist);
                    let headers = result.headers;
                    let datas = result.datas;
                    let rowCount = parseInt(result.row_count);
                    let statusMessage = `총 ${rowCount}개의 데이터에서 ${datas.length}개가 이상치로 판별되었습니다.`;
                    document.querySelector('#preprocTableExcludeRangeOutlier').dataset.outliers = JSON.stringify(datas);
                    preProcessMakeHTMLExcludeDataTable('#preprocTableExcludeRangeOutlier', 'outlierDataTableExcludeRange', headers, datas, statusMessage, function (wrapper, headers, datas) {
                        console.log('wrapper', wrapper);
                        console.log('preProcessMakeHTMLExcludeDataTable is completed');
                        $('#outlierDataTableExcludeRange').DataTable({
                            scrollX: true,
                            columnDefs: [{
                                targets: '_all', className: 'text-nowrap'
                            }],
                            order: [[0, "asc"]],
                            searching: false,
                            info: false,
                            lengthChange: false,
                            autoWidth: true,
                            lengthMenu: [[10], [10]],
                            initComplete: function (settings, json) {
                                console.log('DataTable has finished its initialisation.');
                                wrapper.parentElement.style.display = 'block';
                            }
                        });
                    });
                    break;
                }
                case 'kmean': {
                    //VIEW 초기화
                    let view = document.getElementById('view6');
                    initializeViewGroup(view);

                    //Chart Draw
                    let settings = scatterChartDataInitialize('title', 'subtitle', result.info, outlier_target_col);
                    if (settings.isDraw) {
                        viewTypeDefault("scatter", settings, 6, false, false);
                    } else {
                        hideGraphViewGroup([6]);
                    }

                    let headers = result.headers;
                    let datas = result.datas;
                    let rowCount = parseInt(result.row_count);
                    let statusMessage = `총 ${rowCount}개의 데이터에서 ${datas.length}개가 이상치로 판별되었습니다.`;
                    document.querySelector('#preprocTableExcludeRangeOutlier').dataset.outliers = JSON.stringify(datas);
                    preProcessMakeHTMLExcludeDataTable('#preprocTableExcludeRangeOutlier', 'outlierDataTableExcludeRange', headers, datas, statusMessage, function (wrapper, headers, datas) {
                        console.log('wrapper', wrapper);
                        console.log('preProcessMakeHTMLExcludeDataTable is completed');
                        $('#outlierDataTableExcludeRange').DataTable({
                            scrollX: true,
                            columnDefs: [{
                                targets: '_all', className: 'text-nowrap'
                            }],
                            order: [[0, "asc"]],
                            searching: false,
                            info: false,
                            lengthChange: false,
                            autoWidth: true,
                            lengthMenu: [[10], [10]],
                            initComplete: function (settings, json) {
                                console.log('DataTable has finished its initialisation.');
                                wrapper.parentElement.style.display = 'block';
                            }
                        });
                    });
                    break;
                }
                case 'dbscan': {
                    //VIEW 초기화
                    let view = document.getElementById('view7');
                    initializeViewGroup(view);

                    //Chart Draw
                    let settings = scatterChartDataInitialize('title', 'subtitle', result.info, outlier_target_col);
                    if (settings.isDraw) {
                        viewTypeDefault("scatter", settings, 7, false, false);
                    } else {
                        hideGraphViewGroup([7]);
                    }

                    let headers = result.headers;
                    let datas = result.datas;
                    let rowCount = parseInt(result.row_count);
                    let statusMessage = `총 ${rowCount}개의 데이터에서 ${datas.length}개가 이상치로 판별되었습니다.`;
                    document.querySelector('#preprocTableExcludeRangeOutlier').dataset.outliers = JSON.stringify(datas);
                    preProcessMakeHTMLExcludeDataTable('#preprocTableExcludeRangeOutlier', 'outlierDataTableExcludeRange', headers, datas, statusMessage, function (wrapper, headers, datas) {
                        console.log('wrapper', wrapper);
                        console.log('preProcessMakeHTMLExcludeDataTable is completed');
                        $('#outlierDataTableExcludeRange').DataTable({
                            scrollX: true,
                            columnDefs: [{
                                targets: '_all', className: 'text-nowrap'
                            }],
                            order: [[0, "asc"]],
                            searching: false,
                            info: false,
                            lengthChange: false,
                            autoWidth: true,
                            lengthMenu: [[10], [10]],
                            initComplete: function (settings, json) {
                                console.log('DataTable has finished its initialisation.');
                                wrapper.parentElement.style.display = 'block';
                            }
                        });
                    });
                    break;
                }
                case 'auto encoder':
                case 'AUTO ENCODER':
                case 'AUTOENCODER':
                case 'autoencoder': {
                    //VIEW 초기화
                    let headers = result.headers;
                    let datas = result.datas;
                    let rowCount = parseInt(result.row_count);
                    let statusMessage = `총 ${rowCount}개의 데이터에서 ${datas.length}개가 이상치로 판별되었습니다.`;
                    document.querySelector('#preprocTableExcludeRangeOutlier').dataset.outliers = JSON.stringify(datas);
                    preProcessMakeHTMLExcludeDataTable('#preprocTableExcludeRangeOutlier', 'outlierDataTableExcludeRange', headers, datas, statusMessage, function (wrapper, headers, datas) {
                        console.log('wrapper', wrapper);
                        console.log('preProcessMakeHTMLExcludeDataTable is completed');
                        $('#outlierDataTableExcludeRange').DataTable({
                            scrollX: true,
                            columnDefs: [{
                                targets: '_all', className: 'text-nowrap'
                            }],
                            order: [[0, "asc"]],
                            searching: false,
                            info: false,
                            lengthChange: false,
                            autoWidth: true,
                            lengthMenu: [[10], [10]],
                            initComplete: function (settings, json) {
                                console.log('DataTable has finished its initialisation.');
                                wrapper.parentElement.style.display = 'block';
                            }
                        });
                    });
                    break;
                }
            }
        } else {
            if (result.result_code === -100) {
                let errorModal = document.querySelector('#errorModal');
                if (errorModal) {
                    let errTpElement = errorModal.querySelector('#errTp');
                    let errCdElement = errorModal.querySelector('#errCd');
                    let errNmElement = errorModal.querySelector('#errNm');
                    let errLctElement = errorModal.querySelector('#errLct');
                    let errCnElement = errorModal.querySelector('#errCn');
                    let errRegDtElement = errorModal.querySelector('#errRegDt');

                    errTpElement.innerHTML = `${result.errTp}`;
                    errCdElement.innerHTML = `${result.errCd}`;
                    errNmElement.innerHTML = `${result.errNm}`;
                    errLctElement.innerHTML = `${result.errLct}`;
                    errCnElement.innerHTML = `${result.errCn}`;
                    errRegDtElement.innerHTML = `${result.errRegDt}`;

                    if (!errorModal.classList.contains('is-open')) {
                        errorModal.classList.add('is-open');
                    }
                } else {
                    console.error('errorModal could not find');
                    alert('에러가 발생하였습니다. 관리자에게 문의해주세요.');
                }
            } else {
                console.error('errorModal could not find');
                alert('에러가 발생하였습니다. 관리자에게 문의해주세요.');
            }
        }
    }).catch(function (error) {
        console.error('error 진입::: ', error);
        console.error('error : ', error);
        alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
    });
}

function getPreprocLevelLastTargetFileName(preproc_order) {
    var file_nm;
    console.log('getPreprocLevelLastTargetFileName');
    console.log('preproc_order', preproc_order);
    var preProcData = JSON.parse($('#preprocProPerty').val());
    var maxOrder = jsonTemplateArrayNumbering(preproc_order);
    console.log('preProcData', preProcData);
    console.log('maxOrder', maxOrder);
    if (maxOrder > 0) {
        file_nm = preProcData.preproc_property_info[0].preproc_property[preproc_order - 1].preproc_set[maxOrder - 1].trgt_file_nm
    } else {
        var base_file_nm = preProcData.preproc_property_info[0].base_file_nm;
        var base_file_nm_set_range_row = preProcData.preproc_property_info[0].base_file_nm_set_range_row;
        var base_file_nm_set_range_col = preProcData.preproc_property_info[0].base_file_nm_set_range_col;

        if (base_file_nm_set_range_col != null && base_file_nm_set_range_col != '') {
            file_nm = base_file_nm_set_range_col;
        } else if (base_file_nm_set_range_row != null && base_file_nm_set_range_row != '') {
            file_nm = base_file_nm_set_range_row;
        } else {
            file_nm = base_file_nm;
        }
    }

    return file_nm;
}

function getTotalLastFile() {
    var jsonTemplate = JSON.parse($('#preprocProPerty').val());
    var lastPreprocOrder = null;
    var lastPreprocSet = null;
    var lastTargetFileName = null;
    var lastSetOrder = null;

    $.each(jsonTemplate.preproc_property_info, function (index, preprocPropertyInfo) {
        // preproc_property 배열 반복
        $.each(preprocPropertyInfo.preproc_property, function (index, preprocProperty) {
            if (preprocProperty.preproc_order !== null) {
                // 마지막 preproc_order의 preproc_set 배열 업데이트
                lastPreprocSet = preprocProperty.preproc_set;
                // preproc_set 배열 반복
                $.each(preprocProperty.preproc_set, function (index, preprocSet) {
                    // trgt_file_nm이 존재하는 경우에만 업데이트
                    if (preprocSet.trgt_file_nm !== null) {
                        lastTargetFileName = preprocSet.trgt_file_nm;
                        lastSetOrder = preprocSet.set_order;
                        lastPreprocOrder = preprocProperty.preproc_order;
                    }
                });
            }
        });
    });

    if (lastTargetFileName == null) {
        var base_file_nm = jsonTemplate.preproc_property_info[0].base_file_nm;
        var base_file_nm_set_range_row = jsonTemplate.preproc_property_info[0].base_file_nm_set_range_row;
        var base_file_nm_set_range_col = jsonTemplate.preproc_property_info[0].base_file_nm_set_range_col;

        lastPreprocOrder = null;
        if (base_file_nm_set_range_col != null && base_file_nm_set_range_col != '') {
            lastTargetFileName = base_file_nm_set_range_col;
        } else if (base_file_nm_set_range_row != null && base_file_nm_set_range_row != '') {
            lastTargetFileName = base_file_nm_set_range_row;
        } else {
            lastTargetFileName = base_file_nm;
        }
    }

    jsonTemplate.preproc_property_info[0].last_step_preproc_order = lastPreprocOrder;
    jsonTemplate.preproc_property_info[0].last_step_preproc_file_nm = lastTargetFileName;

    $('#preprocProPerty').val(JSON.stringify(jsonTemplate));
    $('.preprocProPerty').val(prettyJson(JSON.stringify(jsonTemplate)));
}

function outlierInfoResult(params) {
    // 로딩 표시를 보여줍니다.
    let data = {
        outlier_type: params.outlier_type,
        model_seq: params.model_seq,
        file_path: params.file_path,
        file_name: params.file_name,
        index_target_col: params.index_target_col,
        outlier_target_col: params.outlier_target_col,
        freq: params.freq,
        p_value: params.p_value,
        eps: params.eps,
        min_samples: params.min_samples,
        n_clusters: params.n_clusters,
        window_size: params.window_size,
        threshold: params.threshold,
        etc_model_seq: params.etc_model_seq,
        target_row_count: params.target_row_count,
        n_count: params.n_count
    };
    showProgressBar({element: null, process_id: 'process-38'});
    //Promise를 반환하여 비동기 요청을 처리합니다.
    return new Promise(function (resolve, reject) {
        $.ajax({
            type: 'POST',
            url: '/dt/model/get/outlier_info',
            data: JSON.stringify(data),
            contentType: "application/json; charset=utf-8;",
            dataType: "json",
            success: function (result) {
                closeProgressBar({element: null, process_id: 'process-38'});
                resolve(result);
            },
            error: function (xhr, status, error) {
                closeProgressBar({element: null, process_id: 'process-38'});
                reject(error);
            }
        });
    });
}

function savePreproc(param) {
    showProgressBar({element: null, process_id: 'process-45'});
    $.ajax({
        type: "POST",
        url: '/dt/model/savePreproc',
        data: JSON.stringify(param),
        contentType: "application/json; charset=utf-8;",
        dataType: "json",
        success: function (result) {
            if (result.result_code === 200) {
                closeProgressBar({element: null, process_id: 'process-45'});
                const url = new URL(window.location.href);
                const urlParams = url.searchParams;
                let menu_cd = urlParams.get('menuCd');
                window.location.href = contextPath + '/dt/model/model/list?menuCd=' + menu_cd;
            } else {
                closeProgressBar({element: null, process_id: 'process-45'});
                alert('API 내 에러 발생');
            }
        },
        error: function (xhr, status, error) {
            console.error('error : ', error);
            closeProgressBar({element: null, process_id: 'process-45'});
            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
        }
    });
}

function goModelProperty(param) {
    showProgressBar({element: null, process_id: 'process-44'});
    $.ajax({
        type: "POST",
        async: false,
        url: '/dt/model/savePreproc',
        data: JSON.stringify(param),
        contentType: "application/json; charset=utf-8;",
        dataType: "json",
        success: function (result) {
            if (result.result_code === 200) {
                closeProgressBar({element: null, process_id: 'process-44'});
                $('#modelSeq').val(result.model_seq);
                makeAlgorithm(result.model_seq, function () {
                });
                /**
                 2025-03-20, 상관관계 분석 로직 추가
                 * 초기 상관관계 로직 추가
                 * */
                {
                    let correlationRange = document.querySelector('[data-id="correlation_range"]');
                    let correlationOption = correlationRange.querySelector('.filter-layer .option-list');
                    const selectedOption = correlationOption.querySelector('li input[type="radio"]:checked');
                    console.log('selectedOption', selectedOption);
                    const preProcData = JSON.parse($('#preprocProPerty').val());
                    let data = {}
                    data.type = selectedOption.dataset.type;
                    if (selectedOption.dataset.method) {
                        data.method = selectedOption.dataset.method;
                    }
                    if (selectedOption.dataset.maxlag) {
                        data.maxlag = selectedOption.dataset.maxlag;
                    }

                    data.model_seq = $("#modelSeq").val();
                    data.file_name = preProcData.preproc_property_info[0].last_step_preproc_file_nm;
                    data.index_trgt_col = preProcData.preproc_property_info[0].index_trgt_col
                    data.checkHeader = preProcData.preproc_property_info[0].preproc_trgt_col.slice();
                    showProgressBar({element: null, process_id: 'correlation-4'});
                    getCorrelation(data.type, data, function (result) {
                        try {
                            let correlationViewContainer = document.querySelector('#view4');
                            if (correlationViewContainer) {
                                let parent = correlationViewContainer.parentElement;
                                correlationViewContainer.remove();
                                correlationViewContainer = document.createElement('div');
                                correlationViewContainer.id = 'view4';
                                correlationViewContainer.style.display = 'block';
                                correlationViewContainer.style.width = '100%';
                                correlationViewContainer.style.height = '400px';
                                correlationViewContainer.style.borderStyle = 'solid';
                                correlationViewContainer.style.borderStyle = 'solid';
                                correlationViewContainer.style.borderColor = '#EEE';
                                parent.appendChild(correlationViewContainer);
                                if (result.correlation_data['data'].length !== 0) {
                                    correlationHeatMapView(result.correlation_data['data'], result.correlation_data['xdata'], result.correlation_data['ydata']);
                                } else {
                                    let textDiv = document.createElement('div');
                                    textDiv.style.display = 'flex';
                                    textDiv.style.width = '100%';
                                    textDiv.style.height = '100%';
                                    textDiv.style.justifyContent = 'center';
                                    textDiv.style.alignItems = 'center';
                                    textDiv.style.textAlign = 'center';
                                    textDiv.style.padding = '0 16px';
                                    textDiv.innerHTML = `상관관계를 분석할 수 없는 데이터입니다.`;
                                    correlationViewContainer.appendChild(textDiv);
                                }
                            } else {
                                console.warn('correlationViewContainer is not found');
                            }
                        } catch (e) {
                            console.error(e);
                        } finally {
                            closeProgressBar({element: null, process_id: 'correlation-4'});
                        }
                    });
                }
            } else {
                closeProgressBar({element: null, process_id: 'process-44'});
                alert('API 내 에러 발생')
            }
        },
        error: function (xhr, status, error) {
            console.error('error : ', error);
            closeProgressBar({element: null, process_id: 'process-44'});
            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
        }
    });

}

function findLastFileAndPrevFile(jsonProperty) {
    let files = {};
    let preprocPropertyInfo = jsonProperty.preproc_property_info[0];
    let lastStep;
    let lastStepIndex = -1;
    let lastStepProcIndex = -1;
    for (let i = (preprocPropertyInfo.preproc_property.length - 1); i >= 0; i--) {
        let step = preprocPropertyInfo.preproc_property[i];
        if (step.preproc_set.length !== 0) {
            lastStep = step;
            lastStepIndex = i;
            lastStepProcIndex = step.preproc_set.length - 1;
            break;
        }
    }
    if (lastStep) {
        files.last = lastStep.preproc_set[lastStepProcIndex].trgt_file_nm;
    } else {
        files.last = preprocPropertyInfo.base_file_nm_set_range_col;
    }
    let prevLastStep;
    let prevLastStepIndex = -1;
    let prevLastStepProcIndex = -1;
    for (let i = lastStepIndex; i >= 0; i--) {
        let step = preprocPropertyInfo.preproc_property[i];
        //현재 스텝과 라스트 스텝이 같다면
        if (step.preproc_type === lastStep.preproc_type) {
            //프로세스가 여러개 있다면
            if ((step.preproc_set.length) > 1) {
                prevLastStep = step;
                prevLastStepIndex = i;
                prevLastStepProcIndex = lastStepProcIndex - 1;
                break;
            }
        } else {
            //같지 않다면 그 이전
            if (step.preproc_set.length !== 0) {
                prevLastStep = step;
                prevLastStepIndex = i;
                prevLastStepProcIndex = step.preproc_set.length - 1;
                break;
            }
        }
    }
    if (prevLastStep) {
        files.prev = prevLastStep.preproc_set[prevLastStepProcIndex].trgt_file_nm;
    } else {
        files.prev = preprocPropertyInfo.base_file_nm_set_range_col;
    }
    return files;
}

/**
 * 2024-08-26 DECISION TREE Interval Conversion 로직 수행 할 때
 * */
function findDecisionPreProcSet(jsonProperty) {
    let preprocSet = null;
    let preprocPropertyInfo = jsonProperty.preproc_property_info[0];
    let missingPreprocProperties = preprocPropertyInfo.preproc_property[2].preproc_set;
    missingPreprocProperties.forEach(property => {
        if (property.interpl_tp === 'decisiontree') {
            preprocSet = property;
        }
    });
    return preprocSet;
}

function convertDelta(delta) {
    const secondsInMinute = 60;
    const secondsInHour = 60 * 60;
    const secondsInDay = 60 * 60 * 24;

    let days = 0;
    let hours = 0;
    let minutes = 0;
    let seconds = delta;

    // delta가 일로 나누어 떨어지면 일로 변환
    if (delta % secondsInDay === 0) {
        days = Math.floor(delta / secondsInDay);
        seconds = 0;
    }
    // delta가 시로 나누어 떨어지면 시로 변환
    else if (delta % secondsInHour === 0) {
        hours = Math.floor(delta / secondsInHour);
        seconds = 0;
    }
    // delta가 분으로 나누어 떨어지면 분으로 변환
    else if (delta % secondsInMinute === 0) {
        minutes = Math.floor(delta / secondsInMinute);
        seconds = 0;
    }

    return {
        D: days, H: hours, M: minutes, S: seconds
    };
}

const createValidateCheckResultMessage = (container, message) => {
    let infoMessage = document.createElement('span');
    infoMessage.style.display = 'inline-block';
    infoMessage.style.width = '100%';
    infoMessage.style.color = 'red';
    infoMessage.style.fontSize = '13px';
    infoMessage.innerHTML = `${message}`;
    container.appendChild(infoMessage);
}

function extractAndConvertToLong(dateString) {
    let date;

    // 다양한 날짜 형식에 대한 정규 표현식 및 파싱 로직
    const dateFormats = [
        {
            regex: /^(\d{4})[-/](\d{2})[-/](\d{2}) (\d{2}):(\d{2}):(\d{2})$/,
            parser: (match) => new Date(match[1], match[2] - 1, match[3], match[4], match[5], match[6])
        },
        {
            regex: /^(\d{4})[-/](\d{2})[-/](\d{2})$/,
            parser: (match) => new Date(match[1], match[2] - 1, match[3])
        },
        {
            regex: /^(\d{2})[-/](\d{2})[-/](\d{4}) (\d{2}):(\d{2}):(\d{2})$/,
            parser: (match) => new Date(match[3], match[2] - 1, match[1], match[4], match[5], match[6])
        },
        {
            regex: /^(\d{2})[-/](\d{2})[-/](\d{4})$/,
            parser: (match) => new Date(match[3], match[2] - 1, match[1])
        },
        {
            regex: /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/,
            parser: (match) => new Date(match[1], match[2] - 1, match[3], match[4], match[5], match[6])
        },
        {
            regex: /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})Z/,
            parser: (match) => {
                const utcDate = new Date(Date.UTC(match[1], match[2] - 1, match[3], match[4], match[5], match[6]));
                return new Date(utcDate.getTime() - (new Date().getTimezoneOffset() * 60000)); // 로컬 시간으로 변환
            }
        }
    ];

    for (const format of dateFormats) {
        const match = dateString.match(format.regex);
        if (match) {
            date = format.parser(match);
            break;
        }
    }

    if (!date || isNaN(date.getTime())) {
        return 0; // 혹은 다른 에러 처리
    }

    return date.getTime();
}

function originDataExtractToRemovedData(origin_data, removed_data) {
    for (let i = 0; i < removed_data.length; i++) {
        const removedRow = removed_data[i];
        const removedDate = extractAndConvertToLong(removedRow[0]); // 날짜 추출 및 숫자 변환

        for (let j = 0; j < origin_data.length; j++) {
            const originRow = origin_data[j];
            const originDate = extractAndConvertToLong(originRow[0]); // 날짜 추출 및 숫자 변환

            if (originDate === removedDate) {
                // 날짜가 일치하면 origin_data의 값을 removed_data로 덮어씁니다.
                removed_data[i] = originRow;
                break; // 일치하는 날짜를 찾았으면 origin_data 순회 종료
            }
        }
    }
    return removed_data;
}
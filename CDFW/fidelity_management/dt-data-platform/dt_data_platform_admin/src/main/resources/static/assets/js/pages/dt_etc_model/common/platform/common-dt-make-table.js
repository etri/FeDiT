'use strict'

$(document).ready(function () {
    $(document).on('change', '#chkAllCol', function () {
        $('input[name="dataSetColumnArr"]').attr('checked', $(this).is(':checked'));
    });
});

function makeFilterHTML(headers, container, count, start_date, end_date, selectedIndex) {
    let filterDataTableContainer = document.createElement('div');
    ['table-scroll-parent', 'filter-data-table-container'].forEach(function (className) {
        filterDataTableContainer.classList.add(className);
    });

    let messages = [`시계열 컬럼과 데이터 범위를 지정 후 조회 버튼을 클릭합니다.`, `시계열 컬럼이 아닌 다른 컬럼을 선택할 수 없습니다.`, `시작일과 종료일 미선택시 전체 기간에서 검색합니다.`, `미리보기로 ${count}개 이하만 보입니다.`, `파일로 데이터 업로드 선택시 전체 데이터를 보여줍니다.`];
    filterDataTableContainer.appendChild(createMessageElement(messages, ['mb-3']));

    let filterFormRow = document.createElement('div');
    ['row'].forEach(function (className) {
        filterFormRow.classList.add(className);
    });

    let selectParent = document.createElement('div');
    ['col'].forEach(function (className) {
        selectParent.classList.add(className);
    });

    let timeColumnSelect = document.createElement('div');
    ['dropdown-box'].forEach(function (className) {
        timeColumnSelect.classList.add(className);
    });

    let timeColumnButton = document.createElement('button');
    timeColumnButton.setAttribute('type', 'button');
    ['form-control', 'sm', 'dropdown-toggle'].forEach(function (className) {
        timeColumnButton.classList.add(className);
    });
    timeColumnButton.id = 'index_trgt_col';
    timeColumnButton.innerHTML = `선택 없음`;
    timeColumnButton.dataset.value = `0`;

    timeColumnButton.addEventListener('click', dropdownToggleButtonClickEventListener);
    timeColumnSelect.appendChild(timeColumnButton);

    let timeColumnSelection = document.createElement('div');
    ['dropdown-layer'].forEach(function (className) {
        timeColumnSelection.classList.add(className);
    });
    timeColumnSelection.id = 'index_trgt_col_selection';

    let optionUl = document.createElement('ul');
    ['option-list'].forEach(function (className) {
        optionUl.classList.add(className);
    });

    ['0', ...headers].forEach(function (header) {
        let optionLi = document.createElement('li');
        let input = document.createElement('input');
        let label = document.createElement('label');
        label.addEventListener('click', labelClickEventListener);
        if (header === selectedIndex) {
            input.setAttribute('type', 'radio');
            input.id = `input_${header}`;
            input.name = `index_trgt_col_input`
            input.checked = true;
            label.setAttribute('for', `input_${header}`);

            if (header === '0') {
                timeColumnButton.innerHTML = `선택 없음`;
                timeColumnButton.dataset.value = `0`;
                input.value = `0`;
                label.innerHTML = `선택 없음`;
            } else {
                timeColumnButton.innerHTML = `${header}`;
                timeColumnButton.dataset.value = `${header}`;
                input.value = `${header}`;
                label.innerHTML = `${header}`;
            }
        } else {
            input.setAttribute('type', 'radio');
            input.id = `input_${header}`;
            input.name = `index_trgt_col_input`
            label.setAttribute('for', `input_${header}`);

            if (header === '0') {
                input.value = `0`;
                label.innerHTML = `선택 없음`;
            } else {
                input.value = `${header}`;
                label.innerHTML = `${header}`;
            }
        }
        optionLi.appendChild(input);
        optionLi.appendChild(label);
        optionUl.appendChild(optionLi);
    });
    timeColumnSelection.appendChild(optionUl);
    timeColumnSelect.appendChild(timeColumnSelection);
    selectParent.appendChild(timeColumnSelect);
    filterFormRow.appendChild(selectParent);
    closeLayerOnOutsideClick(Array.from(timeColumnSelect ? [timeColumnSelect] : []), '.dropdown-layer');

    let startTimeParent = document.createElement('div');
    ['col'].forEach(function (className) {
        startTimeParent.classList.add(className);
    });
    let startTimeInput = document.createElement('input');
    ['form-control', 'sm'].forEach(function (className) {
        startTimeInput.classList.add(className);
    });
    startTimeInput.id = 'target_start_date'
    startTimeInput.type = 'text';
    startTimeInput.placeholder = '시작일';
    startTimeInput.value = `${start_date ? start_date : ''}`;
    startTimeParent.appendChild(startTimeInput);
    filterFormRow.appendChild(startTimeParent);

    let endTimeParent = document.createElement('div');
    ['col'].forEach(function (className) {
        endTimeParent.classList.add(className);
    });
    let endTimeInput = document.createElement('input');
    ['form-control', 'sm'].forEach(function (className) {
        endTimeInput.classList.add(className);
    });
    endTimeInput.id = 'target_end_date'
    endTimeInput.type = 'text';
    endTimeInput.placeholder = '종료일';
    endTimeInput.value = `${end_date ? end_date : ''}`;
    endTimeParent.appendChild(endTimeInput);
    filterFormRow.appendChild(endTimeParent);

    let countRangeParent = document.createElement('div');
    ['col'].forEach(function (className) {
        countRangeParent.classList.add(className);
    });
    let countRangeInput = document.createElement('input');
    ['form-control', 'sm'].forEach(function (className) {
        countRangeInput.classList.add(className);
    });
    countRangeInput.id = 'target_row_count'
    countRangeInput.type = 'number';
    countRangeInput.placeholder = '데이터 개수';
    countRangeInput.value = `${parseInt(count)}`;
    countRangeParent.appendChild(countRangeInput);
    filterFormRow.appendChild(countRangeParent);

    let inquireParent = document.createElement('div');
    ['col-auto'].forEach(function (className) {
        inquireParent.classList.add(className);
    });
    let inquireButton = document.createElement('button');
    ['ui-button', 'primary', 'sm', 'btn-set-data-preview'].forEach(function (className) {
        inquireButton.classList.add(className);
    });
    inquireButton.type = 'button';
    inquireButton.innerHTML = `조회`;

    inquireParent.appendChild(inquireButton);
    filterFormRow.appendChild(inquireParent);

    filterDataTableContainer.appendChild(filterFormRow);

    container.appendChild(filterDataTableContainer);
    /**
     * DatePicker 실행
     * */
    $('#target_start_date').datepicker({
        format: 'yyyy-mm-dd', todayHighlight: true, autoclose: true, language: 'kr'
    });
    $('#target_end_date').datepicker({
        format: 'yyyy-mm-dd', todayHighlight: true, autoclose: true, language: 'kr'
    });
}

function makeDataTableHTML(headers, datas, container, table_id, callback) {
    let table = document.createElement('table');
    ['data-table'].forEach(function (className) {
        table.classList.add(className);
    });
    table.id = table_id;
    table.style.width = '100%';

    let thead = document.createElement('thead');
    let tr = document.createElement('tr');
    headers.forEach((header) => {
        let th = document.createElement('th');
        th.innerHTML = `${header}`;
        tr.appendChild(th);
    });
    thead.appendChild(tr);
    table.appendChild(thead);
    let tbody = document.createElement('tbody');
    datas.forEach((rowData) => {
        let tr = document.createElement('tr');
        rowData.forEach((data) => {
            let td = document.createElement('td');
            td.innerHTML = `${data}`;
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);
    callback(table);
}

function makeDataSetInfo(ds, container) {
    let isInsert = document.querySelector('#formType').value === 'I';
    /* DT ETC MODEL 공개 여부 관련 설정 (GRANT==FALSE 시 수정 불가)*/
    let grant = $('#grant').val();
    grant = grant === 'true' || grant === true;
    console.log('grant', grant);

    let data = ds.data.info;

    let label = document.createElement('label');
    ['col-form-label'].forEach(function (className) {
        label.classList.add(className);
    });
    label.innerHTML = `컬럼 정보`;

    container.appendChild(label);
    if ($('#formType').val() === 'I') {
        container.appendChild(createMessageElement([`작업할 컬럼을 필수로 1개이상 지정해야 합니다.`, `전체 선택시 모든 데이터를 사용하도록 합니다.`, `선택 후 '확인(미리보기' 버튼을 눌러 데이터를 확인해주세요.)`], ['mb-3']));
    }

    let tableContainer = document.createElement('div');
    ['table-responsive'].forEach(function (className) {
        tableContainer.classList.add(className);
    });

    let table = document.createElement('table');
    ['data-table'].forEach(function (className) {
        table.classList.add(className);
    });
    table.id = 'preProcDatatableColumnInfo';
    table.style.width = '100%';

    let thead = document.createElement('thead');
    let tr = document.createElement('tr');

    ['checkbox', 'col', 'dtype', 'min', 'max', 'unique', 'duplicate', 'nan', 'std'].forEach(function (column) {
        let th = document.createElement('th');
        if (column === 'checkbox') {
            let inputContainer = document.createElement('div');
            ['form-checkbox'].forEach(function (className) {
                inputContainer.classList.add(className);
            });
            inputContainer.style.display = 'inline-block';

            let input = document.createElement('input');
            input.type = 'checkbox';
            ['ui-check', 'preprocCheck'].forEach(function (className) {
                input.classList.add(className);
            });
            input.setAttribute('aria-labelledby', 'chkAllCol_label');
            input.id = 'chkAllCol';
            input.name = 'chkAllCol';
            if (!grant && !isInsert) {
                input.setAttribute('disabled', 'disabled');
            }

            let label = document.createElement('label');
            ['form-label'].forEach(function (className) {
                label.classList.add(className);
            });
            label.setAttribute('for', 'chkAllCol');
            label.id = 'chkAllCol_label';
            label.style.margin = '0';
            inputContainer.appendChild(input);
            inputContainer.appendChild(label);
            th.appendChild(inputContainer);
        } else {
            th.innerHTML = `${column}`;
        }
        tr.appendChild(th);
    });
    thead.appendChild(tr);
    table.appendChild(thead);

    let tbody = document.createElement('tbody');

    data.forEach(function (_data, _index) {
        let obj = JSON.parse(_data);
        let headers = Object.keys(obj);
        headers.forEach(function (header, index) {
            let dtype = obj[header]?.dtype ?? 'null';
            let min = obj[header]?.min ?? 'null';
            let max = obj[header]?.max ?? 'null';
            let unique = obj[header]?.unique ?? 'null';
            let duplicate = obj[header]?.duplicate ?? 'null';
            let nan = obj[header]?.nan ?? 'null';
            let std = obj[header]?.std ?? 'null';

            let tr = document.createElement('tr');

            let thCheckbox = document.createElement('th');
            let inputContainer = document.createElement('div');
            ['form-checkbox'].forEach(function (className) {
                inputContainer.classList.add(className);
            });
            inputContainer.style.display = 'inline-block';

            let input = document.createElement('input');
            input.type = 'checkbox';
            ['ui-check', 'preprocCheck'].forEach(function (className) {
                input.classList.add(className);
            });
            input.setAttribute('aria-labelledby', `preprocCheck${_index}_label`);
            input.id = `preprocCheck${_index}`;
            input.name = `dataSetColumnArr`;
            input.value = `${header}`;
            if (!grant && !isInsert) {
                input.setAttribute('disabled', 'disabled');
            }

            let label = document.createElement('label');
            ['form-label'].forEach(function (className) {
                label.classList.add(className);
            });
            label.setAttribute('for', `preprocCheck${_index}`);
            label.id = `preprocCheck${_index}_label`;
            label.style.margin = '0';
            inputContainer.appendChild(input);
            inputContainer.appendChild(label);
            thCheckbox.appendChild(inputContainer);
            tr.appendChild(thCheckbox);

            let tdHeader = document.createElement('td');
            tdHeader.textContent = header;
            tr.appendChild(tdHeader);

            let tdDtype = document.createElement('td');
            tdDtype.textContent = dtype;
            tr.appendChild(tdDtype);

            let tdMin = document.createElement('td');
            tdMin.textContent = min;
            tr.appendChild(tdMin);

            let tdMax = document.createElement('td');
            tdMax.textContent = max;
            tr.appendChild(tdMax);

            let tdUnique = document.createElement('td');
            tdUnique.textContent = unique;
            tr.appendChild(tdUnique);

            let tdDuplicate = document.createElement('td');
            tdDuplicate.textContent = duplicate;
            tr.appendChild(tdDuplicate);

            let tdNan = document.createElement('td');
            tdNan.textContent = nan;
            tr.appendChild(tdNan);

            let tdStd = document.createElement('td');
            tdStd.textContent = std;
            tr.appendChild(tdStd);

            tbody.appendChild(tr);
        });
    });

    table.appendChild(tbody);
    tableContainer.appendChild(table);
    container.appendChild(tableContainer);

    if (isInsert) {
        let buttonContainer = document.createElement('div');
        ['row'].forEach(function (className) {
            buttonContainer.classList.add(className);
        });

        let row = document.createElement('div');
        ['col', 'pt-3'].forEach(function (className) {
            row.classList.add(className);
        });

        let button = document.createElement('button');
        button.type = 'button';
        ['ui-button', 'primary', 'sm', 'btn-set-column-select-view'].forEach(function (className) {
            button.classList.add(className);
        });
        button.innerHTML = `확인(미리보기)`;
        row.appendChild(button);
        buttonContainer.appendChild(row);
        container.appendChild(buttonContainer);
    }
}

function makeDataSetStatisticsHeader(ds, container, col) {
    let headers = ds.data.columns;
    headers = headers.map(item => item.replace(/\"/g, ''));
    let parent = document.createElement('div');

    let label = document.createElement('label');
    ['col-form-label'].forEach(function (className) {
        label.classList.add(className);
    });
    label.id = 'preproc_statistics_label';
    label.setAttribute('for', 'preproc_statistics');
    label.innerHTML = `Statistics`;
    parent.appendChild(label);

    let dropdownWrapper = document.createElement('div');
    ['dropdown-wrapper'].forEach(function (className) {
        dropdownWrapper.classList.add(className);
    });

    let dropdown = document.createElement('div');
    ['dropdown-box'].forEach(function (className) {
        dropdown.classList.add(className);
    });

    let dropdownButton = document.createElement('button');
    dropdownButton.setAttribute('type', 'button');
    ['form-control', 'sm', 'dropdown-toggle', 'preproc_statistics'].forEach(function (className) {
        dropdownButton.classList.add(className);
    });
    dropdownButton.id = 'preproc_statistics';
    dropdownButton.innerHTML = `선택 없음`;
    dropdownButton.dataset.value = ``;

    dropdownButton.addEventListener('click', dropdownToggleButtonClickEventListener);
    dropdown.appendChild(dropdownButton);

    let dropdownLayer = document.createElement('div');
    ['dropdown-layer'].forEach(function (className) {
        dropdownLayer.classList.add(className);
    });
    dropdownLayer.id = 'preproc_statistics_selection';

    let optionUl = document.createElement('ul');
    ['option-list'].forEach(function (className) {
        optionUl.classList.add(className);
    });

    ['', ...headers].forEach(function (header) {
        let optionLi = document.createElement('li');
        let input = document.createElement('input');
        let label = document.createElement('label');
        label.addEventListener('click', labelClickEventListener);
        if (header === col) {
            input.setAttribute('type', 'radio');
            input.id = `input_${header}`;
            input.name = `preproc_statistics_input`
            input.checked = true;
            label.setAttribute('for', `input_${header}`);

            if (header === '0') {
                dropdownButton.innerHTML = `선택 없음`;
                dropdownButton.dataset.value = `0`;
                input.value = `0`;
                label.innerHTML = `선택 없음`;
            } else {
                dropdownButton.innerHTML = `${header}`;
                dropdownButton.dataset.value = `${header}`;
                input.value = `${header}`;
                label.innerHTML = `${header}`;
            }
        } else {
            input.setAttribute('type', 'radio');
            input.id = `input_${header}`;
            input.name = `preproc_statistics_input`
            label.setAttribute('for', `input_${header}`);

            if (header === '') {
                input.value = ``;
                label.innerHTML = `선택 없음`;
            } else {
                input.value = `${header}`;
                label.innerHTML = `${header}`;
            }
        }
        optionLi.appendChild(input);
        optionLi.appendChild(label);
        optionUl.appendChild(optionLi);
    });
    dropdownLayer.appendChild(optionUl);
    dropdown.appendChild(dropdownLayer);
    dropdownWrapper.appendChild(dropdown);
    parent.appendChild(dropdownWrapper);
    closeLayerOnOutsideClick(Array.from(dropdown ? [dropdown] : []), '.dropdown-layer');
    container.appendChild(parent);
    observeDataValueChange(dropdownButton, function (targetElement, newValue) {
        console.log('observeDataValueChange Callback', targetElement, newValue);
        let dataSetStatisticsRange = targetElement.closest('#dataSetStatisticsRange');
        if (dataSetStatisticsRange) {
            if (!newValue || newValue === '선택 없음' || newValue === '0' || newValue === '') {
                return;
            }
            dataSetStatisticsRange.innerHTML = ``; // 기존 내용 초기화
            let data = uriDecodingParameter('dataList');
            makeDataSetStatisticsHeader(data, dataSetStatisticsRange, newValue);
            makeDataSetStatisticsTable(data, dataSetStatisticsRange, newValue);
        }
    });
}

function makeDataSetStatisticsTable(ds, container, col) {
    let tableContainer = document.createElement('div');
    ['table-responsive', 'mt-3'].forEach(function (className) {
        tableContainer.classList.add(className);
    });

    let table = document.createElement('table');
    ['data-table'].forEach(function (className) {
        table.classList.add(className);
    });
    table.id = 'preProcDatatable';
    table.style.width = '100%';

    let thead = document.createElement('thead');
    let tr = document.createElement('tr');
    ['ITEM', 'VALUE'].forEach(function (column) {
        let th = document.createElement('th');
        th.innerHTML = `${column}`;
        th.style.width = '50%';
        tr.appendChild(th);
    });
    thead.appendChild(tr);
    table.appendChild(thead);

    let tbody = document.createElement('tbody');

    let data = ds.data.info;
    let perKeys = ['25%', '50%', '75%'];
    data.forEach(function (_data) {
        let obj = JSON.parse(_data);
        if (obj.hasOwnProperty(col)) {
            let {count, mean, std, min, max} = obj[col];
            let perValues = perKeys.map(key => obj[col][key]);
            let rows = [['Count', count], ['Average', mean], ['Standard Deviation', std], ['Min', min], ['25%', perValues[0]], ['50%', perValues[1]], ['75%', perValues[2]], ['Max', max]];
            rows.forEach(row => {
                let tr = document.createElement('tr');
                let tdLabel = document.createElement('td');
                let tdValue = document.createElement('td');

                tdLabel.textContent = row[0];
                tdValue.textContent = row[1];

                tr.appendChild(tdLabel);
                tr.appendChild(tdValue);
                tbody.appendChild(tr);
            });
        }
    });
    table.appendChild(tbody);
    tableContainer.appendChild(table);
    container.appendChild(tableContainer);
}

function makeDataSetHistogramHeader(ds, container, col) {
    let headers = ds.data.columns;
    headers = headers.map(item => item.replace(/\"/g, ''));
    let parent = document.createElement('div');

    let label = document.createElement('label');
    ['col-form-label'].forEach(function (className) {
        label.classList.add(className);
    });
    label.id = 'preproc_histogram_label';
    label.setAttribute('for', 'preproc_histogram');
    label.innerHTML = `Histogram`;
    parent.appendChild(label);

    let dropdownWrapper = document.createElement('div');
    ['dropdown-wrapper'].forEach(function (className) {
        dropdownWrapper.classList.add(className);
    });

    let dropdown = document.createElement('div');
    ['dropdown-box'].forEach(function (className) {
        dropdown.classList.add(className);
    });

    let dropdownButton = document.createElement('button');
    dropdownButton.setAttribute('type', 'button');
    ['form-control', 'sm', 'dropdown-toggle', 'preproc_histogram'].forEach(function (className) {
        dropdownButton.classList.add(className);
    });
    dropdownButton.id = 'preproc_histogram';
    dropdownButton.innerHTML = `선택 없음`;
    dropdownButton.dataset.value = ``;

    dropdownButton.addEventListener('click', dropdownToggleButtonClickEventListener);
    dropdown.appendChild(dropdownButton);

    let dropdownLayer = document.createElement('div');
    ['dropdown-layer'].forEach(function (className) {
        dropdownLayer.classList.add(className);
    });
    dropdownLayer.id = 'preproc_histogram_selection';

    let optionUl = document.createElement('ul');
    ['option-list'].forEach(function (className) {
        optionUl.classList.add(className);
    });

    ['', ...headers].forEach(function (header) {
        let optionLi = document.createElement('li');
        let input = document.createElement('input');
        let label = document.createElement('label');
        label.addEventListener('click', labelClickEventListener);
        if (header === col) {
            input.setAttribute('type', 'radio');
            input.id = `input_${header}`;
            input.name = `preproc_histogram_input`
            input.checked = true;
            label.setAttribute('for', `input_${header}`);

            if (header === '0') {
                dropdownButton.innerHTML = `선택 없음`;
                dropdownButton.dataset.value = `0`;
                input.value = `0`;
                label.innerHTML = `선택 없음`;
            } else {
                dropdownButton.innerHTML = `${header}`;
                dropdownButton.dataset.value = `${header}`;
                input.value = `${header}`;
                label.innerHTML = `${header}`;
            }
        } else {
            input.setAttribute('type', 'radio');
            input.id = `input_${header}`;
            input.name = `preproc_histogram_input`
            label.setAttribute('for', `input_${header}`);

            if (header === '') {
                input.value = ``;
                label.innerHTML = `선택 없음`;
            } else {
                input.value = `${header}`;
                label.innerHTML = `${header}`;
            }
        }
        optionLi.appendChild(input);
        optionLi.appendChild(label);
        optionUl.appendChild(optionLi);
    });
    dropdownLayer.appendChild(optionUl);
    dropdown.appendChild(dropdownLayer);
    dropdownWrapper.appendChild(dropdown);
    parent.appendChild(dropdownWrapper);
    closeLayerOnOutsideClick(Array.from(dropdown ? [dropdown] : []), '.dropdown-layer');
    container.appendChild(parent);
    observeDataValueChange(dropdownButton, function (targetElement, newValue) {
        console.log('observeDataValueChange Callback', targetElement, newValue);
        let dataSetHistogramRange = targetElement.closest('#dataSetHistogramRange');
        if (dataSetHistogramRange) {
            if (!newValue || newValue === '선택 없음' || newValue === '0' || newValue === '') {
                return;
            }
            dataSetHistogramRange.innerHTML = ``; // 기존 내용 초기화
            let data = uriDecodingParameter('dataList');
            makeDataSetHistogramHeader(data, dataSetHistogramRange, newValue);
            makeDataSetHistogramTable(data, dataSetHistogramRange, newValue);
            histogramChartView(data, newValue);
        }
    });
}

function makeDataSetHistogramTable(ds, container, col) {
    let data = ds.data.range;
    let tableContainer = document.createElement('div');
    ['table-responsive', 'mt-3'].forEach(function (className) {
        tableContainer.classList.add(className);
    });

    let table = document.createElement('table');
    ['data-table'].forEach(function (className) {
        table.classList.add(className);
    });
    table.id = 'preProcDatatable';
    table.style.width = '100%';

    let thead = document.createElement('thead');
    let tr = document.createElement('tr');
    ['RANGE', 'COUNT'].forEach(function (column) {
        let th = document.createElement('th');
        th.innerHTML = `${column}`;
        th.style.width = '50%';
        tr.appendChild(th);
    });
    thead.appendChild(tr);
    table.appendChild(thead);

    let tbody = document.createElement('tbody');
    data.forEach(function (_data) {
        let obj = JSON.parse(_data);

        if (obj.hasOwnProperty(col)) {
            let target_col = obj[col];

            for (let key in target_col) {
                let tr = document.createElement('tr');

                let tdKey = document.createElement('td');
                tdKey.textContent = key;
                tr.appendChild(tdKey);

                let tdValue = document.createElement('td');
                tdValue.textContent = target_col[key];
                tr.appendChild(tdValue);

                tbody.appendChild(tr);
            }
        }
    });
    table.appendChild(tbody);
    tableContainer.appendChild(table);
    container.appendChild(tableContainer);
}

function getTargetDataSetInfo(base_file_path, base_file_nm, index_trgt_col, form_type, callback) {
    let data = {
        base_file_path: base_file_path, base_file_nm: base_file_nm, index_trgt_col: index_trgt_col, form_type: form_type
    }
    showProgressBar({element: null, process_id: 'process-15'});
    $.ajax({
        type: 'POST',
        async: false, //enctype: 'multipart/form-data',
        url: '/dt/dataset/getDataSetInfo/META_ETC_MODEL',
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8;",
        dataType: "json",
        success: function (result) {
            console.log('getTargetDataSetInfo result', result);
            closeProgressBar({element: null, process_id: 'process-15'});
            if (result.code === 200) {
                getTargetDataSetInfoAfterLogic(result.data);
                callback(result.data);
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
                    alert('에러가 발생하였습니다. 관리자에게 문의해주세요.');
                }
            }
        },
        error: function (xhr, status, error) {
            console.error('getTargetDataSetInfo', error);
            closeProgressBar({element: null, process_id: 'process-15'});
            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
        }
    });
}

function getTargetDataSetInfoAfterLogic(data) {
    let data_list = JSON.parse(data);
    let header_list = data_list.data.columns;
    uriEncodingParameter(data_list, 'dataList');
    uriEncodingParameter(header_list, 'headerList');
    let dataSetInfoRange = document.querySelector('#dataSetInfoRange');
    dataSetInfoRange.innerHTML = ``;
    makeDataSetInfo(data_list, dataSetInfoRange);

    let dataSetStatisticsRange = document.querySelector('#dataSetStatisticsRange');
    dataSetStatisticsRange.innerHTML = ``;
    makeDataSetStatisticsHeader(data_list, dataSetStatisticsRange, header_list[0]);
    makeDataSetStatisticsTable(data_list, dataSetStatisticsRange, header_list[0]);

    let dataSetHistogramRange = document.querySelector('#dataSetHistogramRange');
    dataSetHistogramRange.innerHTML = ``;

    makeDataSetHistogramHeader(data_list, dataSetHistogramRange, header_list[0]);
    makeDataSetHistogramTable(data_list, dataSetHistogramRange, header_list[0]);

    histogramChartView(data_list, header_list[0]);

    $(window).trigger('resize');
}

function makeMetaApiListTable(data, container, datatable_id) {
    container.querySelector(`#${datatable_id}`)?.closest('.dataTables_wrapper')?.remove();
    let table = document.createElement('table');
    ['data-table'].forEach(function (className) {
        table.classList.add(className);
    });
    table.id = datatable_id;
    table.style.width = '100%';

    /**
     * Table Head 구성
     * */
    let thead = document.createElement('thead');
    let tr = document.createElement('tr');
    ['#', '트윈타입', '트윈아이디', '트윈명', '설명', '생성 및 수정일시'].forEach(function (header) {
        let th = document.createElement('th');
        th.innerHTML = `${header}`;
        tr.appendChild(th);
    });
    thead.appendChild(tr);

    table.appendChild(thead);

    /**
     * Table Body 구성
     * */
    let tbody = document.createElement('tbody');
    data.forEach(function (rowData, index) {
        let tr = document.createElement('tr');
        tr.innerHTML = `<td>${(index + 1)}</td>
                        <td>${rowData.type && rowData.type.length > 0 ? rowData.type : '없음'}</td>
                        <td><a href="#" class="btn-object-list" data-twin-id="${rowData.dtid}">${rowData.dtid}</a></td>
                        <td><a href="#" class="btn-object-list" data-twin-id="${rowData.dtid}">${rowData.name}</a></td>
                        <td>${rowData.description && rowData.description.length > 0 ? rowData.description : '없음'}</td>
                        <td>${rowData.creationTime <= rowData.modificationTime ? rowData.modificationTime : rowData.creationTime}</td>`;
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);
}

function makeMetaApiObjectListTable(data, container, datatable_id) {
    container.querySelector(`#${datatable_id}`)?.closest('.dataTables_wrapper')?.remove();
    let table = document.createElement('table');
    ['data-table'].forEach(function (className) {
        table.classList.add(className);
    });
    table.id = datatable_id;
    table.style.width = '100%';

    /**
     * Table Head 구성
     * */
    let thead = document.createElement('thead');
    let tr = document.createElement('tr');
    ['#', '오브젝트아이디', '오브젝트명', '설명', '키워드', '생성 및 수정일시'].forEach(function (header) {
        let th = document.createElement('th');
        th.innerHTML = `${header}`;
        tr.appendChild(th);
    });
    thead.appendChild(tr);

    table.appendChild(thead);

    /**
     * Table Body 구성
     * */
    let tbody = document.createElement('tbody');
    data.forEach(function (rowData, index) {
        let tr = document.createElement('tr');
        tr.innerHTML = `<td>${(index + 1)}</td>
                        <td><a href="#" class="btn-pop-api-view btn-popup-open" data-action="custom" data-popup-id="modalApiView" data-twin-id="${rowData.dtid}" data-object-id="${rowData.dtoid}">${rowData.dtoid}</a></td>
                        <td><a href="#" class="btn-pop-api-view btn-popup-open" data-action="custom" data-popup-id="modalApiView" data-twin-id="${rowData.dtid}" data-object-id="${rowData.dtoid}">${rowData.name}</a></td>
                        <td>${rowData.description && rowData.description.length > 0 ? rowData.description : '없음'}</td>
                        <td>${rowData.keywords && rowData.keywords.length > 0 ? rowData.keywords : '없음'}</td>
                        <td>${rowData.creationTime <= rowData.modificationTime ? rowData.modificationTime : rowData.creationTime}</td>`;
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);
}

function makeModelParameterList(container, parameterList, lossList, metricsList, optimizerList) {
    const createRow = () => {
        let row = document.createElement('div');
        ['row', 'pt-3'].forEach(function (className) {
            row.classList.add(className);
        });
        return row;
    }

    const createCol = (colCount) => {
        let col = document.createElement('div');
        [`col-${colCount}`].forEach(function (className) {
            col.classList.add(className);
        });
        return col;
    }

    const createLabel = (text, forId) => {
        let label = document.createElement('label');
        ['col-form-label'].forEach(function (className) {
            label.classList.add(className);
        });
        label.innerHTML = `${text}`;
        if (forId && forId.length > 0) {
            label.setAttribute('for', forId);
        }
        return label;
    }

    const createSelect = (id) => {
        let select = document.createElement('select');
        ['select', 'form-control', 'sm'].forEach(function (className) {
            select.classList.add(className);
        });
        select.id = id;
        return select;
    }

    let label = document.createElement('label');
    ['col-form-label'].forEach(function (className) {
        label.classList.add(className);
    });
    label.innerHTML = `모델 파라미터`;
    container.appendChild(label);

    parameterList.forEach(function (parameter, index) {
        let row = createRow();
        let labelCol = createCol(4);
        labelCol.appendChild(createLabel(`${parameter.model_params_item}`, `${parameter.model_params_item}`));
        row.appendChild(labelCol);
        let inputCol = createCol(8);
        let inputColContentHTML = ``;
        if (parameter.model_params_item_tp !== 'string') {
            //일반 Input 파라미터
            if (parameter.model_params_item_value == null || parameter.model_params_item_value === '') {
                //값이 없을 때, 기본값 사용
                switch (parameter.model_params_item) {
                    //특수 케이스
                    case 'test_size': {
                        inputColContentHTML = `<input type="range" class="form-control sm custom-range-obj" min="0.1" max="0.9" step="0.1"
                                                      id="${parameter.model_params_item}Range" value="${parameter.model_params_item_crtr_1}">
                                               <input type="number" id="${parameter.model_params_item}" class="form-control sm custom-number-range number_only"
                                                      min="0.1" max="0.9" value="${parameter.model_params_item_crtr_1}" readonly="readonly">
                                               <div class="form-message-wrap" id="${parameter.model_params_item}Range_desc">
                                                   <span class="form-message ico">${parameter.model_params_derpn}</span>
                                               </div>`;
                        break;
                    }
                    case 'testSize': {
                        inputColContentHTML = `<input type="range" class="form-control sm custom-range-obj" min="0.01" max="0.9" step="0.01"
                                                      id="${parameter.model_params_item}Range" value="${parameter.model_params_item_crtr_1}">
                                               <input type="number" id="${parameter.model_params_item}" class="form-control sm custom-number-range number_only"
                                                      min="0.01" max="0.9" value="${parameter.model_params_item_crtr_1}" readonly="readonly">
                                               <div class="form-message-wrap" id="${parameter.model_params_item}Range_desc">
                                                   <span class="form-message ico">${parameter.model_params_derpn}</span>
                                               </div>`;
                        break;
                    }
                    case 'testSizePerDataLength': {
                        inputColContentHTML = `<input type="range" class="form-control sm custom-range-obj" min="0.01" max="0.9" step="0.01"
                                                      id="${parameter.model_params_item}Range" value="${parameter.model_params_item_crtr_1}">
                                               <input type="number" id="${parameter.model_params_item}" class="form-control sm custom-number-range number_only"
                                                      min="0.01" max="0.9" value="${parameter.model_params_item_crtr_1}" readonly="readonly">
                                               <div class="form-message-wrap" id="${parameter.model_params_item}Range_desc">
                                                   <span class="form-message ico">${parameter.model_params_derpn}</span>
                                               </div>`;
                        break;
                    }
                    default: {
                        //일반 파라미터 아이템
                        switch (parameter.model_params_item) {
                            case 'window_size': {
                                inputColContentHTML = `<input type="number" class="form-control sm number_only" id="${parameter.model_params_item}" placeholder="${parameter.model_params_derpn}" value="${parameter.model_params_item_crtr_1}" required="required">
                                                       <div class="form-message-wrap" id="${parameter.model_params_item}_desc">
                                                           <span class="form-message ico">${parameter.model_params_derpn}</span>
                                                       </div>`;
                                break;
                            }
                            case 'batch_size': {
                                inputColContentHTML = `<input type="number" class="form-control sm number_only" id="${parameter.model_params_item}" placeholder="${parameter.model_params_derpn}"  value="${parameter.model_params_item_crtr_1}" required="required">
                                                       <div class="form-message-wrap" id="${parameter.model_params_item}_desc">
                                                           <span class="form-message ico">${parameter.model_params_derpn}</span>
                                                       </div>`;
                                break;
                            }
                            case 'epochs': {
                                inputColContentHTML = `<input type="number" class="form-control sm number_only" id="${parameter.model_params_item}" placeholder="${parameter.model_params_derpn}"  value="${parameter.model_params_item_crtr_1}" required="required">
                                                       <div class="form-message-wrap" id="${parameter.model_params_item}_desc">
                                                           <span class="form-message ico">${parameter.model_params_derpn}</span>
                                                       </div>`;
                                break;
                            }
                            case 'units': {
                                inputColContentHTML = `<input type="number" class="form-control sm number_only" id="${parameter.model_params_item}" placeholder="${parameter.model_params_derpn}"  value="${parameter.model_params_item_crtr_1}" required="required">
                                                       <div class="form-message-wrap" id="${parameter.model_params_item}_desc">
                                                           <span class="form-message ico">${parameter.model_params_derpn}</span>
                                                       </div>`;
                                break;
                            }
                            case 'patience': {
                                inputColContentHTML = `<input type="number" class="form-control sm number_only" id="${parameter.model_params_item}" placeholder="${parameter.model_params_derpn}"  value="${parameter.model_params_item_crtr_1}" required="required">
                                                       <div class="form-message-wrap" id="${parameter.model_params_item}_desc">
                                                           <span class="form-message ico">${parameter.model_params_derpn}</span>
                                                       </div>`;
                                break;
                            }
                            case 'n_estimator': {
                                inputColContentHTML = `<input type="number" class="form-control sm number_only" id="${parameter.model_params_item}" placeholder="${parameter.model_params_derpn}"  value="${parameter.model_params_item_crtr_1}" required="required">
                                                       <div class="form-message-wrap" id="${parameter.model_params_item}_desc">
                                                           <span class="form-message ico">${parameter.model_params_derpn}</span>
                                                       </div>`;
                                break;
                            }
                            case 'min_samples_leaf': {
                                inputColContentHTML = `<input type="number" class="form-control sm number_only" id="${parameter.model_params_item}" placeholder="${parameter.model_params_derpn}"  value="${parameter.model_params_item_crtr_1}" required="required">
                                                       <div class="form-message-wrap" id="${parameter.model_params_item}_desc">
                                                           <span class="form-message ico">${parameter.model_params_derpn}</span>
                                                       </div>`;
                                break;
                            }
                            case 'min_samples_split': {
                                inputColContentHTML = `<input type="number" class="form-control sm number_only" id="${parameter.model_params_item}" placeholder="${parameter.model_params_derpn}"  value="${parameter.model_params_item_crtr_1}" required="required">
                                                       <div class="form-message-wrap" id="${parameter.model_params_item}_desc">
                                                           <span class="form-message ico">${parameter.model_params_derpn}</span>
                                                       </div>`;
                                break;
                            }
                            case 'max_features': {
                                inputColContentHTML = `<input type="number" class="form-control sm number_only" id="${parameter.model_params_item}" placeholder="${parameter.model_params_derpn}"  value="${parameter.model_params_item_crtr_1}" required="required">
                                                       <div class="form-message-wrap" id="${parameter.model_params_item}_desc">
                                                           <span class="form-message ico">${parameter.model_params_derpn}</span>
                                                       </div>`;
                                break;
                            }
                            case 'max_depth': {
                                inputColContentHTML = `<input type="number" class="form-control sm number_only" id="${parameter.model_params_item}" placeholder="${parameter.model_params_derpn}"  value="${parameter.model_params_item_crtr_1}" required="required">
                                                       <div class="form-message-wrap" id="${parameter.model_params_item}_desc">
                                                           <span class="form-message ico">${parameter.model_params_derpn}</span>
                                                       </div>`;
                                break;
                            }
                            case 'data_size': {
                                inputColContentHTML = `<input type="number" class="form-control sm number_only" id="${parameter.model_params_item}" placeholder="${parameter.model_params_derpn}"  value="${parameter.model_params_item_crtr_1}" required="required">
                                                       <div class="form-message-wrap" id="${parameter.model_params_item}_desc">
                                                           <span class="form-message ico">${parameter.model_params_derpn}</span>
                                                       </div>`;
                                break;
                            }
                            case 'optimizerLr': {
                                inputColContentHTML = `<input type="number" class="form-control sm optimizer-number-chk" id="${parameter.model_params_item}" placeholder="${parameter.model_params_derpn}"  value="${parameter.model_params_item_crtr_1}" required="required">
                                                       <div class="form-message-wrap" id="${parameter.model_params_item}_desc">
                                                           <span class="form-message ico">${parameter.model_params_derpn}</span>
                                                       </div>`;
                                break;
                            }
                            case 'time_steps': {
                                inputColContentHTML = `<input type="number" class="form-control sm number_only" id="${parameter.model_params_item}" placeholder="${parameter.model_params_derpn}"  value="${parameter.model_params_item_crtr_1}" required="required">
                                                       <div class="form-message-wrap" id="${parameter.model_params_item}_desc">
                                                           <span class="form-message ico">${parameter.model_params_derpn}</span>
                                                       </div>`;
                                break;
                            }
                            case 'gradientClipping': {
                                inputColContentHTML = `<input type="number" class="form-control sm number_only" id="${parameter.model_params_item}" placeholder="${parameter.model_params_derpn}"  value="${parameter.model_params_item_crtr_1}" required="required">
                                                       <div class="form-message-wrap" id="${parameter.model_params_item}_desc">
                                                           <span class="form-message ico">${parameter.model_params_derpn}</span>
                                                       </div>`;
                                break;
                            }
                            default: {
                                console.warn('parameter is missing type', parameter);
                                break;
                            }
                        }
                        break;
                    }
                }
            } else {
                //값이 있을 때, 있는 값 사용
                switch (parameter.model_params_item) {
                    //특수 케이스
                    case 'test_size': {
                        inputColContentHTML = `<input type="range" class="form-control sm custom-range-obj" min="0.1" max="0.9" step="0.1"
                                                      id="${parameter.model_params_item}Range" value="${parameter.model_params_item_value}">
                                               <input type="number" id="${parameter.model_params_item}" class="form-control sm custom-number-range number_only"
                                                      min="0.1" max="0.9" value="${parameter.model_params_item_value}" readonly="readonly">
                                               <div class="form-message-wrap" id="${parameter.model_params_item}Range_desc">
                                                   <span class="form-message ico">${parameter.model_params_derpn}</span>
                                               </div>`;
                        break;
                    }
                    case 'testSize': {
                        inputColContentHTML = `<input type="range" class="form-control sm custom-range-obj" min="0.01" max="0.9" step="0.01"
                                                      id="${parameter.model_params_item}Range" value="${parameter.model_params_item_value}">
                                               <input type="number" id="${parameter.model_params_item}" class="form-control sm custom-number-range number_only"
                                                      min="0.01" max="0.9" value="${parameter.model_params_item_value}" readonly="readonly">
                                               <div class="form-message-wrap" id="${parameter.model_params_item}Range_desc">
                                                   <span class="form-message ico">${parameter.model_params_derpn}</span>
                                               </div>`;
                        break;
                    }
                    case 'testSizePerDataLength': {
                        inputColContentHTML = `<input type="range" class="form-control sm custom-range-obj" min="0.01" max="0.9" step="0.01"
                                                      id="${parameter.model_params_item}Range" value="${parameter.model_params_item_value}">
                                               <input type="number" id="${parameter.model_params_item}" class="form-control sm custom-number-range number_only"
                                                      min="0.01" max="0.9" value="${parameter.model_params_item_value}" readonly="readonly">
                                               <div class="form-message-wrap" id="${parameter.model_params_item}Range_desc">
                                                   <span class="form-message ico">${parameter.model_params_derpn}</span>
                                               </div>`;
                        break;
                    }
                    default: {
                        //일반 파라미터 아이템
                        switch (parameter.model_params_item) {
                            case 'window_size': {
                                inputColContentHTML = `<input type="number" class="form-control sm number_only" id="${parameter.model_params_item}" placeholder="${parameter.model_params_derpn}" value="${parameter.model_params_item_value}" required="required">
                                                       <div class="form-message-wrap" id="${parameter.model_params_item}_desc">
                                                           <span class="form-message ico">${parameter.model_params_derpn}</span>
                                                       </div>`;
                                break;
                            }
                            case 'batch_size': {
                                inputColContentHTML = `<input type="number" class="form-control sm number_only" id="${parameter.model_params_item}" placeholder="${parameter.model_params_derpn}"  value="${parameter.model_params_item_value}" required="required">
                                                       <div class="form-message-wrap" id="${parameter.model_params_item}_desc">
                                                           <span class="form-message ico">${parameter.model_params_derpn}</span>
                                                       </div>`;

                                break;
                            }
                            case 'epochs': {
                                inputColContentHTML = `<input type="number" class="form-control sm number_only" id="${parameter.model_params_item}" placeholder="${parameter.model_params_derpn}"  value="${parameter.model_params_item_value}" required="required">
                                                       <div class="form-message-wrap" id="${parameter.model_params_item}_desc">
                                                           <span class="form-message ico">${parameter.model_params_derpn}</span>
                                                       </div>`;
                                break;
                            }
                            case 'units': {
                                inputColContentHTML = `<input type="number" class="form-control sm number_only" id="${parameter.model_params_item}" placeholder="${parameter.model_params_derpn}"  value="${parameter.model_params_item_value}" required="required">
                                                       <div class="form-message-wrap" id="${parameter.model_params_item}_desc">
                                                           <span class="form-message ico">${parameter.model_params_derpn}</span>
                                                       </div>`;
                                break;
                            }
                            case 'patience': {
                                inputColContentHTML = `<input type="number" class="form-control sm number_only" id="${parameter.model_params_item}" placeholder="${parameter.model_params_derpn}"  value="${parameter.model_params_item_value}" required="required">
                                                       <div class="form-message-wrap" id="${parameter.model_params_item}_desc">
                                                           <span class="form-message ico">${parameter.model_params_derpn}</span>
                                                       </div>`;
                                break;
                            }
                            case 'n_estimator': {
                                inputColContentHTML = `<input type="number" class="form-control sm number_only" id="${parameter.model_params_item}" placeholder="${parameter.model_params_derpn}"  value="${parameter.model_params_item_value}" required="required">
                                                       <div class="form-message-wrap" id="${parameter.model_params_item}_desc">
                                                           <span class="form-message ico">${parameter.model_params_derpn}</span>
                                                       </div>`;
                                break;
                            }
                            case 'min_samples_leaf': {
                                inputColContentHTML = `<input type="number" class="form-control sm number_only" id="${parameter.model_params_item}" placeholder="${parameter.model_params_derpn}"  value="${parameter.model_params_item_value}" required="required">
                                                       <div class="form-message-wrap" id="${parameter.model_params_item}_desc">
                                                           <span class="form-message ico">${parameter.model_params_derpn}</span>
                                                       </div>`;
                                break;
                            }
                            case 'min_samples_split': {
                                inputColContentHTML = `<input type="number" class="form-control sm number_only" id="${parameter.model_params_item}" placeholder="${parameter.model_params_derpn}"  value="${parameter.model_params_item_value}" required="required">
                                                       <div class="form-message-wrap" id="${parameter.model_params_item}_desc">
                                                           <span class="form-message ico">${parameter.model_params_derpn}</span>
                                                       </div>`;
                                break;
                            }
                            case 'max_features': {
                                inputColContentHTML = `<input type="number" class="form-control sm number_only" id="${parameter.model_params_item}" placeholder="${parameter.model_params_derpn}"  value="${parameter.model_params_item_value}" required="required">
                                                       <div class="form-message-wrap" id="${parameter.model_params_item}_desc">
                                                           <span class="form-message ico">${parameter.model_params_derpn}</span>
                                                       </div>`;
                                break;
                            }
                            case 'max_depth': {
                                inputColContentHTML = `<input type="number" class="form-control sm number_only" id="${parameter.model_params_item}" placeholder="${parameter.model_params_derpn}"  value="${parameter.model_params_item_value}" required="required">
                                                       <div class="form-message-wrap" id="${parameter.model_params_item}_desc">
                                                           <span class="form-message ico">${parameter.model_params_derpn}</span>
                                                       </div>`;
                                break;
                            }
                            case 'data_size': {
                                inputColContentHTML = `<input type="number" class="form-control sm number_only" id="${parameter.model_params_item}" placeholder="${parameter.model_params_derpn}"  value="${parameter.model_params_item_value}" required="required">
                                                       <div class="form-message-wrap" id="${parameter.model_params_item}_desc">
                                                           <span class="form-message ico">${parameter.model_params_derpn}</span>
                                                       </div>`;
                                break;
                            }
                            case 'optimizerLr': {
                                inputColContentHTML = `<input type="number" class="form-control sm optimizer-number-chk" id="${parameter.model_params_item}" placeholder="${parameter.model_params_derpn}"  value="${parameter.model_params_item_value}" required="required">
                                                       <div class="form-message-wrap" id="${parameter.model_params_item}_desc">
                                                           <span class="form-message ico">${parameter.model_params_derpn}</span>
                                                       </div>`;
                                break;
                            }
                            case 'time_steps': {
                                inputColContentHTML = `<input type="number" class="form-control sm number_only" id="${parameter.model_params_item}" placeholder="${parameter.model_params_derpn}"  value="${parameter.model_params_item_value}" required="required">
                                                       <div class="form-message-wrap" id="${parameter.model_params_item}_desc">
                                                           <span class="form-message ico">${parameter.model_params_derpn}</span>
                                                       </div>`;
                                break;
                            }
                            case 'gradientClipping': {
                                inputColContentHTML = `<input type="number" class="form-control sm number_only" id="${parameter.model_params_item}" placeholder="${parameter.model_params_derpn}"  value="${parameter.model_params_item_value}" required="required">
                                                       <div class="form-message-wrap" id="${parameter.model_params_item}_desc">
                                                           <span class="form-message ico">${parameter.model_params_derpn}</span>
                                                       </div>`;
                                break;
                            }
                            default: {
                                console.warn('parameter is missing type', parameter);
                                break;
                            }
                        }
                        break;
                    }
                }
            }
        } else {
            //Select 파라미터
            let select = createSelect(parameter.model_params_item);
            if (parameter.model_params_item_value == null || parameter.model_params_item_value === '') {
                switch (parameter.model_params_item) {
                    case 'loss': {
                        lossList.forEach(function (loss) {
                            let option = document.createElement('option');
                            option.value = `${loss.dtl_cd}`;
                            option.innerHTML = `${loss.dtl_cd_nm}`;
                            //기본값이 포함되는 경우
                            if (loss.dtl_cd === parameter.model_params_item_crtr_1) {
                                option.dataset.selected = true;
                            }
                            select.appendChild(option);
                        });
                        inputColContentHTML = `${select.outerHTML}`;
                        inputColContentHTML += `<div class="form-message-wrap" id="${parameter.model_params_item}_desc">
                                                   <span class="form-message ico">${parameter.model_params_derpn}</span>
                                               </div>`;
                        break;
                    }
                    case 'meterics': {
                        metricsList.forEach(function (metrics) {
                            let option = document.createElement('option');
                            option.value = `${metrics.dtl_cd}`;
                            option.innerHTML = `${metrics.dtl_cd_nm}`;
                            //기본값이 포함되는 경우
                            if (metrics.dtl_cd === parameter.model_params_item_crtr_1) {
                                option.dataset.selected = true;
                            }
                            select.appendChild(option);
                        });
                        inputColContentHTML = `${select.outerHTML}`;
                        inputColContentHTML += `<div class="form-message-wrap" id="${parameter.model_params_item}_desc">
                                                   <span class="form-message ico">${parameter.model_params_derpn}</span>
                                               </div>`;
                        break;
                    }
                    case 'optimizer': {
                        optimizerList.forEach(function (optimizer) {
                            let option = document.createElement('option');
                            option.value = `${optimizer.dtl_cd}`;
                            option.innerHTML = `${optimizer.dtl_cd_nm}`;
                            //기본값이 포함되는 경우
                            if (optimizer.dtl_cd === parameter.model_params_item_crtr_1) {
                                option.dataset.selected = true;
                            }
                            select.appendChild(option);
                        });
                        inputColContentHTML = `${select.outerHTML}`;
                        inputColContentHTML += `<div class="form-message-wrap" id="${parameter.model_params_item}_desc">
                                                   <span class="form-message ico">${parameter.model_params_derpn}</span>
                                               </div>`;
                        break;
                    }
                }
            } else {
                switch (parameter.model_params_item) {
                    case 'loss': {
                        lossList.forEach(function (loss) {
                            let option = document.createElement('option');
                            option.value = `${loss.dtl_cd}`;
                            option.innerHTML = `${loss.dtl_cd_nm}`;
                            //기본값이 포함되는 경우
                            if (loss.dtl_cd === parameter.model_params_item_value) {
                                option.dataset.selected = true;
                            }
                            select.appendChild(option);
                        });
                        inputColContentHTML = `${select.outerHTML}`;
                        inputColContentHTML += `<div class="form-message-wrap" id="${parameter.model_params_item}_desc">
                                                   <span class="form-message ico">${parameter.model_params_derpn}</span>
                                               </div>`;
                        break;
                    }
                    case 'meterics': {
                        metricsList.forEach(function (metrics) {
                            let option = document.createElement('option');
                            option.value = `${metrics.dtl_cd}`;
                            option.innerHTML = `${metrics.dtl_cd_nm}`;
                            //기본값이 포함되는 경우
                            if (metrics.dtl_cd === parameter.model_params_item_value) {
                                option.dataset.selected = true;
                            }
                            select.appendChild(option);
                        });
                        inputColContentHTML = `${select.outerHTML}`;
                        inputColContentHTML += `<div class="form-message-wrap" id="${parameter.model_params_item}_desc">
                                                   <span class="form-message ico">${parameter.model_params_derpn}</span>
                                               </div>`;
                        break;
                    }
                    case 'optimizer': {
                        optimizerList.forEach(function (optimizer) {
                            let option = document.createElement('option');
                            option.value = `${optimizer.dtl_cd}`;
                            option.innerHTML = `${optimizer.dtl_cd_nm}`;
                            //기본값이 포함되는 경우
                            if (optimizer.dtl_cd === parameter.model_params_item_value) {
                                option.dataset.selected = true;
                            }
                            select.appendChild(option);
                        });
                        inputColContentHTML = `${select.outerHTML}`;
                        inputColContentHTML += `<div class="form-message-wrap" id="${parameter.model_params_item}_desc">
                                                   <span class="form-message ico">${parameter.model_params_derpn}</span>
                                               </div>`;
                        break;
                    }
                }
            }
        }
        inputCol.innerHTML = inputColContentHTML;
        row.appendChild(inputCol);
        container.appendChild(row);
        //Select 값 초기화
        let select = document.querySelector(`select#${parameter.model_params_item}`);
        if (select) {
            console.log('select', select);
            select.querySelectorAll('option').forEach(function (option) {
                if (option.dataset.selected === true || option.dataset.selected === 'true') {
                    select.value = option.value;
                    option.selected = true;
                    delete option.dataset.selected;
                }
            });
        }
    });
}

function createMessageElement(messages, ul_classes = [], li_classes = []) {
    let ul = document.createElement('ul');
    ul_classes.forEach(function (_class) {
        ul.classList.add(_class);
    });
    messages.forEach(function (message) {
        let li = document.createElement('li');
        li_classes.forEach(function (_class) {
            li.classList.add(_class);
        });
        li.innerHTML = `<div class="bg-box">
                                    <p class="dot-desc">${message}</p>
                                </div>`;
        ul.appendChild(li);
    });
    return ul;
}
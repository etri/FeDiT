'use strict'

$(document).ready(function () {
    $(document).on('change', '#chkAllCol', function () {
        $('input[name="dataSetColumnArr"]').attr('checked', $(this).is(':checked'));
    });
});

function makeFilterHTML(headers, container, count, start_date, end_date, selectedIndex) {
    let filterDataTableContainer = document.createElement('div');
    ['table-scroll-parent'].forEach(function (className) {
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
            if (!isInsert) {
                input.setAttribute('disabled', 'disabled');
            }
            ['ui-check', 'preprocCheck'].forEach(function (className) {
                input.classList.add(className);
            });
            input.setAttribute('aria-labelledby', 'chkAllCol_label');
            input.id = 'chkAllCol';
            input.name = 'chkAllCol';

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
            if (!isInsert) {
                input.setAttribute('disabled', 'disabled');
            }
            ['ui-check', 'preprocCheck'].forEach(function (className) {
                input.classList.add(className);
            });
            input.setAttribute('aria-labelledby', `preprocCheck${_index}_label`);
            input.id = `preprocCheck${_index}`;
            input.name = `dataSetColumnArr`;
            input.value = `${header}`;

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

function makeDataSetInfoValidate(ds, container) {
    // 키를 찾는 함수
    const isObjectKey = (obj, targetKey) => {
        for (const key in obj) {
            if (key === targetKey) {
                return true; // 키를 찾으면 해당 값을 반환
            }
        }
        return false; // 키가 없으면 null 반환
    }

    let data = ds.data.info;
    let headers = ds.data.columns;

    let tableWrapper = document.createElement('div');
    ['table-responsive'].forEach(function (className) {
        tableWrapper.classList.add(className);
    });

    let table = document.createElement('table');
    ['data-table'].forEach(function (className) {
        table.classList.add(className);
    });
    table.id = 'preProcDatatable';
    table.style.width = '100%';

    let thead = document.createElement('thead');
    let tr = document.createElement('tr');
    ['#', 'column', 'type'].forEach(function (column) {
        let th = document.createElement('th');
        th.innerHTML = `${column}`;
        tr.appendChild(th);
    });
    thead.appendChild(tr);
    table.appendChild(thead);

    let tbody = document.createElement('tbody');
    headers.forEach(function (header, index) {
        let tr = document.createElement('tr');

        let orderTd = document.createElement('td');
        orderTd.innerHTML = `${index + 1}`;

        let columnTd = document.createElement('td');
        columnTd.innerHTML = `${header}`;

        // Find the corresponding data object for the current header
        let dataObj = JSON.parse(data.find(d => {
            return isObjectKey(JSON.parse(d), header);
        }));
        let typeTd = document.createElement('td');
        if (dataObj) {
            let dtype = dataObj[header].dtype;
            typeTd.innerHTML = dtype ? `${dtype}` : 'object';
        } else {
            typeTd.innerHTML = 'object';
        }
        tr.appendChild(orderTd);
        tr.appendChild(columnTd);
        tr.appendChild(typeTd);
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    tableWrapper.appendChild(table);
    container.appendChild(tableWrapper);
}

function makeColumnSelector(ds, container, selectedCol) {
    let headers = ds.data.columns;
    headers = headers.map(item => item.replace(/\"/g, ''));

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
    ['form-control', 'sm', 'dropdown-toggle'].forEach(function (className) {
        dropdownButton.classList.add(className);
    });
    switch (container.id) {
        case 'preProcValidTargetCol': {
            dropdownButton.id = 'select_valid_target_col';
            break;
        }
        case 'preProcOutlierTargetCol': {
            dropdownButton.id = 'select_outlier_target_col';
            break;
        }
        case 'preProcUnitTargetCol': {
            dropdownButton.id = 'select_unit_target_col';
            break;
        }
        case 'preProcResampleTargetCol': {
            dropdownButton.id = 'select_resample_target_col';
            break;
        }
    }
    dropdownButton.innerHTML = `선택 없음`;
    dropdownButton.dataset.value = `0`;
    dropdownButton.addEventListener('click', dropdownToggleButtonClickEventListener);
    dropdown.appendChild(dropdownButton);

    let dropdownLayer = document.createElement('div');
    ['dropdown-layer'].forEach(function (className) {
        dropdownLayer.classList.add(className);
    });
    dropdownLayer.id = `${dropdownButton.id}_selection`;

    let optionUl = document.createElement('ul');
    ['option-list'].forEach(function (className) {
        optionUl.classList.add(className);
    });
    ['0', ...headers].forEach(function (header) {
        let optionLi = document.createElement('li');
        let input = document.createElement('input');
        let label = document.createElement('label');
        label.addEventListener('click', labelClickEventListener);
        if (header === selectedCol) {
            input.setAttribute('type', 'radio');
            input.id = `input_${dropdownButton.id}_${header}`;
            input.name = `${dropdownButton.id}_input`
            input.checked = true;
            label.setAttribute('for', `input_${dropdownButton.id}_${header}`);

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
            input.id = `input_${dropdownButton.id}_${header}`;
            input.name = `${dropdownButton.id}_input`
            label.setAttribute('for', `input_${dropdownButton.id}_${header}`);

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
    dropdownLayer.appendChild(optionUl);
    dropdown.appendChild(dropdownLayer);
    dropdownWrapper.appendChild(dropdown);
    container.appendChild(dropdownWrapper);
    closeLayerOnOutsideClick(Array.from(dropdown ? [dropdown] : []), '.dropdown-layer');
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

//가져온 메타에 대한 원본 데이터에서 필터를 지정해서 실제 작업에 사용할 데이터
function getTargetDataSetInfo(base_file_path, base_file_nm, index_trgt_col, form_type, proc_type, callback) {
    let data = {
        base_file_path: base_file_path,
        base_file_nm: base_file_nm,
        index_trgt_col: index_trgt_col,
        form_type: form_type,
        proc_type: proc_type
    }
    showProgressBar({element: null, process_id: 'process-19'});
    $.ajax({
        type: 'POST',
        url: '/dt/dataset/getDataSetInfo/META_MODEL',
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8;",
        dataType: "json",
        success: function (result) {
            console.log('getTargetDataSetInfo result', result);
            closeProgressBar({element: null, process_id: 'process-19'});
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
            console.error('error : ', error);
            closeProgressBar({element: null, process_id: 'process-19'});
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

//가져온 메타에 대한 원본 데이터에서 필터를 지정해서 실제 작업에 사용할 데이터 Callback 버전
function getPreprocessTargetDataSetInfo(base_file_path, base_file_nm, index_trgt_col, form_type, proc_type, option, callback) {
    let data = {
        base_file_path: base_file_path,
        base_file_nm: base_file_nm,
        index_trgt_col: index_trgt_col,
        form_type: form_type,
        proc_type: proc_type
    }
    showProgressBar({element: null, process_id: 'process-19'});
    $.ajax({
        type: 'POST',
        url: '/dt/dataset/getDataSetInfo/META_MODEL',
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8;",
        dataType: "json",
        success: function (result) {
            console.log('result', result);
            closeProgressBar({element: null, process_id: 'process-19'});
            if (result.code === 200) {
                getPreprocessTargetDataSetInfoAfterLogic(result, proc_type, option);
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
            console.error('error : ', error);
            closeProgressBar({element: null, process_id: 'process-19'});
            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
        }
    });
}

function getPreprocessTargetDataSetInfoAfterLogic(result, proc_type, option) {
    let data_list = JSON.parse(result.data);
    let header_list = data_list.data.columns;
    uriEncodingParameter(data_list, 'dataList');
    uriEncodingParameter(header_list, 'headerList');
    switch (proc_type) {
        case 'validate': {
            let preProcValidTargetColContainer = document.querySelector('#preProcValidTargetCol');
            preProcValidTargetColContainer.innerHTML = ``;
            makeColumnSelector(data_list, preProcValidTargetColContainer);

            let tabMissingTableRangeValidContainer = document.querySelector('#tab_missing_table_range_valid');
            tabMissingTableRangeValidContainer.innerHTML = ``;
            makeDataSetInfoValidate(data_list, tabMissingTableRangeValidContainer);
            break;
        }
        case 'outlier': {
            let preProcOutlierTargetColContainer = document.querySelector('#preProcOutlierTargetCol');
            preProcOutlierTargetColContainer.innerHTML = ``;
            console.log(preProcOutlierTargetColContainer, 'data_list', data_list);
            makeColumnSelector(data_list, preProcOutlierTargetColContainer);
            {
                let selectOutlierTargetCol = document.querySelector('#select_outlier_target_col');
                if (selectOutlierTargetCol) {
                    observeDataValueChange(selectOutlierTargetCol, function (targetElement, newValue) {
                        console.log('observeDataValueChange Callback', targetElement, newValue);
                        if (!newValue || newValue === '선택 없음' || newValue === '0' || newValue === '') {
                            return;
                        }
                        let dropdownBox = targetElement.closest('.dropdown-box');
                        let selectOutlierOption = document.querySelector('#select_outlier_option');
                        let outlier_type = selectOutlierOption.dataset.value;
                        let outlier_target_col = newValue;
                        let etc_model_seq;

                        switch (outlier_type) {
                            case '0': {
                                outlier_type = 0;
                                alert('이상치 처리 옵션을 먼저 선택해 주세요');
                                return false;
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
                                const [etc_model_tp, etc_model_seq_tmp, trgt_col, window_sz] = selectOutlierOption.dataset.data?.split('|').map(item => item.trim());
                                outlier_type = etc_model_tp;
                                etc_model_seq = etc_model_seq_tmp;
                            }
                        }

                        if (!outlier_target_col && outlier_target_col.length === 0) {
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
                                showGraphViewGroup([7]);
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
                            let n_clusters = $('#n_clusters').val();
                            let n_count = $('#n_count').val();
                            if (n_clusters === '') {
                                alert('클러스터 수에 숫자값을 입력해주세요.');
                                return false;
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
                                let parsedNCluster = parseInt(n_clusters);
                                if (n_clusters && parsedNCluster === 0) {
                                    alert('클러스터의 개수는 0이 될 수 없습니다.');
                                    return;
                                }
                            } catch (e) {
                                console.error(e);
                                return;
                            }
                            params.n_clusters = parseInt(n_clusters);
                            params.n_count = parseInt(n_count);
                        }
                        if (outlier_type === 'autoencoder' || outlier_type === 'auto encoder' || outlier_type.trim().toUpperCase() === 'auto encoder'.trim().toUpperCase()) {
                            let window_size = $('#window_size').val();
                            let threshold = $('#threshold').val();

                            if (threshold === '') {
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

                                        // Chart Draw
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
                                    case 'AUTOENCODER':
                                    case 'AUTO ENCODER':
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
                                        hideGraphViewGroup();
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
                    });
                }

                const data = [];
                for (const item of result.etc_outlier_list) {
                    data.push({
                        etc_model_seq: item.etc_model_seq,
                        etc_model_nm: item.etc_model_nm + '(AE)',
                        etc_model_derpn: `모델 타입 : ${item.etc_model_tp} | 모델 번호 : ${item.etc_model_seq} | 모델 컬럼 : ${item.trgt_col} | Window Size : ${item.window_size}`,
                        trgt_col: `${item.etc_model_tp} | ${item.etc_model_seq} | ${item.trgt_col} | ${item.window_size}`
                    });
                }

                /**
                 * 2024-07-22
                 * 선택 옵션 초기화 로직 진행
                 * 2024-11-22
                 * Select element to dropdown element has changed
                 * @author 김우식
                 * @description 선택 옵션을 기존 0, standard, kmean, dbscan을 제외하고 옵션을 제거 후 다시 추가로 변경
                 * @changed by 김우식
                 * */
                const selectElement = document.getElementById('select_outlier_option');
                const dropdownBox = selectElement.closest('.dropdown-box');
                const optionList = dropdownBox.querySelector('.dropdown-layer ul.option-list');
                const options = optionList.querySelectorAll('li > input');
                const baseOptionValues = ['0', 'standard', 'kmean', 'dbscan'];
                options.forEach(option => {
                    if (!baseOptionValues.includes(option.value)) {
                        let li = option.closest('li');
                        li.remove();
                    }
                });
                for (const item of data) {
                    let optionLi = document.createElement('li');
                    let input = document.createElement('input');
                    input.setAttribute('type', 'radio');
                    input.id = `input_${selectElement.id}_${item.etc_model_seq}`;
                    input.name = `${selectElement.id}_input`
                    input.dataset.data = item.trgt_col;
                    input.value = `${item.etc_model_seq}`;

                    let label = document.createElement('label');
                    label.setAttribute('for', `input_${selectElement.id}_${item.etc_model_seq}`);
                    label.dataset.selected_name = `${item.etc_model_nm}`;
                    label.innerHTML = `${item.etc_model_nm}<br/>${item.etc_model_derpn}`;
                    label.addEventListener('click', datasetLabelClickEventListener);
                    optionLi.appendChild(input);
                    optionLi.appendChild(label);
                    optionList.appendChild(optionLi);
                }
            }
            break;
        }
        case 'resample': {
            let preProcResampleTargetColContainer = document.querySelector('#preProcResampleTargetCol');
            preProcResampleTargetColContainer.innerHTML = ``;
            makeColumnSelector(data_list, preProcResampleTargetColContainer);
            break;
        }
        case 'interpolate': {
            let headers = data_list.data.columns;
            let infos = data_list.data.info.map((info) => {
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

            const data = [];
            let jsonValue, featureCols = [];
            for (const item of result.etc_interpolate_list) {
                switch (item.etc_model_tp) {
                    case 'Random Forest':
                    case 'random forest':
                        jsonValue = JSON.parse(item.user_pprcs_full_stng_value);
                        featureCols = jsonValue.preproc_property_info[0].model_property[0].feature_cols;
                        data.push({
                            etc_model_nm: item.etc_model_nm + '(RF)',
                            trgt_col: `${item.etc_model_tp} | ${item.etc_model_seq} | ${item.trgt_col} | ${featureCols.map(item => `${item}(F)`).join(', ')}`,
                            output_col: item.trgt_col,
                            etc_model_seq: item.etc_model_seq,
                            etc_model_derpn: `모델 타입 : ${item.etc_model_tp} | 모델 번호 : ${item.etc_model_seq} | 모델 컬럼 : ${item.trgt_col} | 독립 컬럼 : ${featureCols.map(item => `${item}(F)`).join(', ')}`,
                            feature_cols: featureCols.map(item => `${item}`).join(', ')
                        });
                        break;
                    case 'BRITS':
                    case 'brits':
                        jsonValue = JSON.parse(item.user_pprcs_full_stng_value);
                        data.push({
                            etc_model_nm: item.etc_model_nm + '(Brits)',
                            trgt_col: `${item.etc_model_tp} | ${item.etc_model_seq} | ${item.trgt_col}`,
                            output_col: item.trgt_col,
                            etc_model_seq: item.etc_model_seq,
                            etc_model_derpn: `모델 타입 : ${item.etc_model_tp} | 모델 번호 : ${item.etc_model_seq} | 모델 컬럼 : ${item.trgt_col}`,
                            feature_cols: []
                        });
                        break;
                    case 'NAOMI':
                    case 'naomi':
                        jsonValue = JSON.parse(item.user_pprcs_full_stng_value);
                        data.push({
                            etc_model_nm: item.etc_model_nm + '(Naomi)',
                            trgt_col: `${item.etc_model_tp} | ${item.etc_model_seq} | ${item.trgt_col}`,
                            output_col: item.trgt_col,
                            etc_model_seq: item.etc_model_seq,
                            etc_model_derpn: `모델 타입 : ${item.etc_model_tp} | 모델 번호 : ${item.etc_model_seq} | 모델 컬럼 : ${item.trgt_col}`,
                            feature_cols: []
                        });
                        break;
                    default:
                        jsonValue = JSON.parse(item.user_pprcs_full_stng_value);
                        data.push({
                            etc_model_nm: item.etc_model_nm + '(default)',
                            trgt_col: `${item.etc_model_tp} | ${item.etc_model_seq} | ${item.trgt_col}`,
                            output_col: item.trgt_col,
                            etc_model_seq: item.etc_model_seq,
                            etc_model_derpn: `모델 타입 : ${item.etc_model_tp} | 모델 번호 : ${item.etc_model_seq} | 모델 컬럼 : ${item.trgt_col}`,
                            feature_cols: []
                        });
                        break;
                }
            }

            if (!option) {
                /**
                 * 2024-09-24
                 * 선택 옵션 초기화(Interpolate) 로직 진행
                 * 2024-11-22
                 * Select element to dropdown element has changed
                 * @author 김우식
                 * @description 선택 옵션을 기존 옵션 제외 초기화(0, linear, slinear, time, spline, decisiontree)
                 * @changed by 김우식
                 * */
                const selectElement = document.getElementById('select_interpolate');
                const dropdownBox = selectElement.closest('.dropdown-box');
                const optionList = dropdownBox.querySelector('.dropdown-layer ul.option-list');
                const options = optionList.querySelectorAll('li > input');
                const baseOptionValues = ['0', 'linear', 'slinear', 'time', 'spline', 'decisiontree'];
                options.forEach(option => {
                    if (!baseOptionValues.includes(option.value)) {
                        let li = option.closest('li');
                        li.remove();
                    }
                });
                for (const item of data) {
                    let optionLi = document.createElement('li');
                    let input = document.createElement('input');
                    input.setAttribute('type', 'radio');
                    input.id = `input_${selectElement.id}_${item.etc_model_seq}`;
                    input.name = `${selectElement.id}_input`
                    input.dataset.data = item.trgt_col;
                    input.value = `${item.trgt_col}`;
                    input.dataset.feature_cols = item.feature_cols;
                    input.dataset.output_col = item.output_col;
                    input.dataset.etc_model_seq = item.etc_model_seq;

                    let label = document.createElement('label');
                    label.setAttribute('for', `input_${selectElement.id}_${item.etc_model_seq}`);
                    label.dataset.selected_name = `${item.etc_model_nm}`;
                    label.innerHTML = `${item.etc_model_nm}<br/>${item.etc_model_derpn}`;
                    label.addEventListener('click', datasetLabelClickEventListener);
                    optionLi.appendChild(input);
                    optionLi.appendChild(label);
                    optionList.appendChild(optionLi);
                }
            }
            break;
        }
        case 'unit': {
            let preProcUnitTargetColContainer = document.querySelector('#preProcUnitTargetCol');
            preProcUnitTargetColContainer.innerHTML = ``;
            makeColumnSelector(data_list, preProcUnitTargetColContainer, null);
            break;
        }
    }
}

function getTargetDataSetTimeCheckCallbackFunction(base_file_path, base_file_nm, index_trgt_col, callback) {
    let data = {
        file_path: base_file_path, file_name: base_file_nm, index_trgt_col: index_trgt_col
    }
    showProgressBar({element: null, process_id: 'process-42'});
    ajaxPost('/dt/dataset/getDataTimeCheck/META_MODEL', data, function (result) {
        console.log('getTargetDataSetTimeCheck result', result);
        if (result.code === 200) {
            let datas = JSON.parse(result.data);
            let headers = datas.data.columns;
            let select_origin_term = document.querySelector('#select_origin_term');
            let termValue = getCsvIndexColumnTerm(datas, index_trgt_col);
            select_origin_term.innerHTML = `${termValue}`;
            select_origin_term.dataset.type = termValue === '불분명' ? '불분명' : '분명';
            select_origin_term.style.fontSize = '13px';
            select_origin_term.style.color = select_origin_term.dataset.type === '불분명' ? 'red' : '#000000';
            closeProgressBar({element: null, process_id: 'process-42'});
            callback(headers, datas);
        } else {
            if (result.result_code === -100) {
                closeProgressBar({element: null, process_id: 'process-42'});
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
                closeProgressBar({element: null, process_id: 'process-42'});
                alert('에러가 발생하였습니다. 관리자에게 문의해주세요.');
            }
        }
    });
}

function getCsvIndexColumnTerm(dataString, index_col) {
    const data = dataString;
    console.log(data)
    const validation_count = data.data.validation_count;
    const deltaList = data.data.delta; // "delta"를 리스트로 추출

    var resultType = '';
    var resultTimeTerm = 0;

    // "count" 배열에서 최대값과 해당 인덱스를 찾기
    var maxCount = Math.max.apply(null, data.data.count);
    var maxCountIndex = data.data.count.indexOf(maxCount);

    // 해당 인덱스를 사용하여 "delta" 배열에서 값을 가져오기
    var deltaValue = Math.abs(data.data.delta[maxCountIndex]);


    if (deltaValue >= 1 && deltaValue < 60) {
        resultTimeTerm = Math.floor(deltaValue % 60);
        $('#defaultResmplIntvlTp').val('S');
        $('#defaultResmplIntvlValue').val(resultTimeTerm);
    } else if (deltaValue >= 60 && deltaValue < 3600) {
        resultTimeTerm = Math.floor(deltaValue / 60);
        $('#defaultResmplIntvlTp').val('T');
        $('#defaultResmplIntvlValue').val(resultTimeTerm);
    } else if (deltaValue >= 3600 && deltaValue < 86400) {
        resultTimeTerm = Math.floor(deltaValue / 3600);
        $('#defaultResmplIntvlTp').val('H');
        $('#defaultResmplIntvlValue').val(resultTimeTerm);
    } else if (deltaValue >= 86400 && deltaValue < 2505600) {
        resultTimeTerm = Math.floor(deltaValue / 86400);
        $('#defaultResmplIntvlTp').val('D');
        $('#defaultResmplIntvlValue').val(resultTimeTerm);
    } else if (deltaValue >= 2505600 && deltaValue < 31536000) {
        resultTimeTerm = Math.floor(deltaValue / 2592000);
        $('#defaultResmplIntvlTp').val('M');
        $('#defaultResmplIntvlValue').val(resultTimeTerm);
    } else if (deltaValue >= 31536000 && deltaValue < 31536000) {
        //console.log('-------31536000-------')
        $('#defaultResmplIntvlTp').val('Y');
        $('#defaultResmplIntvlValue').val(resultTimeTerm);
    } else {
        $('#defaultResmplIntvlTp').val('D');
        $('#defaultResmplIntvlValue').val(resultTimeTerm);
    }

    //Y:년도, Q:분기, M:월, D:일, H:시
    //resmpl_intvl_tp
    //resmpl_intvl_value

    //alert(Number(validation_count))
    if (Number(validation_count) > 1) {
        resultType = '불분명';
    } else {
        if (deltaList[1] >= 1 && deltaList[1] < 60) {
            resultTimeTerm = Math.floor(deltaList[1] % 60);
            resultType = resultTimeTerm + '초 단위';
        } else if (deltaList[1] >= 60 && deltaList[1] < 3600) {
            resultTimeTerm = Math.floor(deltaList[1] / 60);
            resultType = resultTimeTerm + '분 단위';
        } else if (deltaList[1] >= 3600 && deltaList[1] < 86400) {
            resultTimeTerm = Math.floor(deltaList[1] / 3600);
            resultType = resultTimeTerm + '시간 단위';
        } else if (deltaList[1] >= 86400 && deltaList[1] < 2505600) {
            resultTimeTerm = Math.floor(deltaList[1] / 86400);
            resultType = resultTimeTerm + '일 단위';
        } else if (deltaList[1] >= 2505600 && deltaList[1] < 31536000) {
            resultTimeTerm = Math.floor(deltaList[1] / 2592000);
            resultType = resultTimeTerm + '개월 단위';
        } else if (deltaList[1] >= 31536000 && deltaList[1] < 31536000) {
            //console.log('-------31536000-------')
            resultTimeTerm = Math.floor(deltaList[1] / 31536000);
            resultType = resultTimeTerm + '년 단위';
        } else {
            resultType = '불분명';
        }
    }
    return resultType
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

function makeSimulationModelListTable(data, position_id, datatable_id) {
    var strHTML = '';

    strHTML += '		<table class="table" id="' + datatable_id + '">';
    strHTML += `<colgroup>
                                <col style="width: auto;">
                                <col style="width: 30%;">
                                <col style="width: 30%;">
                                <col style="width: auto;">
                                <col style="width: auto;">
                                <col style="width: auto;">
                                <col style="width: auto;">
                            </colgroup>`;
    strHTML += '			<thead>';
    strHTML += '				<tr>';
    strHTML += '        			<th>순번</th>';
    strHTML += '        			<th>모델명</th>';
    strHTML += '        			<th>모델설명</th>';
    strHTML += '        			<th>작업유형</th>';
    strHTML += '        			<th>작성자</th>';
    strHTML += '        			<th>등록일</th>';
    strHTML += '				</tr>';
    strHTML += '			</thead>';
    strHTML += '			<tbody class="table-text-nowrap">';

    $.each(data, function (index, item) {
        strHTML += '			   <tr>';
        strHTML += '					<td>' + (index + 1) + '</td>';
        strHTML += '					<td class="wrap">'
        strHTML += '                        <a href="#none" class="btn-select-simulation-model" data-model-seq="' + item.model_seq + '" data-model-nm="' + item.model_nm + '">' + item.model_nm;
        strHTML += '					</a>';
        strHTML += '					</td>'
        strHTML += '					<td class="wrap">' + (item.model_derpn != null ? item.model_derpn : '') + '</td>';
        strHTML += '					<td>' + item.status_nm + '</td>';
        strHTML += '					<td>' + item.user_id + '</td>';
        strHTML += '					<td>' + item.reg_dt_str + '</td>';
        strHTML += '			   </tr>';
    });

    strHTML += '			</tbody>';
    strHTML += '		</table>';

    $('#' + position_id).html(strHTML);
    return strHTML;
}

/**
 * @param selector
 * @param table_id
 * @param headers
 * @param datas
 * @param message
 * @param callback
 * @param equal_column header 사이즈와 맞춰서 데이터 배열 시각화 (Boolean)
 * */
function preProcessMakeHTMLExcludeDataTable(selector, table_id, headers, datas, message, callback, equal_column) {
    document.querySelector(selector).innerHTML = '';
    let wrapper = document.createElement('div');
    let classes = ['pt-3'];
    classes.forEach(function (_class) {
        wrapper.classList.add(_class);
    });

    if (message) {
        let messageElement = document.createElement('div');
        /*let messageElementClasses = ['mb-3'];
        messageElementClasses.forEach(function (_class) {
            messageElement.classList.add(_class);
        });*/
        messageElement.style.fontSize = '13px';
        messageElement.innerHTML = `${message}`;
        wrapper.appendChild(messageElement);
    }

    let table = document.createElement('table');
    table.id = table_id;
    table.style.width = `100%`;
    let tableClasses = ['data-table'];
    tableClasses.forEach(function (_class) {
        table.classList.add(_class);
    });

    let thead = document.createElement('thead');
    let thead_tr = document.createElement('tr');
    headers.forEach(function (column) {
        let th = document.createElement('th');
        th.innerHTML = `${column}`;
        thead_tr.appendChild(th);
    });
    thead.appendChild(thead_tr);
    table.appendChild(thead);

    let tbody = document.createElement('tbody');

    datas.forEach(function (data) {
        let tr = document.createElement('tr');
        data.forEach((column, index) => {
            if (equal_column && headers.length === index) {
                //헤더의 숫자와 index의 숫자가 같으면 data의 컬럼이 초과되었다는 뜻
                //해당 데이터는 버린다.
            } else {
                let td = document.createElement('td');
                td.innerHTML = `${column}`;
                tr.appendChild(td);
            }
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrapper.appendChild(table);
    document.querySelector(selector).appendChild(wrapper);
    callback(wrapper, headers, datas);
}

function makeUnitSelectRangeSelector(container, units) {
    let originSelectWrapper = document.createElement('div');
    ['col-6'].forEach(function (className) {
        originSelectWrapper.classList.add(className);
    });

    let originSelectLabel = document.createElement('label');
    ['col-form-label'].forEach(function (className) {
        originSelectLabel.classList.add(className);
    });
    originSelectLabel.innerHTML = `현재 단위`;
    originSelectLabel.setAttribute('for', 'select_unit_cd1');
    originSelectWrapper.appendChild(originSelectLabel);

    let originDropdownWrapper = document.createElement('div');
    ['dropdown-wrapper'].forEach(function (className) {
        originDropdownWrapper.classList.add(className);
    });

    let originDropdown = document.createElement('div');
    ['dropdown-box'].forEach(function (className) {
        originDropdown.classList.add(className);
    });

    let originDropdownButton = document.createElement('button');
    originDropdownButton.setAttribute('type', 'button');
    ['form-control', 'sm', 'dropdown-toggle'].forEach(function (className) {
        originDropdownButton.classList.add(className);
    });
    originDropdownButton.id = `select_unit_cd1`;
    originDropdownButton.addEventListener('click', dropdownToggleButtonClickEventListener);
    originDropdown.appendChild(originDropdownButton);

    let originDropdownLayer = document.createElement('div');
    ['dropdown-layer'].forEach(function (className) {
        originDropdownLayer.classList.add(className);
    });
    originDropdownLayer.id = `${originDropdownButton.id}_selection`;

    let originOptionUl = document.createElement('ul');
    ['option-list'].forEach(function (className) {
        originOptionUl.classList.add(className);
    });

    units.forEach(function (unit) {
        let optionLi = document.createElement('li');
        let input = document.createElement('input');
        let label = document.createElement('label');
        label.addEventListener('click', labelClickEventListener);
        input.setAttribute('type', 'radio');
        input.id = `input_${originDropdownButton.id}_${unit.unit_seq}`;
        input.name = `${originDropdownButton.id}_input`
        label.setAttribute('for', `input_${originDropdownButton.id}_${unit.unit_seq}`);
        input.value = `${unit.unit_seq}`;
        label.innerHTML = `${unit.unit_nm_1}`;
        optionLi.appendChild(input);
        optionLi.appendChild(label);
        originOptionUl.appendChild(optionLi);
    });
    originDropdownLayer.appendChild(originOptionUl);
    originDropdown.appendChild(originDropdownLayer);
    originDropdownWrapper.appendChild(originDropdown);
    originSelectWrapper.appendChild(originDropdownWrapper);
    container.appendChild(originSelectWrapper);
    closeLayerOnOutsideClick(Array.from(originDropdown ? [originDropdown] : []), '.dropdown-layer');

    //Change Dropdown
    let changeSelectWrapper = document.createElement('div');
    ['col-6'].forEach(function (className) {
        changeSelectWrapper.classList.add(className);
    });

    let changeSelectLabel = document.createElement('label');
    ['col-form-label'].forEach(function (className) {
        changeSelectLabel.classList.add(className);
    });
    changeSelectLabel.innerHTML = `변환 단위`;
    changeSelectLabel.setAttribute('for', 'select_unit_cd2');
    changeSelectWrapper.appendChild(changeSelectLabel);

    let changeDropdownWrapper = document.createElement('div');
    ['dropdown-wrapper'].forEach(function (className) {
        changeDropdownWrapper.classList.add(className);
    });

    let changeDropdown = document.createElement('div');
    ['dropdown-box'].forEach(function (className) {
        changeDropdown.classList.add(className);
    });

    let changeDropdownButton = document.createElement('button');
    changeDropdownButton.setAttribute('type', 'button');
    ['form-control', 'sm', 'dropdown-toggle'].forEach(function (className) {
        changeDropdownButton.classList.add(className);
    });
    changeDropdownButton.id = `select_unit_cd2`;
    changeDropdownButton.addEventListener('click', dropdownToggleButtonClickEventListener);
    changeDropdown.appendChild(changeDropdownButton);

    let changeDropdownLayer = document.createElement('div');
    ['dropdown-layer'].forEach(function (className) {
        changeDropdownLayer.classList.add(className);
    });
    changeDropdownLayer.id = `${changeDropdownButton.id}_selection`;

    let changeOptionUl = document.createElement('ul');
    ['option-list'].forEach(function (className) {
        changeOptionUl.classList.add(className);
    });

    units.forEach(function (unit) {
        let optionLi = document.createElement('li');
        let input = document.createElement('input');
        let label = document.createElement('label');
        label.addEventListener('click', labelClickEventListener);
        label.addEventListener('click', function (event) {
            let selectUnitCD2 = document.querySelector('#select_unit_cd2');
            let changeDropdownBox = selectUnitCD2.closest('.dropdown-box');
            let changeSelectedInput = changeDropdownBox.querySelector(`ul.option-list input[value="${selectUnitCD2.dataset.value}"]`);
            let changeSelectedLabel = changeDropdownBox.querySelector(`ul.option-list label[for="${changeSelectedInput.id}"]`);

            let selectUnitCD1 = document.querySelector('#select_unit_cd1');
            let dropdownBox = selectUnitCD1.closest('.dropdown-box');
            let selectedInput = dropdownBox.querySelector(`ul.option-list input:checked`);
            let selectedLabel = dropdownBox.querySelector(`ul.option-list label[for="${selectedInput.id}"]`);

            let sameSelectedInput = dropdownBox.querySelector(`ul.option-list input[value="${changeSelectedInput.value}"]`);
            let sameSelectedLabel = dropdownBox.querySelector(`ul.option-list label[for="${sameSelectedInput.id}"]`);
            if (changeSelectedInput.value !== selectedInput.value) {
                sameSelectedInput.checked = true;
                selectUnitCD1.innerHTML = `${sameSelectedLabel.textContent}`;
                selectUnitCD1.dataset.value = `${sameSelectedInput.value}`;
            }
        });
        input.setAttribute('type', 'radio');
        input.id = `input_${changeDropdownButton.id}_${unit.unit_seq}`;
        input.name = `${changeDropdownButton.id}_input`
        label.setAttribute('for', `input_${changeDropdownButton.id}_${unit.unit_seq}`);
        input.value = `${unit.unit_seq}`;
        label.innerHTML = `${unit.unit_nm_2}`;
        optionLi.appendChild(input);
        optionLi.appendChild(label);
        changeOptionUl.appendChild(optionLi);
    });
    changeDropdownLayer.appendChild(changeOptionUl);
    changeDropdown.appendChild(changeDropdownLayer);
    changeDropdownWrapper.appendChild(changeDropdown);
    changeSelectWrapper.appendChild(changeDropdownWrapper);
    container.appendChild(changeSelectWrapper);
    closeLayerOnOutsideClick(Array.from(changeDropdown ? [changeDropdown] : []), '.dropdown-layer');

    if (originDropdownButton) {
        observeDataValueChange(originDropdownButton, function (targetElement, newValue) {
            console.log('observeDataValueChange Callback', targetElement, newValue);
            let selectUnitCD2 = document.querySelector('#select_unit_cd2');
            let dropdownBox = selectUnitCD2.closest('.dropdown-box');
            let selectedInput = dropdownBox.querySelector(`input[value="${newValue}"]`);
            let selectedLabel = dropdownBox.querySelector(`label[for="${selectedInput.id}"]`);
            if (selectedInput) {
                selectedInput.checked = true;
                selectUnitCD2.innerHTML = `${selectedLabel.textContent}`;
                selectUnitCD2.dataset.value = `${selectedInput.value}`;
            }
        });
    }

    let originFirstOption = originOptionUl.querySelector('li:first-child');
    let originFirstLabel = originFirstOption.querySelector('label');
    originFirstLabel.click();

    let changeFirstOption = changeOptionUl.querySelector('li:first-child');
    let changeFirstLabel = changeFirstOption.querySelector('label');
    changeFirstLabel.click();
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
                            case 'windowSize':
                            case 'window_size': {
                                inputColContentHTML = `<input type="number" class="form-control sm number_only" id="${parameter.model_params_item}" placeholder="${parameter.model_params_derpn}" value="${parameter.model_params_item_crtr_1}" required="required">
                                                       <div class="form-message-wrap" id="${parameter.model_params_item}_desc">
                                                           <span class="form-message ico">${parameter.model_params_derpn}</span>
                                                       </div>`;
                                break;
                            }
                            case 'batchSize':
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
                            case 'dataSize':
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
                            case 'segment_len': {
                                inputColContentHTML = `<input type="number" class="form-control sm number_only" id="${parameter.model_params_item}" placeholder="${parameter.model_params_derpn}"  value="${parameter.model_params_item_crtr_1}" required="required">
                                                       <div class="form-message-wrap" id="${parameter.model_params_item}_desc">
                                                           <span class="form-message ico">${parameter.model_params_derpn}</span>
                                                       </div>`;
                                break;
                            }
                            case 'num_segments': {
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
                            case 'windowSize':
                            case 'window_size': {
                                inputColContentHTML = `<input type="number" class="form-control sm number_only" id="${parameter.model_params_item}" placeholder="${parameter.model_params_derpn}" value="${parameter.model_params_item_value}" required="required">
                                                       <div class="form-message-wrap" id="${parameter.model_params_item}_desc">
                                                           <span class="form-message ico">${parameter.model_params_derpn}</span>
                                                       </div>`;
                                break;
                            }
                            case 'batchSize':
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
                            case 'dataSize':
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
                            case 'num_segments': {
                                inputColContentHTML = `<input type="number" class="form-control sm number_only" id="${parameter.model_params_item}" placeholder="${parameter.model_params_derpn}" value="${parameter.model_params_item_value}" required="required">
                                                       <div class="form-message-wrap" id="${parameter.model_params_item}_desc">
                                                           <span class="form-message ico">${parameter.model_params_derpn}</span>
                                                       </div>`;
                                break;
                            }
                            case 'segment_len': {
                                inputColContentHTML = `<input type="number" class="form-control sm number_only" id="${parameter.model_params_item}" placeholder="${parameter.model_params_derpn}" value="${parameter.model_params_item_value}" required="required">
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
            //설정 값이 존재하지 않을 때
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
                //설정 값이 존재 할때
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
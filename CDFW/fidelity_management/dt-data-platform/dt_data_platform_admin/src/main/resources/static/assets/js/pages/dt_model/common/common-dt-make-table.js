'use strict'

$(document).ready(function () {
    $(document).on('change', '#chkAllCol', function () {
        //$('#chkAll').on('change', function(e) {
        $('input[name="dataSetColumnArr"]').attr('checked', $(this).is(':checked'));
    });
});

function makeHtmlTable(header_data, data, position_id, filter_yn, datatable_id, count, start_date, end_date) {
    var preProcData = JSON.parse($('#preprocProPerty').val());
    var target_row_count = preProcData.preproc_property_info[0].target_row_count;
    var index_trgt_col = $('#index_trgt_col').val();

    var strHTML = '';
    strHTML += '				<div class="col-md-12 grid-margin  stretch-card">';
    strHTML += '				<div class="card">';
    strHTML += '					<div class="card-body table-scroll-parent">';
    strHTML += '';

    if (filter_yn == 'Y') {
        strHTML += `<div class="mb-2" style="color: red;">*조회 버튼을 클릭하여 시계열 컬럼과 데이터 범위를 지정하세요. 시계열 컬럼이 아닌 다른 컬럼을 선택시 에러가 발생합니다.</div>`;
        strHTML += '						<h6 id="sample_desc" class="card-title">미리보기로 1000개 이하만 보입니다.</h6>';
        strHTML += '						<div class="form-group">';
        strHTML += '						    <div class="row">';
        strHTML += '				        		<div class="col">';
        strHTML += '								시계열 컬럼:<select class="form-control" id="index_trgt_col">';
        strHTML += '									<option value="0">선택</option>';
        if (typeof index_trgt_col === 'undefined') {
            $.each(header_data, function (idx, item) {
                strHTML += '									<option value=' + item + '>' + item + '</option>';
            });
        } else {
            $.each(header_data, function (idx, item) {
                if (item == index_trgt_col) {
                    strHTML += '<option selected value=' + item + '>' + item + '</option>';
                } else {
                    strHTML += '<option value=' + item + '>' + item + '</option>';
                }

            });

        }
        strHTML += '								</select>';
        strHTML += '				        		</div>';
        let startDatePickerDate = `<div class="col">
                                            시작일
                                            <input type="text" placeholder="시작일" value="${start_date ? start_date : ''}" class="form-control" id="target_start_date">
                                            <span class="input-group-addon bg-transparent"><i data-feather="calendar" class=" text-primary"></i></span>
                                          </div>`;
        let endDatePickerDate = `<div class="col">
                                            종료일
                                            <input type="text" placeholder="종료일" value="${end_date ? end_date : ''}" class="form-control" id="target_end_date">
                                            <span class="input-group-addon bg-transparent"><i data-feather="calendar" class=" text-primary"></i></span>
                                        </div>`;
        strHTML += startDatePickerDate;
        strHTML += endDatePickerDate;
        strHTML += '				        		<div class="col">';

        if (target_row_count == null) {
            strHTML += '				           			갯수<font color="red"><b>(0 입력시 전체데이터)</b></font>:<input type="number" id="target_row_count" value="1000" class="form-control">';
        } else {
            strHTML += '				           			갯수<font color="red"><b>(0 입력시 전체데이터)</b></font>:<input type="number" id="target_row_count" value="' + target_row_count + '" class="form-control">';
        }


        strHTML += '				        		</div>';
        strHTML += '				        		<div class="col">';
        strHTML += '				           			조회:<button type="button" class="form-control btn btn-dark btn-set-data-preview">조회</button>';
        strHTML += '				        		</div>';
        strHTML += '						    </div>';
        strHTML += '						</div>';
    }

    //console.log(position_id)
    if (position_id == 'preprocTableRange') {
        strHTML += '							<h6>전처리 데이터</h6>';
    }

    strHTML += '							<table class="table" style="width: 100%;" id="' + datatable_id + '">';
    strHTML += '								<thead>';
    strHTML += '									<tr>';
    $.each(header_data, function (i) {
        strHTML += '	<td>' + header_data[i].replace(/\"/gi, "") + '</td>';
    });
    strHTML += '									</tr>';
    strHTML += '								</thead>';
    strHTML += '								<tbody>';
    $.each(data, function (i, row) {
        strHTML += '									<tr>';
        $.each(row, function (j, cell) {
            strHTML += '<td>' + cell.replace(/\"/gi, "") + '</td>';
        });
        strHTML += '									</tr>';
    });
    strHTML += '								</tbody>';
    strHTML += '							</table>';
    strHTML += '						</div>';
    strHTML += '	      			</div>';
    strHTML += '            	</div>';
    strHTML += '			</div>';

    $('#' + position_id).html(strHTML);
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

function makeDataSetInfo(ds, position_id) {
    var data = ds.data.info;
    var header_list = ds.data.columns;

    var objCnt = 0;
    var strHTML = '';

    strHTML += '<div class="col-md-12 grid-margin  stretch-card">';
    strHTML += '	<div class="card">';
    strHTML += '	<div class="card-body">';


    strHTML += '	<h6 class="card-title">컬럼 정보 : 작업할 컬럼을 필수로 지정해야 합니다.</h6>';

    strHTML += '	<div class="table-responsive">';
    strHTML += '		<table class="table" id="preProcDatatableColumnInfo">';
    strHTML += '			<thead>';
    strHTML += '				<tr>';
    strHTML += '        			<th><input type="checkbox" class="preprocCheck" id="chkAllCol"></th>';
    strHTML += '        			<th>col</th>';
    strHTML += '        			<th>dtype</th>';
    strHTML += '        			<th>min</th>';
    strHTML += '        			<th>max</th>';
    strHTML += '        			<th>unique</th>';
    strHTML += '        			<th>duplicate</th>';
    strHTML += '        			<th>nan</th>';
    strHTML += '        			<th>std</th>';
    strHTML += '				</tr>';
    strHTML += '			</thead>';
    strHTML += '			<tbody>';


    for (var i = 0; i < data.length; i++) {
        var obj = JSON.parse(data[i]);
        var header_list = Object.keys(obj); // 모든 키 가져오기
        for (var j = 0; j < header_list.length; j++) {
            var header = header_list[j];
            var col = header;
            var dtype = obj[header] !== undefined && obj[header].dtype !== undefined ? obj[header].dtype : 'null';
            var min = obj[header] !== undefined && obj[header].min !== undefined ? obj[header].min : 'null';
            var max = obj[header] !== undefined && obj[header].max !== undefined ? obj[header].max : 'null';
            var unique = obj[header] !== undefined && obj[header].unique !== undefined ? obj[header].unique : 'null';
            var duplicate = obj[header] !== undefined && obj[header].duplicate !== undefined ? obj[header].duplicate : 'null';
            var nan = obj[header] !== undefined && obj[header].nan !== undefined ? obj[header].nan : 'null';
            var std = obj[header] !== undefined && obj[header].std !== undefined ? obj[header].std : 'null';

            strHTML += '<tr>';
            strHTML += '<th><input type="checkbox" class="preprocCheck" name="dataSetColumnArr" id="preprocCheck' + i + '" value="' + header + '"></th>';
            strHTML += '<td>' + col + '</td>';
            strHTML += '<td>' + (dtype === null ? 'null' : dtype) + '</td>';
            strHTML += '<td>' + (min === null ? 'null' : min) + '</td>';
            strHTML += '<td>' + (max === null ? 'null' : max) + '</td>';
            strHTML += '<td>' + (unique === null ? 'null' : unique) + '</td>';
            strHTML += '<td>' + (duplicate === null ? 'null' : duplicate) + '</td>';
            strHTML += '<td>' + (nan === null ? 'null' : nan) + '</td>';
            strHTML += '<td>' + (std === null ? 'null' : std) + '</td>';
            strHTML += '</tr>';
        }
    }
    strHTML += '			</tbody>';
    strHTML += '		</table>';
    strHTML += '	</div>';
    strHTML += '	</div>';

    if ($('#formType').val() == 'I') {
        strHTML += '						<div class="form-group">';
        strHTML += '				        		<div class="col" style="width: 15%;">';
        strHTML += '				           			<button type="button" class="form-control btn btn-success btn-set-column-select-view">확인(미리보기)</button>';
        strHTML += '				        		</div>';
        strHTML += '						</div>';
    }

    strHTML += '</div>';


    $('#' + position_id).html(strHTML);
    //alert(objCnt);
    return strHTML;
}

// 키를 찾는 함수
function isObjectKey(obj, targetKey) {
    for (const key in obj) {
        if (key === targetKey) {
            return true; // 키를 찾으면 해당 값을 반환
        }
    }
    return false; // 키가 없으면 null 반환
}

function makeDataSetInfoValidate(ds, position_id) {
    console.log('ds', ds);
    var data = ds.data.info;
    var header_list = ds.data.columns;

    let tableWrapper = document.createElement('div');
    tableWrapper.classList.add('table-responsive');
    let table = document.createElement('table');
    table.id = 'preProcDatatable';
    table.classList.add('table');
    let thead = document.createElement('thead');
    let tr = document.createElement('tr');
    let orderTh = document.createElement('th');
    orderTh.innerHTML = `#`;
    let columnTh = document.createElement('th');
    columnTh.innerHTML = `column`;
    let typeTh = document.createElement('th');
    typeTh.innerHTML = `type`;
    tr.appendChild(orderTh);
    tr.appendChild(columnTh);
    tr.appendChild(typeTh);
    thead.appendChild(tr);
    table.appendChild(thead);
    let tbody = document.createElement('tbody');
    header_list.forEach(function (header, index) {
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
    $('#' + position_id).html(``);
    $('#' + position_id).append(tableWrapper);
    return true;
}

function makeDataSetInfoInterpolate(ds, position_id) {
    console.log('ds', ds);
    var data = ds.data.info;
    var header_list = ds.data.columns;

    var totalNaN = 0;

    var objCnt = 0;
    var strHTML = '';

    strHTML += '	<div class="table-responsive">';
    strHTML += '		<table class="table" id="preProcDatatable">';
    strHTML += '			<thead>';
    strHTML += '				<tr>';
    strHTML += '        			<th>#</th>';
    strHTML += '        			<th>column</th>';
    strHTML += '        			<th>count</th>';
    strHTML += '				</tr>';
    strHTML += '			</thead>';
    strHTML += '			<tbody>';

    for (var i = 0; i < data.length; i++) {
        strHTML += '   				<tr>';
        var obj = JSON.parse(data[i]);
        var header = header_list[i];
        if (obj.hasOwnProperty(header)) {
            var col = header;
            var dtype = obj[header].dtype;
            var min = obj[header].min;
            var max = obj[header].max;
            var unique = obj[header].unique;
            var duplicate = obj[header].duplicate;
            var nan = obj[header].nan;
            var std = obj[header].std;
            strHTML += '					<td>' + (i + 1) + '</td>';
            strHTML += '					<td>' + col + '</td>';
            strHTML += '					<td>' + nan + '</td>';
            if (nan > 0) { // NaN 값이 0보다 클 경우에만 totalNaN에 더함
                totalNaN += nan;
            }
        }
        strHTML += '    			</tr>';
    }
    strHTML += '			</tbody>';
    strHTML += '		</table>';
    strHTML += '		<input type="hidden" id="totalNaN" value="' + totalNaN + '">';
    strHTML += '</div>';
    $('#' + position_id).html(strHTML);
    return strHTML;
}

function makeHeader(ds, position_id, col) {
    console.log('makeHeader', ds, position_id, col);
    var data = ds.data.info;
    var header_list = ds.data.columns;

    var strHTML = '';

    strHTML += '		컬럼 선택:';
    if (position_id === 'preProcOutlierTargetCol') {
        strHTML += '		<select class="w-100  unit-select-box" id="select_outlier_target_col">';
    } else if (position_id === 'preProcUnitTargetCol') {
        strHTML += '		<select class="w-100  unit-select-box" id="select_unit_target_col">';
    } else if (position_id === 'preProcResampleTargetCol') {
        strHTML += '		<select class="w-100  unit-select-box" id="select_valid_target_col">';
    } else {
        strHTML += '		<select class="w-100  unit-select-box" id="select_valid_target_col">';
    }

    strHTML += '			<option value="0">선택</option>';
    for (var i = 0; i < header_list.length; i++) {
        if (header_list[i].replace(/\"/gi, "") == col) {
            strHTML += '			<option selected value="' + header_list[i].replace(/\"/gi, "") + '">' + header_list[i].replace(/\"/gi, "") + '</option>';
        } else {
            strHTML += '			<option value="' + header_list[i].replace(/\"/gi, "") + '">' + header_list[i].replace(/\"/gi, "") + '</option>';
        }
    }
    strHTML += '			</select>';

    $('#' + position_id).html(strHTML);
    //alert(objCnt);
    return strHTML.length !== 0 ? true : false;
}

function makeDataSetStatisticsHeader(ds, position_id, col) {
    var data = ds.data.info;
    var header_list = ds.data.columns;

    var objCnt = 0;
    var strHTML = '';

    strHTML += '<div class=grid-margin  stretch-card">';
    strHTML += '	<div class="card">';
    strHTML += '	<div class="card-body">';


    strHTML += '	<label class="label-a">Statistics</label>';
    strHTML += '		<select class="w-40 select-a preproc_statistics"  id="preproc_statistics" style="display: inline-block;margin: auto;">';
    strHTML += '			<option value="0">선택</option>';
    for (var i = 0; i < header_list.length; i++) {
        if (header_list[i].replace(/\"/gi, "") == col) {
            strHTML += '			<option selected value="' + header_list[i].replace(/\"/gi, "") + '">' + header_list[i].replace(/\"/gi, "") + '</option>';
        } else {
            strHTML += '			<option value="' + header_list[i].replace(/\"/gi, "") + '">' + header_list[i].replace(/\"/gi, "") + '</option>';
        }
    }
    strHTML += '			</select>';

    strHTML += '	<div class="table-responsive">';
    strHTML += '		<table class="table" id="preProcDatatable">';
    strHTML += '			<thead>';
    strHTML += '				<tr>';
    strHTML += '        			<th>ITEM</th>';
    strHTML += '        			<th>VALUE</th>';
    strHTML += '				</tr>';
    strHTML += '			</thead>';

    strHTML += makeDataSetStatisticsBody(ds, col)

    strHTML += '		</table>';
    strHTML += '	</div>';
    strHTML += '	</div>';
    strHTML += '</div>';


    $('#' + position_id).html(strHTML);
    //alert(objCnt);
    return strHTML;
}

function makeDataSetStatisticsBody(ds, col) {
    var data = ds.data.info;
    var strHTML = '';


    //특수기호 키호출 불가
    var per25 = '25%';
    var per50 = '50%';
    var per75 = '75%';

    for (var i = 0; i < data.length; i++) {
        var obj = JSON.parse(data[i]);


        if (obj.hasOwnProperty(col)) {
            var count = obj[col].count;
            var mean = obj[col].mean;
            var std = obj[col].std;
            var min = obj[col].min;
            var per25 = obj[col][per25];
            var per50 = obj[col][per50];
            var per75 = obj[col][per75];
            var max = obj[col].max;

            strHTML += '			<tbody>';
            strHTML += '				<tr>';
            strHTML += '					<td>Count</td>';
            strHTML += '					<td>' + count + '</td>';
            strHTML += '			</tr>';
            strHTML += '			<tr>';
            strHTML += '				<td>Average</td>';
            strHTML += '				<td>' + mean + '</td>';
            strHTML += '			</tr>';
            strHTML += '			<tr>';
            strHTML += '				<td>Standard Deviation</td>';
            strHTML += '				<td>' + std + '</td>';
            strHTML += '			</tr>';
            strHTML += '			<tr>';
            strHTML += '				<td>Min</td>';
            strHTML += '				<td>' + min + '</td>';
            strHTML += '			</tr>';
            strHTML += '			<tr>';
            strHTML += '				<td>25%</td>';
            strHTML += '				<td>' + per25 + '</td>';
            strHTML += '			</tr>';
            strHTML += '			<tr>';
            strHTML += '				<td>50%</td>';
            strHTML += '				<td>' + per50 + '</td>';
            strHTML += '			</tr>';
            strHTML += '			<tr>';
            strHTML += '				<td>75%</td>';
            strHTML += '				<td>' + per75 + '</td>';
            strHTML += '			</tr>';
            strHTML += '			<tr>';
            strHTML += '				<td>Max</td>';
            strHTML += '				<td>' + max + '</td>';
            strHTML += '			</tr>';
        }
    }


    return strHTML;
}

function makeDataSetHistogramHeader(ds, position_id, col) {
    var data = ds.data.range;
    var header_list = ds.data.columns;

    var objCnt = 0;
    var strHTML = '';

    strHTML += '<div class="grid-margin stretch-card">';
    strHTML += '	<div class="card">';
    strHTML += '	<div class="card-body">';


    strHTML += '	<label class="label-a">Histogram</label>';
    strHTML += '		<select class="w-40 select-a preproc_histogram"  id="preproc_histogram" style="display: inline-block;margin: auto;">';
    strHTML += '			<option value="0">선택</option>';
    for (var i = 0; i < header_list.length; i++) {
        if (header_list[i].replace(/\"/gi, "") == col) {
            strHTML += '			<option selected value="' + header_list[i].replace(/\"/gi, "") + '">' + header_list[i].replace(/\"/gi, "") + '</option>';
        } else {
            strHTML += '			<option value="' + header_list[i].replace(/\"/gi, "") + '">' + header_list[i].replace(/\"/gi, "") + '</option>';
        }
    }
    strHTML += '			</select>';

    strHTML += '	<div class="table-responsive">';
    strHTML += '		<table class="table" id="preProcDatatable">';
    strHTML += '			<thead>';
    strHTML += '				<tr>';
    strHTML += '        			<th>RANGE</th>';
    strHTML += '        			<th>COUNT</th>';
    strHTML += '				</tr>';
    strHTML += '			</thead>';

    strHTML += makeDataSetHistogramBody(ds, col)

    strHTML += '		</table>';
    strHTML += '	</div>';
    strHTML += '	</div>';
    strHTML += '</div>';


    $('#' + position_id).html(strHTML);
    //alert(objCnt);
    return strHTML;
}

function makeDataSetHistogramBody(ds, col) {
    var data = ds.data.range;
    var strHTML = '';

    for (var i = 0; i < data.length; i++) {
        var obj = JSON.parse(data[i]);

        if (obj.hasOwnProperty(col)) {
            var target_col = obj[col];
            strHTML += '			<tbody>';
            for (var key in target_col) {
                strHTML += '				<tr>';
                strHTML += '					<td>' + key + '</td>';
                var value = target_col[key];
                strHTML += '					<td>' + value + '</td>';
                strHTML += '				<tr>';
            }
            strHTML += '			</tbody>';

        }
    }

    return strHTML;
}

//가져온 메타에 대한 원본 데이터에서 필터를 지정해서 실제 작업에 사용할 데이터
function getTargetDataSetInfo(base_file_path, base_file_nm, index_trgt_col, main_info_yn, proc_type) {
    console.log('base_file_path, base_file_nm, index_trgt_col, main_info_yn, proc_type', base_file_path, base_file_nm, index_trgt_col, main_info_yn, proc_type);
    var form_type = $('#formType').val();
    var data = {
        base_file_path: base_file_path,
        base_file_nm: base_file_nm,
        index_trgt_col: index_trgt_col,
        form_type: form_type,
        proc_type: proc_type
    }

    console.log('data', data);

    $.ajax({
        type: 'POST',
        async: false, //enctype: 'multipart/form-data',
        url: '/dt/model/getDataSetInfo',
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8;",
        dataType: "json",
        success: function (result) {
            console.log('result', result);
            if (result.code === 200) {
                var data_list = JSON.parse(result.data);
                var header_list = data_list.data.columns;

                uriEncodingParameter(data_list, 'dataList')
                uriEncodingParameter(header_list, 'headerList')

                console.log('main_info_yn', main_info_yn);
                console.log('header_list', header_list);
                console.log('data_list', data_list);
                console.log('data', data);
                if (main_info_yn === 'Y') {
                    makeDataSetInfo(data_list, 'dataSetInfoRange');
                    makeDataSetStatisticsHeader(data_list, 'dataSetStatisticsRange', header_list[0]);
                    makeDataSetHistogramHeader(data_list, 'dataSetHistogramRange', header_list[0]);

                    histogramChartView(header_list[0], data_list);
                } else {
                    console.log('proc_type', proc_type, 'header_list[0]', header_list[0]);
                    let logicStartCheck = false;
                    if (proc_type === 'validate') {
                        console.log('validate');
                        let check = makeDataSetInfoValidate(data_list, 'tab_missing_table_range_valid');
                        console.log('makeDataSetInfoValidate check', check);
                        makeHeader(data_list, 'preProcValidTargetCol', header_list[0]);
                        console.log('data_list', data_list, 'header_list[0]', header_list[0]);
                        logicStartCheck = true;
                    } else if (proc_type === 'outlier') {
                        console.log('outlier');
                        makeHeader(data_list, 'preProcOutlierTargetCol', header_list[0]);

                        const data = [];
                        for (const item of result.etc_outlier_list) {
                            data.push({
                                etc_model_nm: item.etc_model_nm + '(AE)',
                                trgt_col: item.etc_model_tp + '|' + item.etc_model_seq + '|' + item.trgt_col + '|' + item.window_size
                            });
                        }

                        /**
                         * 2024-07-22
                         * 선택 옵션 초기화 로직 진행
                         * @author 김우식
                         * @description 선택 옵션을 기존 0, standard, kmean, dbscan을 제외하고 옵션을 제거 후 다시 추가로 변경
                         * */
                        const selectElement = document.getElementById('select_outlier_option');
                        const options = selectElement.querySelectorAll('option[value]');
                        const baseOptionValues = ['0', 'standard', 'kmean', 'dbscan'];
                        options.forEach(option => {
                            if (!baseOptionValues.includes(option.value)) {
                                option.remove();
                            }
                        });
                        for (const item of data) {
                            const option = document.createElement('option');
                            option.value = item.trgt_col;
                            option.textContent = item.etc_model_nm;
                            selectElement.appendChild(option);
                        }
                    } else if (proc_type === 'resample') {
                        console.log('resample');
                        makeHeader(data_list, 'preProcResampleTargetCol', header_list[0]);
                    } else if (proc_type === 'unit') {
                        console.log('unit');
                        makeHeader(data_list, 'preProcUnitTargetCol', header_list[0]);
                    } else {
                        console.log('others');
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
                        console.log('table', table);

                        const data = [];
                        let jsonValue, featureCols = [];
                        for (const item of result.etc_interpolate_list) {
                            switch (item.etc_model_tp) {
                                case 'random forest':
                                    jsonValue = JSON.parse(item.user_pprcs_full_stng_value);
                                    featureCols = jsonValue.preproc_property_info[0].model_property[0].feature_cols;
                                    console.log('featureCols', featureCols);
                                    data.push({
                                        etc_model_nm: item.etc_model_nm + '(RF)',
                                        trgt_col: item.etc_model_tp + '|' + item.etc_model_seq + '|' + item.trgt_col + '|' + featureCols.map(item => `${item}(F)`).join(', '),
                                        output_col: item.trgt_col,
                                        etc_model_seq: item.etc_model_seq,
                                        feature_cols: featureCols.map(item => `${item}`).join(', ')
                                    });
                                    break;
                                case 'brits':
                                    jsonValue = JSON.parse(item.user_pprcs_full_stng_value);
                                    data.push({
                                        etc_model_nm: item.etc_model_nm + '(Brits)',
                                        trgt_col: item.etc_model_tp + '|' + item.etc_model_seq + '|' + item.trgt_col,
                                        output_col: item.trgt_col,
                                        etc_model_seq: item.etc_model_seq,
                                        feature_cols: []
                                    });
                                    break;
                                case 'naomi':
                                    jsonValue = JSON.parse(item.user_pprcs_full_stng_value);
                                    data.push({
                                        etc_model_nm: item.etc_model_nm + '(Naomi)',
                                        trgt_col: item.etc_model_tp + '|' + item.etc_model_seq + '|' + item.trgt_col,
                                        output_col: item.trgt_col,
                                        etc_model_seq: item.etc_model_seq,
                                        feature_cols: []
                                    });
                                    break;
                                default:
                                    jsonValue = JSON.parse(item.user_pprcs_full_stng_value);
                                    data.push({
                                        etc_model_nm: item.etc_model_nm + '(default)',
                                        trgt_col: item.etc_model_tp + '|' + item.etc_model_seq + '|' + item.trgt_col,
                                        output_col: item.trgt_col,
                                        etc_model_seq: item.etc_model_seq,
                                        feature_cols: []
                                    });
                                    break;
                            }
                        }

                        /**
                         * 2024-09-24
                         * 선택 옵션 초기화(Interpolate) 로직 진행
                         * @author 김우식
                         * @description 선택 옵션을 기존 옵션 제외 초기화(0, linear, slinear, time, spline, decisiontree)
                         * */
                        const selectElement = document.getElementById('select_interpolate');
                        const options = selectElement.querySelectorAll('option[value]');
                        const baseOptionValues = ['0', 'linear', 'slinear', 'time', 'spline', 'decisiontree'];
                        options.forEach(option => {
                            if (!baseOptionValues.includes(option.value)) {
                                option.remove();
                            }
                        });
                        for (const item of data) {
                            const option = document.createElement('option');
                            option.value = item.trgt_col;
                            option.textContent = item.etc_model_nm;
                            option.dataset.feature_cols = item.feature_cols;
                            option.dataset.output_col = item.output_col;
                            option.dataset.etc_model_seq = item.etc_model_seq;
                            selectElement.appendChild(option);
                        }
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

                        console.log('errorModal', errorModal);
                        $(errorModal).modal('show');
                    } else {
                        console.error('errorModal could not find');
                        alert('에러가 발생하였습니다. 관리자에게 문의해주세요.');
                    }
                } else {
                    console.error('error : ', 'errorModal could not find');
                    alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                }
            }
        },
        error: function (xhr, status, error) {
            console.error('error : ', error);
            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
        }
    });
}

//가져온 메타에 대한 원본 데이터에서 필터를 지정해서 실제 작업에 사용할 데이터 Callback 버전
function getTargetDataSetInfoCallbackFunction(base_file_path, base_file_nm, index_trgt_col, main_info_yn, proc_type, callback, option) {
    let form_type = $('#formType').val();
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
        url: '/dt/model/getDataSetInfo',
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8;",
        dataType: "json",
        success: function (result) {
            console.log('result', result);
            closeProgressBar({element: null, process_id: 'process-19'});
            if (result.code === 200) {
                var data_list = JSON.parse(result.data);
                var header_list = data_list.data.columns;

                uriEncodingParameter(data_list, 'dataList')
                uriEncodingParameter(header_list, 'headerList')

                console.log('main_info_yn', main_info_yn);
                console.log('header_list', header_list);
                console.log('data_list', data_list);
                console.log('data', data);
                if (main_info_yn === 'Y') {
                    makeDataSetInfo(data_list, 'dataSetInfoRange');
                    makeDataSetStatisticsHeader(data_list, 'dataSetStatisticsRange', header_list[0]);
                    makeDataSetHistogramHeader(data_list, 'dataSetHistogramRange', header_list[0]);

                    histogramChartView(header_list[0], data_list);
                } else {
                    console.log('proc_type', proc_type, 'header_list', header_list);
                    let logicStartCheck = false;
                    if (proc_type === 'validate') {
                        console.log('validate');
                        let check = makeDataSetInfoValidate(data_list, 'tab_missing_table_range_valid');
                        console.log('makeDataSetInfoValidate check', check);
                        makeHeader(data_list, 'preProcValidTargetCol', header_list[0]);
                        console.log('data_list', data_list, 'header_list[0]', header_list[0]);
                        logicStartCheck = true;
                    } else if (proc_type === 'outlier') {
                        console.log('outlier');
                        makeHeader(data_list, 'preProcOutlierTargetCol', header_list[0]);

                        const data = [];
                        for (const item of result.etc_outlier_list) {
                            data.push({
                                etc_model_nm: item.etc_model_nm + '(AE)',
                                trgt_col: item.etc_model_tp + '|' + item.etc_model_seq + '|' + item.trgt_col + '|' + item.window_size
                            });
                        }
                        /**
                         * 2024-07-22
                         * 선택 옵션 초기화 로직 진행
                         * @author 김우식
                         * @description 선택 옵션을 기존 0, standard, kmean, dbscan을 제외하고 옵션을 제거 후 다시 추가로 변경
                         * */
                        const selectElement = document.getElementById('select_outlier_option');
                        const options = selectElement.querySelectorAll('option[value]');
                        const baseOptionValues = ['0', 'standard', 'kmean', 'dbscan'];
                        options.forEach(option => {
                            if (!baseOptionValues.includes(option.value)) {
                                option.remove();
                            }
                        });
                        for (const item of data) {
                            const option = document.createElement('option');
                            option.value = item.trgt_col;
                            option.textContent = item.etc_model_nm;
                            selectElement.appendChild(option);
                        }
                    } else if (proc_type === 'resample') {
                        console.log('resample');
                        makeHeader(data_list, 'preProcResampleTargetCol', header_list[0]);
                    } else if (proc_type === 'unit') {
                        console.log('unit');
                        makeHeader(data_list, 'preProcUnitTargetCol', header_list[0]);
                    } else {
                        console.log('others : interpolate');
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
                        console.log('table', table);

                        const data = [];
                        let jsonValue, featureCols = [];
                        for (const item of result.etc_interpolate_list) {
                            switch (item.etc_model_tp) {
                                case 'random forest':
                                    jsonValue = JSON.parse(item.user_pprcs_full_stng_value);
                                    featureCols = jsonValue.preproc_property_info[0].model_property[0].feature_cols;
                                    console.log('featureCols', featureCols);
                                    data.push({
                                        etc_model_nm: item.etc_model_nm + '(RF)',
                                        trgt_col: item.etc_model_tp + '|' + item.etc_model_seq + '|' + item.trgt_col + '|' + featureCols.map(item => `${item}(F)`).join(', '),
                                        output_col: item.trgt_col,
                                        etc_model_seq: item.etc_model_seq,
                                        feature_cols: featureCols.map(item => `${item}`).join(', ')
                                    });
                                    break;
                                case 'brits':
                                    jsonValue = JSON.parse(item.user_pprcs_full_stng_value);
                                    data.push({
                                        etc_model_nm: item.etc_model_nm + '(Brits)',
                                        trgt_col: item.etc_model_tp + '|' + item.etc_model_seq + '|' + item.trgt_col,
                                        output_col: item.trgt_col,
                                        etc_model_seq: item.etc_model_seq,
                                        feature_cols: []
                                    });
                                    break;
                                case 'naomi':
                                    jsonValue = JSON.parse(item.user_pprcs_full_stng_value);
                                    data.push({
                                        etc_model_nm: item.etc_model_nm + '(Naomi)',
                                        trgt_col: item.etc_model_tp + '|' + item.etc_model_seq + '|' + item.trgt_col,
                                        output_col: item.trgt_col,
                                        etc_model_seq: item.etc_model_seq,
                                        feature_cols: []
                                    });
                                    break;
                                default:
                                    jsonValue = JSON.parse(item.user_pprcs_full_stng_value);
                                    data.push({
                                        etc_model_nm: item.etc_model_nm + '(default)',
                                        trgt_col: item.etc_model_tp + '|' + item.etc_model_seq + '|' + item.trgt_col,
                                        output_col: item.trgt_col,
                                        etc_model_seq: item.etc_model_seq,
                                        feature_cols: []
                                    });
                                    break;
                            }
                        }
                        if (!option) {
                            /**
                             * 2024-09-24
                             * 선택 옵션 초기화(Interpolate) 로직 진행
                             * @author 김우식
                             * @description 선택 옵션을 기존 옵션 제외 초기화(0, linear, slinear, time, spline, decisiontree)
                             * */
                            const selectElement = document.getElementById('select_interpolate');
                            const options = selectElement.querySelectorAll('option[value]');
                            const baseOptionValues = ['0', 'linear', 'slinear', 'time', 'spline', 'decisiontree'];
                            options.forEach(option => {
                                if (!baseOptionValues.includes(option.value)) {
                                    option.remove();
                                }
                            });
                            for (const item of data) {
                                const option = document.createElement('option');
                                option.value = item.trgt_col;
                                option.textContent = item.etc_model_nm;
                                option.dataset.feature_cols = item.feature_cols;
                                option.dataset.output_col = item.output_col;
                                option.dataset.etc_model_seq = item.etc_model_seq;
                                selectElement.appendChild(option);
                            }
                        }
                    }
                }
                console.log('callback execute');
                callback(result);
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

                        console.log('errorModal', errorModal);
                        $(errorModal).modal('show');
                    } else {
                        console.error('errorModal could not find');
                        alert('에러가 발생하였습니다. 관리자에게 문의해주세요.');
                    }
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

function getTargetDataSetTimeCheckCallbackFunction(base_file_path, base_file_nm, index_trgt_col, callback) {
    let data = {
        file_path: base_file_path, file_name: base_file_nm, index_trgt_col: index_trgt_col
    }
    showProgressBar({element: null, process_id: 'process-42'});
    ajaxPost('/dt/model/getDataTimeCheck', data, function (result) {
        console.log('getTargetDataSetTimeCheck result', result);
        if (result.code === 200) {
            let datas = JSON.parse(result.data);
            let headers = datas.data.columns;
            let select_origin_term = document.querySelector('#select_origin_term');
            let termValue = getCsvIndexColumnTerm(datas, index_trgt_col);
            select_origin_term.innerHTML = `${termValue}`;
            select_origin_term.dataset.type = termValue === '불분명' ? '불분명' : '분명';
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

                    console.log('errorModal', errorModal);
                    $(errorModal).modal('show');
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
    var deltaValue = data.data.delta[maxCountIndex];


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

function outLierResultTableView(id, jsonData) {
    let firstKey = Object.keys(jsonData)[0];  // 첫 번째 key 가져오기
    let rowCount = jsonData[firstKey].length;

    let strHTML = '<div class="table-responsive2">';
    strHTML += '<h6>이상치 데이터</h6>';
    strHTML += ' <table class="table" id="outlierTable">';

    strHTML += '<thead><tr>';

    // JSON 데이터의 각 key를 테이블의 컬럼 제목으로 추가
    for (var key in jsonData) {
        if (jsonData.hasOwnProperty(key)) {
            strHTML += '<th>' + key + '</th>';
        }
    }

    strHTML += '</tr></thead>';
    strHTML += '<tbody>';

    // 테이블 내용 생성
    for (var i = 0; i < rowCount; i++) {
        strHTML += '<tr>';
        for (var key in jsonData) {
            if (jsonData.hasOwnProperty(key)) {
                var value = jsonData[key][i];
                strHTML += '<td>' + value + '</td>';
            }
        }
        strHTML += '</tr>';
    }

    strHTML += '</tbody>';
    strHTML += '</table>';

    strHTML += '</div>';

    // 생성한 HTML을 div에 삽입
    //document.getElementById(id).innerHTML = tableHTML;
    //alert(strHTML);
    //$('#outlier_table').append(strHTML);

    $('#' + id).html(strHTML);

    $('#outlierTable').DataTable({
        "destroy": true,
        "order": [[0, "asc"]],
        "searching": false,
        "info": false,
        "lengthChange": false,
        "autoWidth": false,
        "lengthMenu": [[3], [3]]
    });
}

function makeMetaApiListTable(data, position_id, datatable_id) {

    var strHTML = '';

    //strHTML += '<div class="col-md-12 grid-margin  stretch-card">';
    strHTML += '	<div class="card">';
    strHTML += '	<div class="card-body">';
    strHTML += '	<p class="card-description">트윈 목록</p>';
    strHTML += '	<div class="table-responsive">';
    strHTML += '		<table class="table" id="' + datatable_id + '">';
    strHTML += '			<thead>';
    strHTML += '				<tr>';
    strHTML += '        			<th>#</th>';
    strHTML += '        			<th>메타모델</th>';
    strHTML += '        			<th>트윈아이디</th>';
    strHTML += '        			<th>트윈명</th>';
    strHTML += '        			<th>설명</th>';
    strHTML += '				</tr>';
    strHTML += '			</thead>';
    strHTML += '			<tbody>';


    $.each(data, function (index, item) {
        strHTML += '			   <tr>';

        strHTML += '					<td>' + (index + 1) + '</td>';
        strHTML += '					<td>' + item.metaModel + '</td>';
        strHTML += '					<td>'
        strHTML += '<a href="#none" class="btn-object-list" data-twin-id="' + item.digitalTwinId + '" data-meta-model="' + item.metaModel + '">' + item.digitalTwinId;
        strHTML += '					</a>';
        strHTML += '					</td>'
        strHTML += '					<td>'
        strHTML += '<a href="#none" class="btn-object-list" data-twin-id="' + item.digitalTwinId + '" data-meta-model="' + item.metaModel + '">' + item.digitalTwinName;
        strHTML += '					</a>';
        strHTML += '					</td>'
        strHTML += '					<td>' + item.description + '</td>';

        strHTML += '			   </tr>';
    });


    strHTML += '			</tbody>';
    strHTML += '		</table>';
    strHTML += '	</div>';
    //strHTML += '	</div>';

    $('#' + position_id).html(strHTML);
    //alert(objCnt);
    return strHTML;
}

function makeMetaApiObjectListTable(data, position_id, datatable_id) {

    var strHTML = '';

    //strHTML += '<div class="col-md-12 grid-margin  stretch-card">';
    strHTML += '	<div class="card">';
    strHTML += '	<div class="card-body">';
    strHTML += '	<p class="card-description">오브젝트 목록</p>';
    strHTML += '	<div class="table-responsive">';
    strHTML += '		<table class="table" id="' + datatable_id + '">';
    strHTML += '			<thead>';
    strHTML += '				<tr>';
    strHTML += '        			<th>#</th>';
    strHTML += '        			<th>오브젝트명</th>';
    strHTML += '        			<th>설명</th>';
    strHTML += '				</tr>';
    strHTML += '			</thead>';
    strHTML += '			<tbody>';


    $.each(data, function (index, item) {
        strHTML += '			   <tr>';

        strHTML += '					<td>' + (index + 1) + '</td>';
        strHTML += '					<td>'
        strHTML += '<a href="#none" class="btn-pop-api-view" data-twin-id="' + item.digitalTwinId + '" data-object-id="' + item.digitalObjectId + '">' + item.digitalObjectName;
        strHTML += '					</a>';
        strHTML += '					</td>'
        strHTML += '					<td>' + item.description + '</td>';

        strHTML += '			   </tr>';
    });


    strHTML += '			</tbody>';
    strHTML += '		</table>';
    strHTML += '	</div>';
    //strHTML += '	</div>';

    $('#' + position_id).html(strHTML);
    //alert(objCnt);
    return strHTML;
}

/*
function makeMetaApiListTable(data, position_id, datatable_id) {
	
	var strHTML = '';
	
		strHTML += '<div class="col-md-12 grid-margin  stretch-card">';
		strHTML += '	<div class="card">';
		strHTML += '	<div class="card-body">';
		
		strHTML += '	<div class="table-responsive">';
		strHTML += '		<table class="table" id="' + datatable_id + '">';
		strHTML += '			<thead>';
		strHTML += '				<tr>';
		strHTML += '        			<th>#</th>';
		strHTML += '        			<th>메타모델</th>';
		strHTML += '        			<th>제목</th>';
		strHTML += '        			<th>오브젝트명</th>';
		strHTML += '        			<th>오브젝트아이디</th>';
		strHTML += '        			<th>태그</th>';
		strHTML += '				</tr>';
		strHTML += '			</thead>';
		strHTML += '			<tbody>';
			
		
$.each(data, function(index, item) {
	strHTML += '			   <tr>';
		
		strHTML += '					<td>' + (index + 1) + '</td>';
		strHTML += '					<td>' + item.metaModel + '</td>';
		strHTML += '					<td>'
		strHTML += '<a href="#none" class="btn-pop-api-view" data-object-id="' + item.digitalObjectId + '" data-meta-model="' + item.metaModel + '">' + item.subject;
		strHTML += '					</a>';
		strHTML += '					</td>'
		strHTML += '					<td>'
		strHTML += '<a href="#none" class="btn-pop-api-view" data-object-id="' + item.digitalObjectId + '" data-meta-model="' + item.metaModel + '">' + item.digitalObjectName;
		strHTML += '					</a>';
		strHTML += '					</td>'
		strHTML += '					<td>' + item.digitalObjectId + '</td>';
		strHTML += '					<td>' + item.tags + '</td>';
		
	strHTML += '			   </tr>';
});
				
		
		
		
		strHTML += '			</tbody>';
		strHTML += '		</table>';
		strHTML += '	</div>';
		strHTML += '	</div>';      	
	
		$('#' + position_id).html(strHTML);
			//alert(objCnt);
	return strHTML;
}
*/

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
    let classes = ['col-md-12', 'grid-margin', 'stretch-card'];
    classes.forEach(function (_class) {
        wrapper.classList.add(_class);
    });

    let card = document.createElement('div');
    let cardClasses = ['card'];
    cardClasses.forEach(function (_class) {
        card.classList.add(_class);
    });

    let cardBody = document.createElement('div');
    let cardBodyClasses = ['card-body', 'table-scroll-parent'];
    cardBodyClasses.forEach(function (_class) {
        cardBody.classList.add(_class);
    });

    let messageElement = document.createElement('div');
    let messageElementClasses = ['mb-3'];
    messageElementClasses.forEach(function (_class) {
        messageElement.classList.add(_class);
    });
    messageElement.innerHTML = `${message}`;
    cardBody.appendChild(messageElement);

    let table = document.createElement('table');
    table.id = table_id;
    table.style.width = `100%`;
    let tableClasses = ['table'];
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
                console.log('해당 컬럼 버림', column, index);
            } else {
                let td = document.createElement('td');
                td.innerHTML = `${column}`;
                tr.appendChild(td);
            }
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    cardBody.appendChild(table);
    card.appendChild(cardBody);
    wrapper.append(card);
    document.querySelector(selector).appendChild(wrapper);
    callback(wrapper, headers, datas);
}

/*$.each(data, function (i, row) {
        strHTML += '									<tr>';
        $.each(row, function (j, cell) {
            strHTML += '<td>' + cell.replace(/\"/gi, "") + '</td>';
        });
        strHTML += '									</tr>';
    });*/
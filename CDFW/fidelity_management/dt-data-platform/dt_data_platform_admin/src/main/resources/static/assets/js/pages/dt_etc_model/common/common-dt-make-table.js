'use strict'

$(document).ready(function () {

    $(document).on('change', '#chkAllCol', function () {
        //$('#chkAll').on('change', function(e) {
        $('input[name="dataSetColumnArr"]').attr('checked', $(this).is(':checked'));
    });

});

function makeHtmlTable(header_data, data, position_id, filter_yn, datatable_id, count, start_date, end_date) {
    var preProcData = JSON.parse($('#preprocProPerty').val());
    var target_row_count = count ? count : preProcData.preproc_property_info[0].target_row_count;
    var index_trgt_col = $('#index_trgt_col').val();

    var strHTML = '';
    strHTML += '				<div class="col-md-12 grid-margin  stretch-card">';
    strHTML += '				<div class="card">';
    strHTML += '					<div class="card-body table-scroll-parent">';
    strHTML += '';

    if (filter_yn === 'Y') {
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
                if (item === index_trgt_col) {
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

    /*

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
            strHTML += '					<th><input type="checkbox" class="preprocCheck" name="dataSetColumnArr" id="preprocCheck' +  i + '" value="' + header + '"></th>';
            strHTML += '					<td>' + col + '</td>';
            strHTML += '					<td>' + dtype + '</td>';
            strHTML += '					<td>' + min + '</td>';
            strHTML += '					<td>' + max + '</td>';
            strHTML += '					<td>' + unique + '</td>';
            strHTML += '					<td>' + duplicate + '</td>';
            strHTML += '					<td>' + nan + '</td>';
            strHTML += '					<td>' + std + '</td>';
                                            }
            strHTML += '    			</tr>';
                                        }
    */


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

function makeDataSetInfoValidate(ds, position_id) {
    var data = ds.data.info;
    var header_list = ds.data.columns;

    var objCnt = 0;
    var strHTML = '';

    strHTML += '	<div class="table-responsive">';
    strHTML += '		<table class="table" id="preProcDatatable">';
    strHTML += '			<thead>';
    strHTML += '				<tr>';
    strHTML += '        			<th>#</th>';
    strHTML += '        			<th>column</th>';
    strHTML += '        			<th>type</th>';
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
            strHTML += '					<td>' + dtype + '</td>';
        }
        strHTML += '    			</tr>';
    }
    strHTML += '			</tbody>';
    strHTML += '		</table>';
    strHTML += '</div>';


    $('#' + position_id).html(strHTML);
    //alert(objCnt);
    return strHTML;
}

function makeDataSetInfoInterpolate(ds, position_id) {
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

    console.log(totalNaN);

    $('#' + position_id).html(strHTML);
    //alert(objCnt);
    return strHTML;
}

function makeHeader(ds, position_id, col) {
    var data = ds.data.info;
    var header_list = ds.data.columns;

    var strHTML = '';

    strHTML += '		컬럼선택:';
    if (position_id == 'preProcOutlierTargetCol') {
        strHTML += '		<select class="w-100  unit-select-box" id="select_outlier_target_col">';
    } else if (position_id == 'preProcUnitTargetCol') {
        strHTML += '		<select class="w-100  unit-select-box" id="select_unit_target_col">';
    } else {
        strHTML += '		<select class="w-100  unit-select-box" id="select_valid_target_col">';
    }

    strHTML += '			<option value="">선택</option>';
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
    return strHTML;
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
    strHTML += '			<option value="">선택</option>';
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
    strHTML += '			<option value="">선택</option>';
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
    var form_type = $('#formType').val();
    var data = {
        base_file_path: base_file_path, base_file_nm: base_file_nm, index_trgt_col: index_trgt_col, form_type: form_type
    }
    showProgressBar({element: null, process_id: 'process-15'});
    $.ajax({
        type: 'POST',
        async: false, //enctype: 'multipart/form-data',
        url: '/dt/etc/model/getDataSetInfo',
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8;",
        dataType: "json",
        success: function (result) {
            if (result.code === 200) {
                console.log("result.code == 200")
                var data_list = JSON.parse(result.data);
                var header_list = data_list.data.columns;
                uriEncodingParameter(data_list, 'dataList')
                uriEncodingParameter(header_list, 'headerList')
                if (main_info_yn === 'Y') {
                    makeDataSetInfo(data_list, 'dataSetInfoRange');
                    makeDataSetStatisticsHeader(data_list, 'dataSetStatisticsRange', header_list[0]);
                    makeDataSetHistogramHeader(data_list, 'dataSetHistogramRange', header_list[0]);
                    histogramChartView(header_list[0], data_list);
                }
                closeProgressBar({element: null, process_id: 'process-15'});
            } else {
                console.error('getTargetDataSetInfo');
                closeProgressBar({element: null, process_id: 'process-15'});
            }
        },
        error: function (xhr, status, error) {
            console.error('getTargetDataSetInfo', error);
            closeProgressBar({element: null, process_id: 'process-15'});
            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
        }
    });
}

function getTargetDataSetInfoCallback(base_file_path, base_file_nm, index_trgt_col, main_info_yn, callback) {
    let form_type = $('#formType').val();
    let data = {
        base_file_path: base_file_path, base_file_nm: base_file_nm, index_trgt_col: index_trgt_col, form_type: form_type
    }
    $.ajax({
        type: 'POST',
        async: false, //enctype: 'multipart/form-data',
        url: '/dt/etc/model/getDataSetInfo',
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8;",
        dataType: "json",
        success: function (result) {
            callback(result, null);
        },
        error: function (xhr, status, error) {
            callback(null, error)
        }
    });
}

//가져온 메타에 대한 원본 데이터에서 필터를 지정해서 실제 작업에 사용할 데이터
function getTargetDataSetTimeCheck(base_file_path, base_file_nm, index_trgt_col) {
    var data = {
        file_path: base_file_path, file_name: base_file_nm, index_trgt_col: index_trgt_col
    }

    var check_list;

    ajaxPost('/dt/etc/model/getDataTimeCheck', data, function (result) {
        var strHTML = '';
        //var resultData = result.result_data[0];

        if (result.code == 200) {
            //console.log(result);
            var data_list = JSON.parse(result.data);
            var header_list = data_list.data.columns;

            $("#select_origin_term").text(getCsvIndexColumnTerm(data_list, index_trgt_col));

        } else {
            console.error('error : ', result);
            alert('API 에러가 발생하였습니다. 관리자에게 문의하십시오.');
        }

        //}, true);
    });

}


function getCsvIndexColumnTerm(dataString, index_col) {
    //console.log(dataString);
    //const data = JSON.parse(dataString);
    const data = dataString;
    console.log(data)
    const validation_count = data.data.validation_count;
    const deltaList = data.data.delta; // "delta"를 리스트로 추출
    const countList = data.data.count; // "count"를 리스트로 추출

    var resultType = '';
    var resultTimeTerm = 0;


    // "count" 배열에서 최대값과 해당 인덱스를 찾기
    var maxCount = Math.max.apply(null, data.data.count);
    var maxCountIndex = data.data.count.indexOf(maxCount);

    // 해당 인덱스를 사용하여 "delta" 배열에서 값을 가져오기
    var deltaValue = data.data.delta[maxCountIndex];

    var defaultResmplIntvlTp;
    var defaultResmplIntvlValue;


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
        //console.log(deltaList[1]);

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
    var firstKey = Object.keys(jsonData)[0];  // 첫 번째 key 가져오기
    var rowCount = jsonData[firstKey].length;


    var strHTML = '<div class="table-responsive2">';
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

    $('#' + position_id).html(strHTML);
    return strHTML;
}
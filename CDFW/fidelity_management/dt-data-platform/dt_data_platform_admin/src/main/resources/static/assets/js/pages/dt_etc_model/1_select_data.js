(function () {
    'use strict'
    $(document).ready(function () {
        if ($('#formType').val() == 'U') {
            var preProcData = JSON.parse($('#preprocProPerty').val());
            $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));

            var preProcData = JSON.parse($('#preprocProPerty').val());
            var index_trgt_col = preProcData.preproc_property_info[0].index_trgt_col;
            var base_file_path = $('#lastFilePath').val();
            var base_file_nm = preProcData.preproc_property_info[0].base_file_nm_set_range_row;

            //실제 작업할 필터 건 파일을 만듬
            //getTargetDataSetInfo(base_file_path, base_file_nm, index_trgt_col, 'Y', '')
            showProgressBar({element: null, process_id: 'process-1'});
            let mainInfoYn = 'Y';
            getTargetDataSetInfoCallback(base_file_path, base_file_nm, index_trgt_col, mainInfoYn, function (result, error) {
                console.log('getTargetDataSetInfoCallback', result, error);
                try {
                    if (result) {
                        if (result.code === 200) {
                            console.log("result.code == 200")
                            let data_list = JSON.parse(result.data);
                            let header_list = data_list.data.columns;
                            uriEncodingParameter(data_list, 'dataList')
                            uriEncodingParameter(header_list, 'headerList')
                            if (mainInfoYn === 'Y') {
                                makeDataSetInfo(data_list, 'dataSetInfoRange');
                                makeDataSetStatisticsHeader(data_list, 'dataSetStatisticsRange', header_list[0]);
                                makeDataSetHistogramHeader(data_list, 'dataSetHistogramRange', header_list[0]);
                                histogramChartView(header_list[0], data_list);
                            }
                            $('#preProcDatatableColumnInfo tbody tr').each(function () {
                                var row = $(this);
                                var checkBoxes = row.find('input[type="checkbox"]');
                                checkBoxes.each(function () {
                                    var checkbox = $(this);
                                    var value = checkbox.val();
                                    // 가져온 JSON 데이터에 해당 값이 있는지 확인하여 체크
                                    if (preProcData.preproc_property_info[0].preproc_trgt_col.includes(value)) {
                                        checkbox.prop('checked', true);
                                    }
                                });
                            });
                            closeProgressBar({element: null, process_id: 'process-1'});
                        } else {
                            closeProgressBar({element: null, process_id: 'process-1'});
                            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                        }
                    } else {
                        closeProgressBar({element: null, process_id: 'process-1'});
                        alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                        console.error('getTargetDataSetInfoCallback', error);
                    }
                } catch (error) {
                    closeProgressBar({element: null, process_id: 'process-1'});
                    alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                    console.error('getTargetDataSetInfoCallback', error);
                }
            });
        } else {
            var preProcData = preProcTemplate();
            $('#preprocProPerty').val(JSON.stringify(preProcData));
            $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));
            $('#metaListDataTable').DataTable({
                destroy: true, autoWidth: false, pageLength: 4, //scrollX: true, // 수평 스크롤 활성화
                //scrollCollapse: true, // 스크롤이 축소될 때 테이블 크기 축소
                //autoWidth: true, // 테이블 너비 자동 조정
                columnDefs: [{"width": "15%", "targets": 0}], order: [[0, 'asc']], //"searching": false,  "info": false,  "lengthChange": false,  "autoWidth": false
                "searching": true, "info": false, "lengthChange": false
            });
        }
        var selectedValue = $('input[name="dataUseTp"]:checked').val();
        //var base_file_nm_set_range_row_check = $('#base_file_nm_set_range_row_check').val();
        $('#base_file_nm_set_range_row_check').val('N');
        if (selectedValue === 'F') {
            $('.file-upload-data').show();
            $('.meta-data').hide();
        } else if (selectedValue === 'M') {
            $('.file-upload-data').hide();
            $('.meta-data').show();
        } else {
            $('.file-upload-data').hide();
            $('.meta-data').hide();
        }
        $('input[name="dataUseTp"]').change(function () {
            var selectedValue = $('input[name="dataUseTp"]:checked').val();
            if (selectedValue == 'F') {
                $('.file-upload-data').show();
                $('.meta-data').hide();

                //getMetaDataTotalList();
            }
            if (selectedValue == 'M') {
                $('.file-upload-data').hide();
                $('.meta-data').show();
            }

        });

        //데이터 유형 선택 파일 업로드
        $("#attachFilesCsv").on('change', function (e) {
            chgAddFilePc($(this), e);
        });

        $(document).on('click', '.btn-object-list', function () {
            var twinId = $(this).data('twin-id');

            var data = {
                //curPage: 1,
                //pageListSize: 10,
                digitalTwinId: twinId
                //srchText: '유동인구'
            }
            showProgressBar({element: null, process_id: 'process-9'});
            $.ajax({
                type: "POST", //async: false,
                url: ' /dt/meta/api/v1/resource/objects',
                data: JSON.stringify(data),
                contentType: "application/json; charset=utf-8;",
                dataType: "json",
                success: function (result) {
                    if (result.code == 200) {
                        makeMetaApiObjectListTable(result.data, "search_meta_api_list_table_obj", "metaApiListDataTableObj");
                        $('#metaApiListDataTableObj').DataTable({
                            "order": [[0, "asc"]],
                            "searching": true,
                            "info": false,
                            "lengthChange": false,
                            "autoWidth": false,
                            "lengthMenu": [[5], [5]]
                        });
                        $('html, body').animate({scrollTop: $(document).height()}, 'slow');
                        closeProgressBar({element: null, process_id: 'process-9'});
                    } else {
                        closeProgressBar({element: null, process_id: 'process-9'});
                        alert('API 내 에러 발생');
                    }
                },
                error: function (xhr, status, error) {
                    console.error('error : ', error);
                    closeProgressBar({element: null, process_id: 'process-9'});
                    alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                }
            });
        });
        $(document).on('click', '.btn-meta-search', function () {
            var meta_model_name = $('#meta_model_name').val();

            if (meta_model_name.lenth < 0) {
                alert('트윈명을 입력하세요.');
                return false;
            }

            var data = {
                //curPage: 1,
                //pageListSize: 10,
                srchText: meta_model_name
                //srchText: '유동인구'
            }
            showProgressBar({element: null, process_id: 'process-8'});
            $.ajax({
                type: "POST", //async: false,
                url: '/dt/meta/api/v1/resource/dts',
                data: JSON.stringify(data),
                contentType: "application/json; charset=utf-8;",
                dataType: "json",
                success: function (result) {
                    if (result.code == 200) {
                        makeMetaApiListTable(result.data, "search_meta_api_list_table", "metaApiListDataTable");
                        $('#metaApiListDataTable').DataTable({
                            "order": [[0, "asc"]],
                            "searching": true,
                            "info": false,
                            "lengthChange": false,
                            "autoWidth": false,
                            "lengthMenu": [[5], [5]]
                        });
                        closeProgressBar({element: null, process_id: 'process-8'});
                    } else {
                        closeProgressBar({element: null, process_id: 'process-8'});
                        alert('API 내 에러 발생');
                    }
                },
                error: function (xhr, status, error) {
                    closeProgressBar({element: null, process_id: 'process-8'});
                    console.error('error : ', error);
                    alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                }
            });
        });
        $(document).on('click', '.btn-pop-api-view', function () {
            //$('.btn-pop-api-view').on('click', function() {
            //var metaSeq = $(this).data('meta-seq');
            //getMetaFullTextJsonDataView(metaSeq);

            var objectId = $(this).data('object-id');
            var twinId = $(this).data('twin-id');
            getMetaFullTextJsonDataView(twinId, objectId);
        });
        //작업할 데이터 미리보기
        $(document).on('click', '.btn-set-data-preview', function () {
            $('#input_info_check').val('Y');
            $('#csvUpRange2').empty();
            //$('#csvUpRange2').empty();
            $('#dataSetInfoRange').empty();
            $('#dataSetStatisticsRange').empty();
            $('#dataSetHistogramRange').empty();
            $('#dataSetChartRange').empty();
            //$('#view3').empty();
            var preProcData = JSON.parse($('#preprocProPerty').val());
            preProcData.preproc_property_info[0].preproc_trgt_col = null;
            $('#preprocProPerty').val(JSON.stringify(preProcData));
            $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));
            //var index_trgt_col = $('#index_trgt_col').val();
            let index_trgt_col = $('#index_trgt_col option:selected').val();

            if (index_trgt_col == 0) {
                alert('시계열 컬럼은 필수 선택입니다. \n시간 데이터가 아닌 컬럼을 지정할 경우 오류가 발생합니다.');
                return false;
            }

            // hidden 요소에서 JSON 데이터 가져오기
            let jsonData = JSON.parse($('#preprocProPerty').val());

            // base_dir 및 base_file_nm 값 가져오기
            let base_file_path = jsonData.preproc_property_info[0].base_dir;
            let base_file_nm = jsonData.preproc_property_info[0].base_file_nm;
            let digitalTwinId = $('#digitalTwinId').val();
            let digitalObjectId = $('#digitalObjectId').val();
            let target_start_date = $('#target_start_date').val();
            let target_end_date = $('#target_end_date').val();
            let target_row_count = $('#target_row_count').val();

            let data = {
                base_file_path,
                base_file_nm,
                digitalTwinId,
                digitalObjectId,
                target_start_date,
                target_end_date,
                target_row_count,
                index_trgt_col
            }
            console.log('clicked event', 'data', data);
            reGetBaseDataCallbackFunction(data, function (data) {
                checkIndexTimeColumn(data, function (err, result, data) {
                    console.log('checkIndexTimeColumn', 'data', data);
                    if (err) {
                        console.error('Error', err);
                        return false;
                    } else {
                        console.log('Result', result);
                        if (result === false) {
                            alert('선택하신 컬럼은 시계열이 아닙니다.');
                            return false;
                        }
                        if ((data.target_row_count === 0) && (data.target_start_date.length === 0 || data.target_end_date.length === 0)) {
                            alert('시작일과 종료일 둘다 입력 해야합니다.');
                            return false;
                        }
                        if (data.target_start_date.length !== 0 && data.target_end_date.length !== 0) {
                            let dateValidCheck = validateDates(data.target_start_date, data.target_end_date);
                            console.log('dateValidCheck', dateValidCheck);
                            if (!dateValidCheck) {
                                return false;
                            }
                        } else {
                            if (data.target_row_count.length === 0) {
                                alert('날짜를 지정하거나 불러올 데이터 갯수를 지정해야합니다.');
                                return false;
                            }
                        }
                        console.log('target_start_date', data.target_start_date, 'target_end_date', data.target_end_date, 'target_row_count', data.target_row_count);
                        //실제 작업할 필터 건 파일을 만듬
                        getBaseDataSetRangeRow(data.base_file_path, data.base_file_nm, data.index_trgt_col, data.target_start_date, data.target_end_date, data.target_row_count, function () {
                            $('#next_button_info_range').show();
                            $('#info_next').show();
                            makePropertyListHtml();
                        });
                    }
                });
            });
        });
        $(document).on('click', '.btn-get-meta-all-info', function () {
            var digitalTwinId = $('#digitalTwinId').val();
            var digitalObjectId = $('#digitalObjectId').val();

            var digitalObjectName = $('#digitalObjectName').val();
            var digitalObjectDataSourceUrl = $('#digitalObjectDataSourceUrl').val();
            var description = $('#description').val();
            var digitalObjectDataModel = $('#digitalObjectDataModel').val();
            var digitalObjectDataSample = $('#digitalObjectDataSample').val();

            getBaseData(digitalTwinId, digitalObjectId, digitalObjectName, digitalObjectDataSourceUrl, description, digitalObjectDataModel);

            $('#modalApiView').modal('hide');

            $('#tab_getdata_range').hide();
            $('#tab_info_range').show();
            $('#tab_preview_range').show();

            $('#tab_getdata').attr('class', 'nav-link');
            $('#tab_info').attr('class', 'nav-link active');
            $('#tab_column_info').attr('class', 'nav-link');
            $('#tab_preproc').attr('class', 'nav-link');
            $('#tab_getalgo').attr('class', 'nav-link');
            $('#tab_savemodel').attr('class', 'nav-link');

            $('#next_button_info_range').show();

            //$('#next_button_info_range').show();

            //var param4 = { key: 'sdt_full_text', value: sdt_full_text };
            //ar paramsArray = [param1, param2, param3, param4];
            //var params = {sdt_uniq_id : sdt_uniq_id, sdt_nm : sdt_nm};
        });
    });
})();

function getMetaFullTextJsonDataView(twin_id, object_id) {
    let data = getMetaFullTextJsonData(twin_id, object_id);
    $('#metaModel').val(data.metaModel);
    $('#digitalObjectName').val(data.digitalObjectName);
    $('#digitalObjectDataSourceUrl').val(data.digitalObjectDataSourceUrl ? data.digitalObjectDataSourceUrl : '없음');
    $('#description').val(data.description);

    $('#digitalObjectId').val(data.digitalObjectId);
    $('#digitalTwinId').val(twin_id);

    let digitalObjectDataModel = prettyJson(data.digitalTwinObjectData.digitalObjectDataModel);
    let digitalObjectDataSample = prettyJson(data.digitalTwinObjectData.digitalObjectDataSample);

    console.log('digitalObjectDataModel', JSON.parse(data.digitalTwinObjectData.digitalObjectDataModel));
    console.log('digitalObjectDataSample', JSON.parse(data.digitalTwinObjectData.digitalObjectDataSample));

    $('#digitalObjectDataModel').val(digitalObjectDataModel);
    $('#digitalObjectDataSample').val(digitalObjectDataSample);
}

//메타 정보보기 샘플
function getMetaFullTextJsonData(twin_id, object_id) {
    var resultData;

    var data = {
        twin_id: twin_id, object_id: object_id, row_count: 2
    }

    showProgressBar({element: null, process_id: 'process-10'});

    $.ajax({
        type: 'POST',
        async: false, //enctype: 'multipart/form-data',
        url: '/dt/meta/api/v1/resource/objects/detail',
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8;",
        dataType: "json",
        success: function (result) {
            console.log('getMetaFullTextJsonData result', result)
            if (result.code === 200) {
                $('#modalApiView').modal('show');
                resultData = result.data;
                closeProgressBar({element: null, process_id: 'process-10'});
            } else {
                closeProgressBar({element: null, process_id: 'process-10'});
                alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                return false;
            }
        },
        error: function (xhr, status, error) {
            console.error('error : ', error);
            closeProgressBar({element: null, process_id: 'process-10'});
            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
        }
    });

    return resultData;
}

//가져오기 클릭 시  초기 설정 없이 갯수제한만 걸고 가져올 메타에 대한 원본 데이터
function getBaseData(twin_id, object_id, sdt_nm, sdt_data_url, sdt_derpn, sdt_full_text) {
    var data = {
        digital_twins: twin_id, digital_objects: object_id
    }
    showProgressBar({element: null, process_id: 'process-11'});
    ajaxPost('/dt/etc/meta/api/v1/resource/objects/detail/set/file', data, function (result) {
        var strHTML = '';
        //var resultData = result.result_data[0];
        if (result.code === 200) {
            var header_list = JSON.parse(result.header_list);
            var data_list = JSON.parse(result.data_list);

            var preProcData = preProcTemplate();
            preProcData.preproc_property_info[0].twin_id = twin_id;
            preProcData.preproc_property_info[0].twin_obj_id = object_id;
            preProcData.preproc_property_info[0].base_dir = result.base_dir;
            preProcData.preproc_property_info[0].base_file_nm = result.file_name;
            preProcData.preproc_property_info[0].data_use_tp = 'M';
            //preProcData.preproc_property_info[0].index_trgt_col = result.data.index_trgt_col;
            $('#preprocProPerty').val(JSON.stringify(preProcData));
            $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));

            //결과값으로  테이블 만들기
            makeHtmlTable(header_list, data_list, 'csvUpRange', 'Y', 'csvUpRangeDataTable', result.limit);
            let sample_desc = document.querySelector('#sample_desc');
            sample_desc.innerHTML = `미리보기로 ${result.limit}개 이하만 보입니다.`;
            $('#csvUpRangeDataTable').DataTable({
                columnDefs: [{
                    targets: '_all',
                    className: 'text-nowrap'
                }],
                "order": [[0, "asc"]],
                "searching": false,
                "info": false,
                "lengthChange": false,
                "autoWidth": true,
                "lengthMenu": [[10], [10]],
                scrollX: true
            });
            closeProgressBar({element: null, process_id: 'process-11'});
        } else {
            console.error('error : ', result);
            closeProgressBar({element: null, process_id: 'process-11'});
            alert('API 에러가 발생하였습니다. 관리자에게 문의하십시오.');
        }
    });
}

function reGetBaseDataCallbackFunction(data, callback) {
    let sendData = {
        digital_twins: data.digitalTwinId,
        digital_objects: data.digitalObjectId,
        base_file_path: data.base_file_path,
        base_file_name: data.base_file_nm,
        target_start_date: data.target_start_date.length != 0 ? data.target_start_date : null,
        target_end_date: data.target_end_date.length != 0 ? data.target_end_date : null,
        target_row_count: data.target_row_count
    }
    showProgressBar({element: null, process_id: 'process-12'});
    ajaxPost('/dt/etc/meta/api/v1/resource/objects/detail/reset/file', sendData, function (result) {
        console.log('result', result);
        if (result.code === 200) {
            var header_list = JSON.parse(result.header_list);
            var data_list = JSON.parse(result.data_list);

            var preProcData = preProcTemplate();
            preProcData.preproc_property_info[0].twin_id = data.digitalTwinId;
            preProcData.preproc_property_info[0].twin_obj_id = data.digitalObjectId;
            preProcData.preproc_property_info[0].base_dir = result.base_dir;

            preProcData.preproc_property_info[0].base_file_nm = result.file_name;
            preProcData.preproc_property_info[0].data_use_tp = 'M';
            $('#preprocProPerty').val(JSON.stringify(preProcData));
            $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));

            data.base_file_path = result.base_dir;
            data.base_file_nm = result.file_name;

            //결과값으로  테이블 만들기
            makeHtmlTable(header_list, data_list, 'csvUpRange', 'Y', 'csvUpRangeDataTable', data.target_row_count, data.target_start_date, data.target_end_date);
            let target_row_count = document.querySelector('#target_row_count');
            target_row_count.value = result.limit;

            $('#csvUpRangeDataTable').DataTable({
                columnDefs: [{
                    targets: '_all',
                    className: 'text-nowrap'
                }],
                "order": [[0, "asc"]],
                "searching": false,
                "info": false,
                "lengthChange": false,
                "autoWidth": true,
                "lengthMenu": [[10], [10]],
                scrollX: true
            });
            closeProgressBar({element: null, process_id: 'process-12'});
            callback(data);
        } else {
            console.error('error : ', result);
            closeProgressBar({element: null, process_id: 'process-12'});
            alert('API 에러가 발생하였습니다. 관리자에게 문의하십시오.');
        }
    });
}

function checkIndexTimeColumn(data, callback) {
    let sendData = {
        base_file_path: data.base_file_path, base_file_nm: data.base_file_nm, index_trgt_col: data.index_trgt_col
    }
    showProgressBar({element: null, process_id: 'process-13'});
    $.ajax({
        type: 'POST',
        url: '/dt/etc/model/checkIndexTimeColumn',
        data: JSON.stringify(sendData),
        contentType: "application/json; charset=utf-8;",
        dataType: "json",
        success: function (result) {
            if (result.code === 200) {
                let response = result.data.data;
                closeProgressBar({element: null, process_id: 'process-13'});
                callback(null, response, data);
            } else {
                closeProgressBar({element: null, process_id: 'process-13'});
                callback(new Error('Unexpected response code: ' + result.code));
            }
        },
        error: function (xhr, status, error) {
            console.error('error : ', error);
            closeProgressBar({element: null, process_id: 'process-13'});
            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
            callback(error);
        }
    });
}


//가져온 메타에 대한 원본 데이터에서 필터를 지정해서 실제 작업에 사용할 데이터
function getBaseDataSetRangeRow(base_file_path, base_file_nm, index_trgt_col, target_start_date, target_end_date, target_row_count, callback) {
    var data = {
        base_file_path: base_file_path,
        base_file_nm: base_file_nm,
        index_trgt_col: index_trgt_col,
        target_start_date: target_start_date,
        target_end_date: target_end_date,
        target_row_count: target_row_count
    }
    console.log('getBaseDataSetRangeRow', data);
    showProgressBar({element: null, process_id: 'process-14'});
    ajaxPost('/dt/etc/model/getBaseDataSetRangeRow', data, function (result) {
        if (result.code === 200) {
            var preProcData = JSON.parse($('#preprocProPerty').val());
            preProcData.preproc_property_info[0].index_trgt_col = result.index_trgt_col;
            preProcData.preproc_property_info[0].target_row_count = result.target_row_count;
            preProcData.preproc_property_info[0].base_file_nm_set_range_row = result.base_file_nm_set_range_row;
            $('#preprocProPerty').val(JSON.stringify(preProcData));
            $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));

            //결과값으로  테이블 만들기
            var header_list = JSON.parse(result.header_list);
            var data_list = JSON.parse(result.data_list);
            makeHtmlTable(header_list, data_list, 'csvUpRange', 'Y', 'csvUpRangeDataTable2', result.target_row_count, data.target_start_date, data.target_end_date);

            $('#csvUpRangeDataTable2').DataTable({
                columnDefs: [{
                    targets: '_all',
                    className: 'text-nowrap'
                }],
                "searching": false,
                "info": false,
                "lengthChange": false,
                "autoWidth": true,
                "lengthMenu": [[10], [10]],
                scrollX: true
            });
            closeProgressBar({element: null, process_id: 'process-14'});
            callback();
        } else {
            console.error('error : ', result);
            closeProgressBar({element: null, process_id: 'process-14'});
            alert('API 에러가 발생하였습니다. 관리자에게 문의하십시오.');
        }
    });
}


function chgAddFilePc(obj, e) {
    let fileValue = obj.val().split("\\");
    let fileName = fileValue[fileValue.length - 1]; // 파일명
    let ext = fileName.substring(fileName.lastIndexOf('.') + 1, fileName.length);
    ext = ext.toLowerCase();
    if (ext !== 'csv') {
        alert("확장자가 csv인  파일만 첨부가능합니다.");
        window.location.reload();
    } else {
        uploadFile();
    }
}

function uploadFile() {
    let form = $('#editForm')[0];
    let formData = new FormData(form);
    showProgressBar({element: null, process_id: 'process-7'});
    $.ajax({
        type: 'POST', //enctype: 'multipart/form-data',
        url: '/dt/etc/model/csvFileUpload',
        data: formData,
        processData: false,
        contentType: false,
        success: function (result) {
            var strHTML = '';
            //var resultData = result.result_data[0];
            try {
                if (result.code === 200) {
                    let header_list = JSON.parse(result.header_list);
                    let data_list = JSON.parse(result.data_list);

                    let preProcData = preProcTemplate();
                    preProcData.preproc_property_info[0].base_dir = result.base_dir;
                    preProcData.preproc_property_info[0].base_file_nm = result.file_name;

                    preProcData.preproc_property_info[0].data_use_tp = 'F';
                    $('#preprocProPerty').val(JSON.stringify(preProcData));
                    $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));

                    //결과값으로  테이블 만들기
                    makeHtmlTable(header_list, data_list, 'csvUpRange', 'Y', 'csvUpRangeDataTable', result.limit);

                    $('#tab_getdata_range').hide();
                    $('#tab_info_range').show();
                    $('#tab_preview_range').show();

                    $('#tab_getdata').attr('class', 'nav-link');
                    $('#tab_info').attr('class', 'nav-link active');
                    $('#tab_column_info').attr('class', 'nav-link');
                    $('#tab_preproc').attr('class', 'nav-link');
                    $('#tab_getalgo').attr('class', 'nav-link');
                    $('#tab_savemodel').attr('class', 'nav-link');
                    $('#next_button_info_range').show();
                    $('#csvUpRangeDataTable').DataTable({
                        columnDefs: [{
                            targets: '_all',
                            className: 'text-nowrap'
                        }],
                        "order": [[0, "asc"]],
                        "searching": false,
                        "info": false,
                        "lengthChange": false,
                        "autoWidth": true,
                        "lengthMenu": [[10], [10]],
                        scrollX: true
                    });
                    closeProgressBar({element: null, process_id: 'process-7'});
                } else {
                    console.error('uploadFile', result);
                    closeProgressBar({element: null, process_id: 'process-7'});
                    alert('API 에러가 발생하였습니다. 관리자에게 문의하십시오.');
                }
            } catch (error) {
                console.error('uploadFile', error);
                closeProgressBar({element: null, process_id: 'process-7'});
                alert('API 에러가 발생하였습니다. 관리자에게 문의하십시오.');
            }
        }
    });
}




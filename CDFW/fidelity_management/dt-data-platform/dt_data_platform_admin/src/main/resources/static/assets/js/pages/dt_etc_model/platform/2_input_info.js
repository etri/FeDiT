(function () {
    'use strict'
    $(document).ready(function () {

        /* DT ETC MODEL 공개 여부 관련 설정 (GRANT==FALSE 시 수정 불가)*/
        let grant = $('#grant').val();
        grant = grant === 'true' || grant === true;

        if (!grant) {
            let input_info_container = document.querySelector('#tab_info_range');
            let inputs = input_info_container.querySelectorAll('input[type="radio"]');
            inputs.forEach(function (input) {
                input.addEventListener('click', function (event) {
                    event.stopPropagation();
                    event.preventDefault();
                    return false;
                });
                input.setAttribute('disabled', 'disabled');
            });
        }

        $(document).on('click', '.next-dataset-info-step', function () {
            let model_nm = $('#etcModelNm').val();
            let model_derpn = $('textarea[name="etcModelDerpn"]').val();
            let rls_yn = $('input[name="rlsYn"]:checked').val();

            let input_info_check = $('#input_info_check').val();

            if (model_nm.length === 0) {
                alert('모델명을 입력하세요.');
                return false;
            }

            if (input_info_check === 'N') {
                alert('조회 후  다른 이벤트가 발생 했거나 조회 버튼을 클릭하지 않았습니다.');
                return false;
            }

            //타겟 파일로 컬럼 정보 보여주는 api로 넘김
            let preProcData = JSON.parse($('#preprocProPerty').val());

            // base_dir 및 사용자가 로우 갯수와 인덱스를 지정한 파일 가져와서 정보 보여줌
            preProcData.preproc_property_info[0].model_nm = model_nm;
            preProcData.preproc_property_info[0].model_derpn = model_derpn;
            preProcData.preproc_property_info[0].rls_yn = rls_yn;
            console.log('preProcData', preProcData);
            $('#preprocProPerty').val(JSON.stringify(preProcData));
            $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));

            let index_trgt_col = preProcData.preproc_property_info[0].index_trgt_col;
            let base_file_path = preProcData.preproc_property_info[0].base_dir;
            let base_file_nm = preProcData.preproc_property_info[0].base_file_nm_set_range_row;

            $('#next_button_column_info_range').show();

            //정보입력탭 안보이게
            //데이터현황 보이게 안보이게
            $('#tab_getdata_range').hide();
            $('#tab_info_range').hide();
            $('#tab_preview_range').hide();

            //먼저 show를 해야 차트 사이즈가 잡히고 시작
            $('#tab_column_info_range').show();

            $('#tab_getdata').attr('class', 'nav-link');
            $('#tab_info').attr('class', 'nav-link');
            $('#tab_column_info').attr('class', 'nav-link active');
            $('#tab_getalgo').attr('class', 'nav-link');
            $('#tab_savemodel').attr('class', 'nav-link');

            //실제 작업할 필터 건 파일을 만듬
            let form_type = $('#formType').val();
            getTargetDataSetInfo(base_file_path, base_file_nm, index_trgt_col, form_type, function (data) {
                console.log('getTargetDataSetInfo', JSON.parse(data));
            });
        });

        $(document).on('click', '.btn-set-column-select-view', function () {
            if ($('input[name="dataSetColumnArr"]:checked').length === 0) {
                alert('사용할 컬럼을 선택하세요');
                return false;
            }

            let dataSetColumnArr = [];
            let preProcData = JSON.parse($('#preprocProPerty').val());

            // 'columnArr'라는 이름의 체크된 input 요소를 선택합니다.
            $('input[name="dataSetColumnArr"]:checked').each(function () {
                // 각 체크된 요소의 값을 배열에 추가합니다.
                dataSetColumnArr.push($(this).val());
            });

            preProcData.preproc_property_info[0].preproc_trgt_col = dataSetColumnArr;
            $('#preprocProPerty').val(JSON.stringify(preProcData));
            $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));

            getBaseDataSetRangeCol(preProcData);

            $('#tab_validate_range').hide();
            $('#next_button_column_info_range').show();
            $('#column_info_next').show();

            makePropertyListHtml();
            $('html, body').animate({scrollTop: $(document).height()}, 'slow');
        });

        //작업할 데이터 미리보기
        $(document).on('click', '.btn-set-data-preview', function () {
            $('#input_info_check').val('Y');
            $('#csvUpRange2').empty();
            $('#dataSetInfoRange').empty();
            $('#dataSetStatisticsRange').empty();
            $('#dataSetHistogramRange').empty();
            $('#dataSetChartRange').empty();

            let preProcData = JSON.parse($('#preprocProPerty').val());
            preProcData.preproc_property_info[0].preproc_trgt_col = null;
            $('#preprocProPerty').val(JSON.stringify(preProcData));
            $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));
            let index_trgt_col = document.querySelector('#index_trgt_col').dataset.value;

            if (!index_trgt_col || (index_trgt_col === 0 || index_trgt_col === '0')) {
                alert('시계열 컬럼은 필수 선택입니다. \n시간 데이터가 아닌 컬럼을 지정할 경우 오류가 발생합니다.');
                return false;
            }

            // hidden 요소에서 JSON 데이터 가져오기
            let jsonData = JSON.parse($('#preprocProPerty').val());

            // base_dir 및 base_file_nm 값 가져오기
            let base_file_path = jsonData.preproc_property_info[0].base_dir;
            let base_file_nm = jsonData.preproc_property_info[0].base_file_nm;
            let digitalTwinId = jsonData.preproc_property_info[0].twin_id;
            let digitalObjectId = jsonData.preproc_property_info[0].twin_obj_id;
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
            if (parseInt(data.target_row_count) !== 0) {
                reGetBaseDataCallbackFunction(data, function (data) {
                    if (data) {
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
                                getBaseDataSetRangeRow(data.base_file_path, data.base_file_nm, data.index_trgt_col, data.target_start_date, data.target_end_date, parseInt(data.target_row_count), function () {
                                    $('#next_button_info_range').show();
                                    $('#info_next').show();
                                    makePropertyListHtml();
                                });
                            }
                        });
                    }
                });
            } else {
                alert('데이터 개수를 선택해야합니다.');
            }
        });
    });
})();

//가져온 메타에 대한 원본 데이터에서 필터를 지정해서 실제 작업에 사용할 데이터
function getBaseDataSetRangeCol(param) {
    let form_type = $('#formType').val();
    let last_file_path = $('#lastFilePath').val();
    let data = {
        param: JSON.stringify(param),
        form_type: form_type,
        last_file_path: last_file_path
    }
    showProgressBar({element: null, process_id: 'process-16'});
    $.ajax({
        type: "POST",
        url: '/dt/dataset/getBaseDataSetRangeCol/META_ETC_MODEL',
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8;",
        dataType: "json",
        success: function (result) {
            if (result.code === 200) {
                let preProcData = JSON.parse($('#preprocProPerty').val());
                preProcData.preproc_property_info[0].base_file_nm_set_range_col = result.base_file_nm_set_range_col;
                $('#preprocProPerty').val(JSON.stringify(preProcData));
                $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));

                //결과값으로 테이블 만들기
                let header_list = result.header_list;
                let data_list = result.data_list;

                let csvUpRange3 = document.querySelector('#csvUpRange3');
                let csvUpRangeTableContainer = csvUpRange3.querySelector('.table-scroll-parent');
                csvUpRangeTableContainer.innerHTML = ``;
                data_list = [];
                makeDataTableHTML(header_list, data_list, csvUpRangeTableContainer, 'csvUpRangeDataTable3', function (table) {
                    $(table).DataTable({
                        columnDefs: [{
                            targets: '_all', className: 'text-nowrap', searchable: false
                        }],
                        order: [[0, "asc"]],
                        searching: false,
                        info: false,
                        bServerSide: true,
                        ajax: {
                            url: "/datatable/server/render",
                            type: "POST",
                            dataType: "json",
                            data: function (data) {
                                data.file_name = result.file_name;
                                data.file_path = result.file_path;
                                data.target_row_count = parseInt(result.target_row_count);
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
                closeProgressBar({element: null, process_id: 'process-16'});
            } else {
                closeProgressBar({element: null, process_id: 'process-16'});
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
            closeProgressBar({element: null, process_id: 'process-16'});
            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
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
    ajaxPost('/dt/meta/api/v1/resource/objects/detail/reset/file/META_ETC_MODEL', sendData, function (result) {
        console.log('result', result);
        if (result.code === 200) {
            if (result.data_list.length === 0 || result.header_list.length === 0) {
                console.debug('error : ', result);
                closeProgressBar({element: null, process_id: 'process-12'});
                alert('해당하는 기간에 데이터가 없습니다. 다른 기간을 선택해주세요.');
                callback(null);
                return;
            }
            let header_list = result.header_list;
            let data_list = result.data_list;

            let preProcData = preProcTemplate();
            preProcData.preproc_property_info[0].twin_id = data.digitalTwinId;
            preProcData.preproc_property_info[0].twin_obj_id = data.digitalObjectId;
            preProcData.preproc_property_info[0].base_dir = result.base_dir;
            preProcData.preproc_property_info[0].base_file_nm = result.file_name;
            preProcData.preproc_property_info[0].data_use_tp = 'M';

            $('#preprocProPerty').val(JSON.stringify(preProcData));
            $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));

            data.base_file_path = result.base_dir;
            data.base_file_nm = result.file_name;

            //결과값으로 테이블 만들기
            let csvUpRange = document.querySelector('#csvUpRange');
            csvUpRange.innerHTML = ``;
            makeFilterHTML(header_list, csvUpRange, data.target_row_count, data.target_start_date, data.target_end_date, data.index_trgt_col);
            let csvUpRangeTableContainer = csvUpRange.querySelector('.table-scroll-parent');
            data_list = [];
            makeDataTableHTML(header_list, data_list, csvUpRangeTableContainer, 'csvUpRangeDataTable', function (table) {
                data.target_row_count = result.target_row_count;
                callback(data);
                $(table).DataTable({
                    columnDefs: [{
                        targets: '_all', className: 'text-nowrap', searchable: false
                    }],
                    order: [[0, "asc"]],
                    searching: false,
                    info: false,
                    bServerSide: true,
                    ajax: {
                        url: "/datatable/server/render",
                        type: "POST",
                        dataType: "json",
                        data: function (data) {
                            data.file_name = result.file_name;
                            data.file_path = result.file_path;
                            data.target_row_count = parseInt(result.target_row_count);
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
            closeProgressBar({element: null, process_id: 'process-12'});
        } else {
            console.error('error : ', result);
            closeProgressBar({element: null, process_id: 'process-12'});
            alert('API 에러가 발생하였습니다. 관리자에게 문의하십시오.');
            callback(null);
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
        url: '/dt/dataset/checkIndexTimeColumn/META_ETC_MODEL',
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
    let data = {
        base_file_path: base_file_path,
        base_file_nm: base_file_nm,
        index_trgt_col: index_trgt_col,
        target_start_date: target_start_date,
        target_end_date: target_end_date,
        target_row_count: target_row_count
    }
    console.log('getBaseDataSetRangeRow', data);
    showProgressBar({element: null, process_id: 'process-14'});
    ajaxPost('/dt/dataset/getBaseDataSetRangeRow/META_ETC_MODEL', data, function (result) {
        if (result.code === 200) {
            let preProcData = JSON.parse($('#preprocProPerty').val());
            preProcData.preproc_property_info[0].index_trgt_col = result.index_trgt_col;
            preProcData.preproc_property_info[0].target_row_count = result.target_row_count;
            preProcData.preproc_property_info[0].base_file_nm_set_range_row = result.base_file_nm_set_range_row;
            $('#preprocProPerty').val(JSON.stringify(preProcData));
            $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));


            //결과값으로 테이블 만들기
            let header_list = result.header_list;
            let data_list = result.data_list;

            let csvUpRange = document.querySelector('#csvUpRange');
            csvUpRange.innerHTML = ``;
            makeFilterHTML(header_list, csvUpRange, result.target_row_count, result.target_start_date, result.target_end_date, result.index_trgt_col);
            let csvUpRangeTableContainer = csvUpRange.querySelector('.table-scroll-parent');
            data_list = [];
            makeDataTableHTML(header_list, data_list, csvUpRangeTableContainer, 'csvUpRangeDataTable2', function (table) {
                callback();
                $(table).DataTable({
                    columnDefs: [{
                        targets: '_all', className: 'text-nowrap', searchable: false
                    }],
                    order: [[0, "asc"]],
                    searching: false,
                    info: false,
                    bServerSide: true,
                    ajax: {
                        url: "/datatable/server/render",
                        type: "POST",
                        dataType: "json",
                        data: function (data) {
                            data.file_name = result.file_name;
                            data.file_path = result.file_path;
                            data.target_row_count = parseInt(result.target_row_count);
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
            closeProgressBar({element: null, process_id: 'process-14'});
        } else {
            console.error('error : ', result);
            closeProgressBar({element: null, process_id: 'process-14'});
            alert('API 에러가 발생하였습니다. 관리자에게 문의하십시오.');
        }
    });
}
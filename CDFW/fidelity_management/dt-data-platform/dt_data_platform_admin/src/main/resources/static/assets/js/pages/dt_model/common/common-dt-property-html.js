'use strict'
$(document).ready(function () {

    $(document).on("click", ".btn-property-file-view", function () {
        var form_type = $('#formType').val();
        var file_name = $(this).data("trgt-file-nm");
        var set_order = $(this).data('set-order');

        var jsonData = JSON.parse($('#preprocProPerty').val());

        var file_path;
        if (form_type === 'I') {
            file_path = jsonData.preproc_property_info[0].base_dir;
        } else {
            file_path = $('#lastFilePath').val();
        }

        if (form_type === 'I') {
            viewPreprocFile(form_type, file_name, file_path, 'preprocTableRange', 'fileViewDataTableRange', set_order);
        } else {
            //$('#property_option').empty();
            //$('#preprocTableRangeView').empty();
            viewPreprocFile(form_type, file_name, file_path, 'preprocTableRangeView', 'fileViewDataTableRange2', set_order);
        }

    });


    $(document).on("click", ".btn-property-delete", function () {

        var con = confirm('삭제 지점 기준으로 이후 작업한 모든 데이터가 사라집니다. 진행 하시겠습니까?');
        if (con == true) {
            let jsonData = JSON.parse($('#preprocProPerty').val());
            let file_path = jsonData.preproc_property_info[0].base_dir

            let preprocOrder = $(this).data("preproc-order");
            let setOrder = $(this).data("set-order");
            let propertyInfo = jsonData.preproc_property_info[0];
            let preprocProperty = propertyInfo.preproc_property;

            let filesToRemove = [];

            console.log('preprocOrder', preprocOrder, 'setOrder', setOrder, 'propertyInfo', propertyInfo, 'preprocProperty', preprocProperty);

            //전체 단계 삭제시
            for (var j = preprocProperty.length - 1; j >= 0; j--) {
                var property = preprocProperty[j];
                if (property.preproc_order >= preprocOrder) {
                    var setsToRemove = [];
                    for (var k = 0; k < property.preproc_set.length; k++) {
                        if (property.preproc_order === preprocOrder && property.preproc_set[k].set_order >= setOrder) {
                            filesToRemove.push(property.preproc_set[k].trgt_file_nm);
                            setsToRemove.push(k);
                        } else if (property.preproc_order > preprocOrder) {
                            filesToRemove.push(property.preproc_set[k].trgt_file_nm);
                            setsToRemove.push(k);
                        }
                    }
                    // 삭제할 요소들을 역순으로 순회하여 삭제
                    for (var l = setsToRemove.length - 1; l >= 0; l--) {
                        property.preproc_set.splice(setsToRemove[l], 1);
                    }
                }
            }

            //프로세스 단계별 파일 삭제
            /**
             * 2024-08-01
             * 파일을 절대 삭제하면 안되는 예외 파일
             * 원본 파일, 원본에서 날짜 선택한 파일, 컬럼을 선택한 데이터 파일
             * 필요 옵션 : Validate
             * */
            let excludeFileList = [propertyInfo.base_file_nm, propertyInfo.base_file_nm_set_range_row, propertyInfo.base_file_nm_set_range_col];
            // filesToRemove 배열에서 excludeFileList에 포함되지 않은 파일만 남김
            filesToRemove = filesToRemove.filter(file => !excludeFileList.includes(file));
            console.log('Filtering filesToRemove', filesToRemove);

            deletePreprocFiles(filesToRemove, file_path);

            // 업데이트된 JSON 데이터 hidden 요소에 넣기
            $('#preprocProPerty').val(JSON.stringify(jsonData));
            $('.preprocProPerty').val(prettyJson(JSON.stringify(jsonData)));

            getTotalLastFile();
            makePropertyListHtml();
            $('#preprocTableRange').empty();
            /**
             * 2024-07-29
             * 프로세스 삭제 처리시 각 테이블 초기화
             * */
            switch (preprocOrder) {
                case 1: {
                    let ids = ['preprocTableExcludeRangeValidate', 'preprocTableRangeValidate'];
                    ids.forEach(function (_id) {
                        let wrapper = document.querySelector(`#${_id}`);
                        if (wrapper) {
                            wrapper.innerHTML = ``;
                            wrapper.style.display = 'none';
                        }
                    });
                    break;
                }
                case 2: {
                    let ids = ['preprocTableExcludeRangeOutlier', 'preprocTableRangeOutlier'];
                    ids.forEach(function (_id) {
                        let wrapper = document.querySelector(`#${_id}`);
                        if (wrapper) {
                            wrapper.innerHTML = ``;
                            wrapper.style.display = 'none';
                        }
                    });
                    resetGraphView([5, 6, 7]);
                    break;
                }
                case 3: {
                    let ids = ['preprocTableExcludeRangeMissing', 'preprocTableRangeMissing'];
                    ids.forEach(function (_id) {
                        let wrapper = document.querySelector(`#${_id}`);
                        if (wrapper) {
                            wrapper.innerHTML = ``;
                            wrapper.style.display = 'none';
                        }
                    });

                    var preProcData = JSON.parse($('#preprocProPerty').val());
                    var base_file_path = preProcData.preproc_property_info[0].base_dir;
                    var base_file_nm = preProcData.preproc_property_info[0].last_step_preproc_file_nm;
                    var index_trgt_col = preProcData.preproc_property_info[0].index_trgt_col;

                    //보간 초기 옵션 초기화
                    getTargetDataSetInfoCallbackFunction(base_file_path, base_file_nm, index_trgt_col, 'N', 'interpolate', function () {
                        makePropertyListHtml();
                    });
                    break;
                }
                case 4: {
                    let ids = ['preprocTableExcludeAddedRangeResample', 'preprocTableExcludeRemovedRangeResample', 'preprocTableRangeResample'];
                    ids.forEach(function (_id) {
                        let wrapper = document.querySelector(`#${_id}`);
                        if (wrapper) {
                            wrapper.innerHTML = ``;
                            wrapper.style.display = 'none';
                        }
                    });
                    break;
                }
                case 5: {
                    let ids = ['preprocTableRangeUnit'];
                    ids.forEach(function (_id) {
                        let wrapper = document.querySelector(`#${_id}`);
                        if (wrapper) {
                            wrapper.innerHTML = ``;
                            wrapper.style.display = 'none';
                        }
                    });
                    break;
                }
            }
        } else {
            return false;
        }
    });
});


function deletePreprocFiles(filesToRemove, file_path) {
    var data = {
        file_path: file_path, files: filesToRemove
    }
    showProgressBar({element: null, process_id: 'process-40'});
    $.ajax({
        type: 'POST', //async: false,
        //enctype: 'multipart/form-data',
        url: '/dt/model/delete/files',
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8;",
        dataType: "json",
        success: function (result) {
            if (result.result_code === 200) {
                closeProgressBar({element: null, process_id: 'process-40'});
                console.log('Files deleted successfully:');
            } else {
                closeProgressBar({element: null, process_id: 'process-40'});
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
            closeProgressBar({element: null, process_id: 'process-40'});
            alert('에러가 발생하였습니다. 관리자에게 문의해주세요.');
        }
    });
}

function makePropertyListHtml() {
    var preprocCurrent = $('#preprocCurrent').val();

    //validate, outlier, interpolate, resample, unit

    $('#property_range').empty();
    var form_type = $('#formType').val();
    var jsonData = JSON.parse($('#preprocProPerty').val());
    var propertyRangeDiv = $('#property_range');
    var preprocProperty = jsonData.preproc_property_info[0].preproc_property;

    var strHTML = '';

    preprocProperty.forEach(function (property) {
        var preprocOrder = property.preproc_order;
        var preprocType = property.preproc_type;
        var preprocSet = property.preproc_set;

        if (preprocCurrent === 'validate') {
            if (preprocOrder === 1) {
                strHTML += '<div><h6>설정 목록 : 유효성</h6></div><hr/>'
            }
        }
        if (preprocCurrent === 'outlier') {
            if (preprocOrder === 2) {
                strHTML += '<div><h6>설정 목록 : 이상치</h6></div><hr/>'
            }
        }
        if (preprocCurrent === 'interpolate') {
            if (preprocOrder === 3) {
                strHTML += '<div><h6>설정 목록 : 결측치</h6></div><hr/>'
            }
        }
        if (preprocCurrent === 'resample') {
            if (preprocOrder === 4) {
                strHTML += '<div><h6>설정 목록 : 리샘플링</h6></div><hr/>'
            }
        }
        if (preprocCurrent === 'unit') {
            if (preprocOrder === 5) {
                strHTML += '<div><h6>설정 목록 : 단위변환</h6></div><hr/>'
            }
        }

        if (preprocSet.length > 0) {
            preprocSet.forEach(function (set) {
                console.log('set', set);
                if (preprocCurrent === 'validate') {
                    if (preprocOrder === 1) {
                        strHTML += '<div class="validate-section">';

                        strHTML += `<a data-trgt_col="${set.trgt_col}" data-vrfc_tp="${set.vrfc_tp}" data-vrfc_sub_tp="${set.vrfc_sub_tp}" href="#none" class="btn-property-file-view" data-set-order="` + set.set_order + '" data-preproc-order="' + preprocOrder + '" data-trgt-file-nm="' + set.trgt_file_nm + '">';
                        strHTML += '검증 컬럼 : ' + set.trgt_col + ' | ';
                        strHTML += '검증 타입 : ' + set.vrfc_tp_nm + ' | ';
                        strHTML += '검증 형태 : ' + set.vrfc_sub_tp_nm + ' | ';
                        strHTML += '지정 형태 : ' + set.vrfc_clear_tp_nm + '  ';
                        strHTML += '</a>';

                        if (form_type === 'I') {
                            strHTML += '<div class="btn-group ml-2" role="group">'
                            strHTML += '<button type="button" class="btn-sm btn-danger btn-property-delete" data-set-order="' + set.set_order + '" data-preproc-order="' + preprocOrder + '" data-trgt-file-nm="' + set.trgt_file_nm + '">X</button><br>';
                            strHTML += '</div>';
                        }
                        strHTML += '</div>';
                        strHTML += '<hr>';
                    } else {
                        console.error('preprocOrder is not matched 1');
                    }
                }

                if (preprocCurrent === 'outlier') {
                    if (preprocOrder === 2) {
                        strHTML += '<div class="outlier-section">';
                        strHTML += `<a href="#none" data-trgt_col="${set.trgt_col}" data-outlier_tp="${set.outlier_tp}" class="btn-property-file-view" data-set-order="` + set.set_order + '" data-preproc-order="' + preprocOrder + '" data-trgt-file-nm="' + set.trgt_file_nm + '">';
                        strHTML += '검증 유형 : ' + set.outlier_tp + ' | ';
                        strHTML += '선택 컬럼 : ' + set.trgt_col;
                        strHTML += `<br/>`;
                        if (set.outlier_tp === 'standard') {
                            strHTML += '샘플링 길이(FQ) : ' + set.freq + ' | ';
                            strHTML += '정규분포 경계(PV) : ' + set.p_value;
                        } else if (set.outlier_tp === 'kmean') {
                            strHTML += '샘플링 길이(FQ) : ' + set.freq + ' | ';
                            strHTML += '클러스터 수(CC) : ' + set.n_clusters + ' | ';
                            strHTML += '클러스터의 제한되는 데이터 개수(N_COUNT) : ' + set.n_count;
                        } else if (set.outlier_tp === 'dbscan') {
                            strHTML += '샘플링 길이(FQ) : ' + set.freq + ' | ';
                            strHTML += '반지름(EPS) : ' + set.eps + ' | ';
                            strHTML += '최소 샘플(MS) : ' + set.min_samples;
                        } else {
                            strHTML += 'window_size : ' + set.window_size + ' | ';
                            strHTML += 'threshold : ' + set.threshold;
                        }
                        strHTML += '</a>';
                        if (form_type === 'I') {
                            strHTML += '<div class="btn-group ml-2" role="group">'
                            strHTML += '<button type="button" class="btn-sm btn-danger btn-property-delete" data-set-order="' + set.set_order + '" data-preproc-order="' + preprocOrder + '" data-trgt-file-nm="' + set.trgt_file_nm + '">X</button><br>';
                            strHTML += '</div>';
                        }
                        strHTML += '</div>';
                        strHTML += '<hr>';
                    } else {
                        console.error('preprocOrder is not matched 2');
                    }
                }
                if (preprocCurrent === 'interpolate') {
                    if (preprocOrder === 3) {
                        strHTML += '<div class="interpolate-section">';
                        let outputStr = '';
                        let labelStr = '';
                        switch (set.interpl_tp) {
                            case 'decisiontree':
                                strHTML += `<a href="#none" class="btn-property-file-view" data-interpl_tp="${set.interpl_tp}" data-set-order="` + set.set_order + '" data-preproc-order="' + preprocOrder + '" data-trgt-file-nm="' + set.trgt_file_nm + '">';
                                strHTML += '보간 옵션 : ' + set.interpl_tp.toUpperCase();
                                strHTML += ' | 보간 대상 항목 : ' + set.interpl_feature.toUpperCase();
                                set.interpl_outputs?.forEach((output, index) => {
                                    if ((set.interpl_outputs.length - 1) === index) {
                                        outputStr += output;
                                    } else {
                                        outputStr += output + ', ';
                                    }
                                });
                                strHTML += ' | 보간 입력 항목 : ' + outputStr;
                                break;
                            case 'random forest':
                                strHTML += `<a href="#none" class="btn-property-file-view" data-interpl_tp="${set.interpl_tp}" data-output="${set.interpl_outputs.map(item => `${item}`)}" data-features="${set.interpl_labels.map(item => `${item}`).join(', ')}" data-set-order="` + set.set_order + '" data-preproc-order="' + preprocOrder + '" data-trgt-file-nm="' + set.trgt_file_nm + '">';
                                strHTML += '보간 옵션 : ' + set.interpl_tp.toUpperCase();
                                strHTML += ' | 보간 대상 항목 : ' + set.interpl_outputs[0];
                                labelStr = '';
                                set.interpl_labels?.forEach((feature, index) => {
                                    if ((set.interpl_labels.length - 1) === index) {
                                        labelStr += feature;
                                    } else {
                                        labelStr += feature + ', ';
                                    }
                                });
                                strHTML += ' | 보간 입력 항목 : ' + labelStr;
                                break;
                            case 'brits':
                                strHTML += `<a href="#none" class="btn-property-file-view" data-interpl_tp="${set.interpl_tp}" data-output="${set.interpl_outputs.map(item => `${item}`)}" data-set-order="` + set.set_order + '" data-preproc-order="' + preprocOrder + '" data-trgt-file-nm="' + set.trgt_file_nm + '">';
                                strHTML += '보간 옵션 : ' + set.interpl_tp.toUpperCase();
                                strHTML += ' | 보간 대상 항목 : ' + set.interpl_outputs[0];
                                break;
                            case 'naomi':
                                strHTML += `<a href="#none" class="btn-property-file-view" data-interpl_tp="${set.interpl_tp}" data-output="${set.interpl_outputs.map(item => `${item}`)}" data-set-order="` + set.set_order + '" data-preproc-order="' + preprocOrder + '" data-trgt-file-nm="' + set.trgt_file_nm + '">';
                                strHTML += '보간 옵션 : ' + set.interpl_tp.toUpperCase();
                                strHTML += ' | 보간 대상 항목 : ' + set.interpl_outputs[0];
                                break;
                            default:
                                strHTML += `<a href="#none" class="btn-property-file-view" data-interpl_tp="${set.interpl_tp}" data-set-order="` + set.set_order + '" data-preproc-order="' + preprocOrder + '" data-trgt-file-nm="' + set.trgt_file_nm + '">';
                                strHTML += '보간 옵션 : ' + set.interpl_tp.toUpperCase();
                                break;
                        }
                        strHTML += '</a>';

                        if (form_type === 'I') {
                            strHTML += '<div class="btn-group ml-2" role="group">'
                            strHTML += '<button type="button" class="btn-sm btn-danger btn-property-delete" data-set-order="' + set.set_order + '" data-preproc-order="' + preprocOrder + '" data-trgt-file-nm="' + set.trgt_file_nm + '">X</button><br>';
                            strHTML += '</div>';
                        }
                        strHTML += '</div>';
                        strHTML += '<hr>';
                    } else {
                        console.error('preprocOrder is not matched 3');
                    }
                }
                if (preprocCurrent === 'resample') {
                    if (preprocOrder === 4) {
                        strHTML += '<div class="resample-section">';

                        strHTML += '<a href="#none" class="btn-property-file-view" data-set-order="' + set.set_order + '" data-preproc-order="' + preprocOrder + '" data-trgt-file-nm="' + set.trgt_file_nm + '">';
                        strHTML += '간격 유형 : ' + set.resmpl_tp_nm + ' | ';
                        strHTML += '간격 수치 : ' + set.resmpl_intvl_value;
                        strHTML += '</a>';

                        if (form_type === 'I') {
                            strHTML += '<div class="btn-group ml-2" role="group">'
                            strHTML += '<button type="button" class="btn-sm btn-danger btn-property-delete" data-set-order="' + set.set_order + '" data-preproc-order="' + preprocOrder + '" data-trgt-file-nm="' + set.trgt_file_nm + '">X</button><br>';
                            strHTML += '</div>';
                        }
                        strHTML += '</div>';
                        strHTML += '<hr>';
                    } else {
                        console.error('preprocOrder is not matched 4');
                    }
                }
                if (preprocCurrent === 'unit') {
                    if (preprocOrder === 5) {
                        strHTML += '<div class="unit-section">';

                        strHTML += '<a href="#none" class="btn-property-file-view" data-set-order="' + set.set_order + '" data-preproc-order="' + preprocOrder + '" data-trgt-file-nm="' + set.trgt_file_nm + '">';
                        strHTML += set.trgt_col + ' | ';
                        strHTML += set.unit_tp_nm + ' | ';
                        strHTML += set.unit_cd_1_nm + ' -> ';
                        strHTML += set.unit_cd_2_nm + '  ';
                        strHTML += '</a>';

                        if (form_type === 'I') {
                            strHTML += '<div class="btn-group ml-2" role="group">'
                            strHTML += '<button type="button" class="btn-sm btn-danger btn-property-delete" data-set-order="' + set.set_order + '" data-preproc-order="' + preprocOrder + '" data-trgt-file-nm="' + set.trgt_file_nm + '">X</button><br>';
                            strHTML += '</div>';
                        }
                        strHTML += '</div>';
                        strHTML += '<hr>';
                    } else {
                        console.error('preprocOrder is not matched 5');
                    }
                }
            });
        }
    });
    $('#property_range').html(strHTML);
}

function viewPreprocFile(form_type, file_name, file_path, position_id, datatable_id, set_order) {
    var data = {
        form_type: form_type, file_path: file_path, file_name: file_name
    }
    showProgressBar({element: null, process_id: 'process-20'});
    $.ajax({
        type: "POST",
        url: '/dt/model/load/preprocFile',
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8;",
        dataType: "json",
        success: function (result) {
            if (result.code == 200) {
                let header_list = result.header_list;
                let data_list = result.data_list;
                if (form_type === 'U') {
                    makeInfoHtmlJsonProperty(set_order);
                    $('#preprocTableRangeView').show();
                }
                makeHtmlTable(header_list, data_list, position_id, 'N', datatable_id)
                $('#' + datatable_id).DataTable({
                    scrollX: true,
                    columnDefs: [{
                        targets: '_all', className: 'text-nowrap'
                    }],
                    "destroy": true,
                    "order": [[0, "asc"]],
                    "searching": false,
                    "info": false,
                    "lengthChange": false,
                    "autoWidth": true,
                    "lengthMenu": [[10], [10]]
                });
                closeProgressBar({element: null, process_id: 'process-20'});
            } else {
                closeProgressBar({element: null, process_id: 'process-20'});
                alert('API 내 에러 발생');
            }
        },
        error: function (xhr, status, error) {
            console.error('error : ', error);
            closeProgressBar({element: null, process_id: 'process-20'});
            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
        }
    });
}

function resetGraphView(view_numbers = [5, 6, 7]) {
    view_numbers.forEach(view_number => {
        let form_group;
        let chart_range;
        switch (view_number) {
            case 5: {
                form_group = document.querySelector('#outlier_standard_chart_range_form_group');
                chart_range = document.querySelector('#outlier_standard_chart_range');
                break;
            }
            case 6: {
                form_group = document.querySelector('#outlier_kmean_chart_range_form_group');
                chart_range = document.querySelector('#outlier_kmean_chart_range');
                break;
            }
            case 7: {
                form_group = document.querySelector('#outlier_dbscan_chart_range_form_group');
                chart_range = document.querySelector('#outlier_dbscan_chart_range');
                break;
            }
        }
        form_group.style.display = 'none';
        chart_range.style.display = 'none';
        let viewElement = document.querySelector('#view' + view_number);
        viewElement.remove();
        let newViewElement = document.createElement('div');
        newViewElement.setAttribute('id', 'view' + view_number);
        newViewElement.style.width = '100%';
        newViewElement.style.height = 'auto';
        newViewElement.style.borderStyle = 'solid';
        newViewElement.style.borderWidth = '1px';
        newViewElement.style.borderColor = '#EEE';
        chart_range.appendChild(newViewElement);
    });
}

function hideGraphViewGroup(view_numbers = [5, 6, 7]) {
    view_numbers.forEach(view_number => {
        let form_group;
        let chart_range;
        switch (view_number) {
            case 5: {
                form_group = document.querySelector('#outlier_standard_chart_range_form_group');
                chart_range = document.querySelector('#outlier_standard_chart_range');
                break;
            }
            case 6: {
                form_group = document.querySelector('#outlier_kmean_chart_range_form_group');
                chart_range = document.querySelector('#outlier_kmean_chart_range');
                break;
            }
            case 7: {
                form_group = document.querySelector('#outlier_dbscan_chart_range_form_group');
                chart_range = document.querySelector('#outlier_dbscan_chart_range');
                break;
            }
        }
        form_group.style.display = 'none';
        chart_range.style.display = 'none';
    });
}

function showGraphViewGroup(view_numbers = [5, 6, 7]) {
    view_numbers.forEach(view_number => {
        let form_group;
        let chart_range;
        switch (view_number) {
            case 5: {
                form_group = document.querySelector('#outlier_standard_chart_range_form_group');
                chart_range = document.querySelector('#outlier_standard_chart_range');
                break;
            }
            case 6: {
                form_group = document.querySelector('#outlier_kmean_chart_range_form_group');
                chart_range = document.querySelector('#outlier_kmean_chart_range');
                break;
            }
            case 7: {
                form_group = document.querySelector('#outlier_dbscan_chart_range_form_group');
                chart_range = document.querySelector('#outlier_dbscan_chart_range');
                break;
            }
        }
        form_group.style.display = 'block';
        chart_range.style.display = 'block';
    });
}

function initializeViewGroup(view, aspect = 16 / 9) {
    setElementHeightByRatio(view, 16 / 9);
    let chart = echarts.init(view);
    chart.clear();
}

/**
 * 각 프로세스를 리셋해주는 함수입니다.
 * */
function resetProcess({processData = JSON.parse($('#preprocProPerty').val()), preprocOrder, setOrder}) {
    console.log('processData', processData, 'preprocOrder', preprocOrder, 'setOrder', setOrder);
    let file_path = processData.preproc_property_info[0].base_dir
    let propertyInfo = processData.preproc_property_info[0];
    let preprocProperty = propertyInfo.preproc_property;
    let filesToRemove = [];
    //전체 단계 삭제시
    for (var j = preprocProperty.length - 1; j >= 0; j--) {
        var property = preprocProperty[j];
        if (property.preproc_order >= preprocOrder) {
            var setsToRemove = [];
            for (var k = 0; k < property.preproc_set.length; k++) {
                if (property.preproc_order === preprocOrder && property.preproc_set[k].set_order >= setOrder) {
                    filesToRemove.push(property.preproc_set[k].trgt_file_nm);
                    setsToRemove.push(k);
                } else if (property.preproc_order > preprocOrder) {
                    filesToRemove.push(property.preproc_set[k].trgt_file_nm);
                    setsToRemove.push(k);
                }
            }
            // 삭제할 요소들을 역순으로 순회하여 삭제
            for (var l = setsToRemove.length - 1; l >= 0; l--) {
                property.preproc_set.splice(setsToRemove[l], 1);
            }
        }
    }
    /**
     * 2024-08-01
     * 파일을 절대 삭제하면 안되는 예외 파일
     * 원본 파일, 원본에서 날짜 선택한 파일, 컬럼을 선택한 데이터 파일
     * 필요 옵션 : Validate
     * */
    let excludeFileList = [propertyInfo.base_file_nm, propertyInfo.base_file_nm_set_range_row, propertyInfo.base_file_nm_set_range_col];
    // filesToRemove 배열에서 excludeFileList에 포함되지 않은 파일만 남김
    filesToRemove = filesToRemove.filter(file => !excludeFileList.includes(file));
    console.log('Filtering filesToRemove', filesToRemove);
    //프로세스 단계별 파일 삭제
    deletePreprocFiles(filesToRemove, file_path);
    // 업데이트된 JSON 데이터 hidden 요소에 넣기
    $('#preprocProPerty').val(JSON.stringify(processData));
    $('.preprocProPerty').val(prettyJson(JSON.stringify(processData)));
    getTotalLastFile();
    makePropertyListHtml();
    $('#preprocTableRange').empty();
    /**
     * 2024-07-29
     * 프로세스 삭제 처리시 각 테이블 초기화
     * */
    tableUIInitialized(preprocOrder);
}

/**
 * 2024-08-01
 * 프로세스 삭제 처리시 각 테이블 초기화 함수
 * */
function tableUIInitialized(preprocOrder) {
    switch (preprocOrder) {
        case 1: {
            let ids = ['preprocTableExcludeRangeValidate', 'preprocTableRangeValidate'];
            ids.forEach(function (_id) {
                let wrapper = document.querySelector(`#${_id}`);
                if (wrapper) {
                    wrapper.innerHTML = ``;
                    wrapper.style.display = 'none';
                }
            });
            break;
        }
        case 2: {
            let ids = ['preprocTableExcludeRangeOutlier', 'preprocTableRangeOutlier'];
            ids.forEach(function (_id) {
                let wrapper = document.querySelector(`#${_id}`);
                if (wrapper) {
                    wrapper.innerHTML = ``;
                    wrapper.style.display = 'none';
                }
            });
            resetGraphView([5, 6, 7]);
            break;
        }
        case 3: {
            let ids = ['preprocTableExcludeRangeMissing', 'preprocTableRangeMissing'];
            ids.forEach(function (_id) {
                let wrapper = document.querySelector(`#${_id}`);
                if (wrapper) {
                    wrapper.innerHTML = ``;
                    wrapper.style.display = 'none';
                }
            });

            var preProcData = JSON.parse($('#preprocProPerty').val());
            var base_file_path = preProcData.preproc_property_info[0].base_dir;
            var base_file_nm = preProcData.preproc_property_info[0].last_step_preproc_file_nm;
            var index_trgt_col = preProcData.preproc_property_info[0].index_trgt_col;

            //보간 초기 옵션 초기화
            getTargetDataSetInfoCallbackFunction(base_file_path, base_file_nm, index_trgt_col, 'N', 'interpolate', function () {
                makePropertyListHtml();
            });
            break;
        }
        case 4: {
            let ids = ['preprocTableExcludeAddedRangeResample', 'preprocTableExcludeRemovedRangeResample', 'preprocTableRangeResample'];
            ids.forEach(function (_id) {
                let wrapper = document.querySelector(`#${_id}`);
                if (wrapper) {
                    wrapper.innerHTML = ``;
                    wrapper.style.display = 'none';
                }
            });
            break;
        }
        case 5: {
            let ids = ['preprocTableRangeUnit'];
            ids.forEach(function (_id) {
                let wrapper = document.querySelector(`#${_id}`);
                if (wrapper) {
                    wrapper.innerHTML = ``;
                    wrapper.style.display = 'none';
                }
            });
            break;
        }
    }
}
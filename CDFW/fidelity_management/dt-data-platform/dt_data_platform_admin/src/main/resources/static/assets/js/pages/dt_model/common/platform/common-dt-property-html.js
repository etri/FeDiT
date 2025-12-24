'use strict'
var dataVisualCharts = [];
var dataVisualChartOptions = [];
$(document).ready(function () {
    $(document).on('click', '.btn-property-file-view', function () {
        let form_type = $('#formType').val();
        let file_name = $(this).data("trgt-file-nm");
        let set_order = $(this).data('set-order');

        let jsonData = JSON.parse($('#preprocProPerty').val());

        let file_path = form_type === 'I' ? jsonData.preproc_property_info[0].base_dir : $('#lastFilePath').val();
        let preprocTableRangeElement = document.querySelector('#preprocTableRange');
        let preprocTableRangeViewElement = document.querySelector('#preprocTableRangeView');
        console.log('preprocTableRangeElement', preprocTableRangeElement);
        console.log('preprocTableRangeViewElement', preprocTableRangeViewElement);
        if (preprocTableRangeElement || preprocTableRangeViewElement) {
            console.log('btn-property-file-view click event', 'set_order', set_order);
            form_type === 'I' ? viewPreprocFile(form_type, file_name, file_path, 'preprocTableRange', 'fileViewDataTableRange', set_order) : viewPreprocFile(form_type, file_name, file_path, 'preprocTableRangeView', 'fileViewDataTableRange2', set_order);
        }
        if (form_type !== 'I') {
            // Insert 모드가 아닐때,
            let preprocess = $(this).data('preproc-order');
            if (preprocess !== 5) {
                let preprocessIndex = $(this).data('set-order');
                let origin_file_name = jsonData.preproc_property_info[0].base_file_nm_set_range_col;
                let origin_file_path = $('#lastFilePath').val();
                let column = $(this).data('trgt_col') ? $(this).data('trgt_col') : $(this).data('output') ? $(this).data('output') : 'all';
                let modelSeq = $('#modelSeq').val();
                let data = {
                    preprocess,
                    preprocessIndex,
                    column: column,
                    modelSeq: modelSeq,
                    originFileName: origin_file_name,
                    originFilePath: origin_file_path
                }
                getPreprocessFilteredVisualData(data, function (result) {
                    console.log('getPreprocessFilteredVisualData', result);
                    /**
                     * 2025-03-27
                     * 차트 데이터 가공
                     * */
                    let keys = Object.keys(result.data);
                    clearDataVisualChart();
                    if (keys.includes('ADDED_DATA') && keys.includes('REMOVED_DATA')) {

                        keys.forEach(function (histogram_key, index) {
                            let keys = Object.keys(result.data[histogram_key]);
                            if (keys.length !== 0) {
                                if (index === 0) {
                                    let preprocDataVisualRangeView = document.querySelector('#preprocDataVisualRangeView');
                                    preprocDataVisualRangeView.style.display = 'block';
                                }

                                let serieses = [];
                                let dates = [];
                                keys.forEach(function (key, keyIndex) {
                                    let colors = [
                                        '#5571C3', '#93CC79', '#F9C761', '#EC6468', '#76C0DD', '#40A273',
                                        '#FA8258', '#9960B2', '#E87BCB', '#5596C3', '#BBCC79', '#F9A561',
                                        '#EC64A4', '#76D9DD', '#40A245', '#FA6758', '#7F60B2', '#D77BE8'
                                    ];
                                    let datas = result.data[histogram_key][key]
                                    dates = Object.keys(datas)
                                    let series = {
                                        name: `${key}`,
                                        type: 'scatter',
                                        data: dates.map((date) => [date, datas[date]]),
                                        symbolSize: 10,
                                        itemStyle: {
                                            color: `${colors[keyIndex]}`
                                        }
                                    };
                                    serieses.push(series);
                                });
                                console.log('serieses', serieses);

                                /**
                                 * 2025-03-27
                                 * 차트 설정
                                 * */
                                dataVisualChartOptions[index] = {
                                    responsive: true,
                                    maintainAspectRatio: true,
                                    tooltip: {
                                        trigger: 'item',
                                        formatter: function (params) {
                                            return `${params.seriesName}<br>Date: ${params.name}<br>Value: ${params.value[1]}`;
                                        }
                                    },
                                    legend: {
                                        data: keys
                                    },
                                    xAxis: {
                                        type: 'category',
                                        data: dates,
                                        axisLabel: {
                                            rotate: 45
                                        }
                                    },
                                    yAxis: {
                                        type: 'value',
                                        name: ''
                                    },
                                    series: serieses
                                };

                                /**
                                 * Echart 설정
                                 * */
                                let graphContainer = document.querySelector('#data-visual-graph-container');
                                let graphContainerInner = document.createElement('div');
                                graphContainerInner.classList.add('data-visual-graph-container-inner');

                                let label = document.createElement('label');
                                let classes = ['col-form-label', 'pt-3', 'pb-3', 'data-visual-graph-container-inner-label'];
                                classes.forEach(function (_class) {
                                    label.classList.add(_class);
                                });
                                label.innerHTML = `${histogram_key}`;
                                graphContainer.appendChild(label);
                                graphContainer.appendChild(graphContainerInner);
                                initializeDataVisualChart(index, graphContainerInner);
                            } else {
                                let preprocDataVisualRangeView = document.querySelector('#preprocDataVisualRangeView');
                                preprocDataVisualRangeView.style.display = 'none';
                            }
                        });
                    } else {
                        if (keys.length !== 0) {
                            let preprocDataVisualRangeView = document.querySelector('#preprocDataVisualRangeView');
                            preprocDataVisualRangeView.style.display = 'block';

                            let serieses = [];
                            let dates = [];
                            keys.forEach(function (key, keyIndex) {
                                let colors = [
                                    '#5571C3', '#93CC79', '#F9C761', '#EC6468', '#76C0DD', '#40A273',
                                    '#FA8258', '#9960B2', '#E87BCB', '#5596C3', '#BBCC79', '#F9A561',
                                    '#EC64A4', '#76D9DD', '#40A245', '#FA6758', '#7F60B2', '#D77BE8'
                                ];
                                let datas = result.data[key]
                                dates = Object.keys(datas)
                                console.log('dates', dates);
                                let series = {
                                    name: `${key}`,
                                    type: 'scatter',
                                    data: dates.map((date) => [date, datas[date]]),
                                    symbolSize: 10,
                                    itemStyle: {
                                        color: `${colors[keyIndex]}`
                                    }
                                };
                                serieses.push(series);
                            });
                            console.log('serieses', serieses);

                            /**
                             * 2025-03-27
                             * 차트 설정
                             * */

                            dataVisualChartOptions[0] = {
                                responsive: true,
                                maintainAspectRatio: true,
                                tooltip: {
                                    trigger: 'item',
                                    formatter: function (params) {
                                        return `${params.seriesName}<br>Date: ${params.name}<br>Value: ${params.value[1]}`;
                                    }
                                },
                                legend: {
                                    data: keys
                                },
                                xAxis: {
                                    type: 'category',
                                    data: dates,
                                    axisLabel: {
                                        rotate: 45
                                    }
                                },
                                yAxis: {
                                    type: 'value',
                                    name: ''
                                },
                                series: serieses
                            };

                            /**
                             * Echart 설정
                             * */
                            let graphContainer = document.querySelector('#data-visual-graph-container');
                            let graphContainerInner = document.createElement('div');
                            graphContainerInner.classList.add('data-visual-graph-container-inner');
                            graphContainer.appendChild(graphContainerInner);

                            initializeDataVisualChart(0, graphContainerInner);
                        } else {
                            let preprocDataVisualRangeView = document.querySelector('#preprocDataVisualRangeView');
                            preprocDataVisualRangeView.style.display = 'none';
                        }
                    }
                    resizeDataVisualChart();
                });
            }
        }
    });
    $(document).on("click", ".btn-property-delete", function () {

        var con = confirm('삭제 지점 기준으로 이후 작업한 모든 데이터가 사라집니다. 진행 하시겠습니까?');
        if (con === true) {
            let jsonData = JSON.parse($('#preprocProPerty').val());
            let file_path = jsonData.preproc_property_info[0].base_dir

            let preprocOrder = $(this).data("preproc-order");
            let setOrder = $(this).data("set-order");
            let propertyInfo = jsonData.preproc_property_info[0];
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
                    let form_type = $('#formType').val();
                    getPreprocessTargetDataSetInfo(base_file_path, base_file_nm, index_trgt_col, form_type, 'interpolate', false, function (data) {
                        console.log('getPreprocessTargetDataSetInfo', JSON.parse(data));
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

    /**
     * 2025-03-27
     * */
    window.addEventListener('resize', resizeDataVisualChart);
});

function deletePreprocFiles(filesToRemove, file_path) {
    let data = {
        file_path: file_path, files: filesToRemove
    }
    showProgressBar({element: null, process_id: 'process-40'});
    $.ajax({
        type: 'POST', //async: false,
        //enctype: 'multipart/form-data',
        url: '/dt/dataset/delete/files/META_MODEL',
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
            closeProgressBar({element: null, process_id: 'process-40'});
            alert('에러가 발생하였습니다. 관리자에게 문의해주세요.');
        }
    });
}

function makePropertyListHtml() {
    const createDeleteButton = (set, preprocOrder) => {
        let buttonWrapper = document.createElement('div');
        buttonWrapper.style.display = 'block';
        buttonWrapper.style.textAlign = 'end';

        let button = document.createElement('button');
        button.type = 'button';
        ['ui-button', 'primary', 'sm', 'btn-property-delete'].forEach(function (className) {
            button.classList.add(className);
        });
        button.innerHTML = '옵션 삭제';
        let attributes = [{
            option: 'data-set-order', value: `${set.set_order}`
        }, {
            option: 'data-preproc-order', value: `${preprocOrder}`
        }, {
            option: 'data-trgt-file-nm', value: `${set.trgt_file_nm}`
        }]
        attributes.forEach(function (attribute) {
            button.setAttribute(attribute.option, attribute.value);
        });
        buttonWrapper.appendChild(button);
        return buttonWrapper;
    }
    let preprocCurrent = $('#preprocCurrent').val();
    //각 전처리 단계별 설정 목록
    $('#property_range').empty();
    let form_type = $('#formType').val();
    let jsonData = JSON.parse($('#preprocProPerty').val());
    let preprocProperty = jsonData.preproc_property_info[0].preproc_property;

    let container = document.querySelector('#property_range');
    container.innerHTML = ``;

    let titleWrapper = document.createElement('div');
    let titleLabel = document.createElement('label');
    ['col-form-label'].forEach(function (className) {
        titleLabel.classList.add(className);
    });
    titleWrapper.appendChild(titleLabel);
    container.appendChild(titleWrapper);
    let hr = document.createElement('hr');
    hr.style.marginTop = '0';
    container.appendChild(hr);
    preprocProperty.forEach(function (property) {
        let preprocOrder = property.preproc_order;
        let preprocSet = property.preproc_set;

        let text = '설정 목록 :';

        if (preprocCurrent === 'validate') {
            if (preprocOrder === 1) {
                titleLabel.innerHTML = `${text} 유효성`;
            }
        }
        if (preprocCurrent === 'outlier') {
            if (preprocOrder === 2) {
                titleLabel.innerHTML = `${text} 이상치`;
            }
        }
        if (preprocCurrent === 'interpolate') {
            if (preprocOrder === 3) {
                titleLabel.innerHTML = `${text} 결측치`;
            }
        }
        if (preprocCurrent === 'resample') {
            if (preprocOrder === 4) {
                titleLabel.innerHTML = `${text} 리샘플링`;
            }
        }
        if (preprocCurrent === 'unit') {
            if (preprocOrder === 5) {
                titleLabel.innerHTML = `${text} 단위변환`;
            }
        }

        if (preprocSet.length > 0) {
            preprocSet.forEach(function (set) {
                let sectionWrapper = document.createElement('div');
                if (preprocCurrent === 'validate' && preprocOrder === 1) {
                    ['validate-section'].forEach(function (className) {
                        sectionWrapper.classList.add(className);
                    });
                    sectionWrapper.innerHTML = `<a style="font-size: 13px;" data-trgt_col="${set.trgt_col}" data-vrfc_tp="${set.vrfc_tp}" data-vrfc_sub_tp="${set.vrfc_sub_tp}" href="#none" class="btn-property-file-view" data-set-order="${set.set_order}" data-preproc-order="${preprocOrder}" data-trgt-file-nm="${set.trgt_file_nm}">
                                                        검증 컬럼 : ${set.trgt_col} |
                                                        검증 타입 : ${set.vrfc_tp_nm} |
                                                        검증 형태 : ${set.vrfc_sub_tp_nm} |
                                                        지정 형태 : ${set.vrfc_clear_tp_nm}
                                                    </a>`;
                    if (form_type === 'I') {
                        sectionWrapper.appendChild(createDeleteButton(set, preprocOrder))
                    }
                }
                if (preprocCurrent === 'outlier' && preprocOrder === 2) {
                    ['outlier-section'].forEach(function (className) {
                        sectionWrapper.classList.add(className);
                    });
                    sectionWrapper.innerHTML = `<a style="font-size: 13px;" href="#none" data-trgt_col="${set.trgt_col}" data-outlier_tp="${set.outlier_tp}" class="btn-property-file-view" data-set-order="${set.set_order}" data-preproc-order="${preprocOrder}" data-trgt-file-nm="${set.trgt_file_nm}">
                                                        검증 유형 : ${set.outlier_tp} | 선택 컬럼 : ${set.trgt_col} |
                                                        <br/>
                                                        ${set.outlier_tp === 'standard' ? `샘플링 길이(FQ) : ${set.freq} | 정규분포 경계(PV) : ${set.p_value}` : set.outlier_tp === 'kmean' ? `샘플링 길이(FQ) : ${set.freq} | 클러스터 수(CC) : ${set.n_clusters} | 클러스터의 제한되는 데이터 개수(N_COUNT) : ${set.n_count}` : set.outlier_tp === 'dbscan' ? `샘플링 길이(FQ) : ${set.freq} | 반지름(EPS) : ${set.eps} | 최소 샘플(MS) : ${set.min_samples}` : `window_size : ${set.window_size} | threshold : ${set.threshold}`}
                                                    </a>`;
                    if (form_type === 'I') {
                        sectionWrapper.appendChild(createDeleteButton(set, preprocOrder))
                    }
                }
                if (preprocCurrent === 'interpolate' && preprocOrder === 3) {
                    ['interpolate-section'].forEach(function (className) {
                        sectionWrapper.classList.add(className);
                    });
                    let outputStr = '';
                    let labelStr = '';
                    switch (set.interpl_tp) {
                        case 'decisiontree': {
                            set.interpl_outputs?.forEach((output, index) => {
                                if ((set.interpl_outputs.length - 1) === index) {
                                    outputStr += output;
                                } else {
                                    outputStr += output + ', ';
                                }
                            });
                            sectionWrapper.innerHTML = `<a style="font-size: 13px;" href="#none" class="btn-property-file-view" data-interpl_tp="${set.interpl_tp}" data-set-order="${set.set_order}" data-preproc-order="${preprocOrder}" data-trgt-file-nm="${set.trgt_file_nm}">
                                                            보간 옵션 : ${set.interpl_tp.toUpperCase()} | 보간 대상 항목 : ${set.interpl_feature.toUpperCase()} | 보간 입력 항목 : ${outputStr}
                                                        </a>`;
                            break;
                        }
                        case 'random forest': {
                            set.interpl_labels?.forEach((feature, index) => {
                                if ((set.interpl_labels.length - 1) === index) {
                                    labelStr += feature;
                                } else {
                                    labelStr += feature + ', ';
                                }
                            });
                            sectionWrapper.innerHTML = `<a style="font-size: 13px;" href="#none" class="btn-property-file-view" data-interpl_tp="${set.interpl_tp}" data-output="${set.interpl_outputs.map(item => item)}" data-features="${set.interpl_labels.map(item => item).join(', ')}" data-set-order="${set.set_order}" data-preproc-order="${preprocOrder}" data-trgt-file-nm="${set.trgt_file_nm}">
                                                            보간 옵션 : ${set.interpl_tp.toUpperCase()} | 보간 대상 항목 : ${set.interpl_outputs[0]} | 보간 입력 항목 : ${labelStr}
                                                        </a>`;
                            break;
                        }
                        case 'brits': {
                            sectionWrapper.innerHTML = `<a style="font-size: 13px;" href="#none" class="btn-property-file-view" data-interpl_tp="${set.interpl_tp}" data-output="${set.interpl_outputs.map(item => item)}" data-set-order="${set.set_order}" data-preproc-order="${preprocOrder}" data-trgt-file-nm="${set.trgt_file_nm}">
                                                            보간 옵션 : ${set.interpl_tp.toUpperCase()} | 보간 대상 항목 : ${set.interpl_outputs[0]}
                                                        </a>`;
                            break;
                        }
                        case 'naomi': {
                            sectionWrapper.innerHTML = `<a style="font-size: 13px;" href="#none" class="btn-property-file-view" data-interpl_tp="${set.interpl_tp}" data-output="${set.interpl_outputs.map(item => item)}" data-set-order="${set.set_order}" data-preproc-order="${preprocOrder}" data-trgt-file-nm="${set.trgt_file_nm}">
                                                            보간 옵션 : ${set.interpl_tp.toUpperCase()} | 보간 대상 항목 : ${set.interpl_outputs[0]}
                                                        </a>`;
                            break;
                        }
                        default: {
                            sectionWrapper.innerHTML = `<a style="font-size: 13px;" href="#none" class="btn-property-file-view" data-interpl_tp="${set.interpl_tp}" data-set-order="${set.set_order}" data-preproc-order="${preprocOrder}" data-trgt-file-nm="${set.trgt_file_nm}">
                                                            보간 옵션 : ${set.interpl_tp.toUpperCase()}
                                                        </a>`
                        }
                    }
                    if (form_type === 'I') {
                        sectionWrapper.appendChild(createDeleteButton(set, preprocOrder))
                    }
                }
                if (preprocCurrent === 'resample' && preprocOrder === 4) {
                    ['resample-section'].forEach(function (className) {
                        sectionWrapper.classList.add(className);
                    });
                    sectionWrapper.innerHTML = `<a style="font-size: 13px;" href="#none" class="btn-property-file-view" data-set-order="${set.set_order}" data-preproc-order="${preprocOrder}" data-trgt-file-nm="${set.trgt_file_nm}">
                                                            간격 유형 : ${set.resmpl_tp_nm} | 간격 수치 : ${set.resmpl_intvl_value}
                                                        </a>`;
                    if (form_type === 'I') {
                        sectionWrapper.appendChild(createDeleteButton(set, preprocOrder))
                    }
                }
                if (preprocCurrent === 'unit' && preprocOrder === 5) {
                    ['unit-section'].forEach(function (className) {
                        sectionWrapper.classList.add(className);
                    });
                    sectionWrapper.innerHTML = `<a style="font-size: 13px;" href="#none" class="btn-property-file-view" data-set-order="${set.set_order}" data-preproc-order="${preprocOrder}" data-trgt-file-nm="${set.trgt_file_nm}">
                                                            ${set.trgt_col} | ${set.unit_tp_nm} | ${set.unit_cd_1_nm} -> ${set.unit_cd_2_nm}
                                                        </a>`;
                    if (form_type === 'I') {
                        sectionWrapper.appendChild(createDeleteButton(set, preprocOrder))
                    }
                }
                if (sectionWrapper.innerText.trim().length !== 0) {
                    container.appendChild(sectionWrapper);
                    container.appendChild(document.createElement('hr'));
                }
            });
        }
    });
}

function viewPreprocFile(form_type, file_name, file_path, position_id, datatable_id, set_order) {
    let data = {
        form_type: form_type, file_path: file_path, file_name: file_name
    }
    showProgressBar({element: null, process_id: 'process-20'});
    $.ajax({
        type: "POST",
        url: '/dt/dataset/load/preprocFile/META_MODEL',
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8;",
        dataType: "json",
        success: function (result) {
            if (result.code === 200) {
                let header_list = result.header_list;
                let data_list = result.data_list;
                if (form_type === 'U' && set_order) {
                    let container = document.querySelector('#preprocOptionRangeView');
                    container.innerHTML = ``;
                    makeInfoHtmlJsonProperty(container, set_order);
                    $('#preprocTableRangeView').show();
                }
                let csvUpRange = document.querySelector(`#${position_id}`);
                csvUpRange.innerHTML = ``;
                data_list = [];
                makeDataTableHTML(header_list, data_list, csvUpRange, 'csvUpRangeDataTable', function (table) {
                    $(table).DataTable({
                        columnDefs: [{
                            targets: '_all', className: 'text-nowrap', searchable: false
                        }],
                        order: [[0, "asc"]],
                        searching: false,
                        info: false,
                        bServerSide: true,
                        ajax: {
                            url: "/datatable/server/render", type: "POST", dataType: "json", data: function (data) {
                                data.file_name = result.file_name;
                                data.file_path = result.file_path;
                                data.target_row_count = 0;
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
            let form_type = $('#formType').val();
            getPreprocessTargetDataSetInfo(base_file_path, base_file_nm, index_trgt_col, form_type, 'interpolate', false, function (data) {
                console.log('getPreprocessTargetDataSetInfo', JSON.parse(data));
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

/**
 * 2025-03-25 각 전처리 프로세스 별 필터링된 시각화 데이터 가져오는 요청 함수
 * @param {object} data - 요청 데이터 객체
 * @param {string} data.column - 'all' 또는 컬럼 이름
 * @param {string} data.preprocess - 전처리 단계 유형
 * @param {number} data.preprocessIndex - 전처리 단계 인덱스
 * @param {function} callback - 성공 시 실행할 콜백 함수
 */
function getPreprocessFilteredVisualData(data, callback) {
    $.ajax({
        type: 'POST',
        url: '/dt/model/load/preprocess/filtered/visual',
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8;",
        dataType: "json",
        success: function (result) {
            if (result.result_code === 200) {
                try {
                    callback(result); // 콜백 함수 실행
                } catch (e) {
                    console.error("Callback function error:", e);
                    alert("콜백 함수 실행 중 오류가 발생했습니다.");
                }
            } else {
                let errorMessage = '에러가 발생하였습니다. 관리자에게 문의해주세요.';
                if (result && result.message) {
                    errorMessage = result.message; // 서버에서 전달된 오류 메시지 사용
                }
                alert(errorMessage);
            }
        },
        error: function (xhr, status, error) {
            console.error('AJAX error:', status, error);
            alert('네트워크 오류가 발생했습니다. 관리자에게 문의해주세요.');
        }
    });
}

/**
 * 2025-03-27
 * */
function initializeDataVisualChart(index, container) {
    console.log('initializeDataVisualChart');
    let dataVisualChart = echarts.init(container);
    let option = dataVisualChartOptions[index];
    try {
        option && dataVisualChart.setOption(option); // 현재 옵션으로 다시 그리기
        dataVisualCharts[index] = dataVisualChart;
    } catch (e) {
        console.error(e);
    }
}

function clearDataVisualChart() {
    dataVisualCharts.forEach(function (dataVisualChart, index) {
        if (dataVisualChart) {
            let container = dataVisualChart.getDom();
            let labels = container.closest('#data-visual-graph-container').querySelectorAll('label');
            labels.forEach(function (label, _index) {
                label.remove();
            });
            dataVisualChart.dispose();
            container.remove();
        }
    });
    dataVisualCharts = [];
    dataVisualChartOptions = [];
}

function resizeDataVisualChart() {
    dataVisualCharts.forEach(function (dataVisualChart, index) {
        let container = dataVisualChart.getDom();
        const width = container.offsetWidth; // 요소의 현재 너비
        const newHeight = (width * 9) / 16; // 16:9 비율 계산
        container.style.height = newHeight + 'px'; // 계산된 높이 적용
        dataVisualChart.resize(); // Update the chart with the new dimensions
    });
}
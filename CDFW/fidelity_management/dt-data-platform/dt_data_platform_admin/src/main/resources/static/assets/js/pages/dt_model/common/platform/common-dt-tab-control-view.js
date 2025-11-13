'use strict'

$(document).ready(function () {
    $(document).on('click', '#tab_info', function () {
        //탭
        $('#tab_getdata').attr('class', 'nav-link');
        $('#tab_info').attr('class', 'nav-link active');
        $('#tab_column_info').attr('class', 'nav-link');
        $('#tab_preproc').attr('class', 'nav-link');
        $('#tab_getalgo').attr('class', 'nav-link');
        $('#tab_savemodel').attr('class', 'nav-link');
        $('#tab_history').attr('class', 'nav-link');

        //본문
        $('#tab_getdata_range').hide();
        $('#tab_info_range').show();
        $('#tab_column_info_range').hide();
        $('#tab_preproc_range').hide();
        $('#tab_getalgo_range').hide();
        $('#tab_savemodel_range').hide();
        $('#tab_preview_range').hide();
        $('#tab_history_range').hide();

        //버튼
        $('#next_button_info_range').hide();
        $('#next_button_column_info_range').hide();
        $('#next_button_valiate_range').hide();

        let preProcData = JSON.parse($('#preprocProPerty').val());

        let base_file_nm = preProcData.preproc_property_info[0].base_file_nm;
        viewPreprocFile($('#formType').val(), base_file_nm, $('#lastFilePath').val(), 'csvUpRange', 'fileViewDataTableRange', null);
        disabledResultTypeCase();
    });

    $(document).on('click', '#tab_column_info', function () {
        //정보입력탭 안보이게
        //데이터현황 보이게 안보이게
        $('#tab_getdata_range').hide();
        $('#tab_info_range').hide();
        $('#tab_column_info_range').show();
        $('#tab_preproc_range').hide();
        $('#tab_getalgo_range').hide();
        $('#tab_savemodel_range').hide();
        $('#tab_preview_range').hide();
        $('#tab_history_range').hide();

        $('#tab_getdata').attr('class', 'nav-link');
        $('#tab_info').attr('class', 'nav-link');
        $('#tab_column_info').attr('class', 'nav-link active');
        $('#tab_preproc').attr('class', 'nav-link');
        $('#tab_getalgo').attr('class', 'nav-link');
        $('#tab_savemodel').attr('class', 'nav-link');
        $('#tab_history').attr('class', 'nav-link');

        disabledResultTypeCase();

        let preProcData = JSON.parse($('#preprocProPerty').val());
        $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));

        let index_trgt_col = preProcData.preproc_property_info[0].index_trgt_col;
        let base_file_path = $('#lastFilePath').val();
        let base_file_nm = preProcData.preproc_property_info[0].base_file_nm_set_range_row;

        //실제 작업할 필터 건 파일을 만듬
        let form_type = $('#formType').val();
        getTargetDataSetInfo(base_file_path, base_file_nm, index_trgt_col, form_type, null, function (data) {
            console.log('getTargetDataSetInfo', JSON.parse(data));
            let preProcDatatableColumnInfo = document.querySelector('#preProcDatatableColumnInfo');
            let preProcDatatableColumnInfoCheckboxes = preProcDatatableColumnInfo.querySelectorAll('tbody tr input[type="checkbox"]');
            let allChecked = true;
            preProcDatatableColumnInfoCheckboxes.forEach(function (checkbox) {
                if (preProcData.preproc_property_info[0].preproc_trgt_col.includes(checkbox.value)) {
                    checkbox.checked = true;
                }
                if (!checkbox.checked) {
                    allChecked = false;
                }
            });
            let chkAllCol = preProcDatatableColumnInfo.querySelector('#chkAllCol');
            if (chkAllCol) {
                chkAllCol.checked = allChecked;
            }
        });
    });

    $(document).on('click', '#tab_preproc', function () {
        //탭
        $('#tab_getdata').attr('class', 'nav-link');
        $('#tab_info').attr('class', 'nav-link');
        $('#tab_column_info').attr('class', 'nav-link');
        $('#tab_preproc').attr('class', 'nav-link active');
        $('#tab_getalgo').attr('class', 'nav-link');
        $('#tab_savemodel').attr('class', 'nav-link');
        $('#tab_history').attr('class', 'nav-link');

        //본문
        $('#tab_getdata_range').hide();
        $('#tab_info_range').hide();
        $('#tab_column_info_range').hide();
        $('#tab_preproc_range').show();
        $('#tab_getalgo_range').hide();
        $('#tab_savemodel_range').hide();
        $('#tab_preview_range').hide();
        $('#tab_history_range').hide();
        $("#tab_validate1").trigger("click");
        makePropertyListHtml();
        disabledResultTypeCase();
    });

    $(document).on('click', '#tab_getalgo', function () {
        $('#tab_getdata').attr('class', 'nav-link');
        $('#tab_info').attr('class', 'nav-link');
        $('#tab_column_info').attr('class', 'nav-link');
        $('#tab_preproc').attr('class', 'nav-link');
        $('#tab_getalgo').attr('class', 'nav-link active');
        $('#tab_savemodel').attr('class', 'nav-link');
        $('#tab_history').attr('class', 'nav-link');

        //본문
        $('#tab_getdata_range').hide();
        $('#tab_info_range').hide();
        $('#tab_column_info_range').hide();
        $('#tab_preproc_range').hide();
        $('#tab_getalgo_range').show();
        $('#tab_savemodel_range').hide();
        $('#tab_preview_range').hide();
        $('#tab_history_range').hide();
        makeAlgorithm($('#modelSeq').val(), function () {
            disabledResultTypeCase();
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
            showProgressBar({element: null, process_id: 'correlation-3'});
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
                        console.log('result.correlation_data',result.correlation_data);
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
                    closeProgressBar({element: null, process_id: 'correlation-3'});
                }
            });
        }
    });

    $(document).on('click', '#tab_savemodel', function () {
        var model_status = $('#model_status').val();
        if (model_status === 'DOING') {
            alert('모델 생성 중입니다.');
            return false;
        }

        if (model_status === 'FAIL') {
            alert('모델 생성에 실패 하였습니다.');
            let errorFrame = document.querySelector('#error_frame');
            if (errorFrame) {
                let err_type = errorFrame.querySelector('#err_type');
                let errCd = errorFrame.querySelector('#errCd');
                let errNm = errorFrame.querySelector('#errNm');
                let errLct = errorFrame.querySelector('#errLct');
                let errCn = errorFrame.querySelector('#errCn');
                let errRegDt = errorFrame.querySelector('#errRegDt');

                let errorModal = document.querySelector('#errorModal');
                let errTpElement = errorModal.querySelector('#errTp');
                let errCdElement = errorModal.querySelector('#errCd');
                let errNmElement = errorModal.querySelector('#errNm');
                let errLctElement = errorModal.querySelector('#errLct');
                let errCnElement = errorModal.querySelector('#errCn');
                let errRegDtElement = errorModal.querySelector('#errRegDt');

                errTpElement.innerHTML = `${err_type.dataset.value}`;
                errCdElement.innerHTML = `${errCd.dataset.value}`;
                errNmElement.innerHTML = `${errNm.dataset.value}`;
                errLctElement.innerHTML = `${errLct.dataset.value}`;
                errCnElement.innerHTML = `${errCn.dataset.value}`;
                errRegDtElement.innerHTML = `${errRegDt.dataset.value}`;

                if (!errorModal.classList.contains('is-open')) {
                    errorModal.classList.add('is-open');
                }
            }
            return false;
        }

        $('#tab_getdata').attr('class', 'nav-link');
        $('#tab_info').attr('class', 'nav-link');
        $('#tab_column_info').attr('class', 'nav-link');
        $('#tab_preproc').attr('class', 'nav-link');
        $('#tab_getalgo').attr('class', 'nav-link');
        $('#tab_savemodel').attr('class', 'nav-link active');
        $('#tab_history').attr('class', 'nav-link');

        //본문
        $('#tab_getdata_range').hide();
        $('#tab_info_range').hide();
        $('#tab_column_info_range').hide();
        $('#tab_preproc_range').hide();
        $('#tab_getalgo_range').hide();
        $('#tab_savemodel_range').show();
        $('#tab_preview_range').hide();
        $('#tab_history_range').hide();

        if (model_status === 'DONE') {
            if ($("#predictionFileListCount").val() > 0) {
                var params = {"modelSeq": $("#modelSeq").val()}
                var loss = getLoss(params);
                var fid = getFID(params);

                var data_params = {"modelSeq": $("#modelSeq").val(), "count": 100}
                var testData = getTestData(data_params);

                var chart_type = 'line';
                var isTool;

                let selectEpoch = document.querySelector('#select_epoch');
                if (selectEpoch) {
                    observeDataValueChange(selectEpoch, function (targetElement, newValue) {
                        console.log('observeDataValueChange Callback', targetElement, newValue);
                        $('#real_img').attr('src', newValue);
                        $('#fake_img').attr('src', newValue.replace('real', 'fake'));
                    });
                }

                let selectData = document.querySelector('#select_data');
                if (selectData) {
                    observeDataValueChange(selectData, function (targetElement, newValue) {
                        console.log('observeDataValueChange Callback', targetElement, newValue);
                        data_params = {"modelSeq": $('#modelSeq').val(), "count": newValue}
                        let testData = getTestData(data_params);
                        let chart_type = 'line';

                        viewTypeDefault(chart_type, testData, 2, true, false, isTool = true);
                        getDataView(testData["data_test"], testData["data_test_header"], "data_test");
                        getDataView(testData["data_pred"], testData["data_pred_header"], "data_pred");
                    });
                }

                viewTypeDefault(chart_type, testData, 2, true, false, isTool = true);
                viewTypeDefault(chart_type, loss, 0, false, false);
                viewTypeDefault(chart_type, fid, 1, false, false);

                getDataView(testData["data_test"], testData["data_test_header"], "data_test");
                getDataView(testData["data_pred"], testData["data_pred_header"], "data_pred");
            }
            /**
             * XAI Image Equals Logic
             * BASE WATERFALL
             * */
            let xai_base = document.querySelector('img.xai_waterfall, img.xai_bar');
            let xai_plot = document.querySelector('img.xai_plot');
            console.log('xai_base', xai_base, 'xai_plot', xai_plot);
            // XAI Waterfall 이미지가 로드되면 크기 조정을 수행
            setTimeout(function () {
                if (xai_base && xai_plot) {
                    // Waterfall 이미지의 너비와 높이를 가져옴
                    let width = xai_base.clientWidth;
                    let height = xai_base.clientHeight;

                    console.log('loaded width, height', width, height);

                    // Plot 이미지 크기를 Waterfall 이미지 크기와 동일하게 조정
                    xai_plot.style.width = `${width}px`;
                    xai_plot.style.height = `${height}px`;
                }
            }, 500);

            /**
             * XAI Data Chart Logic
             * */
            getXAI({modelSeq: $("#modelSeq").val()}, function (data) {
                console.log('data', data);
                if (data && data.xai_data !== null) {
                    try {
                        let xai_data = JSON.parse(data.xai_data.shap);
                        console.log('xai_data', xai_data);
                        let shap_value = xai_data.shap_values;
                        let x_shap = xai_data.X_shap;
                        console.log('shap_value', shap_value, 'x_shap', x_shap);
                        let meta_user_item = data.meta_user_item;
                        let userPprcsFullStngValue = JSON.parse(meta_user_item.userPprcsFullStngValue);
                        let model_property = userPprcsFullStngValue.preproc_property_info[0].model_property[0];
                        let dependent = model_property.dependent;
                        let independent = model_property.independent;
                        let window_size = parseInt(model_property.hyperparam.window_size);
                        let batch_size = parseInt(model_property.hyperparam.batch_size);
                        console.log('dependent', dependent, 'independent', independent, 'window_size', window_size, 'batch_size', batch_size);
                    } catch (e) {
                        console.warn(e);
                    }
                }
            });
        }
        $(window).trigger('resize');
    });

    $(document).on('click', '#tab_validate1', function () {
        $('#property_option').empty();
        $('#property_option_reset').show();

        $('#preprocTableRangeView').empty();
        let preprocCurrent = $('#preprocCurrent').val('validate');
        $('#tab_preproc_bottom_range').show();

        $('#tab_validate1').attr('class', 'nav-link active');
        $('#tab_outlier1').attr('class', 'nav-link');
        $('#tab_missing1').attr('class', 'nav-link');
        $('#tab_interval1').attr('class', 'nav-link');
        $('#tab_unit1').attr('class', 'nav-link');
        $('#btn-preproc-part').show();
        $('#tab_preproc_bottom_range').show();
        $('#inc_tab_validate').show();
        $('#tab_getdata_range').hide();
        $('#tab_info_range').hide();
        $('#tab_column_info_range').hide();
        $('#tab_preview_range').hide();
        $('#tab_preproc_range').show();
        $('#tab_history_range').hide();
        //여기 클릭 트리거 발동 해야됨
        makePropertyListHtml();
        preprocessAutomaticOptionView(document.querySelector('#property_range .validate-section'), 1);
    });

    $(document).on('click', '#tab_outlier1', function () {
        $('#property_option').empty();
        $('#property_option_reset').show();
        $('#preprocTableRangeView').empty();
        var preprocCurrent = $('#preprocCurrent').val('outlier');

        $('#tab_preproc_bottom_range').show();

        $('#tab_validate1').attr('class', 'nav-link');
        $('#tab_outlier1').attr('class', 'nav-link active');
        $('#tab_missing1').attr('class', 'nav-link');
        $('#tab_interval1').attr('class', 'nav-link');
        $('#tab_unit1').attr('class', 'nav-link');
        makePropertyListHtml();
        preprocessAutomaticOptionView(document.querySelector('#property_range .outlier-section'), 1);
    });

    $(document).on('click', '#tab_missing1', function () {
        $('#property_option').empty();
        $('#property_option_reset').show();
        $('#preprocTableRangeView').empty();
        var preprocCurrent = $('#preprocCurrent').val('interpolate');

        $('#tab_preproc_bottom_range').show();

        $('#tab_validate1').attr('class', 'nav-link');
        $('#tab_outlier1').attr('class', 'nav-link');
        $('#tab_missing1').attr('class', 'nav-link active');
        $('#tab_interval1').attr('class', 'nav-link');
        $('#tab_unit1').attr('class', 'nav-link');
        makePropertyListHtml();
        preprocessAutomaticOptionView(document.querySelector('#property_range .interpolate-section'), 1);
    });

    $(document).on('click', '#tab_interval1', function () {
        $('#property_option').empty();
        $('#property_option_reset').show();
        $('#preprocTableRangeView').empty();
        var preprocCurrent = $('#preprocCurrent').val('resample');

        $('#tab_preproc_bottom_range').show();

        $('#tab_validate1').attr('class', 'nav-link');
        $('#tab_outlier1').attr('class', 'nav-link');
        $('#tab_missing1').attr('class', 'nav-link');
        $('#tab_interval1').attr('class', 'nav-link active');
        $('#tab_unit1').attr('class', 'nav-link');
        makePropertyListHtml();
        preprocessAutomaticOptionView(document.querySelector('#property_range .resample-section'), 1);
    });

    $(document).on('click', '#tab_unit1', function () {
        $('#property_option').empty();
        $('#property_option_reset').show();
        $('#preprocTableRangeView').empty();
        var preprocCurrent = $('#preprocCurrent').val('unit');

        $('#tab_preproc_bottom_range').show();

        $('#tab_validate1').attr('class', 'nav-link');
        $('#tab_outlier1').attr('class', 'nav-link');
        $('#tab_missing1').attr('class', 'nav-link');
        $('#tab_interval1').attr('class', 'nav-link');
        $('#tab_unit1').attr('class', 'nav-link active');
        makePropertyListHtml();
        preprocessAutomaticOptionView(document.querySelector('#property_range .unit-section'), 1);
    });

    function preprocessAutomaticOptionView(container, order) {
        console.log('preprocessAutomaticOptionView', container, order);
        if (container) {
            let options = container.querySelectorAll('a[data-set-order]');
            let firstOption = true;
            options.forEach(function (option) {
                console.log('option', option);
                if (option.dataset.setOrder === order || option.dataset.setOrder === (order + '')) {
                    $(option).trigger('click');
                    firstOption = false;
                }
            });
            if (firstOption) {
                options.forEach(function (option, index) {
                    console.log('option', option, 'index', index);
                    if (index === 0) {
                        $(option).trigger('click');
                    }
                });
            }
        } else {
            console.warn(`preprocessAutoViewOption 함수의 container 변수가 존재하지 않습니다.`);
        }

        let form_type = $('#formType').val();
        if (form_type !== 'I') {
            let preprocDataVisualRangeView = document.querySelector('#preprocDataVisualRangeView');
            preprocDataVisualRangeView.style.display = 'none';
        }
    }

    $(document).on('click', '#tab_history', function () {
        $('#tab_getdata').attr('class', 'nav-link');
        $('#tab_info').attr('class', 'nav-link');
        $('#tab_column_info').attr('class', 'nav-link');
        $('#tab_preproc').attr('class', 'nav-link');
        $('#tab_getalgo').attr('class', 'nav-link');
        $('#tab_savemodel').attr('class', 'nav-link');
        $('#tab_history').attr('class', 'nav-link active');

        //본문
        $('#tab_getdata_range').hide();
        $('#tab_info_range').hide();
        $('#tab_column_info_range').hide();
        $('#tab_preproc_range').hide();
        $('#tab_getalgo_range').hide();
        $('#tab_savemodel_range').hide();
        $('#tab_preview_range').hide();
        $('#tab_history_range').show();

        disabledResultTypeCase();

        //이력 차트 업데이트 (Tab구조 영역 안잡히는 문제 해결)
        refreshHistoryChart();
    });

    /**
     * 2024-07-17
     * @description 상세페이지 로드시 tab_getdata_range가 보여지는 현상 제거
     * @author kimwoosik
     * @overview 상세페이지와 등록 페이지 둘다 사용된다.
     * */
    if ($('#formType').val() === 'U') {
        document.querySelector('#tab_info').click();
    }
});

function makeInfoHtmlJsonProperty(container, set_order) {
    console.log('makeInfoHtmlJsonProperty', container, set_order);
    let preprocCurrent = $('#preprocCurrent').val();
    let propertyContainer = document.createElement('div');

    let classes = ['col-12', 'pt-3'];
    classes.forEach(function (_class) {
        propertyContainer.classList.add(_class);
    });

    let optionResetWrapper = document.createElement('div');
    classes = ['row'];
    classes.forEach(function (_class) {
        optionResetWrapper.classList.add(_class);
    });

    let optionResetContainer = document.createElement('div');
    classes = ['col-12'];
    classes.forEach(function (_class) {
        optionResetContainer.classList.add(_class);
    });
    optionResetContainer.id = 'property_option_reset';
    optionResetContainer.style.display = 'none';

    let infoMessage = document.createElement('span');
    infoMessage.style.display = 'inline-block';
    infoMessage.style.width = '100%';
    infoMessage.style.fontSize = '13px';
    infoMessage.innerHTML = `우측의 설정 목록에서 옵션을 선택하세요.`;
    optionResetContainer.appendChild(infoMessage);

    optionResetWrapper.appendChild(optionResetContainer);
    propertyContainer.appendChild(optionResetWrapper);

    let optionWrapper = document.createElement('div');
    classes = ['row'];
    classes.forEach(function (_class) {
        optionWrapper.classList.add(_class);
    });
    let optionContainer = document.createElement('div');
    classes = ['col-12'];
    classes.forEach(function (_class) {
        optionContainer.classList.add(_class);
    });
    optionContainer.id = 'property_option';
    optionContainer.appendChild(makePropertyView(preprocCurrent, set_order));
    optionWrapper.appendChild(optionContainer);
    propertyContainer.appendChild(optionWrapper);
    container.appendChild(propertyContainer);
}

function makePropertyView(preprocCurrent, set_order) {
    console.log('makePropertyView', preprocCurrent, set_order);
    let jsonData = JSON.parse($('#preprocProPerty').val());
    let preprocProperty = jsonData.preproc_property_info[0].preproc_property;
    let sectionWrapper = document.createElement('div');

    preprocProperty.forEach(function (property) {
        let preprocOrder = property.preproc_order;
        let preprocSet = property.preproc_set;
        if (preprocSet.length > 0) {
            preprocSet.forEach(function (set) {
                console.log('preprocCurrent', preprocCurrent, 'preprocOrder', preprocOrder, 'set.set_order', set.set_order, 'set_order', set_order);
                if (preprocCurrent === 'validate' && preprocOrder === 1 && set.set_order === set_order) {
                    ['validate-section'].forEach(function (className) {
                        sectionWrapper.classList.add(className);
                    });
                    sectionWrapper.innerHTML = `<a style="font-size: 13px;" data-trgt_col="${set.trgt_col}" data-vrfc_tp="${set.vrfc_tp}" data-vrfc_sub_tp="${set.vrfc_sub_tp}" href="#none" data-set-order="${set.set_order}" data-preproc-order="${preprocOrder}" data-trgt-file-nm="${set.trgt_file_nm}">
                                                        검증 컬럼 : ${set.trgt_col} |
                                                        검증 타입 : ${set.vrfc_tp_nm} |
                                                        검증 형태 : ${set.vrfc_sub_tp_nm} |
                                                        지정 형태 : ${set.vrfc_clear_tp_nm}
                                                    </a>`;
                    return sectionWrapper;
                }
                if (preprocCurrent === 'outlier' && preprocOrder === 2 && set.set_order === set_order) {
                    ['outlier-section'].forEach(function (className) {
                        sectionWrapper.classList.add(className);
                    });
                    sectionWrapper.innerHTML = `<a style="font-size: 13px;" href="#none" data-trgt_col="${set.trgt_col}" data-outlier_tp="${set.outlier_tp}" data-set-order="${set.set_order}" data-preproc-order="${preprocOrder}" data-trgt-file-nm="${set.trgt_file_nm}">
                                                        검증 유형 : ${set.outlier_tp} | 선택 컬럼 : ${set.trgt_col} | ${set.outlier_tp === 'standard' ? `샘플링 길이(FQ) : ${set.freq} | 정규분포 경계(PV) : ${set.p_value}` : set.outlier_tp === 'kmean' ? `샘플링 길이(FQ) : ${set.freq} | 클러스터 수(CC) : ${set.n_clusters} | 클러스터의 제한되는 데이터 개수(N_COUNT) : ${set.n_count}` : set.outlier_tp === 'dbscan' ? `샘플링 길이(FQ) : ${set.freq} | 반지름(EPS) : ${set.eps} | 최소 샘플(MS) : ${set.min_samples}` : `window_size : ${set.window_size} | threshold : ${set.threshold}`}
                                                    </a>`;
                    return sectionWrapper;
                }
                if (preprocCurrent === 'interpolate' && preprocOrder === 3 && set.set_order === set_order) {
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
                            sectionWrapper.innerHTML = `<a style="font-size: 13px;" href="#none" data-interpl_tp="${set.interpl_tp}" data-set-order="${set.set_order}" data-preproc-order="${preprocOrder}" data-trgt-file-nm="${set.trgt_file_nm}">
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
                            sectionWrapper.innerHTML = `<a style="font-size: 13px;" href="#none" data-interpl_tp="${set.interpl_tp}" data-output="${set.interpl_outputs.map(item => item)}" data-features="${set.interpl_labels.map(item => item).join(', ')}" data-set-order="${set.set_order}" data-preproc-order="${preprocOrder}" data-trgt-file-nm="${set.trgt_file_nm}">
                                                            보간 옵션 : ${set.interpl_tp.toUpperCase()} | 보간 대상 항목 : ${set.interpl_outputs[0]} | 보간 입력 항목 : ${labelStr}
                                                        </a>`;
                            break;
                        }
                        case 'brits': {
                            sectionWrapper.innerHTML = `<a style="font-size: 13px;" href="#none" data-interpl_tp="${set.interpl_tp}" data-output="${set.interpl_outputs.map(item => item)}" data-set-order="${set.set_order}" data-preproc-order="${preprocOrder}" data-trgt-file-nm="${set.trgt_file_nm}">
                                                            보간 옵션 : ${set.interpl_tp.toUpperCase()} | 보간 대상 항목 : ${set.interpl_outputs[0]}
                                                        </a>`;
                            break;
                        }
                        case 'naomi': {
                            sectionWrapper.innerHTML = `<a style="font-size: 13px;" href="#none" data-interpl_tp="${set.interpl_tp}" data-output="${set.interpl_outputs.map(item => item)}" data-set-order="${set.set_order}" data-preproc-order="${preprocOrder}" data-trgt-file-nm="${set.trgt_file_nm}">
                                                            보간 옵션 : ${set.interpl_tp.toUpperCase()} | 보간 대상 항목 : ${set.interpl_outputs[0]}
                                                        </a>`;
                            break;
                        }
                        default: {
                            sectionWrapper.innerHTML = `<a style="font-size: 13px;" href="#none" data-interpl_tp="${set.interpl_tp}" data-set-order="${set.set_order}" data-preproc-order="${preprocOrder}" data-trgt-file-nm="${set.trgt_file_nm}">
                                                            보간 옵션 : ${set.interpl_tp.toUpperCase()}
                                                        </a>`
                        }
                    }
                    return sectionWrapper;
                }
                if (preprocCurrent === 'resample' && preprocOrder === 4 && set.set_order === set_order) {
                    ['resample-section'].forEach(function (className) {
                        sectionWrapper.classList.add(className);
                    });
                    sectionWrapper.innerHTML = `<a style="font-size: 13px;" href="#none" data-set-order="${set.set_order}" data-preproc-order="${preprocOrder}" data-trgt-file-nm="${set.trgt_file_nm}">
                                                            간격 유형 : ${set.resmpl_tp_nm} | 간격 수치 : ${set.resmpl_intvl_value}
                                                        </a>`;
                    return sectionWrapper;
                }
                if (preprocCurrent === 'unit' && preprocOrder === 5 && set.set_order === set_order) {
                    ['unit-section'].forEach(function (className) {
                        sectionWrapper.classList.add(className);
                    });
                    sectionWrapper.innerHTML = `<a style="font-size: 13px;" href="#none" data-set-order="${set.set_order}" data-preproc-order="${preprocOrder}" data-trgt-file-nm="${set.trgt_file_nm}">
                                                            ${set.trgt_col} | ${set.unit_tp_nm} | ${set.unit_cd_1_nm} -> ${set.unit_cd_2_nm}
                                                        </a>`;
                    return sectionWrapper;
                }
            });
        }
    });
    return sectionWrapper;
}
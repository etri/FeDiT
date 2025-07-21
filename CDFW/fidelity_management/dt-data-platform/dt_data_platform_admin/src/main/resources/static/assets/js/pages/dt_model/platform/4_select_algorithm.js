document.addEventListener("DOMContentLoaded", () => {
    let selectAlgorithm = document.querySelector('#select_algorithm');
    if (selectAlgorithm) {
        observeDataValueChange(selectAlgorithm, function (targetElement, newValue) {
            console.log('observeDataValueChange Callback', targetElement, newValue);
            if (!newValue || newValue === '선택 없음' || newValue === '0' || newValue === '') {
                return;
            }
            let dropdownBox = targetElement.closest('.dropdown-box');
            let selectedInput = dropdownBox.querySelector(`ul.option-list li input[value="${newValue}"]`);
            let selectedLabel = dropdownBox.querySelector(`ul.option-list li label[for="${selectedInput.id}"]`);
            let model_algrm_seq = selectedInput.value;
            let model_seq = $('#modelSeq').val();
            let select_index_col = selectedLabel.textContent;
            let algorithm_img = '/assets/images/algorithm/' + select_index_col + '.png';
            let algorithmImageBox = document.querySelector('#algorithm_img_box');
            if (algorithmImageBox) {
                algorithmImageBox.style.backgroundImage = `url("${algorithm_img}")`;
            }
            makeAlgorithmMetaItemList(model_algrm_seq, model_seq);
        });
    }

    /**
     * 2025-03-20, 상관관계 분석 로직 추가
     * 상관관계 드랍다운 리스트 이벤트 추가
     * */
    let correlationRange = document.querySelector('[data-id="correlation_range"]');
    let correlationOption = correlationRange.querySelector('.filter-layer .option-list');
    let correlationOptionListInputs = correlationOption.querySelectorAll('li input[type="radio"]');
    correlationOptionListInputs.forEach(function (input) {
        input.addEventListener('change', function (event) {
            const preProcData = JSON.parse($('#preprocProPerty').val());

            let data = {}
            data.type = this.dataset.type;
            if (this.dataset.method) {
                data.method = this.dataset.method;
            }
            if (this.dataset.maxlag) {
                data.maxlag = this.dataset.maxlag;
            }

            data.model_seq = $("#modelSeq").val();
            data.file_name = preProcData.preproc_property_info[0].last_step_preproc_file_nm;
            data.index_trgt_col = preProcData.preproc_property_info[0].index_trgt_col
            data.checkHeader = preProcData.preproc_property_info[0].preproc_trgt_col.slice();
            showProgressBar({element: null, process_id: 'correlation-1'});
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
                    closeProgressBar({element: null, process_id: 'correlation-1'});
                }
            });
        });
    });

    $(document).on('change', '.custom-range-obj', function (event) {
        let _this = this;
        let parent = _this.parentElement;
        let rangeElement = parent.querySelector('.custom-number-range');
        rangeElement.value = this.value;
    });

    $(document).on('click', '.make-model', function () {
        let menuCd = $('#menuCd').val();

        let select_algorithm = document.querySelector('#select_algorithm');
        let dropdownBox = select_algorithm.closest('.dropdown-box');
        let selectedInput = dropdownBox.querySelector(`ul.option-list li input:checked`);
        let selectedLabel = dropdownBox.querySelector(`ul.option-list li label[for="${selectedInput.id}"]`);

        let algorithm = selectedLabel.textContent;
        let algorithm_seq = selectedInput.value;

        if (algorithm === '0' || algorithm === 0) {
            alert('알고리즘을 선택하세요.');
            return false;
        }

        let algorithmMetaItemList = JSON.parse($('#algorithm_meta_set').val());
        let model_seq = $('#modelSeq').val();

        let valid_arr = [];
        for (let i = 0; i < algorithmMetaItemList.length; i++) {
            let inputValue = $('#' + algorithmMetaItemList[i].model_params_item).val();
            if (inputValue.length === 0) {
                valid_arr.push(algorithmMetaItemList[i].model_params_item);
            }

            algorithmMetaItemList[i].model_params_item_value = inputValue;

            if (model_seq > 0) {
                algorithmMetaItemList[i].model_seq = model_seq;
            }
        }

        let preProcData = JSON.parse($('#preprocProPerty').val());
        let file_name = preProcData.preproc_property_info[0].last_step_preproc_file_nm;
        let file_path = $('#lastFilePath').val();

        let output_col = $('input[name="outputCol"]:checked').map(function () {
            return this.value;
        }).get();
        let feature_col = $('input[name="featureCol"]:checked').map(function () {
            return this.value;
        }).get();

        if (output_col.length === 0) {
            alert('종속변수를 선택하세요');
            return false;
        }

        /**
         * 1208231533687629
         * [기능] 모델 설정
         * [메뉴] Data Twin Model
         * [동작] C, U
         * [작업내용]
         * 모델 설정의 종속변수와 독립 변수를 같이 선택해도 등록이 되도록 합니다.
         * */
        let duplicates = output_col.filter(function (value) {
            return feature_col.indexOf(value) !== -1;
        });
        switch (parseInt(algorithm_seq)) {
            //LSTM, GRU, ETC...
            case 1:
            case 2:
            default:
                //중복 선택 가능
                break;
            //Deep AR, NBeats
            case 3:
            case 4:
            case 5: /*case 5: SEG_RNN 전용추가*/
                //중복 선택 불가능
                //console.log(duplicates.length)
                if (duplicates.length > 0) {
                    alert('종속변수와 독립변수는 중복으로 선택 할 수 없습니다.');
                    return false;
                }
                break;
        }

        let alert_string = '';
        if (valid_arr.length > 0) {
            for (let va = 0; va < valid_arr.length; va++) {
                if (va === 0) {
                    alert_string += valid_arr[va];
                } else {
                    alert_string += ', ' + valid_arr[va];
                }
            }
            alert(alert_string + ' 필수 입력입니다.');
            return false;
        }

        let optimizer_number_chk = $('.optimizer-number-chk').val();

        if (typeof optimizer_number_chk != 'undefined') {
            if (isNaN(optimizer_number_chk) || optimizer_number_chk <= 0 || optimizer_number_chk >= 1) {
                alert("optimizerLr은 0보다 크고 1보다 작은 값만 가능합니다.");
                return false;
            }
        }

        //console.log(jsonTemplateArrayNumbering());
        preProcData = JSON.parse($('#preprocProPerty').val());
        let modelTemplate = modelAlgorithmTemplate();
        modelTemplate.dependent = output_col;
        modelTemplate.independent = feature_col;
        modelTemplate.algorithm = algorithm;
        modelTemplate.algorithm_seq = algorithm_seq;
        modelTemplate.hyperparam.window_size = $('#windowSize').val();
        modelTemplate.hyperparam.batch_size = $('#batchSize').val();
        modelTemplate.hyperparam.epochs = $('#epochs').val();
        modelTemplate.hyperparam.loss = $('#loss option:selected').val();
        modelTemplate.hyperparam.loss_nm = $('#loss option:selected').text();
        modelTemplate.hyperparam.meterics = $('#meterics option:selected').val();
        modelTemplate.hyperparam.meterics_nm = $('#meterics option:selected').text();
        modelTemplate.hyperparam.optimizer = $('#optimizer option:selected').val();
        modelTemplate.hyperparam.optimizer_nm = $('#optimizer option:selected').text();
        modelTemplate.hyperparam.optimizer_lr = $('#optimizerLr').val();
        modelTemplate.hyperparam.test_size = $('#testSize').val();
        modelTemplate.hyperparam.data_size = $('#dataSize').val();

        /**
         * SEG RNN 추가
         * */
        let num_segments = document.querySelector('#num_segments');
        if (num_segments) {
            modelTemplate.hyperparam.num_segments = num_segments.value;
        }

        let segment_len = document.querySelector('#segment_len');
        if (segment_len) {
            modelTemplate.hyperparam.segment_len = segment_len.value;
        }

        preProcData.preproc_property_info[0].model_create = "Y";
        preProcData.preproc_property_info[0].model_property[0] = modelTemplate;

        $('#preprocProPerty').val(JSON.stringify(preProcData));
        $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));
        let full_text = $('#preprocProPerty').val();
        let confirm_comment = '등록 이후 수정시 재학습할 동안 모델을 사용하실 수 없습니다.\n등록 하시겠습니까?';
        if (feature_col.length === 0) {
            feature_col = null;
        }
        let con = confirm(confirm_comment);
        if (con === true) {
            let data = {
                model_seq: model_seq,
                algorithm: algorithm,
                algorithm_seq: algorithm_seq,
                algorithm_meta_item_list: algorithmMetaItemList,
                file_path: file_path,
                file_name: file_name,
                output_col: output_col,
                feature_col: feature_col,
                full_text: full_text
            }
            showProgressBar({element: null, process_id: 'process-47'});
            $.ajax({
                type: "POST",
                url: '/dt/model/make/model_set',
                data: JSON.stringify(data),
                contentType: "application/json; charset=utf-8;",
                dataType: "json",
                success: function (result) {
                    if (result.result_code === 200) {
                        closeProgressBar({element: null, process_id: 'process-47'});
                        window.location.href = contextPath + "/dt/model/model/list?menuCd=" + menuCd;
                    } else {
                        closeProgressBar({element: null, process_id: 'process-47'});
                        alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                    }
                },
                error: function (xhr, status, error) {
                    console.error('error : ', error);
                    closeProgressBar({element: null, process_id: 'process-47'});
                    alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                }
            });
        } else {
            return false;
        }
    });

    /**
     * 2024-10-15
     * Data Twin Model 수정 기능
     * 1208515341596874
     * */
    $(document).on('click', '.remake-model', function () {
        let menuCd = $('#menuCd').val();

        let select_algorithm = document.querySelector('#select_algorithm');
        let dropdownBox = select_algorithm.closest('.dropdown-box');
        let selectedInput = dropdownBox.querySelector(`ul.option-list li input:checked`);
        let selectedLabel = dropdownBox.querySelector(`ul.option-list li label[for="${selectedInput.id}"]`);

        let algorithm = selectedLabel.textContent;
        let algorithm_seq = selectedInput.value;

        if (algorithm === '0' || algorithm === 0) {
            alert('알고리즘을 선택하세요.');
            return false;
        }

        let algorithmMetaItemList = JSON.parse($('#algorithm_meta_set').val());
        let model_seq = $('#modelSeq').val();

        let valid_arr = [];
        for (let i = 0; i < algorithmMetaItemList.length; i++) {
            let inputValue = $('#' + algorithmMetaItemList[i].model_params_item).val();
            if (inputValue.length === 0) {
                valid_arr.push(algorithmMetaItemList[i].model_params_item);
            }

            algorithmMetaItemList[i].model_params_item_value = inputValue;

            if (model_seq > 0) {
                algorithmMetaItemList[i].model_seq = model_seq;
            }
        }

        let preProcData = JSON.parse($('#preprocProPerty').val());
        let file_name = preProcData.preproc_property_info[0].last_step_preproc_file_nm;
        let file_path = $('#lastFilePath').val();

        let output_col = $('input[name="outputCol"]:checked').map(function () {
            return this.value;
        }).get();
        let feature_col = $('input[name="featureCol"]:checked').map(function () {
            return this.value;
        }).get();

        if (output_col.length === 0) {
            alert('종속변수를 선택하세요');
            return false;
        }

        /**
         * 1208231533687629
         * [기능] 모델 설정
         * [메뉴] Data Twin Model
         * [동작] C, U
         * [작업내용]
         * 모델 설정의 종속변수와 독립 변수를 같이 선택해도 등록이 되도록 합니다.
         * */
        let duplicates = output_col.filter(function (value) {
            return feature_col.indexOf(value) !== -1;
        });
        switch (parseInt(algorithm_seq)) {
            //LSTM, GRU, ETC...
            case 1:
            case 2:
            default:
                //중복 선택 가능
                break;
            //Deep AR, NBeats
            case 3:
            case 4:
                //중복 선택 불가능
                //console.log(duplicates.length)
                if (duplicates.length > 0) {
                    alert('종속변수와 독립변수는 중복으로 선택 할 수 없습니다.');
                    return false;
                }
                break;
        }

        let alert_string = '';
        if (valid_arr.length > 0) {
            for (let va = 0; va < valid_arr.length; va++) {
                if (va === 0) {
                    alert_string += valid_arr[va];
                } else {
                    alert_string += ', ' + valid_arr[va];
                }
            }
            alert(alert_string + ' 필수 입력입니다.');
            return false;
        }

        let optimizer_number_chk = $('.optimizer-number-chk').val();

        if (typeof optimizer_number_chk != 'undefined') {
            if (isNaN(optimizer_number_chk) || optimizer_number_chk <= 0 || optimizer_number_chk >= 1) {
                alert("optimizerLr은 0보다 크고 1보다 작은 값만 가능합니다.");
                return false;
            }
        }

        preProcData = JSON.parse($('#preprocProPerty').val());
        let modelTemplate = modelAlgorithmTemplate();
        modelTemplate.dependent = output_col;
        modelTemplate.independent = feature_col;
        modelTemplate.algorithm = algorithm;
        modelTemplate.algorithm_seq = algorithm_seq;
        modelTemplate.hyperparam.window_size = $('#windowSize').val();
        modelTemplate.hyperparam.batch_size = $('#batchSize').val();
        modelTemplate.hyperparam.epochs = $('#epochs').val();
        modelTemplate.hyperparam.loss = $('#loss option:selected').val();
        modelTemplate.hyperparam.loss_nm = $('#loss option:selected').text();
        modelTemplate.hyperparam.meterics = $('#meterics option:selected').val();
        modelTemplate.hyperparam.meterics_nm = $('#meterics option:selected').text();
        modelTemplate.hyperparam.optimizer = $('#optimizer option:selected').val();
        modelTemplate.hyperparam.optimizer_nm = $('#optimizer option:selected').text();
        modelTemplate.hyperparam.optimizer_lr = $('#optimizerLr').val();
        modelTemplate.hyperparam.test_size = $('#testSize').val();
        modelTemplate.hyperparam.data_size = $('#dataSize').val();

        /**
         * SEG RNN 추가
         * */
        let num_segments = document.querySelector('#num_segments');
        if (num_segments) {
            modelTemplate.hyperparam.num_segments = num_segments.value;
        }

        let segment_len = document.querySelector('#segment_len');
        if (segment_len) {
            modelTemplate.hyperparam.segment_len = segment_len.value;
        }

        preProcData.preproc_property_info[0].model_create = "Y";
        preProcData.preproc_property_info[0].model_property[0] = modelTemplate;


        $('#preprocProPerty').val(JSON.stringify(preProcData));
        $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));
        let full_text = $('#preprocProPerty').val();

        /**
         * 제약 조건 추가 - 시뮬레이션에서 해당 모델 사용하면 안됩니다.
         * */
        showProgressBar({element: null, process_id: 'process-53'});
        let checkData = {
            model_seq: model_seq
        }
        $.ajax({
            type: "POST",
            url: '/dt/model/check/model_reset',
            data: JSON.stringify(checkData),
            contentType: "application/json; charset=utf-8;",
            dataType: "json",
            success: function (result) {
                if (result.result_code === 200) {
                    closeProgressBar({element: null, process_id: 'process-53'});
                    if (result.status === true) {
                        //모델 리셋이 가능한 상황
                        let confirm_comment = '모델 재학습 동안 해당 모델을 사용하실 수 없습니다.\n재학습 하시겠습니까?';

                        if (feature_col.length === 0) {
                            feature_col = null;
                        }

                        let con = confirm(confirm_comment);
                        if (con === true) {
                            let data = {
                                model_seq: model_seq,
                                algorithm: algorithm,
                                algorithm_seq: algorithm_seq,
                                algorithm_meta_item_list: algorithmMetaItemList,
                                file_path: file_path,
                                file_name: file_name,
                                output_col: output_col,
                                feature_col: feature_col,
                                full_text: full_text
                            }
                            console.log('data', data);
                            showProgressBar({element: null, process_id: 'process-47'});
                            $.ajax({
                                type: "POST",
                                url: '/dt/model/make/model_reset',
                                data: JSON.stringify(data),
                                contentType: "application/json; charset=utf-8;",
                                dataType: "json",
                                success: function (result) {
                                    if (result.result_code === 200) {
                                        closeProgressBar({element: null, process_id: 'process-47'});
                                        window.location.href = contextPath + "/dt/model/model/list?menuCd=" + menuCd;
                                    } else {
                                        closeProgressBar({element: null, process_id: 'process-47'});
                                        alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                                    }
                                },
                                error: function (xhr, status, error) {
                                    console.error('error : ', error);
                                    closeProgressBar({element: null, process_id: 'process-47'});
                                    alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                                }
                            });
                        }
                    } else {
                        //모델 리셋이 불가능한 상황
                        alert('해당 모델은 시뮬레이션에서 사용합니다. 해당 시뮬레이션을 진행 상태를 일시 중지로 변경해주세요.');
                    }
                } else {
                    closeProgressBar({element: null, process_id: 'process-53'});
                    alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                }
            },
            error: function (xhr, status, error) {
                console.error('error : ', error);
                closeProgressBar({element: null, process_id: 'process-53'});
                alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
            }
        });
    });
});

function makeAlgorithm(modelSeq, callback) {
    let preProcData = JSON.parse($('#preprocProPerty').val());
    let file_name = preProcData.preproc_property_info[0].last_step_preproc_file_nm;

    let indexTrgtCol = preProcData.preproc_property_info[0].index_trgt_col;

    let checkHeader = preProcData.preproc_property_info[0].preproc_trgt_col.slice();

    let data = {
        model_seq: modelSeq, index_trgt_col: indexTrgtCol, checkHeader: checkHeader, file_name: file_name
    }
    showProgressBar({element: null, process_id: 'process-21'});
    $.ajax({
        type: "POST",
        url: '/dt/model/make/algorithm_set',
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8;",
        dataType: "json",
        success: function (result) {
            console.log('result', result);
            if (result.result_code === 200) {
                //탭
                $('#tab_getdata').attr('class', 'nav-link');
                $('#tab_info').attr('class', 'nav-link');
                $('#tab_column_info').attr('class', 'nav-link');
                $('#tab_preproc').attr('class', 'nav-link');
                $('#tab_getalgo').attr('class', 'nav-link active');
                $('#tab_savemodel').attr('class', 'nav-link');

                //본문
                $('#tab_getdata_range').hide();
                $('#tab_info_range').hide();
                $('#tab_column_info_range').hide();
                $('#tab_preproc_range').hide();
                $('#tab_getalgo_range').show();
                $('#tab_savemodel_range').hide();
                $('#tab_preview_range').hide();

                $('#inc_tab_validate').hide();
                $('#inc_tab_outlier').hide();
                $('#inc_tab_missing').hide();
                $('#inc_tab_interval').hide();
                $('#inc_tab_unit').hide();

                let outputRange = document.querySelector('#algorithmOutputRange');
                let featureRange = document.querySelector('#algorithmFeatureRange');
                outputRange.innerHTML = ``;
                featureRange.innerHTML = ``;
                (outputRange.dataset.formType === 'U' && outputRange.dataset.jobLevel === 'M') ?
                    makeAlgorithmOutputTable(outputRange, data.checkHeader, data.index_trgt_col, true, true)
                    : makeAlgorithmOutputTable(outputRange, data.checkHeader, data.index_trgt_col, true, false);

                (featureRange.dataset.formType === 'U' && featureRange.dataset.jobLevel === 'M') ?
                    makeAlgorithmFeatureTable(featureRange, data.checkHeader, data.index_trgt_col, true, true)
                    : makeAlgorithmFeatureTable(featureRange, data.checkHeader, data.index_trgt_col, true, false);

                if (result.job_level === 'M') {
                    let preProcData = JSON.parse($('#preprocProPerty').val());
                    $('#outputCheckTable tbody tr').each(function () {
                        let row = $(this);
                        let checkBoxes = row.find('input[type="checkbox"]');
                        checkBoxes.each(function () {
                            let checkbox = $(this);
                            let value = checkbox.val();
                            // 가져온 JSON 데이터에 해당 값이 있는지 확인하여 체크
                            if (preProcData.preproc_property_info.length != 0 && preProcData.preproc_property_info[0].model_property.length != 0 && preProcData.preproc_property_info[0].model_property[0].dependent) {
                                if (preProcData.preproc_property_info[0].model_property[0].dependent.includes(value)) {
                                    checkbox.prop('checked', true);
                                }
                            }
                        });
                    });
                    $('#featureCheckTable tbody tr').each(function () {
                        let row = $(this);
                        let checkBoxes = row.find('input[type="checkbox"]');
                        checkBoxes.each(function () {
                            let checkbox = $(this);
                            let value = checkbox.val();
                            // 가져온 JSON 데이터에 해당 값이 있는지 확인하여 체크
                            if (preProcData.preproc_property_info.length != 0 && preProcData.preproc_property_info[0].model_property.length != 0 && preProcData.preproc_property_info[0].model_property[0].independent) {
                                if (preProcData.preproc_property_info[0].model_property[0].independent.includes(value)) {
                                    checkbox.prop('checked', true);
                                }
                            }
                        });
                    });
                    //수정 페이지 사용
                    if (preProcData.preproc_property_info[0].model_property.length !== 0 && preProcData.preproc_property_info[0].model_property[0].algorithm_seq) {
                        let select_algorithm = document.getElementById('select_algorithm');
                        let dropdownBox = select_algorithm.closest('.dropdown-box');
                        let selectedInput = dropdownBox.querySelector(`input[value="${preProcData.preproc_property_info[0].model_property[0].algorithm_seq}"]`);
                        let selectedLabel = dropdownBox.querySelector(`label[for="${selectedInput.id}"]`);
                        if (selectedInput) {
                            selectedInput.checked = true;
                            select_algorithm.innerHTML = `${selectedLabel.textContent}`;
                            select_algorithm.dataset.value = preProcData.preproc_property_info[0].model_property[0].algorithm_seq;
                        }
                        select_algorithm.disabled = true;
                    }
                }
                closeProgressBar({element: null, process_id: 'process-21'});
            } else {
                closeProgressBar({element: null, process_id: 'process-21'});
                alert('API 내 에러 발생');
            }
            if (callback) {
                callback();
            }
        },
        error: function (xhr, status, error) {
            console.error('error : ', error);
            closeProgressBar({element: null, process_id: 'process-21'});
            if (callback) {
                callback();
            }
            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
        }
    });
}

function correlationBarView(data, xdata) {
    let option = {
        series: [{
            header_name: [],
            sort: "1",
            unit_type: "P",
            type: "D",
            name: "Correlation",
            key: 0,
            isComma: false,
            chart: "bar",
            unit: "",
            yname: "",
            data: data
        }], subtitle: "", title: "", xdata: xdata
    };
    viewTypeDefault("bar", option, 4, true);
}

function correlationHeatMapView(data, xdata, ydata) {
    let option = {
        series: [{
            header_name: [],
            sort: "1",
            unit_type: "P",
            type: "D",
            name: "Correlation",
            key: 0,
            chart: "bar",
            unit: "",
            yname: "",
            data: data
        }], subtitle: "", title: "", xdata: xdata, ydata: ydata
    };
    viewTypeDefault("heatmap", option, 4, true);
}

function makeAlgorithmMetaItemList(model_algrm_seq, model_seq) {
    $('#algorithm_meta_item_list').html('');
    var data = {
        model_algrm_seq: model_algrm_seq, model_seq: model_seq
    }
    showProgressBar({element: null, process_id: 'process-22'});
    $.ajax({
        type: "POST",
        url: '/dt/model/make/algorithm_meta_set',
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8;",
        dataType: "json",
        success: function (result) {
            if (result.result_code === 200) {
                console.log('result', result);
                $('#algorithm_meta_set').val(JSON.stringify(result.algorithm_meta_item_list));
                $('#algorithm_param_template_set').val(JSON.stringify(result.algorithm_param_template_set));
                let parameterListContainer = document.querySelector('#algorithm_meta_item_list');
                parameterListContainer.innerHTML = ``;
                makeModelParameterList(parameterListContainer, result.algorithm_meta_item_list, result.meta_item_loss_list, result.meta_item_meterics_list, result.meta_item_optimizer_list);
                closeProgressBar({element: null, process_id: 'process-22'});
            } else {
                closeProgressBar({element: null, process_id: 'process-22'});
                alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
            }
        },
        error: function (xhr, status, error) {
            console.error('error : ', error);
            closeProgressBar({element: null, process_id: 'process-22'});
            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
        }
    });
}

function makeAlgorithmOutputTable(container, headers, index_column, isCheckbox, isDisabled) {
    if (isCheckbox === null || isCheckbox === undefined || isCheckbox === '') {
        isCheckbox = false;
    }
    let tableContainer = document.createElement('div');
    ['table-responsive'].forEach(function (className) {
        tableContainer.classList.add(className);
    });

    let table = document.createElement('table');
    ['data-table'].forEach(function (className) {
        table.classList.add(className);
    });
    table.id = 'outputCheckTable';
    table.style.width = '100%';
    let thead = document.createElement('thead');
    let tr = document.createElement('tr');
    ['선택', 'COLUMN'].forEach(function (column) {
        let th = document.createElement('th');
        th.innerHTML = `${column}`;
        tr.appendChild(th);
    });
    thead.appendChild(tr);
    table.appendChild(thead);

    let tbody = document.createElement('tbody');
    headers = headers.map(item => item.replace(/\"/g, ''));
    headers.forEach(function (header, index) {
        let tr = document.createElement('tr');
        let inputTd = document.createElement('td');

        let inputContainer = document.createElement('div');
        ['form-checkbox'].forEach(function (className) {
            inputContainer.classList.add(className);
        });
        inputContainer.style.display = 'inline-block';

        let input = document.createElement('input');
        input.type = isCheckbox ? 'checkbox' : 'radio';
        if (isDisabled) {
            input.disabled = isDisabled;
        }

        ['ui-check'].forEach(function (className) {
            input.classList.add(className);
        });

        input.setAttribute('aria-labelledby', `output_col_${header}_label`);
        input.id = `output_col_${header}`;
        input.name = 'outputCol';
        input.value = `${header}`;
        let label = document.createElement('label');
        ['form-label'].forEach(function (className) {
            label.classList.add(className);
        });
        label.setAttribute('for', `output_col_${header}`);
        label.id = `output_col_${header}_label`;
        label.style.margin = '0';
        inputContainer.appendChild(input);
        inputContainer.appendChild(label);
        inputTd.appendChild(inputContainer);

        tr.appendChild(inputTd);
        let columnTd = document.createElement('td');
        columnTd.innerHTML = `${header}`;
        tr.appendChild(columnTd);
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    tableContainer.appendChild(table);
    container.appendChild(tableContainer);
}

function makeAlgorithmFeatureTable(container, headers, index_column, isCheckbox, isDisabled) {
    if (isCheckbox === null || isCheckbox === undefined || isCheckbox === '') {
        isCheckbox = false;
    }
    let tableContainer = document.createElement('div');
    ['table-responsive'].forEach(function (className) {
        tableContainer.classList.add(className);
    });

    let table = document.createElement('table');
    ['data-table'].forEach(function (className) {
        table.classList.add(className);
    });
    table.id = 'featureCheckTable';
    table.style.width = '100%';
    let thead = document.createElement('thead');
    let tr = document.createElement('tr');
    ['선택', 'COLUMN'].forEach(function (column) {
        let th = document.createElement('th');
        th.innerHTML = `${column}`;
        tr.appendChild(th);
    });
    thead.appendChild(tr);
    table.appendChild(thead);

    let tbody = document.createElement('tbody');
    headers = headers.map(item => item.replace(/\"/g, ''));
    headers.forEach(function (header, index) {
        let tr = document.createElement('tr');
        let inputTd = document.createElement('td');

        let inputContainer = document.createElement('div');
        ['form-checkbox'].forEach(function (className) {
            inputContainer.classList.add(className);
        });
        inputContainer.style.display = 'inline-block';

        let input = document.createElement('input');
        input.type = isCheckbox ? 'checkbox' : 'radio';
        if (isDisabled) {
            input.disabled = isDisabled;
        }

        ['ui-check'].forEach(function (className) {
            input.classList.add(className);
        });

        input.setAttribute('aria-labelledby', `feature_col_${header}_label`);
        input.id = `feature_col_${header}`;
        input.name = 'featureCol';
        input.value = `${header}`;

        let label = document.createElement('label');
        ['form-label'].forEach(function (className) {
            label.classList.add(className);
        });
        label.setAttribute('for', `feature_col_${header}`);
        label.id = `feature_col_${header}_label`;
        label.style.margin = '0';
        inputContainer.appendChild(input);
        inputContainer.appendChild(label);
        inputTd.appendChild(inputContainer);

        tr.appendChild(inputTd);
        let columnTd = document.createElement('td');
        columnTd.innerHTML = `${header}`;
        tr.appendChild(columnTd);
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    tableContainer.appendChild(table);
    container.appendChild(tableContainer);
}

function getCorrelation(type, data, callback) {
    $.ajax({
        type: "POST",
        url: `/dt/dataset/correlation/${type}/META_MODEL`,
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8;",
        dataType: "json",
        success: function (result) {
            try {
                if (result.result_code === 200) {
                    result.type = type;
                    console.log('getCorrelation', result);
                    callback(result);
                } else {
                    console.error('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                }
            } catch (error) {
                console.error('getCorrelation', error);
            }
        },
        error: function (xhr, status, error) {
            console.error('getCorrelation', error);
            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
        }
    });
}
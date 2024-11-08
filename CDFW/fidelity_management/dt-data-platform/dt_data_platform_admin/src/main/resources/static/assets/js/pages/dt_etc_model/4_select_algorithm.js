document.querySelector('#select_algorithm')?.addEventListener('change', event => {
    console.log('select_algorithm change event');
    let model_algrm_seq = $("#select_algorithm option:selected").val();
    let model_seq = $("#etcModelSeq").val();
    let _this = event.target;
    let select_index_col = $("#select_algorithm option:selected").text();
    let algolithm_img = '/assets/images/algorithm/' + select_index_col + '.png';
    document.querySelector('#algolithm_img_box').style.backgroundImage = `url("${algolithm_img}")`;
    makeAlgorithmMetaItemList(model_algrm_seq, model_seq, function (result) {
        let tab_getalgo_range_top = document.querySelector('#tab_getalgo_range_top');
        let output_range = document.querySelector('[data-id="output_range"]');
        let output_types = output_range.dataset.type.split(',').map(type => type.trim());
        let feature_range = document.querySelector('[data-id="feature_range"]');
        let feature_types = feature_range.dataset.type.split(',').map(type => type.trim());

        let correlation_range = document.querySelector('[data-id="correlation_range"]');

        console.log(tab_getalgo_range_top, output_range, output_types, feature_range, feature_types, correlation_range);
        let selectedValue = _this.value; // 선택된 <option>의 value 값
        let selectedText = _this.options[_this.selectedIndex].text; // 선택된 <option>의 텍스트
        if (output_types.includes(selectedText)) {
            console.log(`${selectedText} is included in output_types.`);
            output_range.style.display = 'block';
        } else {
            console.log(`${selectedText} is not included in output_types.`);
            output_range.style.display = 'none';
        }
        if (feature_types.includes(selectedText)) {
            console.log(`${selectedText} is included in output_types.`);
            feature_range.style.display = 'block';
        } else {
            console.log(`${selectedText} is not included in output_types.`);
            feature_range.style.display = 'none';
        }
        if (feature_range.style.display === 'none') {
            output_range.classList.remove('col-md-4');
            output_range.classList.add('col-md-6');
            correlation_range.classList.remove('col-md-4');
            correlation_range.classList.add('col-md-6');
        } else {
            output_range.classList.add('col-md-4');
            output_range.classList.remove('col-md-6');
            correlation_range.classList.add('col-md-4');
            correlation_range.classList.remove('col-md-6');
        }
        let model_seq = $('#etcModelSeq').val();
        getAlgorithm(model_seq, function (result) {
            /**
             * View4 상관관계 다시 그리기
             * */
            let view4 = document.querySelector('#view4');
            view4.remove();
            let created_view4 = document.createElement('div');
            created_view4.id = 'view4';
            created_view4.style.display = 'block';
            created_view4.style.width = '100%';
            created_view4.style.height = '400px';
            created_view4.style.borderStyle = 'solid';
            created_view4.style.borderStyle = 'solid';
            created_view4.style.borderColor = '#EEE';
            correlation_range.appendChild(created_view4);
            correlationView(result.correlation_data['data'], result.correlation_data['xdata'], result.correlation_data['ydata']);
            /**
             * output_range와 feature_range 초기화
             * */
            output_range.querySelectorAll('input[name="outputCol"]').forEach((radio) => {
                radio.checked = false;
            });
            feature_range.querySelectorAll('input[name="featureCol"]').forEach((checkbox) => {
                checkbox.checked = false;
            });

            let preProcData = JSON.parse($('#preprocProPerty').val());
            if (preProcData.preproc_property_info.length !== 0 &&
                preProcData.preproc_property_info[0].model_property.length !== 0 &&
                preProcData.preproc_property_info[0].model_property[0].algorithm_seq) {

                console.log('preProcData', preProcData);
                let outputRows = document.querySelectorAll('#outputCheckTable tbody tr');
                outputRows.forEach((outputRow) => {
                    let checkboxes = outputRow.querySelectorAll('input[type="radio"]');
                    checkboxes.forEach((checkbox) => {
                        let value = checkbox.value;
                        if (preProcData.preproc_property_info.length !== 0 &&
                            preProcData.preproc_property_info[0].model_property.length !== 0 &&
                            preProcData.preproc_property_info[0].model_property[0].output_col) {
                            console.log(preProcData.preproc_property_info[0].model_property[0].output_col, checkbox, value);
                            if (preProcData.preproc_property_info[0].model_property[0].output_col.includes(value)) {
                                console.log('checkbox', checkbox);
                                checkbox.checked = true;
                            }
                        }
                    });
                });
                if (preProcData.preproc_property_info[0].model_property[0].algorithm_seq === '2' || preProcData.preproc_property_info[0].model_property[0].algorithm_seq === 'Random Forest') {
                    let featureRows = document.querySelectorAll('#featureCheckTable tbody tr');
                    featureRows.forEach((featureRow) => {
                        let checkboxes = featureRow.querySelectorAll('input[type="checkbox"]');
                        checkboxes.forEach((checkbox) => {
                            let value = checkbox.value;
                            if (preProcData.preproc_property_info.length !== 0 &&
                                preProcData.preproc_property_info[0].model_property.length !== 0 &&
                                preProcData.preproc_property_info[0].model_property[0].feature_cols) {
                                if (preProcData.preproc_property_info[0].model_property[0].feature_cols.includes(value)) {
                                    console.log('checkbox', checkbox);
                                    checkbox.checked = true;
                                }
                            }
                        });
                    });
                }
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
    let algorithm = $('#select_algorithm option:selected').text();
    let algorithm_seq = $('#select_algorithm option:selected').val();
    let menuCd = $('#menuCd').val();

    let outputCol = $('input[name="outputCol"]:checked').val();
    if (typeof outputCol == 'undefined') {
        alert('알고리즘에 사용할 컬럼을 선택하세요.');
        return false;
    }
    if (outputCol === '' || outputCol.length === 0) {
        alert('알고리즘에 사용할 컬럼을 선택하세요.');
        return false;
    }
    let algorithmMetaItemList = JSON.parse($('#algorithm_meta_set').val());
    let model_seq = $('#etcModelSeq').val();
    let valid_arr = [];
    for (var i = 0; i < algorithmMetaItemList.length; i++) {
        //console.log(algorithmMetaItemList[i].model_params_item_value);

        var inputValue = $('#' + algorithmMetaItemList[i].model_params_item).val();
        //console.log(inputValue.length);
        if (inputValue.length == 0) {
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

    let alert_string = '';
    if (valid_arr.length > 0) {
        for (var va = 0; va < valid_arr.length; va++) {
            if (va == 0) {
                alert_string += valid_arr[va];
            } else {
                alert_string += ', ' + valid_arr[va];
            }
        }
        alert(alert_string + ' 필수 입력입니다.');
        return false;
    }
    if (algorithm_seq === '2' || algorithm === 'Random Forest') {
        let featureCols = document.querySelectorAll('input[name="featureCol"]:checked');
        if (featureCols.length === 0) {
            alert('알고리즘에 사용할 독립 변수를 선택하세요.');
            return false;
        }
        let features = [];
        let isDuplicateColumnCheck = false;
        featureCols.forEach(function (featureCol) {
            features.push(featureCol.value);
            if (outputCol.trim() === featureCol.value.trim()) {
                isDuplicateColumnCheck = true;
            }
        });
        if (isDuplicateColumnCheck) {
            alert('컬럼 선택과 독립변수들 중 같은 컬럼을 선택하고 있습니다.\n 독립변수 또는 컬럼 선택 부분을 조정해주세요.');
            return false;
        }
        var modelTemplate = modelEtcAlgorithmTemplate();
        modelTemplate.output_col = outputCol;
        console.log('features', features);
        modelTemplate.feature_cols = features;
        modelTemplate.algorithm = algorithm;
        modelTemplate.algorithm_seq = algorithm_seq;
        modelTemplate.hyperparam.test_size = $('#test_size').val();
        modelTemplate.hyperparam.n_estimator = $('#n_estimator').val();
        modelTemplate.hyperparam.min_samples_leaf = $('#min_samples_leaf').val();
        modelTemplate.hyperparam.min_samples_split = $('#min_samples_split').val();
        modelTemplate.hyperparam.max_features = $('#max_features').val();
        modelTemplate.hyperparam.max_depth = $('#max_depth').val();

        preProcData.preproc_property_info[0].model_create = "Y";
        preProcData.preproc_property_info[0].model_property[0] = modelTemplate;

        $('#preprocProPerty').val(JSON.stringify(preProcData));
        $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));
        var full_text = $('#preprocProPerty').val();
        let confirm_comment = '등록 이후 수정이 불가합니다.\n등록 하시겠습니까?';

        var con = confirm(confirm_comment);
        if (con === true) {
            var data = {
                model_seq: model_seq,
                algorithm: algorithm,
                algorithm_seq: algorithm_seq,
                algorithm_meta_item_list: algorithmMetaItemList,
                file_path: file_path,
                file_name: file_name,
                output_col: outputCol, //feature_col: feature_col,
                feature_cols: features,
                full_text: full_text
            }
            showProgressBar({element: null, process_id: 'process-17'});
            $.ajax({
                type: "POST",
                url: '/dt/etc/model/make/model_set',
                data: JSON.stringify(data),
                contentType: "application/json; charset=utf-8;",
                dataType: "json",
                success: function (result) {
                    closeProgressBar({element: null, process_id: 'process-17'});
                    if (result.result_code === 200) {
                        //alert(result.result_code);
                        //console.log(result.item_list);
                        window.location.href = contextPath + "/dt/etc/model/rf/list?menuCd=" + menuCd;
                    }
                },
                error: function (xhr, status, error) {
                    console.error('error : ', error);
                    closeProgressBar({element: null, process_id: 'process-17'});
                    alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                }
            });
        } else {
            return false;
        }
    } else if (algorithm_seq === '3' || algorithm === 'Brits') {
        var optimizer_number_chk = $('.optimizer-number-chk').val();

        if (typeof optimizer_number_chk != 'undefined') {
            if (isNaN(optimizer_number_chk) || optimizer_number_chk <= 0 || optimizer_number_chk >= 1) {
                alert("optimizerLr은   0보다 크고 1보다 작은 값만 가능합니다.");
                $('.optimizer-number-chk').val("0.0005"); // 기본값으로 조정
                return false;
            }
        }

        //console.log(jsonTemplateArrayNumbering());
        var modelTemplate = modelEtcAlgorithmTemplate();
        modelTemplate.output_col = outputCol;
        modelTemplate.algorithm = algorithm;
        modelTemplate.algorithm_seq = algorithm_seq;
        modelTemplate.hyperparam.window_size = $('#window_size').val();
        modelTemplate.hyperparam.batch_size = $('#batch_size').val();
        modelTemplate.hyperparam.test_size = $('#test_size').val();
        modelTemplate.hyperparam.epochs = $('#epochs').val();
        modelTemplate.hyperparam.data_size = $('#data_size').val();
        modelTemplate.hyperparam.time_steps = $('#time_steps').val();
        modelTemplate.hyperparam.loss = $('#loss option:selected').val();
        modelTemplate.hyperparam.loss_nm = $('#loss option:selected').text();
        modelTemplate.hyperparam.optimizer = $('#optimizer option:selected').val();
        modelTemplate.hyperparam.optimizer_nm = $('#optimizer option:selected').text();
        modelTemplate.hyperparam.optimizer_lr = $('#optimizerLr').val();

        preProcData.preproc_property_info[0].model_create = "Y";
        preProcData.preproc_property_info[0].model_property[0] = modelTemplate;


        $('#preprocProPerty').val(JSON.stringify(preProcData));
        $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));
        var full_text = $('#preprocProPerty').val();

        var confirm_comment;
        confirm_comment = '등록 이후 수정이 불가합니다.\n등록 하시겠습니까?';

        /*
        if (feature_col.length == 0) {
            confirm_comment = '독립변수를 체크 하지 않을 경우 종속변수만 적용되어 모델이 생성됩니다.\n등록 이후 수정이 불가합니다.\n등록 하시겠습니까?';
        } else {
            confirm_comment = '등록 이후 수정이 불가합니다.\n등록 하시겠습니까?';
        }

        if (feature_col.length == 0) {
            feature_col = null;
        }
        */

        var con = confirm(confirm_comment);
        if (con === true) {
            var data = {
                model_seq: model_seq,
                algorithm: algorithm,
                algorithm_seq: algorithm_seq,
                algorithm_meta_item_list: algorithmMetaItemList,
                file_path: file_path,
                file_name: file_name,
                output_col: outputCol, //feature_col: feature_col,
                full_text: full_text
            }
            showProgressBar({element: null, process_id: 'process-18'});
            $.ajax({
                type: "POST",
                url: '/dt/etc/model/make/model_set',
                data: JSON.stringify(data),
                contentType: "application/json; charset=utf-8;",
                dataType: "json",
                success: function (result) {
                    console.log('result', result);
                    closeProgressBar({element: null, process_id: 'process-18'});
                    if (result.result_code === 200) {

                        window.location.href = contextPath + "/dt/etc/model/brits/list?menuCd=" + menuCd;
                    }
                },
                error: function (xhr, status, error) {
                    console.error('error : ', error);
                    closeProgressBar({element: null, process_id: 'process-18'});
                    alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                }
            });
        } else {
            return false;
        }
    } else if (algorithm_seq === '4' || algorithm === 'Naomi') {
        var optimizer_number_chk = $('.optimizer-number-chk').val();

        if (typeof optimizer_number_chk != 'undefined') {
            if (isNaN(optimizer_number_chk) || optimizer_number_chk <= 0 || optimizer_number_chk >= 1) {
                alert("optimizerLr은   0보다 크고 1보다 작은 값만 가능합니다.");
                $('.optimizer-number-chk').val("0.005"); // 기본값으로 조정
                return false;
            }
        }

        console.log('algorithmMetaItemList', algorithmMetaItemList);

        //console.log(jsonTemplateArrayNumbering());
        var modelTemplate = modelEtcAlgorithmTemplate();
        modelTemplate.output_col = outputCol;
        modelTemplate.algorithm = algorithm;
        modelTemplate.algorithm_seq = algorithm_seq;
        modelTemplate.hyperparam.window_size = $('#window_size').val();
        modelTemplate.hyperparam.batch_size = $('#batch_size').val();
        modelTemplate.hyperparam.test_size = $('#testSize').val();
        modelTemplate.hyperparam.epochs = $('#epochs').val();
        modelTemplate.hyperparam.optimizer_lr = $('#optimizerLr').val();
        modelTemplate.hyperparam.gradientClipping = $('#gradientClipping').val();
        modelTemplate.hyperparam.testSizePerDataLength = $('#testSizePerDataLength').val();

        preProcData.preproc_property_info[0].model_create = "Y";
        preProcData.preproc_property_info[0].model_property[0] = modelTemplate;

        $('#preprocProPerty').val(JSON.stringify(preProcData));
        $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));
        var full_text = $('#preprocProPerty').val();

        let confirm_comment = '등록 이후 수정이 불가합니다.\n등록 하시겠습니까?';

        let con = confirm(confirm_comment);
        if (con === true) {
            var data = {
                model_seq: model_seq,
                algorithm: algorithm,
                algorithm_seq: algorithm_seq,
                algorithm_meta_item_list: algorithmMetaItemList,
                file_path: file_path,
                file_name: file_name,
                output_col: outputCol, //feature_col: feature_col,
                full_text: full_text
            }
            showProgressBar({element: null, process_id: 'process-18'});
            $.ajax({
                type: "POST",
                url: '/dt/etc/model/make/model_set',
                data: JSON.stringify(data),
                contentType: "application/json; charset=utf-8;",
                dataType: "json",
                success: function (result) {
                    console.log('result', result);
                    closeProgressBar({element: null, process_id: 'process-18'});
                    if (result.result_code === 200) {

                        window.location.href = contextPath + "/dt/etc/model/naomi/list?menuCd=" + menuCd;
                    }
                },
                error: function (xhr, status, error) {
                    console.error('error : ', error);
                    closeProgressBar({element: null, process_id: 'process-18'});
                    alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                }
            });
        } else {
            return false;
        }
    } else {
        var optimizer_number_chk = $('.optimizer-number-chk').val();

        if (typeof optimizer_number_chk != 'undefined') {
            if (isNaN(optimizer_number_chk) || optimizer_number_chk <= 0 || optimizer_number_chk >= 1) {
                alert("optimizerLr은   0보다 크고 1보다 작은 값만 가능합니다.");
                $('.optimizer-number-chk').val("0.0005"); // 기본값으로 조정
                return false;
            }
        }

        //console.log(jsonTemplateArrayNumbering());
        var modelTemplate = modelEtcAlgorithmTemplate();
        modelTemplate.output_col = outputCol;
        modelTemplate.algorithm = algorithm;
        modelTemplate.algorithm_seq = algorithm_seq;
        modelTemplate.hyperparam.window_size = $('#window_size').val();
        modelTemplate.hyperparam.batch_size = $('#batch_size').val();
        modelTemplate.hyperparam.epochs = $('#epochs').val();
        modelTemplate.hyperparam.units = $('#units').val();
        modelTemplate.hyperparam.test_size = $('#test_size').val();
        modelTemplate.hyperparam.patience = $('#patience').val();

        preProcData.preproc_property_info[0].model_create = "Y";
        preProcData.preproc_property_info[0].model_property[0] = modelTemplate;


        $('#preprocProPerty').val(JSON.stringify(preProcData));
        $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));
        var full_text = $('#preprocProPerty').val();

        var confirm_comment;
        confirm_comment = '등록 이후 수정이 불가합니다.\n등록 하시겠습니까?';

        /*
        if (feature_col.length == 0) {
            confirm_comment = '독립변수를 체크 하지 않을 경우 종속변수만 적용되어 모델이 생성됩니다.\n등록 이후 수정이 불가합니다.\n등록 하시겠습니까?';
        } else {
            confirm_comment = '등록 이후 수정이 불가합니다.\n등록 하시겠습니까?';
        }

        if (feature_col.length == 0) {
            feature_col = null;
        }
        */

        var con = confirm(confirm_comment);
        if (con === true) {
            var data = {
                model_seq: model_seq,
                algorithm: algorithm,
                algorithm_seq: algorithm_seq,
                algorithm_meta_item_list: algorithmMetaItemList,
                file_path: file_path,
                file_name: file_name,
                output_col: outputCol, //feature_col: feature_col,
                full_text: full_text
            }
            showProgressBar({element: null, process_id: 'process-18'});
            $.ajax({
                type: "POST",
                url: '/dt/etc/model/make/model_set',
                data: JSON.stringify(data),
                contentType: "application/json; charset=utf-8;",
                dataType: "json",
                success: function (result) {
                    console.log('result', result);
                    closeProgressBar({element: null, process_id: 'process-18'});
                    if (result.result_code === 200) {

                        window.location.href = contextPath + "/dt/etc/model/ae/list?menuCd=" + menuCd;
                    }
                },
                error: function (xhr, status, error) {
                    console.error('error : ', error);
                    closeProgressBar({element: null, process_id: 'process-18'});
                    alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                }
            });
        } else {
            return false;
        }
    }
});

function goModelAlgo(modelSeq) {
    makeAlgorithm(modelSeq);
}

function getAlgorithm(modelSeq, callback) {
    showProgressBar({element: null, process_id: 'process-5'});
    var preProcData = JSON.parse($('#preprocProPerty').val());
    var file_name = preProcData.preproc_property_info[0].last_step_preproc_file_nm;

    var indexTrgtCol = preProcData.preproc_property_info[0].index_trgt_col;

    var checkHeader = preProcData.preproc_property_info[0].preproc_trgt_col.slice();

    var data = {
        model_seq: modelSeq, index_trgt_col: indexTrgtCol, checkHeader: checkHeader, file_name: file_name
    }
    $.ajax({
        type: "POST",
        url: '/dt/etc/model/make/algorithm_set',
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8;",
        dataType: "json",
        success: function (result) {
            if (result.result_code === 200) {
                closeProgressBar({element: null, process_id: 'process-5'});
                callback(result);
            } else {
                closeProgressBar({element: null, process_id: 'process-5'});
                console.error('getAlgorithm');
                alert('API 내 에러 발생');
            }
        },
        error: function (xhr, status, error) {
            closeProgressBar({element: null, process_id: 'process-5'});
            console.error('getAlgorithm', error);
            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
        }
    });
}

function makeAlgorithm(modelSeq) {
    let preProcData = JSON.parse($('#preprocProPerty').val()),
        file_name = preProcData.preproc_property_info[0].last_step_preproc_file_nm,
        indexTrgtCol = preProcData.preproc_property_info[0].index_trgt_col,
        checkHeader = preProcData.preproc_property_info[0].preproc_trgt_col.slice(),
        model_algrm_seq = $("#select_algorithm option:selected").val(),
        data = {
            model_seq: modelSeq,
            index_trgt_col: indexTrgtCol,
            checkHeader: checkHeader,
            file_name: file_name
        };
    showProgressBar({element: null, process_id: 'process-3'});
    $.ajax({
        type: "POST",
        url: '/dt/etc/model/make/algorithm_set',
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8;",
        dataType: "json",
        success: (result) => handleSuccess(result, preProcData, checkHeader, indexTrgtCol, model_algrm_seq),
        error: handleError
    });
}

const handleSuccess = (result, preProcData, checkHeader, indexTrgtCol, model_algrm_seq) => {
    if (result.result_code !== 200) {
        closeProgressBar({element: null, process_id: 'process-3'});
        alert('API 내 에러 발생');
        return;
    }
    //탭
    $('#tab_getdata').attr('class', 'nav-link');
    $('#tab_info').attr('class', 'nav-link');
    $('#tab_column_info').attr('class', 'nav-link');
    $('#tab_getalgo').attr('class', 'nav-link active');
    $('#tab_savemodel').attr('class', 'nav-link');

    //본문
    $('#tab_getdata_range').hide();
    $('#tab_info_range').hide();
    $('#tab_column_info_range').hide();
    $('#tab_getalgo_range').show();
    $('#tab_savemodel_range').hide();
    $('#tab_preview_range').hide();
    let isCheckbox = false;
    if (model_algrm_seq === 3) {
        //Brits 모델
        isCheckbox = false;
    }
    $('#algorithmOutputRange').html(makeAlgorithmOutput(result.data, result.check_header_data, indexTrgtCol, isCheckbox));
    $('#algorithmFeatureRange').html(makeAlgorithmFeature(result.data, result.check_header_data, indexTrgtCol));

    console.log('result', result);
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
            correlationView(result.correlation_data['data'], result.correlation_data['xdata'], result.correlation_data['ydata']);
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
    closeProgressBar({element: null, process_id: 'process-3'});
    if (preProcData.preproc_property_info[0].model_property.length !== 0) {
        let select_algorithm = document.getElementById('select_algorithm');
        select_algorithm.value = preProcData.preproc_property_info[0].model_property[0].algorithm_seq;
        // Create a change event
        let event = new Event('change');
        // Dispatch the change event
        select_algorithm.dispatchEvent(event);
    }
};

const handleError = (xhr, status, error) => {
    console.error('error : ', error);
    closeProgressBar({element: null, process_id: 'process-3'});
    alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
};

function makeAlgorithmOutput(data, header_data, index_trgt_col, isCheckbox) {
    if (!isCheckbox) {
        isCheckbox = false;
    }
    var indexTrgtCol = index_trgt_col;
    var strHTML = '';
    strHTML += '		<div class="table-responsive">';
    strHTML += '			<table class="table" id="outputCheckTable">';
    //strHTML += '				<thead>';
    //strHTML += '					<tr>';
    //strHTML += '						<th>컬럼명</th>';
    //strHTML += '					</tr>';
    //strHTML += '				</thead>';
    strHTML += '				<tbody>';
    for (var i = 0; i < header_data.length; i++) {
        if (header_data[i].replace(/\"/gi, "") != indexTrgtCol) {
            strHTML += '   <tr id="output_col_id_' + header_data[i].replace(/\"/gi, "") + '">';
            strHTML += `           <th><input ${isCheckbox ? 'type="checkbox"' : 'type="radio"'} name="outputCol" id="output_col_${header_data[i].replace(/\"/gi, "")}" value="${header_data[i].replace(/\"/gi, "")}"></th>`;
            strHTML += '           <td>' + header_data[i].replace(/\"/gi, "") + '</td>';
            //strHTML += '           <td>' + '-' + '</td>';
            strHTML += '    </tr>';
        }
    }
    strHTML += '				</tbody>';
    strHTML += '			</table>';
    strHTML += '		</div>';

    return strHTML;
}

function makeAlgorithmFeature(data, header_data, index_trgt_col) {
    var strHTML = '';
    var indexTrgtCol = index_trgt_col;
    strHTML += '		<div class="table-responsive">';
    strHTML += '			<table class="table" id="featureCheckTable">';
    /*strHTML += '				<thead>';
    strHTML += '					<tr>';
    strHTML += '						<th>컬럼명</th>';
    strHTML += '					</tr>';
    strHTML += '				</thead>';*/
    strHTML += '				<tbody>';
    for (var i = 0; i < header_data.length; i++) {
        if (header_data[i].replace(/\"/gi, "") != indexTrgtCol) {
            strHTML += '   <tr id="feature_col_id_' + header_data[i].replace(/\"/gi, "") + '">';
            strHTML += '           <th><input type="checkbox" name="featureCol" id="feature_col_' + header_data[i].replace(/\"/gi, "") + '" value="' + header_data[i].replace(/\"/gi, "") + '"></th>';
            strHTML += '           <td>' + header_data[i].replace(/\"/gi, "") + '</td>';
            //strHTML += '           <td>' + '-' + '</td>';
            strHTML += '    </tr>';
        }
    }
    strHTML += '				</tbody>';
    strHTML += '			</table>';
    strHTML += '		</div>';


    return strHTML;
}

function correlationView(data, xdata, ydata) {
    var data = {
        "series": [{
            "header_name": [],
            "sort": "1",
            "unit_type": "P",
            "type": "D",
            "name": "Correlation",
            "key": 0,
            "chart": "bar",
            "unit": "",
            "yname": "",
            "data": data
        }], "subtitle": "", "title": "", "xdata": xdata, "ydata": ydata
    };

    viewTypeDefault("heatmap", data, 4, true);
}

function makeAlgorithmMetaItemList(model_algrm_seq, model_seq, callback) {
    showProgressBar({element: null, process_id: 'process-4'});
    $('#algorithm_meta_item_list').html('');
    var data = {
        model_algrm_seq: model_algrm_seq, model_seq: model_seq
    }
    $.ajax({
        type: "POST",
        url: '/dt/etc/model/make/algorithm_meta_set',
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8;",
        dataType: "json",
        success: function (result) {
            try {
                if (result.result_code === 200) {
                    console.log('result', result);
                    $('#algorithm_meta_set').val(JSON.stringify(result.algorithm_meta_item_list));
                    $('#algorithm_param_template_set').val(JSON.stringify(result.algorithm_param_template_set));
                    var strHTML = '';
                    var item_list = result.algorithm_meta_item_list;
                    var loss_list = result.meta_item_loss_list;
                    var meterics_list = result.meta_item_meterics_list;
                    var optimizer_list = result.meta_item_optimizer_list;
                    strHTML += '					<h4 class="card-title">모델 파라미터</h4>';
                    for (var i = 0; i < item_list.length; i++) {
                        strHTML += '					<div class="form-group row">';
                        strHTML += '						<div class="col-lg-3">';
                        strHTML += '							<label class="col-form-label">' + item_list[i].model_params_item + '</label>';
                        strHTML += '						</div>';
                        if (item_list[i].model_params_item_tp !== 'string') {
                            strHTML += '						<div class="col-lg-8">';
                            if (item_list[i].model_params_item_value == null || item_list[i].model_params_item_value === '') {
                                if (item_list[i].model_params_item == 'test_size') {
                                    strHTML += `			<input type="range" class="form-control custom-range-obj" min="0.1" max="0.9"  step="0.1" id="${item_list[i].model_params_item}Range" value="${item_list[i].model_params_item_crtr_1}">`;
                                    strHTML += `			<input type="number" id="${item_list[i].model_params_item}" class="form-control custom-number-range number_only" min="0.1" max="0.9" value="${item_list[i].model_params_item_crtr_1}" readonly="readonly" style="margin-left: 10px;">`;
                                } else if (item_list[i].model_params_item == 'testSize') {
                                    strHTML += `			<input type="range" class="form-control custom-range-obj" min="0.01" max="0.9"  step="0.01" id="${item_list[i].model_params_item}Range" value="${item_list[i].model_params_item_crtr_1}">`;
                                    strHTML += `			<input type="number" id="${item_list[i].model_params_item}" class="form-control custom-number-range number_only" min="0.01" max="0.9" value="${item_list[i].model_params_item_crtr_1}" readonly="readonly" style="margin-left: 10px;">`;
                                } else if (item_list[i].model_params_item === 'testSizePerDataLength') {
                                    strHTML += `			<input type="range" class="form-control custom-range-obj" min="0.01" max="0.9"  step="0.01" id="${item_list[i].model_params_item}Range" value="${item_list[i].model_params_item_crtr_1}">`;
                                    strHTML += `			<input type="number" id="${item_list[i].model_params_item}" class="form-control custom-number-range number_only" min="0.01" max="0.9" value="${item_list[i].model_params_item_crtr_1}" readonly="readonly" style="margin-left: 10px;">`;
                                } else {
                                    if (item_list[i].model_params_item == 'window_size') {
                                        strHTML += `			<input type="number" class="form-control number_only" id="${item_list[i].model_params_item}" placeholder="${item_list[i].model_params_derpn}" value="${item_list[i].model_params_item_crtr_1}" required="required">`;
                                    }
                                    if (item_list[i].model_params_item == 'batch_size') {
                                        strHTML += `			<input type="number" class="form-control number_only" id="${item_list[i].model_params_item}" placeholder="${item_list[i].model_params_derpn}"  value="${item_list[i].model_params_item_crtr_1}" required="required">`;
                                    }
                                    if (item_list[i].model_params_item == 'epochs') {
                                        strHTML += `			<input type="number" class="form-control number_only" id="${item_list[i].model_params_item}" placeholder="${item_list[i].model_params_derpn}"  value="${item_list[i].model_params_item_crtr_1}" required="required">`;
                                    }
                                    if (item_list[i].model_params_item == 'units') {
                                        strHTML += `			<input type="number" class="form-control number_only" id="${item_list[i].model_params_item}" placeholder="${item_list[i].model_params_derpn}"  value="${item_list[i].model_params_item_crtr_1}" required="required">`;
                                    }
                                    if (item_list[i].model_params_item == 'patience') {
                                        strHTML += `			<input type="number" class="form-control number_only" id="${item_list[i].model_params_item}" placeholder="${item_list[i].model_params_derpn}"  value="${item_list[i].model_params_item_crtr_1}" required="required">`;
                                    }
                                    if (item_list[i].model_params_item === 'n_estimator') {
                                        strHTML += `			<input type="number" class="form-control number_only" id="${item_list[i].model_params_item}" placeholder="${item_list[i].model_params_derpn}"  value="${item_list[i].model_params_item_crtr_1}" required="required">`;
                                    }
                                    if (item_list[i].model_params_item === 'min_samples_leaf') {
                                        strHTML += `			<input type="number" class="form-control number_only" id="${item_list[i].model_params_item}" placeholder="${item_list[i].model_params_derpn}"  value="${item_list[i].model_params_item_crtr_1}" required="required">`;
                                    }
                                    if (item_list[i].model_params_item === 'min_samples_split') {
                                        strHTML += `			<input type="number" class="form-control number_only" id="${item_list[i].model_params_item}" placeholder="${item_list[i].model_params_derpn}"  value="${item_list[i].model_params_item_crtr_1}" required="required">`;
                                    }
                                    if (item_list[i].model_params_item === 'max_features') {
                                        strHTML += `			<input type="number" class="form-control number_only" id="${item_list[i].model_params_item}" placeholder="${item_list[i].model_params_derpn}"  value="${item_list[i].model_params_item_crtr_1}" required="required">`;
                                    }
                                    if (item_list[i].model_params_item === 'max_depth') {
                                        strHTML += `			<input type="number" class="form-control number_only" id="${item_list[i].model_params_item}" placeholder="${item_list[i].model_params_derpn}"  value="${item_list[i].model_params_item_crtr_1}" required="required">`;
                                    }
                                    if (item_list[i].model_params_item === 'data_size') {
                                        strHTML += `			<input type="number" class="form-control number_only" id="${item_list[i].model_params_item}" placeholder="${item_list[i].model_params_derpn}"  value="${item_list[i].model_params_item_crtr_1}" required="required">`;
                                    }
                                    if (item_list[i].model_params_item === 'optimizerLr') {
                                        strHTML += `			<input type="number" class="form-control optimizer-number-chk" id="${item_list[i].model_params_item}" placeholder="${item_list[i].model_params_derpn}"  value="${item_list[i].model_params_item_crtr_1}" required="required">`;
                                    }
                                    if (item_list[i].model_params_item === 'time_steps') {
                                        strHTML += `			<input type="number" class="form-control number_only" id="${item_list[i].model_params_item}" placeholder="${item_list[i].model_params_derpn}"  value="${item_list[i].model_params_item_crtr_1}" required="required">`;
                                    }
                                    if (item_list[i].model_params_item === 'gradientClipping') {
                                        strHTML += `			<input type="number" class="form-control number_only" id="${item_list[i].model_params_item}" placeholder="${item_list[i].model_params_derpn}"  value="${item_list[i].model_params_item_crtr_1}" required="required">`;
                                    }
                                }
                            } else {
                                if (item_list[i].model_params_item === 'test_size') {
                                    strHTML += `			<input type="range" class="form-control custom-range-obj" min="0.1" max="0.9"  step="0.1" id="${item_list[i].model_params_item}Range" value="${item_list[i].model_params_item_value}">`;
                                    strHTML += `			<input type="number" class="form-control custom-number-range number_only" id="${item_list[i].model_params_item}" value="${item_list[i].model_params_item_value}" min="0.1" max="0.9" readonly="readonly" style="margin-left: 10px;">`;
                                } else if (item_list[i].model_params_item === 'testSize') {
                                    strHTML += `			<input type="range" class="form-control custom-range-obj" min="0.01" max="0.9"  step="0.01" id="${item_list[i].model_params_item}Range" value="${item_list[i].model_params_item_value}">`;
                                    strHTML += `			<input type="number" class="form-control custom-number-range number_only" id="${item_list[i].model_params_item}" value="${item_list[i].model_params_item_value}" min="0.01" max="0.9" readonly="readonly" style="margin-left: 10px;">`;
                                } else if (item_list[i].model_params_item === 'testSizePerDataLength') {
                                    strHTML += `			<input type="range" class="form-control custom-range-obj" min="0.01" max="0.9"  step="0.01" id="${item_list[i].model_params_item}Range" value="${item_list[i].model_params_item_value}">`;
                                    strHTML += `			<input type="number" class="form-control custom-number-range number_only" id="${item_list[i].model_params_item}" value="${item_list[i].model_params_item_value}" min="0.01" max="0.9" readonly="readonly" style="margin-left: 10px;">`;
                                } else {
                                    strHTML += `			<input type="number" class="form-control number_only" id="${item_list[i].model_params_item}" value= "${item_list[i].model_params_item_value}" placeholder="${item_list[i].model_params_derpn}" required="required">`;
                                }
                            }
                            strHTML += '						</div>';
                        } else {
                            if (item_list[i].model_params_item === 'loss') {
                                strHTML += '						<div class="col-lg-8">';
                                strHTML += `					<select class="select" id="${item_list[i].model_params_item}">`;
                                for (var j = 0; j < loss_list.length; j++) {
                                    if (item_list[i].model_params_item_value == null || item_list[i].model_params_item_value == '') {
                                        //기본값이 포함되는 경우
                                        if (loss_list[j].dtl_cd === item_list[i].model_params_item_crtr_1) {
                                            strHTML += `<option selected value="${loss_list[j].dtl_cd}">${loss_list[j].dtl_cd_nm}</option>`;
                                        }
                                        //기본값이 포함되지 않는 경우
                                        else {
                                            strHTML += `<option value="${loss_list[j].dtl_cd}">${loss_list[j].dtl_cd_nm}</option>`;
                                        }
                                    } else {
                                        if (item_list[i].model_params_item_value == loss_list[j].dtl_cd) {
                                            strHTML += `<option selected value="${loss_list[j].dtl_cd}">${loss_list[j].dtl_cd_nm}</option>`;
                                        } else {
                                            strHTML += `<option value="${loss_list[j].dtl_cd}">${loss_list[j].dtl_cd_nm}</option>`;
                                        }
                                    }
                                }
                                strHTML += '					</select>';
                                strHTML += '						</div>';
                            }
                            if (item_list[i].model_params_item === 'meterics') {
                                strHTML += '						<div class="col-lg-8">';
                                strHTML += `					<select class="select" id="${item_list[i].model_params_item}">`;
                                for (var k = 0; k < meterics_list.length; k++) {
                                    if (item_list[i].model_params_item_value == null || item_list[i].model_params_item_value === '') {
                                        //기본값이 포함되는 경우
                                        if (meterics_list[k].dtl_cd === item_list[i].model_params_item_crtr_1) {
                                            strHTML += `<option selected value="${meterics_list[k].dtl_cd}">${meterics_list[k].dtl_cd_nm}</option>`;
                                        }
                                        //기본값이 포함되지 않는 경우
                                        else {
                                            strHTML += `<option value="${meterics_list[k].dtl_cd}">${meterics_list[k].dtl_cd_nm}</option>`;
                                        }
                                    } else {
                                        if (item_list[i].model_params_item_value === meterics_list[k].dtl_cd) {
                                            strHTML += `<option selected value="${meterics_list[k].dtl_cd}">${meterics_list[k].dtl_cd_nm}</option>`;
                                        } else {
                                            strHTML += `<option value="${meterics_list[k].dtl_cd}">${meterics_list[k].dtl_cd_nm}</option>`;
                                        }
                                    }
                                }
                                strHTML += '					</select>';
                                strHTML += '						</div>';
                            }
                            if (item_list[i].model_params_item === 'optimizer') {
                                strHTML += '						<div class="col-lg-8">';
                                strHTML += `					<select class="select" id="${item_list[i].model_params_item}">`;
                                for (var l = 0; l < optimizer_list.length; l++) {
                                    if (item_list[i].model_params_item_value == null || item_list[i].model_params_item_value === '') {
                                        //기본값이 포함되는 경우
                                        if (optimizer_list[l].dtl_cd === item_list[i].model_params_item_crtr_1) {
                                            strHTML += `<option selected value="${optimizer_list[l].dtl_cd}">${optimizer_list[l].dtl_cd_nm}</option>`;
                                        }
                                        //기본값이 포함되지 않는 경우
                                        else {
                                            strHTML += `<option value="${optimizer_list[l].dtl_cd}">${optimizer_list[l].dtl_cd_nm}</option>`;
                                        }
                                    } else {
                                        if (item_list[i].model_params_item_value === optimizer_list[l].dtl_cd) {
                                            strHTML += `<option selected value="${optimizer_list[l].dtl_cd}">${optimizer_list[l].dtl_cd_nm}</option>`;
                                        } else {
                                            strHTML += `<option value="${optimizer_list[l].dtl_cd}">${optimizer_list[l].dtl_cd_nm}</option>`;
                                        }
                                    }
                                }
                                strHTML += '					</select>';
                                strHTML += '						</div>';
                            }
                        }
                        strHTML += '					</div>';
                    }
                    $('#algorithm_meta_item_list').html(strHTML);
                    closeProgressBar({element: null, process_id: 'process-4'});
                    callback(result);
                } else {
                    closeProgressBar({element: null, process_id: 'process-4'});
                    alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                }
            } catch (error) {
                closeProgressBar({element: null, process_id: 'process-4'});
                console.error('makeAlgorithmMetaItemList', error);
            }
        },
        error: function (xhr, status, error) {
            closeProgressBar({element: null, process_id: 'process-4'});
            console.error('makeAlgorithmMetaItemList', error);
            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
        }
    });
}

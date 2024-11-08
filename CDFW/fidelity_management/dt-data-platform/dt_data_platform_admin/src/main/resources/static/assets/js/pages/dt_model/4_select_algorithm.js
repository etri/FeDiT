(function () {
    'use strict'
    $(document).ready(function () {

        $(document).on('change', '#select_algorithm', function () {
            var model_algrm_seq = $("#select_algorithm option:selected").val();
            var model_seq = $("#modelSeq").val();

            var select_index_col = $("#select_algorithm option:selected").text();
            var algolithm_img = '/assets/images/algorithm/' + select_index_col + '.png';
            document.querySelector('#algolithm_img_box').style.backgroundImage = `url("${algolithm_img}")`;
            makeAlgorithmMetaItemList(model_algrm_seq, model_seq);
        });

        $(document).on('change', '#customRange', function () {
            $('.custom-number-range').val($(this).val());
        });

        $(document).on('click', '.make-model', function () {
            var menuCd = $('#menuCd').val();

            var select_algorithm = $("#select_algorithm option:selected").val();
            if (select_algorithm === '0') {
                alert('알고리즘을 선택하세요.');
                return false;
            }

            var algorithmMetaItemList = JSON.parse($('#algorithm_meta_set').val());
            var model_seq = $('#modelSeq').val();

            var valid_arr = [];
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


            var modelSeq = $('#modelSeq').val();
            var algorithm = $('#select_algorithm option:selected').text();
            var algorithm_seq = $('#select_algorithm option:selected').val();

            var preProcData = JSON.parse($('#preprocProPerty').val());
            var file_name = preProcData.preproc_property_info[0].last_step_preproc_file_nm;
            var file_path = $('#lastFilePath').val();

            //var file_list = $('#fileList').val();

            //var output_col = $('input:radio[name="outputCol"]:checked').val()
            var output_col = $('input[name="outputCol"]:checked').map(function () {
                return this.value;
            }).get();
            var feature_col = $('input[name="featureCol"]:checked').map(function () {
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
            var duplicates = output_col.filter(function (value) {
                return feature_col.indexOf(value) !== -1;
            });
            switch (parseInt(algorithm_seq)) {
                //LSTM, GRU, ETC...
                case 1:
                case 2:
                default:
                    //중복 선택 가능
                    //console.log(duplicates.length)
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

            var alert_string = '';
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


            var optimizer_number_chk = $('.optimizer-number-chk').val();

            if (typeof optimizer_number_chk != 'undefined') {
                if (isNaN(optimizer_number_chk) || optimizer_number_chk <= 0 || optimizer_number_chk >= 1) {
                    alert("optimizerLr은   0보다 크고 1보다 작은 값만 가능합니다.");
                    $('.optimizer-number-chk').val("0.0005"); // 기본값으로 조정
                    return false;
                }
            }


            //console.log(jsonTemplateArrayNumbering());
            var preProcData = JSON.parse($('#preprocProPerty').val());
            var modelTemplate = modelAlgorithmTemplate();
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

            preProcData.preproc_property_info[0].model_create = "Y";
            preProcData.preproc_property_info[0].model_property[0] = modelTemplate;


            $('#preprocProPerty').val(JSON.stringify(preProcData));
            $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));
            var full_text = $('#preprocProPerty').val();

            /*if (feature_col.length === 0) {
                confirm_comment = '독립변수를 체크 하지 않을 경우 종속변수만 적용되어 모델이 생성됩니다.\n등록 이후 수정이 불가합니다.\n등록 하시겠습니까?';
            } else {
                confirm_comment = '등록 이후 수정이 불가합니다.\n등록 하시겠습니까?';
            }*/
            var confirm_comment = '등록 이후 수정시 재학습할 동안 모델을 사용하실 수 없습니다.\n등록 하시겠습니까?';

            if (feature_col.length === 0) {
                feature_col = null;
            }

            var con = confirm(confirm_comment);
            if (con === true) {
                var data = {
                    model_seq: modelSeq,
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
                            //alert(result.result_code);
                            //console.log(result.item_list);
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
            var menuCd = $('#menuCd').val();

            var select_algorithm = $("#select_algorithm option:selected").val();
            if (select_algorithm === '0') {
                alert('알고리즘을 선택하세요.');
                return false;
            }

            var algorithmMetaItemList = JSON.parse($('#algorithm_meta_set').val());
            var model_seq = $('#modelSeq').val();

            var valid_arr = [];
            for (var i = 0; i < algorithmMetaItemList.length; i++) {
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

            var modelSeq = $('#modelSeq').val();
            var algorithm = $('#select_algorithm option:selected').text();
            var algorithm_seq = $('#select_algorithm option:selected').val();

            var preProcData = JSON.parse($('#preprocProPerty').val());
            var file_name = preProcData.preproc_property_info[0].last_step_preproc_file_nm;
            var file_path = $('#lastFilePath').val();

            var output_col = $('input[name="outputCol"]:checked').map(function () {
                return this.value;
            }).get();
            var feature_col = $('input[name="featureCol"]:checked').map(function () {
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
            var duplicates = output_col.filter(function (value) {
                return feature_col.indexOf(value) !== -1;
            });
            switch (parseInt(algorithm_seq)) {
                //LSTM, GRU, ETC...
                case 1:
                case 2:
                default:
                    //중복 선택 가능
                    //console.log(duplicates.length)
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

            var alert_string = '';
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

            var optimizer_number_chk = $('.optimizer-number-chk').val();

            if (typeof optimizer_number_chk != 'undefined') {
                if (isNaN(optimizer_number_chk) || optimizer_number_chk <= 0 || optimizer_number_chk >= 1) {
                    alert("optimizerLr은   0보다 크고 1보다 작은 값만 가능합니다.");
                    $('.optimizer-number-chk').val("0.0005"); // 기본값으로 조정
                    return false;
                }
            }

            var preProcData = JSON.parse($('#preprocProPerty').val());
            var modelTemplate = modelAlgorithmTemplate();
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

            preProcData.preproc_property_info[0].model_create = "Y";
            preProcData.preproc_property_info[0].model_property[0] = modelTemplate;


            $('#preprocProPerty').val(JSON.stringify(preProcData));
            $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));
            var full_text = $('#preprocProPerty').val();

            /**
             * 제약 조건 추가 - 시뮬레이션에서 해당 모델 사용하면 안됩니다.
             * */
            showProgressBar({element: null, process_id: 'process-53'});
            let checkData = {
                model_seq: modelSeq
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
                            var confirm_comment = '모델 재학습 동안 해당 모델을 사용하실 수 없습니다.\n재학습 하시겠습니까?';

                            if (feature_col.length === 0) {
                                feature_col = null;
                            }

                            var con = confirm(confirm_comment);
                            if (con === true) {
                                var data = {
                                    model_seq: modelSeq,
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
})();

function goModelAlgo(modelSeq) {
    makeAlgorithm(modelSeq);
}


function makeAlgorithm(modelSeq) {
    var preProcData = JSON.parse($('#preprocProPerty').val());
    var file_name = preProcData.preproc_property_info[0].last_step_preproc_file_nm;

    var indexTrgtCol = preProcData.preproc_property_info[0].index_trgt_col;

    var checkHeader = preProcData.preproc_property_info[0].preproc_trgt_col.slice();

    var data = {
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
                if (outputRange.dataset.formType === 'U' && outputRange.dataset.jobLevel === 'M') {
                    $('#algorithmOutputRange').html(makeAlgorithmOutput(result.data, result.check_header_data, indexTrgtCol, true));
                } else {
                    $('#algorithmOutputRange').html(makeAlgorithmOutput(result.data, result.check_header_data, indexTrgtCol, false));
                }
                if (featureRange.dataset.formType === 'U' && featureRange.dataset.jobLevel === 'M') {
                    $('#algorithmFeatureRange').html(makeAlgorithmFeature(result.data, result.check_header_data, indexTrgtCol, true));
                } else {
                    $('#algorithmFeatureRange').html(makeAlgorithmFeature(result.data, result.check_header_data, indexTrgtCol, false));
                }
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
                if (result.job_level === 'M') {
                    var preProcData = JSON.parse($('#preprocProPerty').val());
                    $('#outputCheckTable tbody tr').each(function () {
                        var row = $(this);
                        var checkBoxes = row.find('input[type="checkbox"]');
                        checkBoxes.each(function () {
                            var checkbox = $(this);
                            var value = checkbox.val();
                            // 가져온 JSON 데이터에 해당 값이 있는지 확인하여 체크
                            if (preProcData.preproc_property_info.length != 0 && preProcData.preproc_property_info[0].model_property.length != 0 && preProcData.preproc_property_info[0].model_property[0].dependent) {
                                if (preProcData.preproc_property_info[0].model_property[0].dependent.includes(value)) {
                                    checkbox.prop('checked', true);
                                }
                            }
                        });
                    });
                    $('#featureCheckTable tbody tr').each(function () {
                        var row = $(this);
                        var checkBoxes = row.find('input[type="checkbox"]');
                        checkBoxes.each(function () {
                            var checkbox = $(this);
                            var value = checkbox.val();
                            // 가져온 JSON 데이터에 해당 값이 있는지 확인하여 체크
                            if (preProcData.preproc_property_info.length != 0 && preProcData.preproc_property_info[0].model_property.length != 0 && preProcData.preproc_property_info[0].model_property[0].independent) {
                                if (preProcData.preproc_property_info[0].model_property[0].independent.includes(value)) {
                                    checkbox.prop('checked', true);
                                }
                            }
                        });
                    });
                    $('#select_algorithm').val(preProcData.preproc_property_info[0].model_property[0].algorithm_seq).prop('disabled', true).trigger('change');
                }
                closeProgressBar({element: null, process_id: 'process-21'});
            } else {
                closeProgressBar({element: null, process_id: 'process-21'});
                alert('API 내 에러 발생');
            }
        },
        error: function (xhr, status, error) {
            console.error('error : ', error);
            closeProgressBar({element: null, process_id: 'process-21'});
            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
        }
    });
}

function makeAlgorithmOutput(data, header_data, index_trgt_col, isDisabled) {

    var indexTrgtCol = index_trgt_col;
    var strHTML = '';
    strHTML += '		<div class="table-responsive">';
    strHTML += '			<table class="table" id="outputCheckTable">';
    strHTML += '				<thead>';
    strHTML += '					<tr>';
    strHTML += '						<th>컬럼명</th>';
    strHTML += '					</tr>';
    strHTML += '				</thead>';
    strHTML += '				<tbody>';
    for (var i = 0; i < header_data.length; i++) {
        if (header_data[i].replace(/\"/gi, "") != indexTrgtCol) {
            strHTML += '   <tr id="output_col_id_' + header_data[i].replace(/\"/gi, "") + '">';
            strHTML += `           <th><input type="checkbox" ${isDisabled === true ? 'disabled="disabled"' : ''} name="outputCol" id="output_col_${header_data[i].replace(/\"/gi, "")}" value="${header_data[i].replace(/\"/gi, "")}"></th>`;
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

function makeAlgorithmFeature(data, header_data, index_trgt_col, isDisabled) {
    var strHTML = '';
    var indexTrgtCol = index_trgt_col;
    strHTML += '		<div class="table-responsive">';
    strHTML += '			<table class="table" id="featureCheckTable">';
    strHTML += '				<thead>';
    strHTML += '					<tr>';
    strHTML += '						<th>컬럼명</th>';
    strHTML += '					</tr>';
    strHTML += '				</thead>';
    strHTML += '				<tbody>';
    for (var i = 0; i < header_data.length; i++) {
        if (header_data[i].replace(/\"/gi, "") != indexTrgtCol) {
            strHTML += '   <tr id="feature_col_id_' + header_data[i].replace(/\"/gi, "") + '">';
            strHTML += `           <th><input type="checkbox" ${isDisabled === true ? 'disabled="disabled"' : ''} name="featureCol" id="feature_col_${header_data[i].replace(/\"/gi, "")}" value="${header_data[i].replace(/\"/gi, "")}"></th>`;
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

    viewTypeDefault("heatmap", data, 4, true)
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
                $('#algorithm_meta_set').val(JSON.stringify(result.algorithm_meta_item_list))
                $('#algorithm_param_template_set').val(JSON.stringify(result.algorithm_param_template_set))
                var strHTML = '';
                var item_list = result.algorithm_meta_item_list;
                var loss_list = result.meta_item_loss_list;
                var meterics_list = result.meta_item_meterics_list;
                var optimizer_list = result.meta_item_optimizer_list;
                strHTML += '					<h4 class="card-title">모델 파라미터</h4>';
                for (var i = 0; i < item_list.length; i++) {
                    strHTML += '					<div class="form-group row">';
                    strHTML += '						<div class="col-lg-3">';
                    strHTML += `							<label class="col-form-label">${item_list[i].model_params_item}</label>`;
                    strHTML += '						</div>';
                    if (item_list[i].model_params_item_tp !== 'string') {
                        strHTML += '						<div class="col-lg-8">';
                        if (item_list[i].model_params_item_value == null || item_list[i].model_params_item_value === '') {
                            if (item_list[i].model_params_item === 'testSize') {
                                strHTML += `			<input type="range" class="form-control" min="0.1" max="0.9"  step="0.1" id="customRange" value="${item_list[i].model_params_item_crtr_1}">`;
                                strHTML += `			<input type="number" id="${item_list[i].model_params_item}" class="form-control custom-number-range number_only" min="0.1" max="0.9" value="${item_list[i].model_params_item_crtr_1}" readonly="readonly" style="margin-left: 10px;">`;
                            } else {
                                if (item_list[i].model_params_item === 'windowSize') {
                                    strHTML += `			<input type="number" class="form-control number_only" id="${item_list[i].model_params_item}" placeholder="${item_list[i].model_params_derpn}" value="${item_list[i].model_params_item_crtr_1}" required="required">`;
                                }
                                if (item_list[i].model_params_item === 'batchSize') {
                                    strHTML += `			<input type="number" class="form-control number_only" id="${item_list[i].model_params_item}" placeholder="${item_list[i].model_params_derpn}"  value="${item_list[i].model_params_item_crtr_1}" required="required">`;
                                }
                                if (item_list[i].model_params_item === 'epochs') {
                                    strHTML += `			<input type="number" class="form-control number_only" id="${item_list[i].model_params_item}" placeholder="${item_list[i].model_params_derpn}"  value="${item_list[i].model_params_item_crtr_1}" required="required">`;
                                }
                                if (item_list[i].model_params_item === 'dataSize') {
                                    strHTML += `<input type="number" class="form-control number_only" id="${item_list[i].model_params_item}" placeholder="${item_list[i].model_params_derpn}"  value="${item_list[i].model_params_item_crtr_1}" required="required">`;
                                    strHTML += `			<br/><span  style="color: red;">${item_list[i].model_params_derpn}</span>`;
                                }
                                if (item_list[i].model_params_item === 'optimizerLr') {
                                    strHTML += `			<input type="number" class="form-control optimizer-number-chk" id="${item_list[i].model_params_item}" placeholder="${item_list[i].model_params_derpn}"  value="${item_list[i].model_params_item_crtr_1}" required="required">`;
                                }
                            }
                        } else {
                            if (item_list[i].model_params_item === 'testSize') {
                                strHTML += `			<input type="range" class="form-control" min="0.1" max="0.9"  step="0.1" id="customRange" value="${item_list[i].model_params_item_crtr_1}">`;
                                strHTML += `			<input type="number" id="${item_list[i].model_params_item}" value= "${item_list[i].model_params_item_value}" class="form-control custom-number-range number_only" min="0.1" max="0.9" readonly="readonly">`;
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
                                if (item_list[i].model_params_item_value == null || item_list[i].model_params_item_value === '') {
                                    //기본값이 포함되는 경우
                                    if (loss_list[j].dtl_cd === item_list[i].model_params_item_crtr_1) {
                                        strHTML += `<option selected value="${loss_list[j].dtl_cd}">${loss_list[j].dtl_cd_nm}</option>`;
                                    }
                                    //기본값이 포함되지 않는 경우
                                    else {
                                        strHTML += `<option value="${loss_list[j].dtl_cd}">${loss_list[j].dtl_cd_nm}</option>`;
                                    }
                                } else {
                                    if (item_list[i].model_params_item_value === loss_list[j].dtl_cd) {
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

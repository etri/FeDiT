document.addEventListener('DOMContentLoaded', function () {
    $(document).on('click', '.next-model-step', function () {
        getTotalLastFile();
        var con = confirm('모델을 생성 단계로 이동  하시겠습니까?');
        if (con == true) {
            var preProcData = JSON.parse($('#preprocProPerty').val());
            //var preProcData = $('#preprocProPerty').val();
            goModelProperty(preProcData);
        }
    });
});

function goModelProperty(param) {
    $.ajax({
        type: "POST",
        async: false,
        url: '/dt/etc/model/savePreproc',
        data: JSON.stringify(param),
        contentType: "application/json; charset=utf-8;",
        dataType: "json",
        success: function (result) {
            if (result.result_code === 200) {
                $('#etcModelSeq').val(result.model_seq);

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

                let preProcData = JSON.parse($('#preprocProPerty').val()),
                    file_name = preProcData.preproc_property_info[0].last_step_preproc_file_nm,
                    indexTrgtCol = preProcData.preproc_property_info[0].index_trgt_col,
                    checkHeader = preProcData.preproc_property_info[0].preproc_trgt_col.slice(),
                    model_algrm_seq = document.querySelector('#select_algorithm').dataset.value, data = {
                        model_seq: $('#etcModelSeq').val(), index_trgt_col: indexTrgtCol, checkHeader: checkHeader, file_name: file_name
                    };

                let isCheckbox = false;
                if (parseInt(model_algrm_seq) === 3) {
                    //Brits 모델
                    isCheckbox = false;
                }

                let algorithmOutputRange = document.querySelector('#algorithmOutputRange');
                algorithmOutputRange.innerHTML = ``;
                makeAlgorithmOutputTable(algorithmOutputRange, checkHeader, indexTrgtCol, isCheckbox);
                let algorithmFeatureRange = document.querySelector('#algorithmFeatureRange');
                algorithmFeatureRange.innerHTML = ``;
                makeAlgorithmFeatureTable(algorithmFeatureRange, checkHeader, indexTrgtCol, !isCheckbox);

                //수정 페이지 사용
                if (preProcData.preproc_property_info[0].model_property.length !== 0) {
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

                /**
                 * 2024-07-17
                 * @description 상세페이지 로드시 tab_getdata_range가 보여지는 현상 제거
                 * @author kimwoosik
                 * @overview 상세페이지와 등록 페이지 둘다 사용된다.
                 * */
                if ($('#formType').val() === 'U') {
                    let etcModelType = document.querySelector('#etcModelType');
                    if (etcModelType) {
                        disabledResultTypeCase(etcModelType.value);
                    }
                }

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

                    data.model_seq = $("#etcModelSeq").val();
                    data.file_name = preProcData.preproc_property_info[0].last_step_preproc_file_nm;
                    data.index_trgt_col = preProcData.preproc_property_info[0].index_trgt_col
                    data.checkHeader = preProcData.preproc_property_info[0].preproc_trgt_col.slice();
                    showProgressBar({element: null, process_id: 'correlation-2'});
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
                            closeProgressBar({element: null, process_id: 'correlation-2'});
                        }
                    });
                }
            } else {
                alert('API 내 에러 발생')
            }
        },
        error: function (xhr, status, error) {
            console.error('error : ', error);
            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
        }
    });
}

function getTotalLastFile() {
    var jsonTemplate = JSON.parse($('#preprocProPerty').val());
    var lastPreprocOrder = null;
    var lastPreprocSet = null;
    var lastTargetFileName = null;
    var lastSetOrder = null;

    $.each(jsonTemplate.preproc_property_info, function (index, preprocPropertyInfo) {
        // preproc_property 배열 반복
        $.each(preprocPropertyInfo.preproc_property, function (index, preprocProperty) {
            if (preprocProperty.preproc_order !== null) {
                // 마지막 preproc_order의 preproc_set 배열 업데이트
                lastPreprocSet = preprocProperty.preproc_set;
                // preproc_set 배열 반복
                $.each(preprocProperty.preproc_set, function (index, preprocSet) {
                    // trgt_file_nm이 존재하는 경우에만 업데이트
                    if (preprocSet.trgt_file_nm !== null) {
                        lastTargetFileName = preprocSet.trgt_file_nm;
                        lastSetOrder = preprocSet.set_order;
                        lastPreprocOrder = preprocProperty.preproc_order;
                    }
                });
            }
        });
    });

    if (lastTargetFileName == null) {
        var base_file_nm = jsonTemplate.preproc_property_info[0].base_file_nm;
        var base_file_nm_set_range_row = jsonTemplate.preproc_property_info[0].base_file_nm_set_range_row;
        var base_file_nm_set_range_col = jsonTemplate.preproc_property_info[0].base_file_nm_set_range_col;

        lastPreprocOrder = null;
        if (base_file_nm_set_range_col != null && base_file_nm_set_range_col != '') {
            lastTargetFileName = base_file_nm_set_range_col;
        } else if (base_file_nm_set_range_row != null && base_file_nm_set_range_row != '') {
            lastTargetFileName = base_file_nm_set_range_row;
        } else {
            lastTargetFileName = base_file_nm;
        }
    }

    jsonTemplate.preproc_property_info[0].last_step_preproc_order = lastPreprocOrder;
    jsonTemplate.preproc_property_info[0].last_step_preproc_file_nm = lastTargetFileName;

    $('#preprocProPerty').val(JSON.stringify(jsonTemplate));
    $('.preprocProPerty').val(prettyJson(JSON.stringify(jsonTemplate)));
}
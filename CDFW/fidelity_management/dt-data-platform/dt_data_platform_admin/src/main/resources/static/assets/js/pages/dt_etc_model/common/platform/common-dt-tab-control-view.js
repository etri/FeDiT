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
        let base_file_nm_set_range_row = preProcData.preproc_property_info[0].base_file_nm_set_range_row;
        let base_file_nm_set_range_col = preProcData.preproc_property_info[0].base_file_nm_set_range_col;
        viewPreprocFile($('#formType').val(), base_file_nm, $('#lastFilePath').val(), 'csvUpRange', 'fileViewDataTableRange');
        let etcModelType = document.querySelector('#etcModelType');
        if (etcModelType) {
            disabledResultTypeCase(etcModelType.value);
        }
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

        let preProcData = JSON.parse($('#preprocProPerty').val());
        $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));

        let index_trgt_col = preProcData.preproc_property_info[0].index_trgt_col;
        let base_file_path = $('#lastFilePath').val();
        let base_file_nm = preProcData.preproc_property_info[0].base_file_nm_set_range_row;

        let etcModelType = document.querySelector('#etcModelType');
        if (etcModelType) {
            disabledResultTypeCase(etcModelType.value);
        }

        //실제 작업할 필터 건 파일을 만듬
        let form_type = $('#formType').val();
        getTargetDataSetInfo(base_file_path, base_file_nm, index_trgt_col, form_type, function (data) {
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
    })

    $(document).on('click', '#tab_getalgo', function () {
        let model_status = $('#model_status').val();
        console.log('model_status', model_status);
        if (model_status === 'PREPARE') {
            alert('모셀을 설정 정보를 찾을 수 없습니다. 삭제하고 다시 시도해주세요.');
            return false;
        }
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
                model_seq: $('#etcModelSeq').val(),
                index_trgt_col: indexTrgtCol,
                checkHeader: checkHeader,
                file_name: file_name
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
    });

    $(document).on('click', '#tab_savemodel', function () {
        let model_status = $('#model_status').val();
        console.log('model_status', model_status);
        if (model_status === 'DOING' || model_status === 'WAIT') {
            alert('모델 생성 중입니다.');
            return false;
        }
        if (model_status === 'PREPARE') {
            alert('모셀을 생성할 수 없습니다. 삭제하고 다시 시도해주세요.');
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
            let params = {"modelSeq": $("#etcModelSeq").val()}
            let loss = getLoss(params);
            let chart_type = 'line';
            viewTypeDefault(chart_type, loss, 0, false, false);
        }
        $(window).trigger('resize');
        let etcModelType = document.querySelector('#etcModelType');
        if (etcModelType) {
            disabledResultTypeCase(etcModelType.value);
        }
    });

    /**
     * TODO 2025-03-13
     * */
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
        let etcModelType = document.querySelector('#etcModelType');
        if (etcModelType) {
            disabledResultTypeCase(etcModelType.value);
        }

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
        let etcModelType = document.querySelector('#etcModelType');
        if (etcModelType) {
            disabledResultTypeCase(etcModelType.value);
        }
    }
});




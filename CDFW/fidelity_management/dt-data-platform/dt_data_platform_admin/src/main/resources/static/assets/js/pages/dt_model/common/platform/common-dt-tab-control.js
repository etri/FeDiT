'use strict'

$(document).ready(function () {
    $(document).on('keydown', '#target_start_date', function () {
        $('#input_info_check').val('N');
    });

    $(document).on('keydown', '#target_end_date', function () {
        $('#input_info_check').val('N');
    });

    $(document).on('keydown', '#target_row_count', function () {
        $('#input_info_check').val('N');
    });

    $(document).on('input', 'input[type="number"]', function () {
        $('#input_info_check').val('N');
    });

    $(document).on('change', '#index_trgt_col', function () {
        $('#input_info_check').val('N');
    });

    $(document).on('click', '.prev-select-data-step', function () {
        //탭
        $('#tab_getdata').attr('class', 'nav-link active');
        $('#tab_info').attr('class', 'nav-link');
        $('#tab_column_info').attr('class', 'nav-link');
        $('#tab_preproc').attr('class', 'nav-link');
        $('#tab_getalgo').attr('class', 'nav-link');
        $('#tab_savemodel').attr('class', 'nav-link');

        //본문
        $('#tab_getdata_range').show();
        $('#tab_info_range').hide();
        $('#tab_column_info_range').hide();
        $('#tab_preproc_range').hide();
        $('#tab_getalgo_range').hide();
        $('#tab_savemodel_range').hide();
        $('#tab_preview_range').hide();

        //버튼
        $('#next_button_info_range').hide();
        $('#next_button_column_info_range').hide();
        $('#next_button_valiate_range').hide();

        //메뉴 완료 후 통합
        $('#csvUpRange2').empty();
        $('#dataSetInfoRange').empty();
        $('#dataSetStatisticsRange').empty();
        $('#dataSetHistogramRange').empty();
        $('#dataSetChartRange').empty();

        $('#input_info_check').val('N');

        document.querySelector('.next-dataset-info-step').style.display = 'none';
        document.querySelector('input[name="modelNm"]').value = '';
        document.querySelector('textarea[name="modelDerpn"]').value = '';
        document.querySelector('input[name="rlsYn"]').click();
        document.getElementById("index_trgt_col").value = '0';
    });

    $(document).on('click', '.prev-input-info-step', function () {
        if (confirm('지정한 컬럼이 초기화 됩니다?\n이전으로 이동하시겠습니까?')) {
            $('#tab_getdata').attr('class', 'nav-link');
            $('#tab_info').attr('class', 'nav-link active');
            $('#tab_column_info').attr('class', 'nav-link');
            $('#tab_preproc').attr('class', 'nav-link');
            $('#tab_getalgo').attr('class', 'nav-link');
            $('#tab_savemodel').attr('class', 'nav-link');

            //본문
            $('#tab_getdata_range').hide();
            $('#tab_info_range').show();
            $('#tab_column_info_range').hide();
            $('#tab_preproc_range').hide();
            $('#tab_getalgo_range').hide();
            $('#tab_savemodel_range').hide();
            $('#tab_preview_range').hide();

            //버튼
            $('#next_button_info_range').show();
            $('#next_button_valiate_range').hide();
            $('#next_button_column_info_range').show();
            $('#column_info_prev').show();
            $('#column_info_next').hide();

            //메뉴 완료 후 통합
            $('#csvUpRange2').empty();
            $('#csvUpRange3 .table-scroll-parent').empty();
            $('#dataSetInfoRange').empty();
            $('#dataSetStatisticsRange').empty();
            $('#dataSetHistogramRange').empty();
            $('#dataSetChartRange').empty();

            var preProcData = JSON.parse($('#preprocProPerty').val());
            preProcData.preproc_property_info[0].preproc_trgt_col = [];
            $('#preprocProPerty').val(JSON.stringify(preProcData));
            $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));
        }
    });

    $(document).on('click', '.prev-column-info-step', function () {
        if (confirm('이전으로 돌아가면 모든 전처리 설정이 초기화됩니다.\n돌아가시겠습니까?')) {
            $('#tab_getdata').attr('class', 'nav-link');
            $('#tab_info').attr('class', 'nav-link');
            $('#tab_column_info').attr('class', 'nav-link active');
            $('#tab_preproc').attr('class', 'nav-link');
            $('#tab_getalgo').attr('class', 'nav-link');
            $('#tab_savemodel').attr('class', 'nav-link');

            //본문
            $('#tab_getdata_range').hide();
            $('#tab_info_range').hide();
            $('#tab_column_info_range').show();
            $('#tab_preproc_range').hide();
            $('#tab_getalgo_range').hide();
            $('#tab_savemodel_range').hide();
            $('#tab_preview_range').hide();

            //버튼
            $('#next_button_info_range').hide();
            $('#next_button_column_info_range').show();
            $('#column_info_prev').show();
            //전처리에서 데이터현황으로 복귀 시 컬럼 선택·미리보기 표가 유지되므로 "다음"도 노출(곧바로 진행 가능)
            $('#column_info_next').show();
            $('#next_button_valiate_range').hide();

            /**
             * 2024-09-04
             * 전처리 프로세스에서 나가게 되면 모든 전처리 초기화 로직
             * */

                //전체 삭제
            let jsonData = JSON.parse($('#preprocProPerty').val());
            let file_path = jsonData.preproc_property_info[0].base_dir

            let propertyInfo = jsonData.preproc_property_info[0];
            let preprocProperty = propertyInfo.preproc_property;

            let filesToRemove = [];
            //전체 단계 삭제시
            for (var j = preprocProperty.length - 1; j >= 0; j--) {
                let property = preprocProperty[j];
                let setsToRemove = [];
                for (let k = 0; k < property.preproc_set.length; k++) {
                    filesToRemove.push(property.preproc_set[k].trgt_file_nm);
                    setsToRemove.push(k);
                }
                // 삭제할 요소들을 역순으로 순회하여 삭제
                for (let l = setsToRemove.length - 1; l >= 0; l--) {
                    property.preproc_set.splice(setsToRemove[l], 1);
                }
            }

            //프로세스 단계별 파일 삭제
            /**
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

            /**
             * 2024-09-04 Validate 초기화
             * */
            //Validate 결과 창 초기화
            preprocessValidateTabClear();

            //Outlier 결과 창 초기화
            preprocessOutlierTabClear();

            //Missing 결과 창 초기화
            preprocessMissingTabClear();

            //Resample 결과 창 초기화
            preprocessResampleTabClear();

            //Unit 결과 창 초기화
            preprocessUnitTabClear();
        }
    });

    //Validate 결과 창 초기화
    function preprocessValidateTabClear() {
        let preprocTableRangeValidate = document.querySelector('#preprocTableRangeValidate');
        preprocTableRangeValidate.innerHTML = '';
        preprocTableRangeValidate.style.display = 'none';
        let preprocTableExcludeRangeValidate = document.querySelector('#preprocTableExcludeRangeValidate');
        preprocTableExcludeRangeValidate.innerHTML = '';
        preprocTableExcludeRangeValidate.style.display = 'none';

        let newValue = '0';
        let select_valid_target_col = document.querySelector('#select_valid_target_col');
        if (select_valid_target_col) {
            let dropdownBox = select_valid_target_col.closest('.dropdown-box');
            let targetLabel = dropdownBox.querySelector(`#${select_valid_target_col.id}_selection label[for="input_${select_valid_target_col.id}_${newValue}"]`);
            targetLabel.click();
        }
        let select_valid_mater_tp = document.querySelector('#select_valid_mater_tp');
        if (select_valid_mater_tp) {
            let dropdownBox = select_valid_mater_tp.closest('.dropdown-box');
            let targetLabel = dropdownBox.querySelector(`#${select_valid_mater_tp.id}_selection label[for="input_${select_valid_mater_tp.id}_${newValue}"]`);
            targetLabel.click();
        }
        let select_valid_detail_tp = document.querySelector('#select_valid_detail_tp');
        if (select_valid_detail_tp) {
            let dropdownBox = select_valid_detail_tp.closest('.dropdown-box');
            let targetLabel = dropdownBox.querySelector(`#${select_valid_detail_tp.id}_selection label[for="input_${select_valid_detail_tp.id}_${newValue}"]`);
            targetLabel.click();
        }

        let valid_range_min = document.querySelector('#valid-range-min');
        let valid_range_max = document.querySelector('#valid-range-max');
        valid_range_min = 0;
        valid_range_max = 10;
        let float_valid_range_min = document.querySelector('#float-valid-range-min');
        let float_valid_range_max = document.querySelector('#float-valid-range-max');
        float_valid_range_min = 0;
        float_valid_range_max = 10;

        let select_valid_clear_tp = document.querySelector('#select_valid_clear_tp .valid-select-box');
        select_valid_clear_tp.selectedIndex = 0;

        let select_valid_range_type = document.querySelector('#select_valid_range_type');
        select_valid_range_type.style.display = 'none'
        select_valid_range_type.querySelectorAll('.col').forEach(function (element) {
            element.style.display = 'none';
        });
    }

    //Outlier 결과 창 초기화
    function preprocessOutlierTabClear() {
        let preprocTableRangeOutlier = document.querySelector('#preprocTableRangeOutlier');
        preprocTableRangeOutlier.innerHTML = '';
        preprocTableRangeOutlier.style.display = 'none';
        let preprocTableExcludeRangeOutlier = document.querySelector('#preprocTableExcludeRangeOutlier');
        preprocTableExcludeRangeOutlier.innerHTML = '';
        preprocTableExcludeRangeOutlier.style.display = 'none';

        let newValue = '0';
        let select_outlier_option = document.querySelector('#select_outlier_option');
        if (select_outlier_option) {
            let dropdownBox = select_outlier_option.closest('.dropdown-box');
            let targetLabel = dropdownBox.querySelector(`#${select_outlier_option.id}_selection label[for="input_${select_outlier_option.id}_${newValue}"]`);
            targetLabel.click();
        }

        let standardSection = document.querySelector('#outlier_standard_range');
        standardSection.querySelector('#freq').value = 10;
        standardSection.querySelector('#p_value').value = 0.05;

        let kMeanSection = document.querySelector('#outlier_kmean_range');
        kMeanSection.querySelector('#freq').value = 10;
        kMeanSection.querySelector('#n_clusters').value = 10;
        kMeanSection.querySelector('#n_count').value = 10;

        let dbScanSection = document.querySelector('#outlier_dbscan_range');
        dbScanSection.querySelector('#freq').value = 10;
        dbScanSection.querySelector('#eps').value = 0.1;
        dbScanSection.querySelector('#min_samples').value = 2;

        //AE Model Section
        let etcSection = document.querySelector('#outlier_etc_range');
        etcSection.querySelector('#window_size').value = 10;
        etcSection.querySelector('#threshold').value = 1.5;

        //Chart Section
        let standardChartSection = document.querySelector('#outlier_standard_chart_range_form_group');
        standardChartSection.style.display = 'none';
        standardChartSection.querySelector('#outlier_standard_chart_range').style.display = 'none';

        let kMeanChartSection = document.querySelector('#outlier_kmean_chart_range_form_group');
        kMeanChartSection.style.display = 'none';
        kMeanChartSection.querySelector('#outlier_kmean_chart_range').style.display = 'none';

        let dbScanChartSection = document.querySelector('#outlier_dbscan_chart_range_form_group');
        dbScanChartSection.style.display = 'none';
        dbScanChartSection.querySelector('#outlier_dbscan_chart_range').style.display = 'none';
    }

    //Missing 결과 창 초기화
    function preprocessMissingTabClear() {
        let preprocTableRangeMissing = document.querySelector('#preprocTableRangeMissing');
        preprocTableRangeMissing.innerHTML = '';
        preprocTableRangeMissing.style.display = 'none';
        let preprocTableExcludeRangeMissing = document.querySelector('#preprocTableExcludeRangeMissing');
        preprocTableExcludeRangeMissing.innerHTML = '';
        preprocTableExcludeRangeMissing.style.display = 'none';
        let newValue = '0';
        let select_interpolate = document.querySelector('#select_interpolate');
        if (select_interpolate) {
            let dropdownBox = select_interpolate.closest('.dropdown-box');
            let targetLabel = dropdownBox.querySelector(`#${select_interpolate.id}_selection label[for="input_${select_interpolate.id}_${newValue}"]`);
            targetLabel.click();
        }
    }

    //Resample 결과 창 초기화
    function preprocessResampleTabClear() {
        let preprocTableExcludeAddedRangeResample = document.querySelector('#preprocTableExcludeAddedRangeResample');
        preprocTableExcludeAddedRangeResample.innerHTML = '';
        preprocTableExcludeAddedRangeResample.style.display = 'none';
        let preprocTableExcludeRemovedRangeResample = document.querySelector('#preprocTableExcludeRemovedRangeResample');
        preprocTableExcludeRemovedRangeResample.innerHTML = '';
        preprocTableExcludeRemovedRangeResample.style.display = 'none';
        let preprocTableRangeResample = document.querySelector('#preprocTableRangeResample');
        preprocTableRangeResample.innerHTML = '';
        preprocTableRangeResample.style.display = 'none';
        let newValue = '0';
        let select_resample = document.querySelector('#select_resample');
        if (select_resample) {
            let dropdownBox = select_resample.closest('.dropdown-box');
            let targetLabel = dropdownBox.querySelector(`#${select_resample.id}_selection label[for="input_${select_resample.id}_${newValue}"]`);
            targetLabel.click();
        }

        let intervalTermSection = document.querySelector('#intvl_term');
        let intervalTermInput = intervalTermSection.querySelector('input.resmpl_intvl_value');
        intervalTermInput.value = null;
    }

    //Unit 결과 창 초기화
    function preprocessUnitTabClear() {
        let preprocTableRangeUnit = document.querySelector('#preprocTableRangeUnit');
        if (preprocTableRangeUnit) {
            preprocTableRangeUnit.innerHTML = '';
            preprocTableRangeUnit.style.display = 'none';
        }
        let newValue = '0';
        let select_unit_tp = document.querySelector('#select_unit_tp');
        if (select_unit_tp) {
            let dropdownBox = select_unit_tp.closest('.dropdown-box');
            let targetLabel = dropdownBox.querySelector(`#${select_unit_tp.id}_selection label[for="input_${select_unit_tp.id}_${newValue}"]`);
            targetLabel.click();
        }

        let select_unit_target_col = document.querySelector('#select_unit_target_col');
        if (select_unit_target_col) {
            let dropdownBox = select_unit_target_col.closest('.dropdown-box');
            let targetLabel = dropdownBox.querySelector(`#${select_unit_target_col.id}_selection label[for="input_${select_unit_target_col.id}_${newValue}"]`);
            targetLabel.click();
        }

        let unit_select_box_range = document.querySelector('#unit_select_box_range');
        if (unit_select_box_range) {
            unit_select_box_range.innerHTML = ``;
        }
    }

    $(document).on('click', '.prev-preproc-validate-step', function () {
        var preprocCurrent = $('#preprocCurrent').val('validate');
        makePropertyListHtml();
        $('#tab_getdata').attr('class', 'nav-link');
        $('#tab_info').attr('class', 'nav-link');
        $('#tab_column_info').attr('class', 'nav-link');
        $('#tab_preproc').attr('class', 'nav-link active');
        $('#tab_getalgo').attr('class', 'nav-link');
        $('#tab_savemodel').attr('class', 'nav-link');

        //본문
        $('#tab_getdata_range').hide();
        $('#tab_info_range').hide();
        $('#tab_column_info_range').hide();
        $('#tab_preproc_range').show();
        $('#tab_getalgo_range').hide();
        $('#tab_savemodel_range').hide();
        $('#tab_preview_range').hide();

        $('#inc_tab_validate').show();
        $('#inc_tab_outlier').hide();
        $('#inc_tab_missing').hide();
        $('#inc_tab_interval').hide();
        $('#inc_tab_unit').hide();
        $('#tab_validate').attr('class', 'nav-link active');
        $('#tab_outlier').attr('class', 'nav-link');
        $('#tab_missing').attr('class', 'nav-link');
        $('#tab_interval').attr('class', 'nav-link');
        $('#tab_unit').attr('class', 'nav-link');

        //버튼
        $('#next_button_info_range').hide();
        $('#next_button_column_info_range').hide();
        $('#next_button_valiate_range').show();
    });

    $(document).on('click', '.prev-preproc-outlier-step', function () {
        var preprocCurrent = $('#preprocCurrent').val('outlier');
        makePropertyListHtml();

        //탭
        $('#tab_getdata').attr('class', 'nav-link');
        $('#tab_info').attr('class', 'nav-link');
        $('#tab_column_info').attr('class', 'nav-link');
        $('#tab_preproc').attr('class', 'nav-link active');
        $('#tab_getalgo').attr('class', 'nav-link');
        $('#tab_savemodel').attr('class', 'nav-link');

        //본문
        $('#tab_getdata_range').hide();
        $('#tab_info_range').hide();
        $('#tab_column_info_range').hide();
        $('#tab_preproc_range').show();
        $('#tab_getalgo_range').hide();
        $('#tab_savemodel_range').hide();
        $('#tab_preview_range').hide();

        $('#inc_tab_validate').hide();
        $('#inc_tab_outlier').show();
        $('#inc_tab_missing').hide();
        $('#inc_tab_interval').hide();
        $('#inc_tab_unit').hide();
        $('#tab_validate').attr('class', 'nav-link');
        $('#tab_outlier').attr('class', 'nav-link active');
        $('#tab_missing').attr('class', 'nav-link');
        $('#tab_interval').attr('class', 'nav-link');
        $('#tab_unit').attr('class', 'nav-link');

        //버튼
        $('#next_button_info_range').hide();
        $('#next_button_column_info_range').hide();
        $('#next_button_outlier_range').show();


    });

    $(document).on('click', '.prev-preproc-interpolate-step', function () {
        var preprocCurrent = $('#preprocCurrent').val('interpolate');
        makePropertyListHtml();

        //탭
        $('#tab_getdata').attr('class', 'nav-link');
        $('#tab_info').attr('class', 'nav-link');
        $('#tab_column_info').attr('class', 'nav-link');
        $('#tab_preproc').attr('class', 'nav-link active');
        $('#tab_getalgo').attr('class', 'nav-link');
        $('#tab_savemodel').attr('class', 'nav-link');

        //본문
        $('#tab_getdata_range').hide();
        $('#tab_info_range').hide();
        $('#tab_column_info_range').hide();
        $('#tab_preproc_range').show();
        $('#tab_getalgo_range').hide();
        $('#tab_savemodel_range').hide();
        $('#tab_preview_range').hide();

        $('#inc_tab_validate').hide();
        $('#inc_tab_outlier').hide();
        $('#inc_tab_missing').show();
        $('#inc_tab_interval').hide();
        $('#inc_tab_unit').hide();
        $('#tab_validate').attr('class', 'nav-link');
        $('#tab_outlier').attr('class', 'nav-link');
        $('#tab_missing').attr('class', 'nav-link active');
        $('#tab_interval').attr('class', 'nav-link');
        $('#tab_unit').attr('class', 'nav-link');

        //버튼
        $('#next_button_info_range').hide();
        $('#next_button_column_info_range').hide();
        $('#next_button_interpolate_range').show();

    });

    $(document).on('click', '.prev-preproc-resample-step', function () {
        var preprocCurrent = $('#preprocCurrent').val('resample');
        makePropertyListHtml();

        //탭
        $('#tab_getdata').attr('class', 'nav-link');
        $('#tab_info').attr('class', 'nav-link');
        $('#tab_column_info').attr('class', 'nav-link');
        $('#tab_preproc').attr('class', 'nav-link active');
        $('#tab_getalgo').attr('class', 'nav-link');
        $('#tab_savemodel').attr('class', 'nav-link');

        //본문
        $('#tab_getdata_range').hide();
        $('#tab_info_range').hide();
        $('#tab_column_info_range').hide();
        $('#tab_preproc_range').show();
        $('#tab_getalgo_range').hide();
        $('#tab_savemodel_range').hide();
        $('#tab_preview_range').hide();

        $('#inc_tab_validate').hide();
        $('#inc_tab_outlier').hide();
        $('#inc_tab_missing').hide();
        $('#inc_tab_interval').show();
        $('#inc_tab_unit').hide();
        $('#tab_validate').attr('class', 'nav-link');
        $('#tab_outlier').attr('class', 'nav-link');
        $('#tab_missing').attr('class', 'nav-link');
        $('#tab_interval').attr('class', 'nav-link active');
        $('#tab_unit').attr('class', 'nav-link');


        //버튼
        $('#next_button_info_range').hide();
        $('#next_button_column_info_range').hide();
        $('#next_button_resample_range').show();

    });

    $(document).on('click', '.prev-preproc-unit-step', function () {
        var preprocCurrent = $('#preprocCurrent').val('unit');
        makePropertyListHtml();

        $('#tab_getdata').attr('class', 'nav-link');
        $('#tab_info').attr('class', 'nav-link');
        $('#tab_column_info').attr('class', 'nav-link');
        $('#tab_preproc').attr('class', 'nav-link active');
        $('#tab_getalgo').attr('class', 'nav-link');
        $('#tab_savemodel').attr('class', 'nav-link');

        //본문
        $('#tab_getdata_range').hide();
        $('#tab_info_range').hide();
        $('#tab_column_info_range').hide();
        $('#tab_preproc_range').show();
        $('#tab_getalgo_range').hide();
        $('#tab_savemodel_range').hide();
        $('#tab_preview_range').hide();

        $('#inc_tab_validate').hide();
        $('#inc_tab_outlier').hide();
        $('#inc_tab_missing').hide();
        $('#inc_tab_interval').hide();
        $('#inc_tab_unit').show();

        //버튼
        $('#next_button_info_range').hide();
        $('#next_button_column_info_range').hide();
        $('#next_button_unit_range').show();

    });
});

function disabledResultTypeCase() {
    let preProcData = JSON.parse($('#preprocProPerty').val());
    let model_property = preProcData.preproc_property_info[0].model_property[0];
    if (!model_property) {
        $('#tab_savemodel').attr('class', 'nav-link disabled');
        let shareCheck = $('#share').val() === 'true' ? true : false;
        if (shareCheck) {
            $('#tab_getalgo').attr('class', 'nav-link disabled');
        }
    }
}
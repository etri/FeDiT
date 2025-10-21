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
        //$('#view3').empty();

        $('#input_info_check').val('N');

        document.querySelector('.next-dataset-info-step').style.display = 'none';
        document.querySelector('input[name="etcModelNm"]').value = '';
        document.querySelector('textarea[name="etcModelDerpn"]').value = '';
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
            $('#next_button_column_info_range').hide();
            $('#next_button_valiate_range').hide();

            //메뉴 완료 후 통합
            $('#csvUpRange2').empty();
            $('#csvUpRange3 .table-scroll-parent').empty();
            $('#dataSetInfoRange').empty();
            $('#dataSetStatisticsRange').empty();
            $('#dataSetHistogramRange').empty();
            $('#dataSetChartRange').empty();

            let preProcData = JSON.parse($('#preprocProPerty').val());
            preProcData.preproc_property_info[0].preproc_trgt_col = [];
            $('#preprocProPerty').val(JSON.stringify(preProcData));
            $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));
        }


    });

    $(document).on('click', '.prev-column-info-step', function () {
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
        $('#next_button_valiate_range').hide();


        var preProcData = JSON.parse($('#preprocProPerty').val());
        preProcData.preproc_property_info[0].preproc_trgt_col = [];
        $('#preprocProPerty').val(JSON.stringify(preProcData));
        $('.preprocProPerty').val(prettyJson(JSON.stringify(preProcData)));

    });

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

function disabledResultTypeCase(modelType) {
    switch (modelType) {
        case 'auto encoder':
        case 'autoencoder':
        case 'ae':
        case 'Auto Encoder':
        case 'AutoEncoder':
        case 'AE':
            // Auto Encoder 관련 동작 수행 결과 사용
            break;
        default:
            // 기타 동작 결과 사용 불가
            $('#tab_savemodel').attr('class', 'nav-link disabled');
            break;
    }
}
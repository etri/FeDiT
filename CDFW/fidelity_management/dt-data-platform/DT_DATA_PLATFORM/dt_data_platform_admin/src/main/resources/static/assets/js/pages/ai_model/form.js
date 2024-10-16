(function () {
    'use strict'
    $(document).ready(function () {
        var form_type = $("#formType").val();
        var main_tab = getCookie('main_tab');
        var sub_tab = getCookie('sub_tab');

        $('#outlier_column_range').hide();
        $('#outlier_standard_range').hide();
        $('#outlier_dbscan_range').hide();
        $('#outlier_kmean_range').hide();

        $('#btn_make_outlier').hide();

        $(document).on('change', '#select_outlier_option', function () {
            //$('#outlierTable').hide();
            $('#tab_outlier_range2').hide();
            var select = $('#select_clusters_group');
            $('#n_clusters').val('');
            select.empty();

            var chartDiv = document.getElementById('view5');
            var chart = echarts.init(chartDiv);
            chart.clear();

            var optionVal = $("#select_outlier_option option:selected").val();
            $("#outlier_column_range option:eq(0)").prop("selected", true);

            if (optionVal == 'standard') {
                $('#outlier_standard_chart_range').show();
                $('#outlier_column_range').show();
                $('#btn_make_outlier').show();

                $('#outlier_standard_range').show();
                $('#outlier_dbscan_range').hide();
                $('#outlier_kmean_range').hide();
            } else if (optionVal == 'dbscan') {
                $('#outlier_column_range').show();
                $('#outlier_standard_chart_range').hide();
                $('#btn_make_outlier').show();

                $('#outlier_standard_range').hide();
                $('#outlier_dbscan_range').show();
                $('#outlier_kmean_range').hide();
            } else if (optionVal == 'kmean') {
                $('#outlier_column_range').show();
                $('#outlier_standard_chart_range').hide();
                $('#btn_make_outlier').show();

                $('#outlier_standard_range').hide();
                $('#outlier_dbscan_range').hide();
                $('#outlier_kmean_range').show();

                //select_outlier_option

                var placeholderValue = $("#n_clusters").attr("placeholder");
                $("#n_clusters").val(placeholderValue)
                $(".btn-clusters-group").trigger("click");

            } else {
                $('#outlier_standard_range').hide();
                $('#outlier_standard_chart_range').hide();
                $('#btn_make_outlier').hide();

                $('#outlier_standard_range').hide();
                $('#outlier_dbscan_range').hide();
                $('#outlier_kmean_range').hide();
            }

        });


        $('.btn-clusters-group').click(function () {
            var num = $('#n_clusters').val();
            var select = $('#select_clusters_group');
            // 기존 옵션 삭제
            select.empty();

            for (var i = 0; i < num; i++) {
                select.append('<option value="' + i + '">' + i + '</option>');
            }
        });


        $(document).on('change', '#select_clusters_group', function () {
            var outlier_target_col = $("#select_outlier_target_col option:selected").val();

            if (outlier_target_col == 0) {
                alert('컬럼을 선택하세요')
                return false;
            } else {
                $('#select_outlier_target_col').trigger('change');
            }

        });


        if (form_type == 'U') {
            //csvViewFile($("#originFilePath").val());

            if ($("#outLierFilePath").val().length > 0) {
                viewModel($("#outLierFilePath").val(), $("#modelSeq").val());
            } else if ($("#validateFilePath").val().length > 0) {
                viewModel($("#validateFilePath").val(), $("#modelSeq").val());
                //viewModel2($("#validateFilePath").val(), $("#modelSeq").val());
            } else {
                viewModel($("#originFilePath").val(), $("#modelSeq").val());
            }
            preprocResampleView(fileDirCheck($("#prcsLevel").val()), $("#modelSeq").val());
            makeAlgorithmMetaItemList($("#modelAlgrmSeq").val(), $("#modelSeq").val());

            $("#select_algorithm").val($("#modelAlgrmSeq").val()).prop("selected", true);


            //checkCsvIndexColumnTerm();

            if ($("#predictionFileListCount").val() > 0) {
                var params = {"modelSeq": $("#modelSeq").val()}
                var loss = getLoss(params);
                var fid = getFID(params);

                var data_params = {"modelSeq": $("#modelSeq").val(), "count": 100}
                var testData = getTestData(data_params);

                //console.log(loss);
                //console.log(fid);
                //console.log(testData);


                var chart_type = 'line';
                var isTool;

                $(document).on('change', '#select_epoch', function () {
                    var optionVal = $("#select_epoch option:selected").val();

                    $("#real_img").attr("src", optionVal);
                    $("#fake_img").attr("src", optionVal.replace('real', 'fake'));
                });

                $(document).on('change', '#select_data', function () {
                    var optionVal = $("#select_data option:selected").val();
                    data_params = {"modelSeq": $("#modelSeq").val(), "count": optionVal}
                    testData = getTestData(data_params);

                    //console.log(data_params);
                    //console.log(testData);

                    viewTypeDefault(chart_type, testData, 2, true, false, isTool = true);
                    getDataView(testData["data_test"], testData["data_test_header"], "data_test");
                    getDataView(testData["data_pred"], testData["data_pred_header"], "data_pred");
                });

                viewTypeDefault(chart_type, testData, 2, true, false, isTool = true);
                viewTypeDefault(chart_type, loss, 0, false, false);
                viewTypeDefault(chart_type, fid, 1, false, false);

                getDataView(testData["data_test"], testData["data_test_header"], "data_test");
                getDataView(testData["data_pred"], testData["data_pred_header"], "data_pred");
            }


            var select_index_val = $("#select_algorithm option:selected").val();

            if (select_index_val != 0) {
                var select_index_col = $("#select_algorithm option:selected").text();
                var algolithm_img = '/assets/images/algorithm/' + select_index_col + '.png';
                $("#algolithm_img_box").attr("src", algolithm_img);
            }

            var resampleOption = $('#select_resample option:selected').val();
            if (resampleOption == 'O' || resampleOption == '2Q' || resampleOption == 'Q') {
                $('#intvl_term').hide();
            } else {
                $('#intvl_term').show();

                if (form_type == 'I') {
                    $('.resmpl_intvl_value').val(1);
                }

            }

            main_tab == 'tab_getdata';

            /*
            let resizeTimeout;
            window.addEventListener('resize', function() {
              clearTimeout(resizeTimeout);
              resizeTimeout = setTimeout(function() {
                alert('윈도우 크기가 변경되었습니다.');
                // 추가 작업 수행
                eChart0.resize();
                eChart1.resize();
                eChart2.resize();
                eChart3.resize();
                eChart4.resize();

              }, 300); // 300ms 이내에 resize 이벤트가 여러 번 발생해도 마지막에 한 번만 실행됩니다.
            });
            */
        }

        $(document).on('change', '#customRange', function () {
            $('.custom-number-range').val($(this).val());
        });


        $(document).on('change', '#select_algorithm', function () {
            var model_algrm_seq = $("#select_algorithm option:selected").val();
            var model_seq = $("#modelSeq").val();

            var select_index_col = $("#select_algorithm option:selected").text();
            var algolithm_img = '/assets/images/algorithm/' + select_index_col + '.png';
            $("#algolithm_img_box").attr("src", algolithm_img);

            makeAlgorithmMetaItemList(model_algrm_seq, model_seq);


        });

        $(document).on('change', '#select_unit_cd1', function () {
            var select_unit_cd1 = $('#select_unit_cd1');
            var select_unit_cd2 = $('#select_unit_cd2');
            var index = select_unit_cd1.prop('selectedIndex');

            select_unit_cd2.find('option').eq(index).prop('selected', true);
        });

        $(document).on('change', '#select_unit_cd2', function () {
            var select_unit_cd1 = $('#select_unit_cd1');
            var select_unit_cd2 = $('#select_unit_cd2');
            var index = select_unit_cd2.prop('selectedIndex');

            select_unit_cd1.find('option').eq(index).prop('selected', true);
        });


        //attachFiles
        $("#attachFilesCsv").on('change', function (e) {
            deleteCookie('sub_tab');
            chgAddFilePc($(this), e);
        });

        $(document).on('click', '.btn-delete-upload', function () {
            $(this).closest('div.attach-file').remove();
            if ($('.attach-file-group .attach-file').length === 0) {
                addFileRow()
            }
        });

        $(document).on('click', '.btn-make-validate-reset', function () {
            var con = confirm('초기화를 하시겠습니까?');
            if (con == true) {
                resetProcTargetFileList(form_type, $('#modelSeq').val(), 'VALIDATE');
            } else {
                return false;
            }

        });

        $(document).on('click', '.btn-make-outlier-reset', function () {
            var con = confirm('초기화를 하시겠습니까?');
            if (con == true) {
                resetProcTargetFileList(form_type, $('#modelSeq').val(), 'OUTLIER');
            } else {
                return false;
            }

        });

        $(document).on('click', '.btn-make-resample-reset', function () {
            var con = confirm('초기화를 하시겠습니까?');
            if (con == true) {
                resetProcTargetFileList(form_type, $('#modelSeq').val(), 'RESAMPLE');
            } else {
                return false;
            }

        });

        $(document).on('click', '.btn-make-unit-reset', function () {
            var con = confirm('초기화를 하시겠습니까?');
            if (con == true) {
                resetProcTargetFileList(form_type, $('#modelSeq').val(), 'UNIT');
            } else {
                return false;
            }
        });


        $(document).on('click', '.next-preproc', function () {
            var modelNm = $('#modelNm').val();
            var fileCheck = document.getElementById("attachFilesCsv").value;
            if (modelNm.length == 0) {
                alert('모델명을 입력하세요');
                return false;
            }

            if (!fileCheck) {
                alert("파일을 업로드해 주세요");
                return false;
            }

            var select_index_col = $("#select_index_col option:selected").val();
            if (select_index_col == 0) {
                alert("시계열 필드를 선택해주세요. 선택 컬럼이 시계열이 아닐경우 진행이 불가합니다.");
                return false;
            }

            var encodedData = $("#uploadData").val();
            var jsonString = decodeURIComponent(encodedData);
            var jsonData = JSON.parse(jsonString);

            var dateColumn = select_index_col; // 파라미터로 넘어온 date 컬럼
            var valid = true;

            // 각 데이터 객체에서 date 값을 가져와서 체크
            for (var i = 0; i < jsonData.length; i++) {
                var dateValue = jsonData[i][dateColumn]; // 현재 객체의 date 컬럼 값
                var isTime = (new Date(dateValue) !== "Invalid Date" && !isNaN(new Date(dateValue)));

                if (!isTime) {
                    valid = false;
                    break;
                }
                /*
                if (isTime) {
                  console.log("Index " + i + " : " + dateColumn + " data is valid.");
                } else {
                  console.log("Index " + i + " : " + dateColumn + " data is not valid.");
                }
                */
            }

            if (!valid) {
                alert(dateColumn + " 컬럼은 시간데이터가 아닙니다. 다른 컬럼을 선택해주세요.");
                return false;
            } else {
                $('#indexTrgtCol').val(dateColumn);
            }

            var confirm_comment = '';

            if ($('#formType').val() == 'I') {
                confirm_comment = '데이터 전처리 페이지로 이동합니다.';
            } else {
                confirm_comment = '파일을 새로 등록시 기존 파일로 세팅된 값들은 모두 삭제 됩니다. 데이터 전처리 페이지로 이동하시겠습니까?';
            }

            var con = confirm(confirm_comment);
            if (con == true) {
                $('#interpolateFilePath').val('');
                $('#outLierFilePath').val('');
                $('#validateFilePath').val('');
                $('#resampleFilePath').val('');
                $('#unitFilePath').val('');

                if ($('#formType').val() == 'I') {
                    insertModel();
                } else {
                    //console.log('---update::::----')
                    updateModel();
                }

            } else {
                return false;
            }

        });


        $(document).on('change', '#chkAll', function () {
            //$('#chkAll').on('change', function(e) {
            $('input[name="columnArr"]').attr('checked', $(this).is(':checked'));
        });

        $(document).on('change', '#preproc_statistics', function () {
            var preproc_statistics = $("#preproc_statistics option:selected").val();

            var encodedData = $("#statisticsNode").val();
            var jsonString = decodeURIComponent(encodedData);
            var jsonData = JSON.parse(jsonString);

            makePreprocStatisticsTable(jsonData, preproc_statistics);

        });

        $(document).on('click', '.btn-make-interpolate', function () {
            //alert($("input[name='columnArr']:checked").length)
            var encodedData = $("#originData").val();
            //console.log(encodedData);
            var interpolateOption = $('#select_interpolate option:selected').val().toLowerCase();

            if (encodedData.length == 0) {
                alert('전처리 대상 데이터가 없습니다.');
                return false;
            }

            var jsonString = decodeURIComponent(encodedData);
            var jsonData = JSON.parse(jsonString);

            var confirm_comment = '';


            var originFilePath = $('#originFilePath').val();
            var interpolateFilePath = $('#interpolateFilePath').val();
            var outLierFilePath = $('#outLierFilePath').val();
            var validateFilePath = $('#validateFilePath').val();
            var resampleFilePath = $('#resampleFilePath').val();
            var unitFilePath = $('#unitFilePath').val();

            var finalFilePath = '';


            if ($('#formType').val() == 'I') {
                if (unitFilePath.length > 0 || resampleFilePath.length > 0) {
                    confirm_comment = 'Missing Value 이후 단계 작업 내역이 있습니다.\n변환시 해당 작업은 모두 초기화 됩니다.\n변환 하시겠습니까.';
                } else {
                    confirm_comment = '변환 하시겠습니까.';
                }
            } else {
                if (unitFilePath.length > 0 || resampleFilePath.length > 0) {
                    confirm_comment = 'Missing Value 이후 단계 작업 내역이 있습니다.\n변환시 해당 작업은 모두 초기화 됩니다.\n변환 하시겠습니까.';
                } else {
                    confirm_comment = '변환 하시겠습니까.';
                }
            }

            var con = confirm(confirm_comment);
            if (con == true) {
                var colArr = [];
                $('input[name="columnArr"]:checked').each(function () {
                    //console.log($('#preprocCheck' + $(this).val()).closest('tr').find('td:eq(1)').text())
                    colArr.push($('#preprocCheck' + $(this).val()).closest('tr').find('td:eq(0)').text());
                });

                //$('#outLierFilePath').val('');
                //$('#validateFilePath').val('');
                $('#resampleFilePath').val('');
                $('#unitFilePath').val('');

                //$('#tab_nan_table_range').hide();
                //$('#tab_nan_table_complete_range').text('변환이 완료 되었습니다.');
                //$('#tab_nan_table_complete_range').show();


                //선택컬럼으로 json다시 만듬
                //var newTargetJsonArr = [];
                //newTargetJsonArr = useInterpolateNewJson(jsonData, colArr);
                //console.log(newTargetJsonArr)
                var modelSeq = $('#modelSeq').val();
                makePreprocInterpolate(jsonData, interpolateOption, modelSeq)
            } else {
                return false;
            }


        });

        $(document).on('click', '.btn-delete', function () {
            if (confirm('모델을 삭제하시겠습니까?')) {
                var modelSeq = $(this).data('model-seq');
                var form = document.forms.deleteForm;
                form.modelSeq.value = modelSeq;
                form.submit();
            }
        });

        $(document).on('change', '#select_resample', function () {
            var resampleOption = $('#select_resample option:selected').val();
            if (resampleOption == 'O' || resampleOption == '2Q' || resampleOption == 'Q') {
                $('#intvl_term').hide();
            } else {
                $('#intvl_term').show();
            }

        });

        $(document).on('click', '.btn-make-resample', function () {
            var resampleOption = $('#select_resample option:selected').val();
            var modelSeq = $('#modelSeq').val();
            var interpolateFilePath = $('#interpolateFilePath').val();
            var interpolateOption = $('#interpolateOption').val();

            var originFilePath = $('#originFilePath').val();
            var outLierFilePath = $('#outLierFilePath').val();
            var validateFilePath = $('#validateFilePath').val();

            var resmpl_intvl_value = $('.resmpl_intvl_value').val();
            var unitFilePath = $('#unitFilePath').val();

            //var unitFilePath = $('#unitFilePath').val();
            //alert(interpolateFilePath);
            //alert(interpolateOption);

            var finalFilePath = '';

            var missingValueYn = $('#missingValueYn').val();
            var missingValueCompleteYn = $('#missingValueCompleteYn').val();


            if (interpolateFilePath.length > 0) {
                finalFilePath = interpolateFilePath;
            } else if (outLierFilePath.length > 0) {
                finalFilePath = outLierFilePath;
            } else if (validateFilePath.length > 0) {
                finalFilePath = validateFilePath;
            } else {
                finalFilePath = originFilePath;
            }

            //alert(finalFilePath);

            /*
            if (interpolateFilePath.length == 0) {
                alert('전처리 대상 데이터가 없습니다.');
                return false;
            }
            */

            if (missingValueCompleteYn == 'N') {
                alert('결측치가 존재할 경우 Missing Value 탭에서 변환작업을 먼저 진행 하셔야 합니다.');
                return false;
            }


            if (resmpl_intvl_value.length == 0) {
                alert('해당 간격 변환은 수치 입력이 필수입니다.');
                return false;
            }

            var confirm_comment = '';
            if ($('#formType').val() == 'I') {
                if (unitFilePath.length > 0) {
                    confirm_comment = 'Unit Conversion 단계 작업 내역이 있습니다.\n변환시 해당 작업은 모두 초기화 됩니다.\n변환 하시겠습니까.';
                } else {
                    confirm_comment = '변환 하시겠습니까.';
                }
            } else {
                if (unitFilePath.length > 0) {
                    confirm_comment = 'Unit Conversion 단계 작업 내역이 있습니다.\n변환시 해당 작업은 모두 초기화 됩니다.\n변환 하시겠습니까.';
                } else {
                    confirm_comment = '변환 하시겠습니까.';
                }
            }

            var con = confirm(confirm_comment);
            if (con == true) {
                $('#make_resample_status').val('Y');
                makePreprocResample(finalFilePath, interpolateOption, resampleOption, resmpl_intvl_value, modelSeq)
            } else {
                return false;
            }


        });

        $(document).on('change', '#select_valid_mater_tp', function () {
            var valid_tp = $("#select_valid_mater_tp option:selected").val();
            var strHTML = '';

            var data = {
                valid_tp: valid_tp
            }
            $.ajax({
                type: "POST",
                url: ' /ai/model/make/select_valid_detail_tp',
                data: JSON.stringify(data),
                contentType: "application/json; charset=utf-8;",
                dataType: "json",
                success: function (result) {
                    if (result.result_code == 200) {
                        $("#select_valid_detail_tp").children('option:not(:first)').remove();

                        $.each(result.valid_detail_tp, function (index, item) {
                            $("#select_valid_detail_tp").append('<option value=' + item.vrfc_seq + '>' + item.vrfc_nm + '</option>');
                        });
                    }
                },
                error: function (xhr, status, error) {
                    console.error('error : ', error);
                    alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                }
            });


            //makeUnitTypeSelectOopion(unit_tp);
        });


        $(document).on('change', '#select_unit_tp', function () {
            var unit_tp = $("#select_unit_tp option:selected").val();
            var strHTML = '';

            var data = {
                unit_tp: unit_tp
            }
            $.ajax({
                type: "POST",
                url: ' /ai/model/make/select_unit_tp',
                data: JSON.stringify(data),
                contentType: "application/json; charset=utf-8;",
                dataType: "json",
                success: function (result) {
                    if (result.result_code == 200) {
                        $('#unit_select_box_range').empty();
                        strHTML += '	<div style="display: inline-block;margin-right: 30px;">';
                        strHTML += '	<label>현재단위</label>';
                        strHTML += '	<select class="w-100 unit-select-box" id="select_unit_cd1">';
                        strHTML += '		<!-- <option th:each="item : ${unit_code_list}" th:value="${item.unit_cd_1}" th:text="${item.unit_nm_1}"></option> -->';
                        $.each(result.unit_tp_list, function (index, item1) {
                            strHTML += '					<option value=' + item1.unit_seq + '>' + item1.unit_nm_1 + '</option>';
                        });
                        strHTML += '	</select>';
                        strHTML += '	</div>';
                        strHTML += '	<div style="display: inline-block;margin-right: 30px;">';
                        strHTML += '	<label>변환단위</label>';
                        strHTML += '	<select class="w-100 unit-select-box" id="select_unit_cd2"style="width: 100px;">';
                        strHTML += '		<!-- <option th:each="item : ${unit_code_list}" th:value="${item.unit_cd_2}" th:text="${item.unit_nm_2}"></option> -->';
                        $.each(result.unit_tp_list, function (index, item2) {
                            strHTML += '					<option value=' + item2.unit_seq + '>' + item2.unit_nm_2 + '</option>';
                        });
                        strHTML += '	</select>';
                        strHTML += '	</div>';

                        $('#unit_select_box_range').append(strHTML);

                        /*
                        $.each(result.unit_tp_list, function(index, item2) {
                              strHTML += '					<option value=' + item2.code + '>' + item2.code_name + '</option>';
                          });
                          */
                    }
                },
                error: function (xhr, status, error) {
                    console.error('error : ', error);
                    alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                }
            });


            //makeUnitTypeSelectOopion(unit_tp);
        });

        $(document).on('change', '#preproc_histogram', function () {
            var preproc_histogram = $("#preproc_histogram option:selected").val();

            var encodedData = $("#rangeValueNode").val();
            var jsonString = decodeURIComponent(encodedData);

            var jsonData = JSON.parse(jsonString);
            //console.log(jsonData)
            makePreprocHistogramTable(jsonData, preproc_histogram);
            histogramView(preproc_histogram, jsonData);
        });

        $(document).on('change', '#select_outlier_target_col', function () {
            var outlier_type = $('#select_outlier_option option:selected').val();
            var outlier_target_col = $("#select_outlier_target_col option:selected").val();
            var index_target_col = $('#indexTrgtCol').val();

            var model_seq = $('#modelSeq').val();

            var freq = $('#freq').val();
            var p_value = $('#p_value').val();
            var eps = $('#eps').val();
            var min_samples = $('#min_samples').val();

            //var file_path = $('#fileList').val();

            var originFilePath = $('#originFilePath').val();
            var interpolateFilePath = $('#interpolateFilePath').val();
            var outLierFilePath = $('#outLierFilePath').val();
            var validateFilePath = $('#validateFilePath').val();
            var resampleFilePath = $('#resampleFilePath').val();
            var unitFilePath = $('#unitFilePath').val();


            var finalFilePath = '';

            //if (unitFilePath.length > 0) {
            //	finalFilePath = unitFilePath;
            //} else
            if (resampleFilePath.length > 0) {
                finalFilePath = resampleFilePath;
            } else if (interpolateFilePath.length > 0) {
                finalFilePath = interpolateFilePath;
            } else if (outLierFilePath.length > 0) {
                finalFilePath = outLierFilePath;
            } else if (validateFilePath.length > 0) {
                finalFilePath = validateFilePath;
            } else {
                finalFilePath = originFilePath;
            }

            var params = {
                outlier_type: outlier_type || null,
                model_seq: model_seq || null,
                file_path: finalFilePath || null,
                outlier_target_col: outlier_target_col || null,
                index_target_col: index_target_col || null,
                freq: freq || null,
                p_value: p_value || null,
                eps: eps || null,
                min_samples: min_samples || null,
                n_clusters: null,
                select_clusters_group: null
            };


            if (outlier_type == 'kmean') {
                var n_clusters = $('#n_clusters').val();
                var select_clusters_group = $("#select_clusters_group option:selected").val();

                if (n_clusters == '') {
                    alert('clusters 수에 숫자값을 입력하시고 SET버튼을 눌러주세요');
                    //$("#select_outlier_target_col option:eq(0)").prop("selected", true);
                    return false;
                }

                if (typeof select_clusters_group == 'undefined') {
                    alert('clusters 수에 숫자값을 입력하시고 SET버튼을 눌러주세요');
                    $("#select_outlier_target_col option:eq(0)").prop("selected", true);
                    return false;
                }

                params.n_clusters = n_clusters;
                params.select_clusters_group = select_clusters_group;
            }

            //var result_data = standardOutlierResult(model_seq, finalFilePath, freq, p_value, outlier_target_col, index_target_col);
            var result_data = outlierInfoResult(params);

            if (outlier_type === 'standard') {
                if (result_data.hist !== '') {
                    //var jsonData = JSON.parse(result_data);
                    $('#tab_outlier_range2').show();
                    outLierHistogramView(outlier_target_col, result_data.hist);
                    outLierResultTableView("outlier_table", result_data.info);
                } else {
                    //alert("컬럼에 문자열이 포함되어 있습니다. validate탭에서 변환작업을 진행하세요");
                    alert(result_data.info);
                    $("#select_outlier_target_col option:eq(0)").prop("selected", true);
                    var chartDiv = document.getElementById('view5');
                    var chart = echarts.init(chartDiv);
                    chart.clear();
                    $('#tab_outlier_range2').hide();
                }
            } else {
                $('#tab_outlier_range2').show();
                var chartDiv = document.getElementById('view5');
                var chart = echarts.init(chartDiv);
                chart.clear();

                if (result_data.hist !== '') {
                    outLierResultTableView("outlier_table", result_data.info);
                } else {
                    alert(result_data.info);
                    $("#select_outlier_target_col option:eq(0)").prop("selected", true);
                    $('#tab_outlier_range2').hide();
                    return false;
                }

            }


        });

        function outLierResultTableView(id, jsonData) {
            var firstKey = Object.keys(jsonData)[0];  // 첫 번째 key 가져오기
            var rowCount = jsonData[firstKey].length;


            var strHTML = '<div class="table-responsive2">';
            strHTML += ' <table class="table" id="outlierTable">';

            strHTML += '<thead><tr>';

            // JSON 데이터의 각 key를 테이블의 컬럼 제목으로 추가
            for (var key in jsonData) {
                if (jsonData.hasOwnProperty(key)) {
                    strHTML += '<th>' + key + '</th>';
                }
            }

            strHTML += '</tr></thead>';
            strHTML += '<tbody>';

            // 테이블 내용 생성
            for (var i = 0; i < rowCount; i++) {
                strHTML += '<tr>';
                for (var key in jsonData) {
                    if (jsonData.hasOwnProperty(key)) {
                        var value = jsonData[key][i];
                        strHTML += '<td>' + value + '</td>';
                    }
                }
                strHTML += '</tr>';
            }

            strHTML += '</tbody>';
            strHTML += '</table>';

            strHTML += '</div>';

            // 생성한 HTML을 div에 삽입
            //document.getElementById(id).innerHTML = tableHTML;
            //alert(strHTML);
            //$('#outlier_table').append(strHTML);

            $('#' + id).html(strHTML);

            $('#outlierTable').DataTable({
                "destroy": true,
                "order": [[0, "asc"]],
                "searching": false,
                "info": false,
                "lengthChange": false,
                "autoWidth": false
            });

        }


        $(document).on('click', '.btn-make-unit', function () {
            var unit_target_col = $("#select_unit_target_col option:selected").val();
            var unit_tp = $("#select_unit_tp option:selected").val();
            var unit_cd1 = $("#select_unit_cd1 option:selected").val();
            var unit_cd2 = $("#select_unit_cd2 option:selected").val();

            if (unit_target_col == 0) {
                alert('변환할 컬럼을 선택하세요.');
                return false;
            }

            if (unit_tp == 0) {
                alert('변환 유형을 선택하세요.');
                return false;
            }

            var modelSeq = $('#modelSeq').val();
            var missingValueCompleteYn = $('#missingValueCompleteYn').val();
            var originFilePath = $('#originFilePath').val();
            var interpolateFilePath = $('#interpolateFilePath').val();
            var outLierFilePath = $('#outLierFilePath').val();
            var validateFilePath = $('#validateFilePath').val();
            var resampleFilePath = $('#resampleFilePath').val();
            var unitFilePath = $('#unitFilePath').val();


            var finalFilePath = '';

            //if (unitFilePath.length > 0) {
            //	finalFilePath = unitFilePath;
            //} else
            if (resampleFilePath.length > 0) {
                finalFilePath = resampleFilePath;
            } else if (interpolateFilePath.length > 0) {
                finalFilePath = interpolateFilePath;
            } else if (outLierFilePath.length > 0) {
                finalFilePath = outLierFilePath;
            } else if (validateFilePath.length > 0) {
                finalFilePath = validateFilePath;
            } else {
                finalFilePath = originFilePath;
            }

            if (missingValueCompleteYn == 'N') {
                alert('결측치가 존재할 경우 Missing Value 탭에서 변환작업을 먼저 진행 하셔야 합니다.');
                return false;
            }

            //alert(missingValueCompleteYn)

            var confirm_comment = '';

            if ($('#formType').val() == 'I') {
                confirm_comment = '변환 하시겠습니까.';
            } else {
                confirm_comment = '기존 변환 파일이 있을 경우 삭제 후 다시 변환이 진행 됩니다. 진행 하시겠습니까?';
            }


            var con = confirm(confirm_comment);
            if (con == true) {
                $('#make_unit_status').val('Y');
                makePreprocUnit(finalFilePath, originFilePath, modelSeq, unit_target_col, unit_tp, unit_cd1, unit_cd2)
            } else {
                return false;
            }


        });

        $(document).on('click', '.info-update', function () {
            if (confirm('수정 하시겠습니까?')) {
                var form = document.forms.editForm;
                form.submit();
            }
        });


        //$('input[name="outputCol"]').click(function() {
        $(document).on('click', 'input[name="outputCol"]', function () {
            var output_check = $('input[type="checkbox"][name="outputCol"]');
            var feature_check = $('input[type="checkbox"][name="featureCol"]');

            for (var i = 0; i < output_check.length; i++) {
                if (output_check[i].checked) {
                    if (feature_check[i].checked) {
                        alert('독립변수에 동일한 값이 체크 되어 있습니다.');
                        return false;
                    }
                }
            }
        });


        $(document).on('click', 'input[name="featureCol"]', function () {
            var output_check = $('input[type="checkbox"][name="outputCol"]');
            var feature_check = $('input[type="checkbox"][name="featureCol"]');

            for (var i = 0; i < feature_check.length; i++) {
                if (feature_check[i].checked) {
                    if (output_check[i].checked) {
                        alert('종속변수에 동일한 값이 체크 되어 있습니다.');
                        return false;
                    }
                }
            }
        });


        $(document).on('click', '.next-preproc-step', function () {
            main_tab = getCookie('main_tab');
            sub_tab = getCookie('sub_tab');

            if (main_tab == 'tab_getdata') {
                $("#tab_preproc").trigger("click");
                $("#tab_validate").trigger("click");
            }
            if (main_tab == 'tab_preproc') {
                $("#tab_validate").trigger("click");
            }

            if (sub_tab == 'tab_validate' || sub_tab == '') {
                $("#tab_missing").trigger("click");
            }
            if (sub_tab == 'tab_missing') {
                $("#tab_outlier").trigger("click");
            }
            if (sub_tab == 'tab_outlier') {
                $("#tab_interval").trigger("click");
            }
            if (sub_tab == 'tab_interval') {
                $("#tab_unit").trigger("click");
            }
            if (sub_tab == 'tab_unit') {
                $("#tab_validate").trigger("click");
            }
        });

        $(document).on('click', '.prev-preproc-step', function () {
            main_tab = getCookie('main_tab');
            sub_tab = getCookie('sub_tab');

            if (main_tab == 'tab_getdata') {
                $("#tab_preproc").trigger("click");
                $("#tab_validate").trigger("click");
            }
            if (main_tab == 'tab_preproc') {
                $("#tab_validate").trigger("click");
            }

            if (sub_tab == 'tab_validate' || sub_tab == '') {
                $("#tab_unit").trigger("click");
            }
            if (sub_tab == 'tab_missing') {
                $("#tab_validate").trigger("click");
            }
            if (sub_tab == 'tab_outlier') {
                $("#tab_missing").trigger("click");
            }
            if (sub_tab == 'tab_interval') {
                $("#tab_outlier").trigger("click");
            }
            if (sub_tab == 'tab_unit') {
                $("#tab_interval").trigger("click");
            }
        });


        $(document).on('click', '.btn-next-algorithm', function () {
            var model_seq = $('#modelSeq').val();

            var make_resample_status = $('#make_resample_status').val();
            var missingValueYn = $('#missingValueYn').val();
            var missingValueCompleteYn = $('#missingValueCompleteYn').val();
            var validCompleteYn = $('#validCompleteYn').val();
            console.log('validCompleteYn', validCompleteYn);
            //if (missingValueCompleteYn == 'N' || validCompleteYn == 'N' ) {
            if (missingValueCompleteYn == 'N') {
                alert('결측치가 존재할 경우 Missing Value 탭에서 변환작업을 먼저 진행 하셔야 합니다.');
                return false;
            } else {
                //$("#tab_getalgo").trigger("click");
                //alert('알고리즘 프로세스')

                if ($('input[name="columnArr"]:checked').length === 0) {
                    alert('사용할 컬럼을 선택하세요');
                    return false;
                }

                var originFilePath = $('#originFilePath').val();
                var interpolateFilePath = $('#interpolateFilePath').val();
                var outLierFilePath = $('#outLierFilePath').val();
                var validateFilePath = $('#validateFilePath').val();
                var resampleFilePath = $('#resampleFilePath').val();
                var unitFilePath = $('#unitFilePath').val();


                var finalFilePath = '';

                if (unitFilePath.length > 0) {
                    finalFilePath = unitFilePath;
                } else if (resampleFilePath.length > 0) {
                    finalFilePath = resampleFilePath;
                } else if (interpolateFilePath.length > 0) {
                    finalFilePath = interpolateFilePath;
                } else if (outLierFilePath.length > 0) {
                    finalFilePath = outLierFilePath;
                } else if (validateFilePath.length > 0) {
                    finalFilePath = validateFilePath;
                } else {
                    finalFilePath = originFilePath;
                }

                //console.log('---알고리즘---');
                //console.log(finalFilePath);

                var hasObjectColumn = false;

                $('input[name="columnArr"]:checked').each(function () {
                    //checkHeader.push($('#preprocCheck' + $(this).val()).closest('tr').find('td:eq(0)').text());
                    var row = $(this).closest('tr');

                    /*
                    checkHeader.push(row.find('td:eq(0)').text());
                    typeHeader.push(row.find('td:eq(1)').text());
                    classHeader.push(row.find('.preproc_statistics option:selected').val());
                    checkHeaderSeq.push(row.find('td:eq(9)').text());
                    */

                    //alert(row.find('td:eq(1)').text())
                    if (row.find('td:eq(1)').text() == 'object') {
                        alert('체크하신 값중  object 인 컬럼이 있습니다. 검증탭에서 전처리 후 진행하시거나 제외하고 선택해주세요');
                        hasObjectColumn = true;
                        return false;
                    }

                });

                if (!hasObjectColumn) {
                    var con = confirm('알고리즘 선택 페이지로 이동하시겠습니까?');
                    if (con == true) {
                        makeAlgorithm(finalFilePath, model_seq);
                        $("#tab_getalgo").trigger("click");
                    } else {
                        return false;
                    }
                }

            }


            /*
            if (make_resample_status == 'N') {
                alert('변환 작업을 먼저 진행해주세요.');
                return false;
            } else {
                 $("#tab_getalgo").trigger("click");
            }
            */

        });

        $(document).on('click', '.make-model', function () {
            //console.log(JSON.parse($('#algorithm_meta_set').val()));
            //console.log(valid_arr);
            //console.log(algorithmMetaItemList);

            /*
            var resampleFilePath = $('#resampleFilePath').val();
            if (resampleFilePath.length == 0) {
                alert('전처리 대상 데이터가 없습니다.');
                return false;
            }
            */

            var menuCd = $('#menuCd').val();

            var select_algorithm = $("#select_algorithm option:selected").val();
            if (select_algorithm == 'none') {
                alert('알고리즘을 선택하세요.');
                return false;
            }

            var algorithmMetaItemList = JSON.parse($('#algorithm_meta_set').val());
            var model_seq = $('#modelSeq').val();

            var vrfc_data_sz = $('#dataSize').val();

            if (typeof vrfc_data_sz !== 'undefined') {
                vrfc_data_sz = $('#dataSize').val();
            } else {
                vrfc_data_sz = null;
            }

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

            var file_list = $('#fileList').val();
            var output_col = $('input[name="outputCol"]:checked').map(function () {
                return this.value;
            }).get();
            var feature_col = $('input[name="featureCol"]:checked').map(function () {
                return this.value;
            }).get();

            if (output_col.length == 0) {
                alert('종속변수를 선택하세요');
                return false;
            }


            var duplicates = output_col.filter(function (value) {
                return feature_col.indexOf(value) !== -1;
            });

            if (duplicates.length > 0) {
                alert('종속변수와 독립변수는 중복으로 선택 할 수 없습니다.');
                return false;
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


            var originFilePath = $('#originFilePath').val();
            var interpolateFilePath = $('#interpolateFilePath').val();
            var outLierFilePath = $('#outLierFilePath').val();
            var validateFilePath = $('#validateFilePath').val();
            var resampleFilePath = $('#resampleFilePath').val();
            var unitFilePath = $('#unitFilePath').val();


            var finalPrcsLevel = '';

            if (unitFilePath.length > 0) {
                finalPrcsLevel = 'UNIT';
            } else if (resampleFilePath.length > 0) {
                finalPrcsLevel = 'RESAMPLE';
            } else if (interpolateFilePath.length > 0) {
                if (interpolateFilePath == originFilePath) {
                    finalPrcsLevel = 'ORIGIN';
                } else {
                    finalPrcsLevel = 'INTERPOLATE';
                }
            } else if (outLierFilePath.length > 0) {
                finalPrcsLevel = 'OUTLIER';
            } else if (validateFilePath.length > 0) {
                finalPrcsLevel = 'VALIDATE';
            } else {
                finalPrcsLevel = 'ORIGIN';
            }

            let check_data = {
                model_seq: modelSeq,
                process: finalPrcsLevel
            }
            $.ajax({
                type: "POST",
                url: '/ai/model/check/process/file',
                data: JSON.stringify(check_data),
                contentType: "application/json; charset=utf-8;",
                dataType: "json",
                success: function (result) {
                    console.log('result', result);
                    if (result.result_code == 200) {
                        /**
                         * 읽은 파일의 데이터들 중 빈 값이 없음
                         * */

                        var confirm_comment;

                        if (feature_col.length == 0) {
                            confirm_comment = '독립변수를 체크 하지 않을 경우 종속변수만 적용되어 모델이 생성됩니다.\n등록 이후 수정이 불가합니다.\n등록 하시겠습니까?';
                        } else {
                            confirm_comment = '등록 이후 수정이 불가합니다.\n등록 하시겠습니까?';
                        }

                        if (feature_col.length == 0) {
                            feature_col = null;
                        }

                        var con = confirm(confirm_comment);
                        if (con == true) {
                            var data = {
                                model_seq: modelSeq,
                                algorithm: algorithm,
                                algorithm_seq: algorithm_seq,
                                algorithm_meta_item_list: algorithmMetaItemList,
                                file_list: file_list,
                                output_col: output_col,
                                feature_col: feature_col,
                                prcs_level: finalPrcsLevel,
                                vrfc_data_sz: vrfc_data_sz
                            }
                            console.log('data', data);
                            $.ajax({
                                type: "POST",
                                url: ' /ai/model/make/model_set',
                                data: JSON.stringify(data),
                                contentType: "application/json; charset=utf-8;",
                                dataType: "json",
                                success: function (result) {
                                    if (result.result_code == 200) {
                                        //alert(result.result_code);
                                        //console.log(result.item_list);
                                        window.location.href = contextPath + "/ai/model/list?menuCd=" + menuCd;
                                    }
                                },
                                error: function (xhr, status, error) {
                                    console.error('error : ', error);
                                    alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                                }
                            });
                        } else {
                            return false;
                        }
                    } else {
                        /**
                         * 읽은 파일의 데이터들 중 빈 값이 있음
                         * */
                        alert('등록하고자 하는 데이터에 빈값이 있습니다. 결측 처리를 진행해주세요.(Missing Value)');
                    }
                },
                error: function (xhr, status, error) {
                    console.error('error : ', error);
                    alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                }
            });
        });


        /*
        $(document).on('keyup', '.optimizer-number-chk', function() {
        	var value = parseFloat($(this).val());
            
        	if (isNaN(value) || value <= 0.00000001 || value >= 1) {
        		alert("1보다 크거나 문자열을 넣을수 없습니다.");
        		$(this).val("0.0005"); // 기본값으로 조정
        	}
        });
        */

        $(document).on('change', '#select_valid_target_col', function () {
            $('#select_valid_clear_tp').hide();
            $('#btn_make_valid').hide();
        });

        $(document).on('change', '#select_valid_mater_tp', function () {
            $('#select_valid_clear_tp').hide();
            $('#btn_make_valid').hide();
        });

        $(document).on('change', '#select_valid_detail_tp', function () {
            $('#select_valid_clear_tp').hide();
            $('#btn_make_valid').hide();
        });


        $(document).on('click', '.btn-view-valid-info', function () {
            var valid_target_col = $("#select_valid_target_col option:selected").val();
            var valid_mater_tp = $("#select_valid_mater_tp option:selected").val();
            var valid_detail_tp = $("#select_valid_detail_tp option:selected").val();
            var valid_clear_tp = $("#select_valid_clear_tp option:selected").val();

            var modelSeq = $('#modelSeq').val();
            var originFilePath = $('#originFilePath').val();
            var indexTrgtCol = $('#indexTrgtCol').val();

            if (valid_target_col == 0) {
                alert('컬럼을 선택하세요');
                return false;
            }

            if (valid_mater_tp == 0) {
                alert('1단계 형식을 선택하세요');
                return false;
            }

            if (valid_detail_tp == 0) {
                alert('2단계 형식을 선택하세요');
                return false;
            }

            /*
            if (valid_clear_tp == 0) {
                alert('3단계 형식을 선택하세요');
                return false;
            }
            */

            var strHTML = "";

            var data = {
                file_path: originFilePath,
                verifyColumn: valid_target_col,
                verifyType: valid_detail_tp,
                clearType: valid_clear_tp,
                index_trgt_col: indexTrgtCol,
                model_seq: modelSeq
            }
            $.ajax({
                type: "POST",
                async: false,
                url: ' /ai/model/make/valid_view_set',
                data: JSON.stringify(data),
                contentType: "application/json; charset=utf-8;",
                dataType: "json",
                success: function (result) {
                    if (result.result_code == 200) {

                        strHTML += '<br/><span  style="color: red;">' + result.data + '</span>';

                    } else {
                        alert('API 내 에러 발생');
                    }
                },
                error: function (xhr, status, error) {
                    console.error('error : ', error);
                    alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                }
            });

            $('#valid_table_range').html(strHTML);

            $('#select_valid_clear_tp').show();
            $('#btn_make_valid').show();

        });

        $(document).on('click', '.btn-make-valid', function () {
            var valid_target_col = $("#select_valid_target_col option:selected").val();
            var valid_mater_tp = $("#select_valid_mater_tp option:selected").val();
            var valid_detail_tp = $("#select_valid_detail_tp option:selected").val();
            var valid_clear_tp = $("#select_valid_clear_tp option:selected").val();

            var modelSeq = $('#modelSeq').val();
            var originFilePath = $('#originFilePath').val();
            var indexTrgtCol = $('#indexTrgtCol').val();

            if (valid_target_col == 0) {
                alert('컬럼을 선택하세요');
                return false;
            }

            if (valid_mater_tp == 0) {
                alert('1단계 형식을 선택하세요');
                return false;
            }

            if (valid_detail_tp == 0) {
                alert('2단계 형식을 선택하세요');
                return false;
            }

            if (valid_clear_tp == 0) {
                alert('3단계 형식을 선택하세요');
                return false;
            }


            var confirm_comment = '';
            var originFilePath = $('#originFilePath').val();
            var interpolateFilePath = $('#interpolateFilePath').val();
            var outLierFilePath = $('#outLierFilePath').val();
            var validateFilePath = $('#validateFilePath').val();
            var resampleFilePath = $('#resampleFilePath').val();
            var unitFilePath = $('#unitFilePath').val();

            var finalFilePath = '';

            if (outLierFilePath.length > 0) {
                finalFilePath = outLierFilePath;
            } else if (validateFilePath.length > 0) {
                finalFilePath = validateFilePath;
            } else {
                finalFilePath = originFilePath;
            }

            if ($('#formType').val() == 'I') {
                if (unitFilePath.length > 0 || resampleFilePath.length > 0 || interpolateFilePath.length > 0 || outLierFilePath.length > 0) {
                    confirm_comment = 'validate 이후 단계 작업 내역이 있습니다.\n변환시 해당 작업은 모두 초기화 됩니다.\n변환 하시겠습니까.';
                } else {
                    confirm_comment = '변환 하시겠습니까.';
                }
            } else {
                if (unitFilePath.length > 0 || resampleFilePath.length > 0 || interpolateFilePath.length > 0 || outLierFilePath.length > 0) {
                    confirm_comment = 'validate 이후 단계 작업 내역이 있습니다.\n변환시 해당 작업은 모두 초기화 됩니다.\n변환 하시겠습니까.';
                } else {
                    confirm_comment = '변환 하시겠습니까.';
                }
            }


            var con = confirm(confirm_comment);

            if (con == true) {

                $('#outLierFilePath').val('');
                $('#interpolateFilePath').val('');
                $('#resampleFilePath').val('');
                $('#unitFilePath').val('');
                $('#tab_nan_table_range').show();
                //$('#tab_nan_table_complete_range').text('변환이 완료 되었습니다.');
                $('#tab_nan_table_complete_range').hide();


                var data = {
                    file_path: originFilePath,
                    verifyColumn: valid_target_col,
                    verifyType: valid_detail_tp,
                    clearType: valid_clear_tp,
                    index_trgt_col: indexTrgtCol,
                    model_seq: modelSeq
                }
                $.ajax({
                    type: "POST",
                    async: false,
                    url: '/ai/model/make/valid_set',
                    data: JSON.stringify(data),
                    contentType: "application/json; charset=utf-8;",
                    dataType: "json",
                    success: function (result) {
                        if (result.result_code == 200) {
                            $('#validateFilePath').val(result.validate_file_path);
                            alert("완료되었습니다.");
                            var validateFilePath = result.validate_file_path;
                            makePreprocNanFinishDataValid(validateFilePath, modelSeq, indexTrgtCol);
                            //$('#validCompleteYn').val('Y');
                            /*
                            var validateFilePath = result.validate_file_path;
                            if (validateFilePath.length > 0) {
                                $('#tab_missing_table_range_valid_object').html('');
                                //$('#tab_nan_table_complete_range').text('변환이 완료 되었습니다.');
                                makePreprocNanFinishDataValid(validateFilePath, modelSeq, indexTrgtCol);
                            }
                            */

                        } else {
                            alert('API 내 에러 발생');
                        }
                    },
                    error: function (xhr, status, error) {
                        console.error('error : ', error);
                        alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                    }
                });

                $('#valid_table_range').html('');


            } else {
                return false;
            }


        });


        $(document).on('click', '.btn-make-outlier', function () {
            var outlier_type = $('#select_outlier_option option:selected').val();
            var outlier_target_col = $('#select_outlier_target_col option:selected').val();
            var freq = $('#freq').val();
            var p_value = $('#p_value').val();

            var modelSeq = $('#modelSeq').val();
            var originFilePath = $('#originFilePath').val();
            var indexTrgtCol = $('#indexTrgtCol').val();

            var eps = $('#eps').val();
            var min_samples = $('#min_samples').val();

            if (outlier_target_col == 0) {
                alert('컬럼을 선택하세요');
                return false;
            }

            var encodedData = $("#originData").val();
            if (encodedData.length == 0) {
                alert('전처리 대상 데이터가 없습니다.');
                return false;
            }

            var jsonString = decodeURIComponent(encodedData);
            var jsonData = JSON.parse(jsonString);

            var confirm_comment = '';
            var originFilePath = $('#originFilePath').val();
            var interpolateFilePath = $('#interpolateFilePath').val();
            var outLierFilePath = $('#outLierFilePath').val();
            var validateFilePath = $('#validateFilePath').val();
            var resampleFilePath = $('#resampleFilePath').val();
            var unitFilePath = $('#unitFilePath').val();

            var finalFilePath = '';

            if (outLierFilePath.length > 0) {
                finalFilePath = outLierFilePath;
            } else if (validateFilePath.length > 0) {
                finalFilePath = validateFilePath;
            } else {
                finalFilePath = originFilePath;
            }

            if ($('#formType').val() == 'I') {
                if (unitFilePath.length > 0 || resampleFilePath.length > 0 || interpolateFilePath.length > 0) {
                    confirm_comment = 'Outlier 이후 단계 작업 내역이 있습니다.\n변환시 해당 작업은 모두 초기화 됩니다.\n변환 하시겠습니까.';
                } else {
                    confirm_comment = '변환 하시겠습니까.';
                }
            } else {
                if (unitFilePath.length > 0 || resampleFilePath.length > 0 || interpolateFilePath.length > 0) {
                    confirm_comment = 'Outlier 이후 단계 작업 내역이 있습니다.\n변환시 해당 작업은 모두 초기화 됩니다.\n변환 하시겠습니까.';
                } else {
                    confirm_comment = '변환 하시겠습니까.';
                }
            }

            var params = {
                outlier_type: outlier_type || null,
                model_seq: modelSeq || null,
                file_path: finalFilePath || null,
                outlier_target_col: outlier_target_col || null,
                index_trgt_col: indexTrgtCol || null,
                freq: freq || null,
                p_value: p_value || null,
                eps: eps || null,
                min_samples: min_samples || null,
                n_clusters: null,
                select_clusters_group: null
            };


            if (outlier_type === 'kmean') {
                var n_clusters = $('#n_clusters').val();
                var select_clusters_group = $("#select_clusters_group option:selected").val();

                if (n_clusters == '') {
                    alert('clusters 수에 숫자값을 입력하시고 SET버튼을 눌러주세요');
                    //$("#select_outlier_target_col option:eq(0)").prop("selected", true);
                    return false;
                }

                if (typeof select_clusters_group == 'undefined') {
                    alert('clusters 수에 숫자값을 입력하시고 SET버튼을 눌러주세요');
                    $("#select_outlier_target_col option:eq(0)").prop("selected", true);
                    return false;
                }

                params.n_clusters = n_clusters;
                params.select_clusters_group = select_clusters_group;
            }


            var con = confirm(confirm_comment);

            if (con === true) {

                $('#interpolateFilePath').val('');
                //$('#validateFilePath').val('');
                $('#resampleFilePath').val('');
                $('#unitFilePath').val('');

                var data = {
                    //file_path: finalFilePath,
                    //outlier_target_col: outlier_target_col,
                    //freq: freq,
                    //p_value: p_value,
                    //index_trgt_col: indexTrgtCol,
                    //model_seq: modelSeq
                    outlier_type: params.outlier_type,
                    model_seq: params.model_seq,
                    file_path: params.file_path,
                    index_trgt_col: params.index_trgt_col,
                    outlier_target_col: params.outlier_target_col,
                    freq: params.freq,
                    p_value: params.p_value,
                    eps: params.eps,
                    min_samples: params.min_samples,
                    n_clusters: params.n_clusters,
                    n_clusters_lable: params.select_clusters_group
                }
                $.ajax({
                    type: "POST", //async: false,
                    url: ' /ai/model/make/outlier_set',
                    data: JSON.stringify(data),
                    contentType: "application/json; charset=utf-8;",
                    dataType: "json",
                    success: function (result) {
                        if (result.result_code === 200) {
                            alert("완료되었습니다.");
                            var outLierFilePath = result.outlier_file_path;
                            $('#outLierFilePath').val(result.outlier_file_path);
                            $("#select_outlier_target_col").trigger("change");
                            $('#tab_nan_table_range').show();
                            $('#tab_nan_table_complete_range').hide();
                            makePreprocNanFinishDataValid(outLierFilePath, modelSeq, indexTrgtCol);
                            //$('#validCompleteYn').val('Y');
                            /*
                            var validateFilePath = result.validate_file_path;
                            if (validateFilePath.length > 0) {
                                $('#tab_missing_table_range_valid_object').html('');
                                //$('#tab_nan_table_complete_range').text('변환이 완료 되었습니다.');
                                makePreprocNanFinishDataValid(validateFilePath, modelSeq, indexTrgtCol);
                            }
                            */

                        } else {
                            alert('API 내 에러 발생');
                        }
                    },
                    error: function (xhr, status, error) {
                        console.error('error : ', error);
                        alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                    }
                });
                //$('#outlierFilePath').val(filepath);
                //return false;
                /*
                var colArr = [];
                $('input[name="columnArr"]:checked').each(function() {
                    //console.log($('#preprocCheck' + $(this).val()).closest('tr').find('td:eq(1)').text())
                    colArr.push($('#preprocCheck' + $(this).val()).closest('tr').find('td:eq(0)').text());
                });

                $('#outLierFilePath').val('');
                //$('#validateFilePath').val('');
                $('#resampleFilePath').val('');
                $('#unitFilePath').val('');

                //선택컬럼으로 json다시 만듬
                var newTargetJsonArr = [];
                newTargetJsonArr = useInterpolateNewJson(jsonData, colArr);

                var modelSeq = $('#modelSeq').val();
                makePreprocInterpolate(jsonData, interpolateOption, modelSeq)
                */
            } else {
                return false;
            }


        });

    });

})();


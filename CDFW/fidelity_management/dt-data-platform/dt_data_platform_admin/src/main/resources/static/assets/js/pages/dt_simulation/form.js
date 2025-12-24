(function () {
    'use strict'
    $(document).ready(function () {
        let simTp = document.querySelector('#simTp');
        if (simTp) {
            observeDataValueChange(simTp, function (targetElement, newValue) {
                console.log('observeDataValueChange Callback', targetElement, newValue);
                $('#simulation_model_nm').val('');
                $('#search_simulation_list_table').empty();
                $("#cycle_tp_check").prop("checked", false);  //체크해제하기
                //file_upload_range
                let augmentTp = document.querySelector('#augmentTp');
                let dropdownBox = augmentTp.closest('.dropdown-box');
                let firstSelected = dropdownBox.querySelector('ul.option-list li')
                if (firstSelected) {
                    firstSelected.querySelector('label').click();
                }
            });
        }

        let augmentTp = document.querySelector('#augmentTp');
        if (augmentTp) {
            observeDataValueChange(augmentTp, function (targetElement, newValue) {
                console.log('observeDataValueChange Callback', targetElement, newValue);
                $('#simulation_model_nm').val('');
                $('#search_simulation_list_table').empty();
                $("#cycle_tp_check").prop("checked", false);
                let simTp = document.querySelector('#simTp');
                let simTpType = simTp.dataset.value;
                simulationFormChanger(simTpType, newValue);
            });
        }

        $(document).on('input', '#modelSearch', function (e) {
            console.log('this', this);
            console.log('e', e);
            let tableContainer = document.querySelector('#search_simulation_list_table');
            let searchInput = tableContainer.querySelector('input[type="search"]');
            if (searchInput) {
                $(searchInput).val(this.value).trigger('input');
            }
        });

        $(document).on('click', '.btn-search-model-list', function (e) {
            let simTp = document.querySelector('#simTp').dataset.value;
            let augmentTp = document.querySelector('#augmentTp').dataset.value;
            let simulation_model_nm = $('#simulation_model_nm').val();
            if (simTp === 0 || simTp === '0') {
                alert('시뮬레이션 유형을 선택 하세요.');
                return false;
            }

            if (augmentTp === 0 || augmentTp === '0') {
                alert('증강 유형을 선택 하세요.');
                return false;
            }

            let is_all;

            if (simulation_model_nm.length == 0) {
                is_all = true;
            } else {
                is_all = false;
            }

            let data = {
                simTp: simTp, augmentTp: augmentTp, modelNm: simulation_model_nm, type: is_all ? 'all' : 'search'
            }
            $.ajax({
                type: "POST", //async: false,
                url: '/dt/simulation/get/model/list',
                data: JSON.stringify(data),
                contentType: "application/json; charset=utf-8;",
                dataType: "json",
                success: function (result) {
                    if (result.code == 200) {
                        $('#search_simulation_list_table').empty();
                        if (result.count == 0) {
                            alert('검색 결과가 없습니다.');
                        } else {
                            console.log('result.data', result.data);
                            makeSimulationModelListTable(result.data, 'search_simulation_list_table', 'simulationModelListDataTable');
                            $('#simulationModelListDataTable').DataTable({
                                order: [[0, "asc"]],
                                searching: true,
                                info: false,
                                lengthChange: false,
                                autoWidth: true,
                                lengthMenu: [[10], [10]],
                                scrollX: true,
                                oLanguage: {
                                    sZeroRecords: '조회 결과가 없습니다.'
                                },
                                initComplete: function () {
                                    /**
                                     * Search Input Custom
                                     * */
                                    let tableContainer = document.querySelector('#search_simulation_list_table');
                                    let searchInput = tableContainer.querySelector('input[type="search"]');
                                    searchInput.classList.forEach(className => searchInput.classList.remove(className));
                                    ['form-control', 'sm'].forEach(function (className) {
                                        searchInput.classList.add(className);
                                    });
                                    searchInput.style.display = 'none';
                                }
                            });
                            console.log('document.querySelector(\'.btn-search-model-list\')', document.querySelector('.btn-search-model-list'));
                            const modalPopupId = document.querySelector('.btn-search-model-list').dataset.popupId;
                            console.log('modalPopupId', modalPopupId);
                            document.getElementById(modalPopupId).classList.add('is-open');
                        }
                    } else {
                        alert('API 내 에러 발생');
                    }
                },
                error: function (xhr, status, error) {
                    console.error('error : ', error);
                    alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                }
            });
        });

        $(document).on('click', '.btn-select-simulation-model', function () {
            var model_seq = $(this).data("model-seq");
            var model_nm = $(this).data("model-nm");
            let _this = this;

            $('#modelSeq').val(model_seq);
            $('#set_model_name').val(model_nm);
            $('#simulation_model_nm').val(model_nm);

            /**
             * 2024-07-15
             * 모델 상세보기 관련 버그건
             * @author kimwoosik
             * URL에서 Parameter로 메뉴코드 (menu_cd) 가져오기 로직 추가
             * */
            const url = new URL(window.location.href);
            const urlParams = url.searchParams;
            let menu_cd = urlParams.get('menuCd');
            let data = {
                model_seq: model_seq,
            }

            $.ajax({
                type: "POST", //async: false,
                url: '/dt/simulation/get/model/property',
                data: JSON.stringify(data),
                contentType: "application/json; charset=utf-8;",
                dataType: "json",
                success: function (result) {
                    if (result.code === 200) {
                        $('#preprocProPerty').val(result.data.user_pprcs_full_stng_value);
                        $('.preprocProPerty').val(prettyJson(result.data.user_pprcs_full_stng_value));

                        let simTp = document.querySelector('#simTp').dataset.value;
                        let augmentTp = document.querySelector('#augmentTp').dataset.value;
                        let preProcData = JSON.parse($('#preprocProPerty').val());
                        let model_property = preProcData.preproc_property_info[0].model_property[0];
                        console.log('model_property', model_property);
                        console.log('simTp', simTp, 'augmentTp', augmentTp);
                        let resample_property = preProcData.preproc_property_info[0].preproc_property[3].preproc_set[0];
                        console.log('resample_property', resample_property);
                        if (simTp === 'A' && (augmentTp === 'O' || augmentTp === 'F')) {
                            let resmplIntvlTp;
                            let resmplIntvlValue;
                            if (typeof resample_property === 'undefined') {
                                resmplIntvlTp = null;
                                resmplIntvlValue = null;
                            } else {
                                resmplIntvlTp = resample_property.resmpl_tp;
                                resmplIntvlValue = resample_property.resmpl_intvl_value;
                            }

                            let data_crt_intvl_tp = document.querySelector('#data_crt_intvl_tp');
                            let dropdownBox = data_crt_intvl_tp.closest('.dropdown-box');
                            if (data_crt_intvl_tp && resmplIntvlTp) {
                                let findInput = dropdownBox.querySelector(`ul.option-list li input[value="${resmplIntvlTp}"]`);
                                let findLabel = dropdownBox.querySelector(`ul.option-list li label[for="${findInput.id}"]`);
                                findLabel.click();
                            } else {
                                let firstInput = dropdownBox.querySelector(`ul.option-list li:first-child input`);
                                let firstLabel = dropdownBox.querySelector(`ul.option-list li:first-child label`);
                                firstLabel.click();
                            }

                            $('#data_crt_intvl_value').val(resmplIntvlValue);
                            $('.reset-cal-term').trigger("click");
                        }
                        if (simTp === 'A' && augmentTp === 'R') {
                            console.log('windowSize', model_property.hyperparam.window_size);
                            $('#windowSize').val(model_property.hyperparam.window_size);
                        }
                        let url = contextPath + `/dt/model/`;
                        url += `model/${model_seq}?menuCd=${menu_cd}`;
                        $("#go_model_btn_range").show();
                        let goModelBtnRange = document.querySelector('#go_model_btn_range');
                        if (goModelBtnRange) {
                            let aTag = goModelBtnRange.querySelector('a');
                            if (aTag) {
                                aTag.setAttribute('href', url);
                            }
                        }
                        $("#go_model_page").attr("href", url);
                        _this.closest('.modal-popup').querySelector('.btn-popup-close[data-popup-id]').click();
                        $('#search_simulation_list_table').empty();
                    } else {
                        alert('API 내 에러 발생');
                    }
                },
                error: function (xhr, status, error) {
                    console.error('error : ', error);
                    alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                }
            });
        });

        $(document).on('click', '.reset-cal-term', function () {
            let data_crt_intvl_tp = document.querySelector('#data_crt_intvl_tp').dataset.value;
            var data_crt_intvl_value = $("#data_crt_intvl_value").val();
            var model_name = $('#set_model_name').val();

            var get_resmpl_intvl_tp = $("#get_resmpl_intvl_tp").val();
            var get_resmpl_intvl_value = $("#get_resmpl_intvl_value").val();

            if (model_name.length === 0) {
                alert('모델을 선택하세요');
                $('#data_crt_intvl_value').val(1);
                return false;
            }

            if (data_crt_intvl_tp.length === 0) {
                alert('자료생성간격범위를 지정해주세요');
                return false;
            }

            if (data_crt_intvl_tp === get_resmpl_intvl_tp) {
                if (parseInt(data_crt_intvl_value) < parseInt(get_resmpl_intvl_value)) {
                    alert('모델과 같은 단위를 선택시 최소값보다 작습니다.');
                    $('#data_crt_intvl_value').val(get_resmpl_intvl_value);
                    return false;
                }
            }

            if (data_crt_intvl_value > 50) {
                alert('50이하로 설정해주세요')
                $('#data_crt_intvl_value').val(1);
                return false;
            }

            if (data_crt_intvl_value.length > 0) {
                let data = calDateTerm(data_crt_intvl_tp, data_crt_intvl_value);
                $('#target_start_date').val(data['target_start_date']);
                $('#target_last_date').val(data['target_last_date']);
            }
        });

        $(document).on('click', '.save-onetime', function (e) {
            var menuCd = $('#menuCd').val();
            var fileInput = $('#attach_files')[0].files[0]; // 예시로 id가 fileInput인 input 요소를 가정합니다.
            var modelSeq = $('#modelSeq').val();

            var title = $('#title').val();
            var derpn = $('#derpn').val();
            var simTp = document.querySelector('#simTp').dataset.value;
            var augmentTp = document.querySelector('#augmentTp').dataset.value;
            var set_model_name = $('#set_model_name').val();
            var use_yn = $('input[name="useYn"]:checked').val();
            let rls_yn = document.querySelector('input[name="rlsYn"]:checked').value;

            if (title.length === 0) {
                alert('제목 입력하세요.');
                return false;
            }

            if (simTp === 0 || simTp === '0') {
                alert('시뮬레이션 유형을 선택하세요');
                return false;
            }

            if (augmentTp === 0 || augmentTp === '0') {
                alert('증강 유형을 선택하세요.');
                return false;
            }

            if (set_model_name.length === 0) {
                alert('모델을 선택하세요.');
                return false;
            }

            if (typeof fileInput === 'undefined') {
                alert('대상 파일을 업로드 하세요.');
                return false;
            } else {
                var fileName = fileInput.name; // 파일명을 직접 가져옵니다.
                var ext = fileName.substring(fileName.lastIndexOf('.') + 1, fileName.length).toLowerCase();

                if (ext != 'csv') {
                    alert("확장자가 csv인 파일만 첨부가능합니다.");
                    $('#attach_files').val(''); // 파일 입력 요소를 초기화
                    $('#attach_files_input').val(''); // 다른 입력 요소를 초기화 (만약 존재한다면)
                    return false;
                }
            }

            var formData = new FormData();
            // #cycleEndDsgnYmd 요소의 값 가져오기
            let cycleBgngDsgnYmdValue = $("#target_start_date").val();
            let cycleEndDsgnYmdValue = $("#target_last_date").val();

            if (simTp === 'A' && augmentTp === 'O') {
                var dataCrtIntvlValue = $("#data_crt_intvl_value").val();

                if (dataCrtIntvlValue.length === 0) {
                    alert('추론기간을 입력하세요.');
                    return false;
                }

                if (cycleBgngDsgnYmdValue.length === 0) {
                    alert('시작일을 입력하세요.');
                    return false;
                }

                if (cycleEndDsgnYmdValue.length === 0) {
                    alert('종료일을 입력하세요.');
                    return false;
                }
            } else {
                cycleBgngDsgnYmdValue = null;
                cycleEndDsgnYmdValue = null;
            }

            formData.append('attachFiles', fileInput);
            formData.append('modelSeq', modelSeq);
            formData.append('title', title);
            formData.append('derpn', derpn);
            formData.append('simTp', simTp);
            formData.append('augmentTp', augmentTp);
            formData.append('useYn', use_yn);
            formData.append('rlsYn', rls_yn);

            var preProcData = JSON.parse($('#preprocProPerty').val());
            var preproc_trgt_col = preProcData.preproc_property_info[0].preproc_trgt_col;
            var index_trgt_col = preProcData.preproc_property_info[0].index_trgt_col;

            formData.append('preprocTrgtCol', preproc_trgt_col);
            formData.append('indexTrgtCol', index_trgt_col);
            formData.append('cycleBgngDsgnYmd', cycleBgngDsgnYmdValue);
            formData.append('cycleEndDsgnYmd', cycleEndDsgnYmdValue);
            formData.append('dataCrtIntvlValue', dataCrtIntvlValue);

            showProgressBar({element: null, process_id: 'process-48'});
            $.ajax({
                type: "POST", //async: false,
                url: '/dt/sch/onetime/simulation', data: formData, contentType: false, // 필요 없음
                processData: false, // 필요 없음
                success: function (result) {
                    if (result.code === 200) {
                        closeProgressBar({element: null, process_id: 'process-48'});
                        window.location.href = contextPath + "/dt/simulation/augment/list?menuCd=" + menuCd;
                    } else {
                        closeProgressBar({element: null, process_id: 'process-48'});
                        alert(`${message}`);
                    }
                }, error: function (xhr, status, error) {
                    console.error('error : ', error);
                    closeProgressBar({element: null, process_id: 'process-48'});
                    alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                }
            });
        });

        $(document).on('click', '.save-predict', function (e) {
            var menuCd = $('#menuCd').val();
            var modelSeq = $('#modelSeq').val();

            var title = $('#title').val();
            var derpn = $('#derpn').val();
            var simTp = document.querySelector('#simTp').dataset.value;
            var augmentTp = document.querySelector('#augmentTp').dataset.value;
            var set_model_name = $('#set_model_name').val();
            var use_yn = $('input[name="useYn"]:checked').val();
            let rls_yn = document.querySelector('input[name="rlsYn"]:checked').value;

            if (title.length === 0) {
                alert('제목 입력하세요.');
                return false;
            }

            if (simTp === 0 || simTp === '0') {
                alert('시뮬레이션 유형을 선택하세요');
                return false;
            }

            if (augmentTp === 0 || augmentTp === '0') {
                alert('처리 유형을 선택하세요.');
                return false;
            }

            if (set_model_name.length === 0) {
                alert('모델을 선택하세요.');
                return false;
            }

            // #cycleEndDsgnYmd 요소의 값 가져오기
            var cycleBgngDsgnYmdValue = $("#target_start_date").val();
            var cycleEndDsgnYmdValue = $("#target_last_date").val();
            var dataCrtIntvlTp = document.querySelector('#data_crt_intvl_tp').dataset.value;
            var dataCrtIntvlValue = $("#data_crt_intvl_value").val();

            if (dataCrtIntvlValue.length === 0) {
                alert('추론기간을 입력하세요.');
                return false;
            }

            if (cycleBgngDsgnYmdValue.length === 0) {
                alert('시작일을 입력하세요.');
                return false;
            }

            if (cycleEndDsgnYmdValue.length === 0) {
                alert('종료일을 입력하세요.');
                return false;
            }

            var preProcData = JSON.parse($('#preprocProPerty').val());
            var preproc_trgt_col = preProcData.preproc_property_info[0].preproc_trgt_col;
            var index_trgt_col = preProcData.preproc_property_info[0].index_trgt_col;
            let data = {
                model_seq: modelSeq,
                title: title,
                sim_tp: simTp,
                derpn: derpn,
                augment_tp: augmentTp,
                cycle_bgng_dsgn_ymd: cycleBgngDsgnYmdValue,
                cycle_end_dsgn_ymd: cycleEndDsgnYmdValue,
                use_yn: use_yn,
                rls_yn: rls_yn,
                data_crt_intvl_value: dataCrtIntvlValue,
                data_crt_intvl_tp: dataCrtIntvlTp,
                preproc_trgt_col: preproc_trgt_col,
                index_trgt_col: index_trgt_col
            }
            console.log('data', data);
            showProgressBar({element: null, process_id: 'process-49'});
            $.ajax({
                type: "POST", //async: false,
                url: '/dt/sch/predict/simulation',
                data: JSON.stringify(data),
                contentType: "application/json; charset=utf-8;",
                dataType: "json",
                processData: false, // 필요 없음
                success: function (result) {
                    if (result.code === 200) {
                        closeProgressBar({element: null, process_id: 'process-49'});
                        window.location.href = contextPath + "/dt/simulation/augment/list?menuCd=" + menuCd;
                    } else {
                        closeProgressBar({element: null, process_id: 'process-49'});
                        alert(`${message}`);
                    }
                },
                error: function (xhr, status, error) {
                    $('#loading').hide();
                    console.error('error : ', error);
                    closeProgressBar({element: null, process_id: 'process-49'});
                    alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                }
            });
        });

        $(document).on('click', '.save-simulation', function () {
            var menuCd = $('#menuCd').val();
            var title = $('#title').val();
            var derpn = $('#derpn').val();
            var simTp = document.querySelector('#simTp').dataset.value;
            var augmentTp = document.querySelector('#augmentTp').dataset.value;
            var cycleTp = $('input[name="cycleTp"]:checked').val();
            var useYn = $('input[name="useYn"]:checked').val();
            let input_data_max_limit_cnt = document.querySelector('#dataMaxLimitCnt');
            let data_max = input_data_max_limit_cnt.dataset.max;
            var data_max_limit_cnt = $('#dataMaxLimitCnt').val();

            if (title.length === 0) {
                alert('제목 입력하세요.');
                return false;
            }

            if (simTp === 0 || simTp === '0') {
                alert('시뮬레이션 유형을 선택하세요');
                return false;
            }

            if (augmentTp === 0 || augmentTp === '0') {
                alert('처리 유형을 선택하세요.');
                return false;
            }

            let etc = null
            if (cycleTp === 'ETC') {
                let etc_time_intvl_value = document.querySelector('#etc_time_intvl').value;
                try {
                    if (parseInt(etc_time_intvl_value) <= 0) {
                        alert('시간 간격을 0 이상을 입력해주세요.');
                    }
                } catch (e) {
                    alert('시간 간격을 숫자형태로 입력해주세요.');
                    return;
                }
                let etc_time_tp_value = document.querySelector('#etc_time_tp').dataset.value;
                etc = {
                    etc_time_tp: etc_time_tp_value,
                    etc_time_intvl: etc_time_intvl_value
                };
            }

            if (!$.isNumeric(data_max_limit_cnt)) {
                alert('숫자만 입력 가능합니다.');
                return false;
            }

            if (data_max_limit_cnt < 1) {
                alert('최저 수치는 1입니다.');
                return false;
            }

            if (data_max_limit_cnt > parseInt(data_max)) {
                alert(`최대 수치는 ${parseInt(data_max)}입니다.`);
                return false;
            }

            let cycleBgngDsgnYmd = $("#cycleBgngDsgnYmd").val();
            console.log('cycleBgngDsgnYmd', cycleBgngDsgnYmd);
            let cycleEndDsgnYmd = $("#cycleEndDsgnYmd").val();
            console.log('cycleEndDsgnYmd', cycleEndDsgnYmd);

            /**
             * 1. 진행 기간 중 시작 날짜가 없을 경우 끝날짜가 있는 경우 (현재 시간부터 끝날짜 까지 데이터 시뮬레이션 전개)
             * 2. 진행 기간 중 시작 날짜가 없을 경우 끝날짜가 없을 경우 (현재 시간부터 계속 시뮬레이션 전개)
             * 3. 진행 기간 중 시작 날짜가 존재하는 경우 끝날짜가 없는 경우 (시작 날짜 부터 시뮬레이션 전개)
             * 4. 진행 기간 중 시작 날짜가 존재하는 경우 끝날짜가 존재 하는 경우 (시작 날짜 부터 끝날짜 까지 시뮬레이션 전개)
             * */
            let cycleEndTp = 'S';
            if (cycleBgngDsgnYmd.length === 0) {
                cycleBgngDsgnYmd = getCurrentDate();
                if (cycleEndDsgnYmd.length !== 0) {
                    // 1. 진행 기간 중 시작 날짜가 없을 경우 끝날짜가 있는 경우 (현재 시간부터 끝날짜 까지 데이터 시뮬레이션 전개)
                    const result = compareDates(cycleBgngDsgnYmd, cycleEndDsgnYmd);

                    if (result === -1) {
                        // 종료일이 시작날 보다 이후
                        console.log(`${cycleBgngDsgnYmd} is before ${cycleEndDsgnYmd}`);
                    } else if (result === 1) {
                        // 종료일이 시작날 보다 이전
                        console.log(`${cycleBgngDsgnYmd} is after ${cycleEndDsgnYmd}`);
                        alert('시작일을 미등록하시면 종료 날짜는 현 시점 보다 이전일 수 없습니다.');
                        return;
                    } else {
                        // 종료일이 시작날과 같음
                        console.log(`${cycleBgngDsgnYmd} is the same as ${cycleEndDsgnYmd}`);
                    }
                    cycleEndTp = 'D';
                } else {
                    // 2. 진행 기간 중 시작 날짜가 없을 경우 끝날짜가 없을 경우 (현재 시간부터 계속 시뮬레이션 전개)
                    cycleEndTp = 'C';
                }
            } else {
                const today = getCurrentDate(); // 오늘 날짜를 가져옵니다.
                const startDateComparison = compareDates(cycleBgngDsgnYmd, today);
                if (startDateComparison === -1) {
                    // 시작일이 오늘보다 이전인 경우
                    alert('시작일은 오늘 날짜 이전일 수 없습니다.');
                    return;
                }

                if (cycleEndDsgnYmd.length === 0) {
                    // 3. 진행 기간 중 시작 날짜가 존재하는 경우 끝날짜가 없는 경우 (시작 날짜 부터 시뮬레이션 전개)
                    cycleEndTp = 'C';
                } else {
                    // 4. 진행 기간 중 시작 날짜가 존재하는 경우 끝날짜가 존재 하는 경우 (시작 날짜 부터 끝날짜 까지 시뮬레이션 전개)
                    const result = compareDates(cycleBgngDsgnYmd, cycleEndDsgnYmd);
                    cycleEndTp = 'D';
                    if (result === -1) {
                        // 종료일이 시작날 보다 이후
                        console.log(`${cycleBgngDsgnYmd} is before ${cycleEndDsgnYmd}`);
                    } else if (result === 1) {
                        // 종료일이 시작날 보다 이전
                        console.log(`${cycleBgngDsgnYmd} is after ${cycleEndDsgnYmd}`);
                        alert('종료 날짜는 시작일 보다 이전일 수 없습니다.');
                        return;
                    } else {
                        // 종료일이 시작날과 같음
                        console.log(`${cycleBgngDsgnYmd} is the same as ${cycleEndDsgnYmd}`);
                    }
                }
            }

            let dataCrtLastHr = document.querySelector('#dataCrtLastHr');
            let dataCrtLastHrValue = dataCrtLastHr.value;
            console.log('dataCrtLastHrValue', dataCrtLastHrValue);

            if (dataCrtLastHrValue.length === 0) {
                dataCrtLastHrValue = getCurrentDate();
            } else {
                const today = getCurrentDate(); // 오늘 날짜를 가져옵니다.
                const startDateComparison = compareDates(dataCrtLastHrValue, today);
                if (startDateComparison === 1) {
                    // 시작일이 오늘보다 이전인 경우
                    alert('데이터 시작일은 오늘 날짜 이후일 수 없습니다.');
                    return;
                }
            }

            let augmentStatus = document.querySelector('input[name="augmentStatus"]:checked').value;
            let rls_yn = document.querySelector('input[name="rlsYn"]:checked').value;

            console.log('dataCrtLastHrValue', dataCrtLastHrValue);

            // 날짜 형식으로 변환
            var model_seq = $('#modelSeq').val();

            let data = {
                model_seq: model_seq,
                title: title,
                sim_tp: simTp,
                derpn: derpn,
                augment_tp: augmentTp,
                cycle_tp: cycleTp,
                cycle_end_tp: cycleEndTp,
                cycle_bgng_dsgn_ymd: cycleBgngDsgnYmd,
                cycle_end_dsgn_ymd: cycleEndDsgnYmd,
                use_yn: useYn,
                rls_yn: rls_yn,
                augment_status: augmentStatus,
                data_max_limit_cnt: data_max_limit_cnt,
                data_crt_last_hr: dataCrtLastHrValue
            }
            if (cycleTp === 'ETC') {
                data.etc_time_tp = etc.etc_time_tp;
                data.etc_time_intvl = etc.etc_time_intvl;
            }
            console.log('data', data);
            showProgressBar({element: null, process_id: 'process-50'});
            $.ajax({
                type: "POST", //async: false,
                url: '/dt/simulation/save/augment',
                data: JSON.stringify(data),
                contentType: "application/json; charset=utf-8;",
                dataType: "json",
                success: function (result) {
                    if (result.code === 200) {
                        closeProgressBar({element: null, process_id: 'process-50'});
                        window.location.href = contextPath + "/dt/simulation/augment/list?menuCd=" + menuCd;
                    } else {
                        closeProgressBar({element: null, process_id: 'process-50'});
                        alert('API 내 에러 발생');
                    }
                },
                error: function (xhr, status, error) {
                    console.error('error : ', error);
                    closeProgressBar({element: null, process_id: 'process-50'});
                    alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                }
            });
        });

        let dataCrtIntvlTp = document.querySelector('#data_crt_intvl_tp');
        if (dataCrtIntvlTp) {
            observeDataValueChange(dataCrtIntvlTp, function (targetElement, newValue) {
                console.log('observeDataValueChange Callback', targetElement, newValue);
                let dataCrtIntvlTp = document.querySelector('#data_crt_intvl_tp');
                let dropdownBox = dataCrtIntvlTp.closest('.dropdown-box');
                let firstInput = dropdownBox.querySelector('ul.option-list li:first-child input');
                let firstLabel = dropdownBox.querySelector('ul.option-list li:first-child label');
                if (!newValue || newValue === '선택 없음' || newValue === '0' || newValue === '') {
                    return;
                }
                let model_name = $('#set_model_name').val();
                if (model_name.length === 0) {
                    alert('모델을 선택하세요');
                    let processClearButton = document.querySelector('#processRange [data-action="clear"]');
                    let dataClearButton = document.querySelector('#dataRange [data-action="clear"]');
                    processClearButton.click();
                    dataClearButton.click();
                    firstLabel.click();
                } else {
                    $('.reset-cal-term').trigger('click');
                }
            });
        }

        let processClearButton = document.querySelector('#processRange [data-action="clear"]');
        processClearButton.addEventListener('click', function (event) {
            let startDateInput = document.querySelector('#cycleBgngDsgnYmd');
            let endDateInput = document.querySelector('#cycleEndDsgnYmd');
            startDateInput.value = '';
            endDateInput.value = '';
        });

        let dataClearButton = document.querySelector('#dataRange [data-action="clear"]');
        dataClearButton.addEventListener('click', function (event) {
            let dataInput = document.querySelector('#dataCrtLastHr');
            dataInput.value = '';
        });

        let cycleTpRange = document.querySelector('#cycle_tp_range');
        if (cycleTpRange) {
            const radios = cycleTpRange.querySelectorAll('input[type="radio"][name="cycleTp"]');

            radios.forEach(function (radio) {
                radio.addEventListener("change", function () {
                    console.log("선택된 주기 유형:", this.value);
                    $('#etc_time_tp_selection ul.option-list li:first-child label').click();
                    $('#etc_time_intvl').val('');
                    //ETC 로직만 예외 처리
                    if (this.value === 'ETC') {
                        let etcRange = document.querySelector('[aria-labelledby="ETC"]');
                        etcRange.style.display = 'block';
                    } else {
                        let etcRange = document.querySelector('[aria-labelledby="ETC"]');
                        etcRange.style.display = 'none';
                    }
                });
            });
        }
    });
})();

function simulationFormChanger(simulationType, augmentType) {
    console.log('simulationType', simulationType, 'augmentType', augmentType);
    //초기화
    //영역
    $('#cycle_tp_range').hide();
    $('#onetime_tp_range').hide();

    //파일
    $('#attach_files').val('');
    $('#attach_files_input').val('');
    $('#file_upload_range').hide();

    //버튼 교체
    $('.save-simulation').hide();
    $('.save-onetime').hide();
    $('.save-predict').hide();

    //진행 여부
    $('#row_limit_yn').hide();

    //개수
    $('#preprocessNeedRange').hide();
    $('#AugmentNeedRange').hide();

    //증강일때만 추론 열린다.
    let augmentTp = document.querySelector('#augmentTp');
    let dropdownBox = augmentTp.closest('.dropdown-box');
    let options = dropdownBox.querySelectorAll('ul.option-list li');

    options.forEach(option => {
        if (simulationType === 'A') {
            if (option.querySelector('input').value === 'F' || option.querySelector('label').innerHTML.trim() === '추론') {
                option.style.display = 'block';
            }
        } else {
            if (option.querySelector('input') === 'F' || option.querySelector('label').innerHTML.trim() === '추론') {
                option.style.display = 'none';
            }
        }
    });

    switch (simulationType) {
        case 'P': {
            switch (augmentType) {
                case 'O': {
                    //전처리 - 일회성
                    //영역
                    $('#cycle_tp_range').hide();
                    $('#onetime_tp_range').hide();

                    //파일
                    $('#attach_files').val('');
                    $('#attach_files_input').val('');
                    $('#file_upload_range').show();

                    //버튼 교체
                    $('.save-onetime').show();
                    break;
                }
                case 'R': {
                    //영역
                    $('#cycle_tp_range').show();

                    //버튼 교체
                    $('.save-simulation').show();

                    //진행 여부
                    $('#row_limit_yn').show();

                    //개수
                    $('#preprocessNeedRange').show();
                    break;
                }
                case 'F': {
                    //영역
                    $('#cycle_tp_range').hide();
                    $('#onetime_tp_range').show();

                    //파일
                    $('#attach_files').val('');
                    $('#attach_files_input').val('');
                    $('#file_upload_range').hide();

                    //버튼 교체
                    $('.save-simulation').hide();
                    $('.save-onetime').hide();
                    $('.save-predict').show();

                    //진행 여부
                    $('#row_limit_yn').hide();
                    break;
                }
                default: {
                    //영역
                    $('#cycle_tp_range').hide();
                    $('#onetime_tp_range').hide();

                    //파일
                    $('#attach_files').val('');
                    $('#attach_files_input').val('');
                    $('#file_upload_range').hide();

                    //버튼 교체
                    $('.save-simulation').hide();
                    $('.save-onetime').hide();
                    $('.save-predict').hide();

                    //진행 여부
                    $('#row_limit_yn').hide();
                    break;
                }
            }
            break;
        }
        case 'A': {
            //개수
            switch (augmentType) {
                case 'O': {
                    //영역
                    $('#cycle_tp_range').hide();
                    $('#onetime_tp_range').show();

                    //파일
                    $('#attach_files').val('');
                    $('#attach_files_input').val('');
                    $('#file_upload_range').show();

                    //버튼 교체
                    $('.save-simulation').hide();
                    $('.save-onetime').show();
                    $('.save-predict').hide();

                    //진행 여부
                    $('#row_limit_yn').hide();
                    break;
                }
                case 'R': {
                    //영역
                    $('#cycle_tp_range').show();

                    //버튼 교체
                    $('.save-simulation').show();

                    //진행 여부
                    $('#row_limit_yn').show();

                    //개수
                    $('#preprocessNeedRange').show();
                    $('#AugmentNeedRange').show();
                    break;
                }
                case 'F': {
                    //영역
                    $('#onetime_tp_range').show();

                    //버튼 교체
                    $('.save-predict').show();
                    break;
                }
            }
            break;
        }
    }
}

function calDateTerm(data_crt_intvl_tp, data_crt_intvl_value) {
    var now = new Date();
    //console.log(now);
    //console.log(dateFormat(now));
    var last_date;

    if (data_crt_intvl_tp === 'S') {
        //초단위
        //var sec = new Date(now.setSeconds(now.getSeconds() - 20));
        var sec = new Date(now.setSeconds(now.getSeconds() + parseInt(data_crt_intvl_value)));
        now = new Date();
        last_date = sec;
    }

    if (data_crt_intvl_tp === 'T') {
        //분단위
        var min = new Date(now.setMinutes(now.getMinutes() + parseInt(data_crt_intvl_value)));
        now = new Date();
        last_date = min;
    }

    if (data_crt_intvl_tp === 'H') {
        //시간단위
        var hour = new Date(now.setHours(now.getHours() + parseInt(data_crt_intvl_value)));
        now = new Date();
        last_date = hour;
    }

    if (data_crt_intvl_tp === 'D') {
        //일단위
        var day = new Date(now.setDate(now.getDate() + parseInt(data_crt_intvl_value)));
        now = new Date();
        last_date = day;
    }

    if (data_crt_intvl_tp === 'M') {
        //월단위
        var mon = new Date(now);
        mon.setMonth(mon.getMonth() + parseInt(data_crt_intvl_value));
        last_date = mon;
    }

    return {
        "target_start_date": dateFormat(now), "target_last_date": dateFormat(last_date)
    };
}

function dateFormat(date) {
    console.log(date);
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let hour = date.getHours();
    let minute = date.getMinutes();
    let second = date.getSeconds();

    month = month >= 10 ? month : '0' + month;
    day = day >= 10 ? day : '0' + day;
    hour = hour >= 10 ? hour : '0' + hour;
    minute = minute >= 10 ? minute : '0' + minute;
    second = second >= 10 ? second : '0' + second;

    return date.getFullYear() + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
}
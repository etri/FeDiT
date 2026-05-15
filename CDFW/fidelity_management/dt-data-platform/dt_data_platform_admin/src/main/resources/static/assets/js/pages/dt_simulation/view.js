(function () {
    'use strict'
    $(document).ready(function () {
        $('#historyLogTable').DataTable({
            order: [[0, "asc"]],
            searching: false,
            info: false,
            lengthChange: false,
            autoWidth: true,
            destroy: true
        });
        $(document).on('click', '.simulation-update', function () {
            let title = $('#title').val();
            let derpn = $('#derpn').val();
            let useYn = $('input[name="useYn"]:checked').val();
            let data_max_limit_cnt = $('#dataMaxLimitCnt').val();

            if (title.length === 0) {
                alert('제목 입력하세요.');
                return false;
            }
            if (derpn.length === 0) {
                alert('설명을 입력하세요.');
                return false;
            }

            if (confirm('수정 하시겠습니까?')) {
                let form = document.forms.editForm;
                // 기본 리다이렉트 URL
                let action = '/dt/simulation/';
                if (window.location.pathname.includes("preprocess")) {
                    action += "augment/";
                } else if (window.location.pathname.includes("augment")) {
                    action += "augment/";
                }
                let augmentSeq = document.querySelector('#augmentSeq').value;
                form.action = `${window.location.origin}${action}form`;
                form.submit();
            }
        });

        /**
         * Prediction
         * */
        let augmentTp = document.querySelector('#augmentTp').dataset.value;
        if (augmentTp === 'F') {
            let augmentSeq = document.querySelector('#augmentSeq').value;
            console.log('augmentSeq', augmentSeq);
            getSimulationPredictionView(augmentSeq, function (data, error) {
                if (data) {
                    console.log('data', data);
                    let predictionContainer = document.querySelector('#predictionRange');
                    predictionContainer.style.display = 'block';
                    let predictionResultTable = document.querySelector('#predictionResultTable');
                    predictionResultTable.innerHTML = '';
                    const newHeaderList = data.header_list.map(value => {
                        return value.replaceAll('\"', '');
                    });
                    const newDataList = data.data_list.map(row => {
                        return row.map(value => {
                            return value.replaceAll('\"', '');
                        });
                    });
                    preProcessMakeHTMLExcludeDataTable('#predictionResultTable', 'predictionResultTableInner', newHeaderList, newDataList, null, function (wrapper, headers, datas) {
                        console.log('wrapper', wrapper);
                        console.log('preProcessMakeHTMLExcludeDataTable is completed');
                        $('#predictionResultTableInner').DataTable({
                            columnDefs: [{
                                targets: '_all', className: 'text-nowrap', searchable: false
                            }],
                            order: [[0, "asc"]],
                            searching: false,
                            info: false,
                            lengthChange: false,
                            autoWidth: true,
                            lengthMenu: [[10], [10]],
                            scrollX: true,
                            initComplete: function (settings, json) {
                                console.log('DataTable has finished its initialisation.');
                                wrapper.parentElement.style.display = 'block';
                            }
                        });
                    });
                }
                if (error) {
                    console.error(error);
                }
            });
            insertSimulationViewResult(augmentSeq, function (result, error) {
                if (result) {
                    //결과차트
                    let predictionContainer = document.querySelector('#predictionRange');
                    predictionContainer.style.display = 'block';
                    makeResultDataChart(result.data, result.index_trgt_col);
                }
                if (error) {
                    console.error(error);
                }
            });
        }
    });

    function getSimulationPredictionView(augmentSeq, callback) {
        $.ajax({
            type: 'POST',
            async: false,
            url: `/dt/simulation/${augmentSeq}/prediction`,
            contentType: "application/json; charset=utf-8;",
            dataType: "json",
            success: function (result) {
                console.log('getSimulationPredictionView', result);
                if (result.code === 200) {
                    callback(result.data, null);
                } else {
                    callback(null, result.message);
                }
            },
            error: function (xhr, status, error) {
                console.error('error : ', error);
                alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
            }
        });
    }

    function insertSimulationViewResult(augmentSeq, callback) {
        let data = {
            augmentSeq
        }
        $.ajax({
            type: 'POST',
            async: false,
            url: '/dt/simulation/insertSimulationViewResult',
            data: JSON.stringify(data),
            contentType: "application/json; charset=utf-8;",
            dataType: "json",
            success: function (result) {
                if (result.result_code === 200) {
                    callback(result, null);
                } else {
                    callback(null, result.message);
                }
            },
            error: function (xhr, status, error) {
                console.error('error : ', error);
                alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                callback(null, error);
            }
        });
    }

    function makeResultDataChart(data, dateKey) {
        const xData = [];
        const seriesData = [];

        data.forEach(item => {
            const keys = Object.keys(item);

            //첫 번째 항목을 x축 데이터로 사용
            if (keys.length > 0) {
                const xKey = keys.filter(key => {
                    if (key === dateKey) {
                        return true;
                    }
                });

                // x축 데이터가 아닌 나머지 항목들을 시리즈로 추가
                for (let i = 1; i < keys.length; i++) {
                    const yKey = keys[i];

                    if (yKey !== keys[0]) {
                        const dataIndex = seriesData.findIndex(seriesItem => {
                            return seriesItem.name === yKey
                        });
                        if (dataIndex === -1) {
                            let data = {
                                name: yKey,
                                //type: 'line',
                                chart: 'line',
                                unit: '',
                                data: [{name: item[xKey], value: parseFloat(item[yKey])}]
                            }
                            seriesData.push(data);
                        } else {
                            let data = {
                                name: item[xKey],
                                value: parseFloat(item[yKey])
                            }
                            seriesData[dataIndex].data.push(data);
                        }
                    }
                }

            }
        });

        const series = {
            series: seriesData,
            subtitle: "추론 데이터",
            title: "추론 데이터"
        };

        viewTypeDefault('line', series, 2, true, false, true);
    }
})();
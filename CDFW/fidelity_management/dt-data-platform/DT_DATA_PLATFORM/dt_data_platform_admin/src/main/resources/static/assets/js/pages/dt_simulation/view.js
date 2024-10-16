(function () {
    'use strict'
    $(document).ready(function () {
        $('#historyLogTable').DataTable({
            "order": [[5, "desc"]],
            "searching": false,
            "info": false,
            "lengthChange": false,
            "autoWidth": false,
            "lengthMenu": [[5], [5]]
            /*
            ,
            "columnDefs": [
                { "width": "20%", "targets": 0 },
                { "width": "5%", "targets": 1 },
                { "width": "10%", "targets": 2 },
                { "width": "25%", "targets": 3 },
                { "width": "25%", "targets": 4 },
                { "width": "15%", "targets": 5 }
            ]
            */
        });
        $(document).on('click', '.simulation-update', function () {
            var title = $('#title').val();
            var derpn = $('#derpn').val();
            var useYn = $('input[name="useYn"]:checked').val();
            var data_max_limit_cnt = $('#dataMaxLimitCnt').val();

            if (title.length == 0) {
                alert('제목 입력하세요.');
                return false;
            }

            if (confirm('수정 하시겠습니까?')) {
                var form = document.forms.editForm;
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
        let augmentTpOptions = document.querySelectorAll('#augmentTp option');
        let augmentTp;
        augmentTpOptions.forEach(function (option) {
            if (option.getAttribute('selected')) {
                augmentTp = option.value;
            }
        });
        if (augmentTp === 'F') {
            let augmentSeq = document.querySelector('#augmentSeq').value;
            console.log('augmentSeq', augmentSeq);
            getSimulationPredictionView(augmentSeq, function (data) {
                console.log('data', data);
                let predictionResultTable = document.querySelector('#predictionResultTable');
                predictionResultTable.style.display = 'block';
                predictionResultTable.innerHTML = '';
                const newHeaderList = data.header_list.map(value => {
                    return value.replaceAll('\"', '');
                });
                const newDataList = data.data_list.map(row => {
                    return row.map(value => {
                        return value.replaceAll('\"', '');
                    });
                });
                preProcessMakeHTMLExcludeDataTable('#predictionResultTable', 'predictionResultTableInner', newHeaderList, newDataList, `<p class="card-description">추론결과</p>`, function (wrapper, headers, datas) {
                    console.log('wrapper', wrapper);
                    console.log('preProcessMakeHTMLExcludeDataTable is completed');
                    $('#predictionResultTableInner').DataTable({
                        order: [[0, "asc"]],
                        searching: false,
                        info: false,
                        lengthChange: false,
                        autoWidth: false,
                        lengthMenu: [[10], [10]],
                        initComplete: function (settings, json) {
                            console.log('DataTable has finished its initialisation.');
                            wrapper.parentElement.style.display = 'block';
                        }
                    });
                });
            });
            insertSimulationViewResult(augmentSeq, function (data) {
                document.querySelector('#predictionResultChart').style.display = 'flex';
                console.log('data', data);
                if (data) {
                    //결과차트
                    makeResultDataChart(data);
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
                    callback(result.data);
                }
            },
            error: function (xhr, status, error) {
                console.error('error : ', error);
                alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
            }
        });
    }

    function getCorrelation(augmentSeq, callback) {
        let data = {
            augmentSeq
        }
        $.ajax({
            type: "POST",
            url: '/dt/simulation/make/correlation',
            data: JSON.stringify(data),
            contentType: "application/json; charset=utf-8;",
            dataType: "json",
            success: function (result) {
                console.log('result', result);
                if (result.result_code === 200) {
                    callback(result, null);
                }
            },
            error: function (xhr, status, error) {
                console.error('error : ', error);
                alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                callback(null, error);
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
                    callback(result.data, null);
                }
            },
            error: function (xhr, status, error) {
                console.error('error : ', error);
                alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                callback(null, error);
            }
        });
    }

    function makeResultDataChart(data) {
        const xData = [];
        const seriesData = [];

        data.forEach(item => {
            const keys = Object.keys(item);

            //첫 번째 항목을 x축 데이터로 사용
            if (keys.length > 0) {
                const xKey = keys[0];
                xData.push(item[xKey]);

                // x축 데이터가 아닌 나머지 항목들을 시리즈로 추가
                for (let i = 1; i < keys.length; i++) {
                    const yKey = keys[i];
                    //if (yKey !== 'yyyymmdd') {
                    if (yKey !== keys[0]) {
                        const dataIndex = seriesData.findIndex(seriesItem => seriesItem.name === yKey);
                        if (dataIndex === -1) {
                            let data = {
                                name: yKey,
                                //type: 'line',
                                chart: 'line',
                                data: [{name: item[xKey], value: parseFloat(item[yKey])}]
                            }
                            console.log('data', data);
                            seriesData.push(data);
                        } else {
                            let data = {
                                name: item[xKey],
                                value: parseFloat(item[yKey])
                            }
                            console.log('data', data);
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
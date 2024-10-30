(function () {
    'use strict'
    $(document).ready(function () {

    });
})();


function getLoss(params) {
    let result;
    showProgressBar({element: null, process_id: 'process-23'});
    $.ajax({
        type: "POST",
        async: false,
        url: "/dt/model/loss",
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(params),
        success: function (data) {
            //console.log(data);
            if (data != null) {
                //console.log(data.cultureart);
                closeProgressBar({element: null, process_id: 'process-23'});
                result = data.loss;
            } else {
                closeProgressBar({element: null, process_id: 'process-23'});
                alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
            }
        },
        error: function (e) {
            console.log(e);
            closeProgressBar({element: null, process_id: 'process-23'});
            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
        }
    });
    return result;
}

//fid 
function getFID(params) {
    let result;
    showProgressBar({element: null, process_id: 'process-24'});
    $.ajax({
        type: "POST",
        async: false,
        url: "/dt/model/fid",
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(params),
        success: function (data) {
            //console.log(data);
            if (data != null) {
                closeProgressBar({element: null, process_id: 'process-24'});
                //console.log(data.cultureart);
                result = data.fid;
            } else {
                closeProgressBar({element: null, process_id: 'process-24'});
                alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
            }
        },
        error: function (e) {
            console.log(e);
            closeProgressBar({element: null, process_id: 'process-24'});
            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
        }
    });
    return result;
}

//테스트데이터
function getTestData(params) {
    let result;
    showProgressBar({element: null, process_id: 'process-25'});
    $.ajax({
        type: "POST",
        async: false,
        url: "/dt/model/testdata",
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(params),
        success: function (data) {
            //console.log(data);
            if (data != null) {
                //console.log(data.cultureart);
                closeProgressBar({element: null, process_id: 'process-25'});
                result = data.test;
            } else {
                closeProgressBar({element: null, process_id: 'process-25'});
                alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
            }
        },
        error: function (e) {
            console.log(e);
            closeProgressBar({element: null, process_id: 'process-25'});
            alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
        }
    });
    return result;
}

function getDataView(data, data_header, divID) {
    var strHTML = '';
    strHTML += '';
    strHTML += '<div class="table-responsive">';
    strHTML += '<table id="' + divID + '_table" class="table table-hover scrolltable">';
    strHTML += '	<colgroup>';
    $.each(data_header, function (i) {
        strHTML += '		<col style="width: ' + (100 / data_header.length) + '%;">';
    });
    strHTML += '	</colgroup>';
    strHTML += '    <thead>';
    strHTML += '        <tr>';
    strHTML += '			<td>No</td>';
    $.each(data_header, function (i) {
        strHTML += '			<td>' + data_header[i].replace(/\"/gi, "") + '</td>';
    });
    strHTML += '        </tr>';
    strHTML += '    </thead>';
    strHTML += '    <tbody>';

    for (var i = 0; i < data.length; i++) {
        strHTML += '   	<tr>';
        strHTML += '           <td>' + (i + 1) + '</td>';

        var obj = data[i];
        $.each(data_header, function (j) {
            for (var key in obj) {
                var value = obj[key];
                if (data_header[j] == key) {
                    strHTML += '           <td>' + value.replace(/\"/gi, "") + '</td>';
                }
                //console.log(key + ': ' + value);
            }
        });
        strHTML += '    </tr>';
    }

    strHTML += '   </tbody>';
    strHTML += '</table>';
    strHTML += '</div>';
    $('#' + divID).html(strHTML);
}
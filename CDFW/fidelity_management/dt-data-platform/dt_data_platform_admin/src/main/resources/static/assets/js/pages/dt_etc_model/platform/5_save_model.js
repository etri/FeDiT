function getLoss(params) {
    var result;
    showProgressBar({element: null, process_id: 'process-6'});
    $.ajax({
        type: "POST",
        async: false,
        url: "/dt/etc/model/loss",
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(params),
        success: function (data) {
            if (data != null) {
                result = data.loss;
                closeProgressBar({element: null, process_id: 'process-6'});
            } else {
                closeProgressBar({element: null, process_id: 'process-6'});
            }
        },
        error: function (e) {
            console.log(e);
            closeProgressBar({element: null, process_id: 'process-6'});
        }
    });

    return result;
}

function getFID(params) {
    var result;

    $.ajax({
        type: "POST",
        async: false,
        url: "/dt/etc/model/fid",
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(params),
        success: function (data) {
            //console.log(data);
            if (data != null) {
                //console.log(data.cultureart);
                result = data.fid;
            } else {
            }
        },
        error: function (e) {
            console.log(e);
        }
    });

    return result;
}
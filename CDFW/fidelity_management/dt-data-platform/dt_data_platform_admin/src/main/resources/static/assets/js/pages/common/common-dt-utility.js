'use strict'
function uriEncodingParameter(data, hiddenId) {
    let encodedData = encodeURIComponent(JSON.stringify(data));
    $('#' + hiddenId).val(encodedData);
}

function uriDecodingParameter(hiddenId) {
    let encodedData = $('#' + hiddenId).val();
    let decodedData = JSON.parse(decodeURIComponent(encodedData));
    return decodedData;
}
'use strict'

$(document).ready(function() {

});

function uriEncodingParameter(data, hiddenId) {
    var encodedData = encodeURIComponent(JSON.stringify(data));
    $('#' + hiddenId).val(encodedData);	
}


function uriDecodingParameter(hiddenId) {
    var encodedData = $('#' + hiddenId).val();
    var decodedData = JSON.parse(decodeURIComponent(encodedData));
    
    return decodedData;
}
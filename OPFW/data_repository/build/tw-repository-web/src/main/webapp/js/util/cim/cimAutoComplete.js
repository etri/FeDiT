function cimAutoCompelete(param){
    let prevIdInputValue = null;
    let list = null;
    let isAutoComplete = false;

    let inputId = param['inputId'];
    let jqueryInputId = '#'+inputId;
    let autoMakerInfoLabelID = param['autoMakerInfoLabelID'];

    let autoMakerContainerID = param['autoMakerContainerID'];
    let autoMakerListID = param['autoMakerListID'];
    let jqueryAutoMakerListID = '#'+autoMakerListID;

    let argPropertyName = param["argPropertyName"];
    let argProperty = param["argProperty"];
    let argAdditionalPropertyName = param["argAdditionalPropertyName"];
    let argAdditionalProperty = param["argAdditionalProperty"];
    let updateListUrl = param["updateListUrl"];
    let required = param["required"]==true?true:false;

    let invalidColor = "#ffdcd2";

    let data = param["data"];
    let left = param["left"];
    let inputDataField = param['inputDataField'];
    let searchLike = false;


    if(typeof param['searchLike'] !== 'undefined'){
        searchLike = param['searchLike'];
        if(searchLike!='true' && searchLike!='false'){
            alert("cimAutoCompelete의 searchLike parameter가 유효하지 않습니다.");
        }
    }

    let checkInvalid = !searchLike || required;

    if(typeof left !== 'undefined'){
        document.getElementById(autoMakerContainerID).style.left = left;
    }

    function makeAutoComplete(txt) {
        let maxListCount = 20;
        let curListCount = 0;

        $(jqueryAutoMakerListID).children().remove();

        if(list.length <= 0) {
            document.getElementById(autoMakerInfoLabelID).innerText = '"' + txt + '"를 포함하는 아이템이 없습니다.';
            document.getElementById(autoMakerContainerID).style.visibility = "visible";
            if (checkInvalid) {
                document.getElementById(inputId).style.backgroundColor = invalidColor;
            }
            return;
        }


        document.getElementById(autoMakerInfoLabelID).innerText = '아이템들';

        let existValidItem = false;

        list.forEach(function(arg){
            let strArgPropertyValue = "";
            if(null != arg[argProperty]){
                strArgPropertyValue = arg[argProperty].toString();
            }

            if(txt == strArgPropertyValue){
                existValidItem = true;
            }

            var html = "<div " + argProperty + "="+arg[argProperty]+">";
            html += argPropertyName+":"+strArgPropertyValue;
            if( typeof argAdditionalPropertyName !== 'undefined') {
                html += ", "+argAdditionalPropertyName+":"+arg[argAdditionalProperty];
            }
            html += "</div>";
            $(jqueryAutoMakerListID).append(html);

            //$(jqueryAutoMakerListID).append($('<div>').text(argPropertyName+":"+strArgPropertyValue+", "+argAdditionalPropertyName+":"+arg[argAdditionalProperty]).attr({argProperty:arg[argProperty]}));

            curListCount++;
            if(curListCount>maxListCount){
                return true;
            }
        });

        $(jqueryAutoMakerListID).children().each(function(){
            $(this).mousedown(function(){
                var argValue = $(this).attr(argProperty);
                $(jqueryInputId).val(argValue);
                //$('#insert_target').val("key : "+$(this).attr('key')+ ", data : " + $(this).text());
                $(jqueryAutoMakerListID).children().remove();
                isAutoComplete = true;

                if (checkInvalid) {
                    document.getElementById(inputId).style.backgroundColor = "#ffffff";
                }
            });
        });

        if (checkInvalid) {
            if (existValidItem) {
                document.getElementById(inputId).style.backgroundColor = "#ffffff";
            } else {
                document.getElementById(inputId).style.backgroundColor = invalidColor;
            }
        }


        if(curListCount>0){
            document.getElementById(autoMakerContainerID).style.visibility = "visible";
        }else{
            document.getElementById(autoMakerContainerID).style.visibility = "hidden";
        }
    }

    function callbackAutoComplete(txt, focus = false) {
        if( focus == false && txt == prevIdInputValue ){
            return;
        }

        prevIdInputValue = txt;

        let json_data = (typeof data === 'undefined') ? {} : data;
        json_data[inputDataField] = txt;


        $.ajax({
            url: updateListUrl,
            type: "POST",
            data : json_data,
            dataType: "json",
            success: function (res) {
                if (res.result == "success") {
                    list = res.list;

                    makeAutoComplete(txt);
                } else {
                    alert(res.message);
                }
            }
        });
    }

    $(jqueryInputId).focus(function(){
        callbackAutoComplete($(this).val(), true);
    });

    $(jqueryInputId).keyup(function(){
        callbackAutoComplete($(this).val());
    });

    $(jqueryInputId).keydown(function(event){
        if(isAutoComplete) {  //autoMakerChargerModel 자식이 선택 되었으면 초기화
            // $('#insert_target').val('')
        }
    });

    $(jqueryInputId).blur(function(){
        if(checkInvalid) {
            if (false == required && strUtil.isEmpty($(this).val())) {
                document.getElementById(inputId).style.backgroundColor = "#ffffff";
            }
        }
        document.getElementById(autoMakerContainerID).style.visibility = "hidden";
    });
}
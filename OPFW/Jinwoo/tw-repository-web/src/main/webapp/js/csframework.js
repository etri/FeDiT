// 지정된 폼의 req class 항목들의 값 입력 여부 확인
function checkForm(formId){
	var result = true;
	$("#" + formId).find(".req").each(function(){
		if(isEmptyString ($(this).val())){ //정규식 체크하기
			alert($(this).data("name")+" 입력하세요!");
			result = false;
			$(this).focus();
			return false;
		}
	});
	return result;
}

// 빈문자열 검사
function isEmptyString (value){
	return value == null || (/^\s*$/).test (value) ;
}

// 아이디를 사용한 빈문자열 검사
function isEmptyStringId (id) {
	return isEmptyString ($("#" + id).val ());
}
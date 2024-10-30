(function() {
    'use strict'	
    $(document).ready(function() {
       
    });
})();


function backAndforwardCheck() {
	
	/*
	window.onpageshow = function(event) {
		if ( event.persisted || (window.performance && window.performance.navigation.type == 2)) {
	    // Back Forward Cache로 브라우저가 로딩될 경우 혹은 브라우저 뒤로가기 했을 경우
	    backAndforwardCheck();
	    //window.location.href = contextPath + '/dt/model/list?menuCd=M0401';
		}
	}
	*/
	
	alert("발생!");
	var preProcData = JSON.parse($('#preprocProPerty').val());
	console.log(preProcData);
}

function refreshOrClose(event) {
	
	/*
		<script>
	const handleBeforeUnload = (event: Event) => {
	  event.preventDefault();
	  event.returnValue = false; // Chrome requires returnValue to be set.
	};
	window.addEventListener('beforeunload', handleBeforeUnload);
	</script>

	
	*/
	alert("발생!");
	var preProcData = JSON.parse($('#preprocProPerty').val());
	console.log(preProcData);
	
	alert('dddd');
	event.preventDefault();

	// 대표적으로 Chrome에서는 returnValue 설정이 필요합니다.
	event.returnValue = '';	
	
}


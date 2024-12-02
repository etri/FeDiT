$(document).ready(function() {
	//달력 모바일 화면에서 위치조정 하는 기능
	$(".datepicker").click(function(){
		if(window.innerWidth<768){
			$(".datepicker").css("left", "0px");
		}
	})
	
	//화면크기에 따른 구성 변화 기능
	$(window).resize(function(){
		if(window.innerWidth<768){
			$(".sidebar-toggleNew").show();
		}
		else{
			$(".sidebar-toggleNew").hide();
		}
	}).resize();
});
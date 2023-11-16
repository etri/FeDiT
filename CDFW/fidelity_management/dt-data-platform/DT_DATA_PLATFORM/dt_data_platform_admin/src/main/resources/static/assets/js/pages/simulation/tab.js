(function() {
    'use strict'
	$('#loading').hide();
	//$('#tab_preproc').trigger("click");
    $(document).ready(function() {
    	
    	$('#tab_input_simulation').on('click', function() {
    		$('#tab_input_simulation_range').show();
    		$('#tab_result_simulation_range').hide();
    		
    		$('#tab_input_simulation').attr('class','nav-link active');
    		$('#tab_result_simulation').attr('class','nav-link');
    	});
    	
    	$('#tab_result_simulation').on('click', function() {
    		$('#tab_input_simulation_range').hide();
    		$('#tab_result_simulation_range').show();
    		
    		$('#tab_input_simulation').attr('class','nav-link');
    		$('#tab_result_simulation').attr('class','nav-link active');
    		
    		
    	    var chartContainer = document.getElementById('view2');
    	    var view2 = echarts.init(chartContainer);
    	    view2.resize();
    	    // 창 크기 변경 시 그래프 크기 조정
    	    //window.addEventListener('resize', function () {
    	    //   myChart.resize();
    	    //});    		
    		
    	});
    	
   
    	
    });
})();


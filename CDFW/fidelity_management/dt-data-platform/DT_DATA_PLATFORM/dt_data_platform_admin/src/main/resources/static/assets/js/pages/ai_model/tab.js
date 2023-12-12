(function() {
    'use strict'	
	$('#loading').hide();
	//$('#tab_preproc').trigger("click");
    $(document).ready(function() {
    	
    	var viewId0 = document.getElementById('view0');
    	var viewId1 = document.getElementById('view1');
    	var viewId2 = document.getElementById('view2');
    	var viewId3 = document.getElementById('view3');
    	var viewId4 = document.getElementById('view4');
    	
    	var eChart0 = null;
    	var eChart1 = null;
    	var eChart2 = null;
    	var eChart3 = null;
    	var eChart4 = null;
    	
    	if (viewId0 != null && viewId0 != '') {
    		eChart0 = echarts.init(document.getElementById('view0'));
    	}
    	if (viewId1 != null && viewId1 != '') {
    		eChart1 = echarts.init(document.getElementById('view1'));
    	}
    	if (viewId2 != null && viewId2 != '') {
    		eChart2 = echarts.init(document.getElementById('view2'));
    	}
    	if (viewId3 != null && viewId3 != '') {
    		eChart3 = echarts.init(document.getElementById('view3'));
    	}
    	if (viewId4 != null && viewId4 != '') {
    		eChart4 = echarts.init(document.getElementById('view4'));
    	}

		init();
    		
    	$('#tab_getdata').on('click', function() {
    		setTabMenuCookie('main_tab', 'tab_getdata');
    		$('#tab_getdata_range').show();
    		$('#tab_preproc_range').hide();
    		
    		$('#tab_getalgo_range').hide();
    		$('#tab_getalgo_range_top').hide();
    		$('#tab_getalgo_range_bottom').hide();
    		
    		$('#tab_excmodel_range').hide();
    		$('#tab_savemodel_range').hide();
    		
    		$('#tab_getdata').attr('class','nav-link active');
    		$('#tab_preproc').attr('class','nav-link');
    		$('#tab_getalgo').attr('class','nav-link');
    		$('#tab_excmodel').attr('class','nav-link');
    		$('#tab_savemodel').attr('class','nav-link');
    	});
    	
    	$('#tab_preproc').on('click', function() {
    		setTabMenuCookie('main_tab', 'tab_preproc');
    		$("#tab_validate").trigger("click");
    		
    		$('#tab_getdata_range').hide();
    		$('#tab_preproc_range').show();
    		
    		$('#tab_getalgo_range').hide();
    		$('#tab_getalgo_range_top').hide();
    		$('#tab_getalgo_range_bottom').hide();
    		
    		$('#tab_excmodel_range').hide();
    		$('#tab_savemodel_range').hide();
    		$('#tab_interval_range').hide();
    		$('#tab_unit_range').hide();
    		
    		
    		$('#tab_getdata').attr('class','nav-link');
    		$('#tab_preproc').attr('class','nav-link active');
    		$('#tab_getalgo').attr('class','nav-link');
    		$('#tab_excmodel').attr('class','nav-link');
    		$('#tab_savemodel').attr('class','nav-link');
        	
    		if (eChart0 != null) {
    			eChart0.resize();	
    		}
    		if (eChart1 != null) {
    			eChart1.resize();	
    		}
    		if (eChart2 != null) {
    			eChart2.resize();	
    		}
    		if (eChart3 != null) {
    			eChart3.resize();	
    		}
    		if (eChart4 != null) {
    			eChart4.resize();	
    		}
    		
    	});
    	
    	$('#tab_getalgo').on('click', function() {
    		setTabMenuCookie('main_tab', 'tab_getalgo');
    		$('#tab_getdata_range').hide();
    		$('#tab_preproc_range').hide();
    		
    		$('#tab_getalgo_range').show();
    		$('#tab_getalgo_range_top').show();
    		$('#tab_getalgo_range_bottom').show();
    		
    		$('#tab_excmodel_range').hide();
    		$('#tab_savemodel_range').hide();
    		$('#tab_interval_range').hide();
    		$('#tab_unit_range').hide();
    		
    		$('#tab_getdata').attr('class','nav-link');
    		$('#tab_preproc').attr('class','nav-link');
    		$('#tab_getalgo').attr('class','nav-link active');
    		$('#tab_excmodel').attr('class','nav-link');
    		$('#tab_savemodel').attr('class','nav-link');
    		
    		if (eChart0 != null) {
    			eChart0.resize();	
    		}
    		if (eChart1 != null) {
    			eChart1.resize();	
    		}
    		if (eChart2 != null) {
    			eChart2.resize();	
    		}
    		if (eChart3 != null) {
    			eChart3.resize();	
    		}
    		if (eChart4 != null) {
    			eChart4.resize();	
    		}
    	});
    	
    	$('#tab_excmodel').on('click', function() {
    		setTabMenuCookie('main_tab', 'tab_excmodel');
    		$('#tab_getdata_range').hide();
    		$('#tab_preproc_range').hide();
    		
    		$('#tab_getalgo_range').hide();
    		$('#tab_getalgo_range_top').hide();
    		$('#tab_getalgo_range_bottom').hide();
    		
    		$('#tab_excmodel_range').show();
    		$('#tab_savemodel_range').hide();
    		$('#tab_interval_range').hide();
    		$('#tab_unit_range').hide();
    		
    		$('#tab_getdata').attr('class','nav-link');
    		$('#tab_preproc').attr('class','nav-link');
    		$('#tab_getalgo').attr('class','nav-link');
    		$('#tab_excmodel').attr('class','nav-link active');
    		$('#tab_savemodel').attr('class','nav-link');
    	});
    	
    	$('#tab_savemodel').on('click', function() {
    		setTabMenuCookie('main_tab', 'tab_savemodel');
    		$('#tab_getdata_range').hide();
    		$('#tab_preproc_range').hide();
    		
    		$('#tab_getalgo_range').hide();
    		$('#tab_getalgo_range_top').hide();
    		$('#tab_getalgo_range_bottom').hide();
    		
    		$('#tab_excmodel_range').hide();
    		$('#tab_savemodel_range').show();
    		$('#tab_interval_range').hide();
    		$('#tab_unit_range').hide();
    		
    		$('#tab_getdata').attr('class','nav-link');
    		$('#tab_preproc').attr('class','nav-link');
    		$('#tab_getalgo').attr('class','nav-link');
    		$('#tab_excmodel').attr('class','nav-link');
    		$('#tab_savemodel').attr('class','nav-link active');
    		
    		if (eChart0 != null) {
    			eChart0.resize();	
    		}
    		if (eChart1 != null) {
    			eChart1.resize();	
    		}
    		if (eChart2 != null) {
    			eChart2.resize();	
    		}
    		if (eChart3 != null) {
    			eChart3.resize();	
    		}
    		if (eChart4 != null) {
    			eChart4.resize();	
    		}
    	    //var canvas = $('#tab_savemodel').find("canvas"); // href 값을 이용해 캔버스 요소를 찾음
    	    //canvas.width(canvas.parent().width()); // 캔버스 요소의 width를 조정함
    	});
    	
    	
    	//전처리 하단 탭
    	$('#tab_missing').on('click', function() {
    		setTabMenuCookie('sub_tab', 'tab_missing');
    		$('#tab_missing_range').show();
    		$('#tab_outlier_range').hide();
    		$('#tab_outlier_range2').hide();
    		$('#tab_validate_range').hide();
    		$('#tab_interval_range').hide();
    		$('#tab_unit_range').hide();
    		
    		$('#tab_missing').attr('class','nav-link active');
    		$('#tab_outlier').attr('class','nav-link');
    		$('#tab_validate').attr('class','nav-link');
    		$('#tab_interval').attr('class','nav-link');
    		$('#tab_unit').attr('class','nav-link');
    		
    	});
    	
    	$('#tab_outlier').on('click', function() {
    		setTabMenuCookie('sub_tab', 'tab_outlier');
    		$('#tab_missing_range').hide();
    		$('#tab_outlier_range').show();
    		$('#tab_outlier_range2').hide();
    		$('#tab_validate_range').hide();
    		$('#tab_interval_range').hide();
    		$('#tab_unit_range').hide();
    		
    		$('#tab_missing').attr('class','nav-link');
    		$('#tab_outlier').attr('class','nav-link active');
    		$('#tab_validate').attr('class','nav-link');
    		$('#tab_interval').attr('class','nav-link');
    		$('#tab_unit').attr('class','nav-link');
    	});    	
    	
    	$('#tab_validate').on('click', function() {
    		setTabMenuCookie('sub_tab', 'tab_validate');
    		$('#tab_missing_range').hide();
    		$('#tab_outlier_range').hide();
    		$('#tab_outlier_range2').hide();
    		$('#tab_validate_range').show();
    		$('#tab_interval_range').hide();
    		$('#tab_unit_range').hide();
    		
    		$('#tab_missing').attr('class','nav-link');
    		$('#tab_outlier').attr('class','nav-link');
    		$('#tab_validate').attr('class','nav-link active');
    		$('#tab_interval').attr('class','nav-link');
    		$('#tab_unit').attr('class','nav-link');
    	});   	
    
    	$('#tab_interval').on('click', function() {
    		setTabMenuCookie('sub_tab', 'tab_interval');
    		$('#tab_missing_range').hide();
    		$('#tab_outlier_range').hide();
    		$('#tab_outlier_range2').hide();
    		$('#tab_validate_range').hide();
    		$('#tab_interval_range').show();
    		$('#tab_unit_range').hide();
    		
    		$('#tab_missing').attr('class','nav-link');
    		$('#tab_outlier').attr('class','nav-link');
    		$('#tab_validate').attr('class','nav-link');
    		$('#tab_interval').attr('class','nav-link active');
    		$('#tab_unit').attr('class','nav-link');
    	});
    	
    	$('#tab_unit').on('click', function() {
    		setTabMenuCookie('sub_tab', 'tab_unit');
    		$('#tab_missing_range').hide();
    		$('#tab_outlier_range').hide();
    		$('#tab_outlier_range2').hide();
    		$('#tab_validate_range').hide();
    		$('#tab_interval_range').hide();
    		$('#tab_unit_range').show();
    		
    		$('#tab_missing').attr('class','nav-link');
    		$('#tab_outlier').attr('class','nav-link');
    		$('#tab_validate').attr('class','nav-link');
    		$('#tab_interval').attr('class','nav-link');
    		$('#tab_unit').attr('class','nav-link active');
    	});
    	
    	
    });
})();


function init() {
	$('[data-zr-dom-id="zr_0"]').each(function() {
		  $(this).width('100%');
	});
	
	$('#tab_getdata_range').show();
	$('#tab_preproc_range').hide();
	$('#tab_getalgo_range').hide();
	$('#tab_excmodel_range').hide();
	$('#tab_savemodel_range').hide();
	$('#tab_outlier_range2').hide();
	
	$('#tab_getdata').attr('class','nav-link active');
	$('#tab_preproc').attr('class','nav-link');
	$('#tab_getalgo').attr('class','nav-link');
	$('#tab_excmodel').attr('class','nav-link');
	$('#tab_savemodel').attr('class','nav-link');
	
}





function setTabMenuCookie(name, value) {
	if (name == 'main_tab') {
		if (value == 'tab_preproc') {
			deleteCookie(name);
			document.cookie = name + "=" + value;	
		} else {
			deleteCookie('sub_tab');
			deleteCookie('main_tab');
			document.cookie = name + "=" + value;
		}
	} else {
		deleteCookie(name);
		document.cookie = name + "=" + value;
	}
	
}

function deleteCookie(name) {
	  //$.cookie(name, null, {path:'/'})
	  document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
}

function getCookie(name) {
	var cookies = document.cookie.split(';');
	var result = '';
	
	for (var i = 0; i < cookies.length; i++) {
		var cookie = cookies[i].trim();
		if (cookie.indexOf(name + "=") === 0) {
			var value = cookie.substring(name.length + 1);
			result = value;
			break;
		}
	}
	return result;
}

/*
$(document).ready(function() {
  // 읽어올 쿠키 이름
  var cookieName = "myCookie";
  
  // 쿠키에서 값을 가져옴
  var cookies = document.cookie.split(';');
  for (var i = 0; i < cookies.length; i++) {
    var cookie = cookies[i].trim();
    if (cookie.indexOf(cookieName + "=") === 0) {
      var value = cookie.substring(cookieName.length + 1);
      // 가져온 값을 사용하여 작업 수행
      console.log("Loaded value from cookie:", value);
      break;
    }
  }
});

*/
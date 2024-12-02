
var token = $("meta[name='_csrf']").attr("content");
var header = $("meta[name='_csrf_header']").attr("content");
var menuNo = $("meta[name='_menu_no']").attr("content");
	
$(document).ready(function() {
	
	//메뉴네비바 활성화 css
	if(menuNo!=null&&menuNo!="")$('.'+menuNo).addClass('active');
	
/*	//스프링시큐리티 모든 ajax요청리 csrf토큰 http헤더에 추가
	$(document).ajaxSend(function(e, xhr, options) {
        xhr.setRequestHeader(header, token);
    });*/
	
	
	//jquery Tooltip이벤트 바인딩
	setTimeout(function(){
		$(".isToolTip").tooltip();
		$('.isToolTip').click(function() {
		    $(this).tooltip("hide");
		});
	},1000);
    
	//로그아웃
	$("#logOutAlink").on('click',function(e){
		$("#logoutBtn").trigger('click');
	})
	
	jQuery.fn.serializeObject = function() { 
		var obj = null; try { 
			if ( this[0].tagName && this[0].tagName.toUpperCase() == "FORM" ) { 
				var arr = this.serializeArray(); 
				if ( arr ) { obj = {}; 
				jQuery.each(arr, function() { 
					obj[this.name] = this.value; 
					}); 
				}//if ( arr ) { 
			} }catch(e){/*ignore*/} finally {} return obj;};

	//모달관련 이벤트등록
	bindModalEvent();
	
	initDatepicker();
	
	//공통검색박스 초기화버튼
	$(".refesh-srhfrm-btn").on('click',function(e){
		var frmId = $(this).attr('for');
		$("#"+frmId)[0].reset();
		initDatepicker();
	});
	
	//autoHoverdropdownToggle();
});

function initDatepicker(){
	  $(".datepicker").datepicker({
          dateFormat: 'yy-mm-dd' //달력 날짜 형태
          ,showOtherMonths: true //빈 공간에 현재월의 앞뒤월의 날짜를 표시
          ,showMonthAfterYear:true // 월- 년 순서가아닌 년도 - 월 순서
          ,changeYear: true //option값 년 선택 가능
          ,changeMonth: true //option값  월 선택 가능                
          ,showOn: "both" //button:버튼을 표시하고,버튼을 눌러야만 달력 표시 ^ both:버튼을 표시하고,버튼을 누르거나 input을 클릭하면 달력 표시  
          ,yearSuffix: "년" //달력의 년도 부분 뒤 텍스트
          ,monthNamesShort: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'] //달력의 월 부분 텍스트
          ,monthNames: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'] //달력의 월 부분 Tooltip
          ,dayNamesMin: ['일','월','화','수','목','금','토'] //달력의 요일 텍스트
          ,dayNames: ['일요일','월요일','화요일','수요일','목요일','금요일','토요일'] //달력의 요일 Tooltip
          ,minDate: "-5Y" //최소 선택일자(-1D:하루전, -1M:한달전, -1Y:일년전)
          ,maxDate: "+5y" //최대 선택일자(+1D:하루후, -1M:한달후, -1Y:일년후)  
      });                    
      
	  $('.picker-ago').datepicker('setDate', '-3M'); //(-1D:하루전, -1M:한달전, -1Y:일년전), (+1D:하루후, -1M:한달후, -1Y:일년후)
      $('.picker-after').datepicker('setDate', 'today'); //(-1D:하루전, -1M:한달전, -1Y:일년전), (+1D:하루후, -1M:한달후, -1Y:일년후)     
}

function miniModalClose(){
        $("#miniCommonModal").fadeOut(); 
}

function miniModalOpen(headerText, content,bodyHeader,hideYflow){
	miniModalClear();
    
	if(hideYflow){
		$("#miniCommonModalContent").css("overflow-y","clip");
		$("#miniCommonModalContentTitle").css("padding-top","10px");
		
	}else{
		$("#miniCommonModalContent").css("overflow-y","auto");
		$("#miniCommonModalContentTitle").css("padding-top","0px");
	}
	
	$("#miniCommonModalHeader").text(headerText);
	$("#miniCommonModalContent").html(content);
	if(bodyHeader) $("#miniCommonModalContentTitle").html(bodyHeader);
    $("#miniCommonModal").css('display','flex').hide().fadeIn();
}

function miniModalClear(){
	$("#miniCommonModalHeader").empty();
	$("#miniCommonModalContent").empty();
	$("#miniCommonModalContentTitle").empty();
}


function bindModalEvent(){
	
    $("#miniCommonModalCloseBtn").click(function(){
    	miniModalClose(); 
    });
	
	$("body").on("click", function(event) { 
        if(event.target.className == 'closeModalBtn' || event.target.className == 'popup-wrap'){
        	miniModalClose();
        }
    });
	
	$(document).keydown(function(event) {
	    if ( event.keyCode == 27 || event.which == 27 ) {
	    	miniModalClose();
	    }
	});
	
	$(document).on('click','#copyErrBtn',function(e){
		var errText = document.getElementById("errText").textContent;
		var tempArea = document.createElement('textarea'); 
		document.body.appendChild(tempArea); 
		tempArea.value = errText;
		tempArea.select(); 
		document.execCommand('copy');
		document.body.removeChild(tempArea);
		alert('오류내용이 클립보드에 복사되었습니다.');
	})
	
	$(document).on('click','.common-file-list-table tbody tr',function(e){
		var fileId = $(this).find('.file-modal-hidden-id').val();
		var fileSn = $(this).find('.file-modal-hidden-sn').val();
		var encodingAt = false;
		if(confirm("다운로드 받으실 파일을 EUC-KR로 변환하시겠습니까?\n(원본파일 인코딩은 UTF-8입니다.)")){
			encodingAt = true;
		}
		if(fileId&&fileSn)location.href="/udt/file/fileDownload.do?fileId="+fileId+"&fileSn="+fileSn+"&encodingAt="+encodingAt;
	})
	
	$(document).on('keyup','.datepicker-custom',function(e){
		var objValue = $(this).val();
		var v = objValue.replace("--", "-");

	    if (v.match(/^\d{4}$/) !== null) {
	        v = v + '-';
	    } else if (v.match(/^\d{4}\-\d{2}$/) !== null) {
	        v = v + '-';
	    }
	 
	    $(this).val(v);
	})
	
	//form reset 커스터마이징
	$.fn.clearForm = function () {
	  return this.each(function () {
	    var type = this.type,
	      tag = this.tagName.toLowerCase();
	    if (tag === 'form') {
	      return $(':input', this).clearForm();
	    }
	    if (
	      type === 'text' ||
	      type === 'password' ||
	      type === 'hidden' ||
	      tag === 'textarea'
	    ) {
	      this.value = '';
	    } else if (type === 'checkbox' || type === 'radio') {
	      this.checked = false;
	    } else if (tag === 'select') {
	      this.selectedIndex = -1;
	    }
	  });
	};
	
	
}


function autoHoverdropdownToggle(){
	$(".dropdown-toggle").mouseover(function(){
		var isOpen = $(this).attr('aria-expanded');
		if(isOpen=="false"){
			$(this).trigger('click');
		}
	});
	$(".dropdown-toggle").mouseleave(function(){
		var isOpen = $(this).attr('aria-expanded');
		if(isOpen=="true"){
			$(this).trigger('click');
		}
		//여기 드롭다운메뉴일경우 안접히게 하는거 추가해야댐
	})
}


function showAjaxFailedErrorPop(request, status, error){
	
	var headerText ="오류내용 출력";
	var bodyHeader='<div style="height: 45px;">'
			+'<small class="float-right">'
				+'<button class="copy-err-btn" type="button" id="copyErrBtn">'
				+'복사하기</button></small>'
				+'<strong>에러내용을 복사하여 관리자에게 문의해주세요.</strong><br/>'
				+'<strong>[code]:'+request.status+'</div>';
				
    var content = '<div id="errText" class="errText">'+request.responseText+'<br/>'+error+'</div>';
	
   
	miniModalOpen(headerText,content,bodyHeader);
	$("#errText").find('style').text('');
	$("#errText").find('h3').remove();
}


//byte를 용량 계산해서 반환
function byteCalculation(bytes) {
	 
    var bytes = parseInt(bytes);
    var s = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    var e = Math.floor(Math.log(bytes)/Math.log(1024));
  
    if(e == "-Infinity") return "0 "+s[0]; 
    else  return (bytes/Math.pow(1024, Math.floor(e))).toFixed(2)+" "+s[e];

}

//새창 센터에 띄우기
function popupCenter(href, w, h) {
	var xPos = (document.body.offsetWidth/2) - (w/2); // 가운데 정렬
	xPos += window.screenLeft; // 듀얼 모니터일 때
	var yPos = (document.body.offsetHeight/2) - (h/2);

	window.open(href, "pop_name", "width="+w+", height="+h+", left="+xPos+", top="+yPos+", menubar=yes, status=yes, titlebar=yes, resizable=yes");
}



/**넌..나중에... 해줄게..**/
function convertCronTabToText(cronExpress){
	var cronArr = cronString.split(' ');
	if(cronArr.length!=6){
		alert('크론 표현식이 잘못되었습니다.');
		return;
	}
	if(cronArr.length==7){
		alert('년도가 포함된 표현식은 아직 사용하실 수 없습니다.');
		return;
	}
	/*초 분 시 일 월 요일 연도(생략가능)*/
	var sec = cronArr[0];
	var min = cronArr[1];
	var hou = cronArr[2];
	var day = cronArr[3];
	var mnt = cronArr[4];
	var dayOfWeek = cronArr[5];
	
}

function checkValidDate(value) {
	var result = true;
	try {
	    var date = value.split("-");
	    var y = parseInt(date[0], 10),
	        m = parseInt(date[1], 10),
	        d = parseInt(date[2], 10);
	    
	    var dateRegex = /^(?=\d)(?:(?:31(?!.(?:0?[2469]|11))|(?:30|29)(?!.0?2)|29(?=.0?2.(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00)))(?:\x20|$))|(?:2[0-8]|1\d|0?[1-9]))([-.\/])(?:1[012]|0?[1-9])\1(?:1[6-9]|[2-9]\d)?\d\d(?:(?=\x20\d)\x20|$))?(((0?[1-9]|1[012])(:[0-5]\d){0,2}(\x20[AP]M))|([01]\d|2[0-3])(:[0-5]\d){1,2})?$/;
	    result = dateRegex.test(d+'-'+m+'-'+y);
	} catch (err) {
		result = false;
	}    
    return result;
}

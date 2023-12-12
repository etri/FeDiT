<%@ page contentType="text/html; charset=utf-8" pageEncoding="utf-8"%>
<%@include file ="/WEB-INF/jsp/layout/header.jsp" %>

<!-- JS 기능 시작 -->
<script>

	var currSrcTbNm ="";
	var currSrcTbKrNm ="";

	$(document).ready(function() {
		
		bindEvent();//이벤트 바인딩
		
	});

	
	
	/* 이벤트 등록 */
	function bindEvent(){
		
		$(".hidden_file").on('change',function(){
	      if($(this).val()!=''){
	    	  var fileName = $(this).val().split('\\').pop();
			  $(this).closest('div').find(".upload-name").val(fileName);
			  $(this).closest('div').find(".fa").show();
	      }
		});
		
		$(".cancle-file").on('click',function(){
			$(this).closest('div').find(".hidden_file").val('');
			$(this).closest('div').find(".upload-name").val('');
			$(this).closest('div').find(".require-hide").hide();
		});
		
		$('.upload-file').on('click',function(){
			var inputFileTag = $(this).closest('div').find(".hidden_file");
			var fileName = inputFileTag.val().split('\\').pop();
			
			var srcDataNm = currSrcTbKrNm;
			if(currSrcTbNm==""||currSrcTbKrNm==""||fileName==""){
				alert('오류가 발생하였습니다. 관리자에게 문의해주세요.')
				return;
			}
			if(confirm("["+srcDataNm+"]원천데이터를 갱신하시겠습니까?\n(기존 원천데이터는 데이터베이스에 백업됩니다.)")){
				var file = inputFileTag[0].files[0];
				var tbNm = currSrcTbNm;
				uploadIndividualFile(file,srcDataNm,tbNm);
			}
		});
		
	
		
		$('#showUploadFileDiv').on('click',function(e){
			var _this= $(this);
			if(_this.hasClass('toggle-off')){
				$("#showFileBoxRow").show();
				_this.removeClass("toggle-off");
				_this.addClass("toggle-on");
				_this.find('.fa').removeClass("fa-chevron-down");
				_this.find('.fa').addClass("fa-chevron-up");
			}else{
				$("#showFileBoxRow").hide();
				_this.addClass("toggle-off");
				_this.removeClass("toggle-on");
				_this.find('.fa').addClass("fa-chevron-down");
				_this.find('.fa').removeClass("fa-chevron-up");
			}
		})
		
		$(document).on('click','.folder-list li',function(e){
			if($(this).hasClass('active-li')){
				return;
			}else{
				$('.folder-list li').removeClass('active-li');
				$(this).addClass('active-li');
				var tbNm = $(this).find('input').val();
				currSrcTbNm=tbNm;
				currSrcTbKrNm=$(this).find('.src-data-nm').text();
				clearSrchFrm();
				fn_selectSrcDataFileHst();
			}
		});
		
		$(".custom-cal-btn").on('click',function(e){
			var inputId = $(this).attr('for');
			//$("#"+inputId).trigger('click');
			$("#"+inputId).focus();
		});
		
		$(".is-src-enter-key").keydown(function(key) {
	         if (key.keyCode == 13) {
	        	 fn_selectSrcDataFileHst();
	         }
	    });
		
		$("#searchFileBtn").on('click',function(e){
			fn_selectSrcDataFileHst();
		});
		
		$(document).on('click','.is-download-tr',function(e){
			var fileId = $(this).find(".hidden-file-id").val();
			if(fileId){
				if(confirm("파일을 다운로드 받으시겠습니까?")){
					location.href="/udt/file/fileDownload.do?fileId="+fileId+"&fileSn="+1+"&encodingAt="+false;	
				}
			}
		});
		
		
		//원천데이터 첫줄강제클릭
		$('.folder-list li').first().trigger('click');
	}
	
	function clearSrchFrm(){
		$("#srchFrm")[0].reset();
		$("#uploadCancleBtn").trigger('click');
		if($("#showUploadFileDiv").hasClass('toggle-on')){
       	 $("#showUploadFileDiv").trigger('click');
        }
		
		initDatepicker();
	}
	
	function makeSelectSrcDatFileHstParam(pageNo){
		
		var returnParamObj= $("#srchFrm").serializeObject();
		returnParamObj.pageIndex=pageNo;
		returnParamObj.srcTbEnNm=currSrcTbNm;
		returnParamObj.insertStartDt=returnParamObj.insertStartDt.replace(/-/gi,'');
		returnParamObj.insertEndDt=returnParamObj.insertEndDt.replace(/-/gi,'');
		
		return returnParamObj;
	}
	
	function fn_validationDate(params){
		if(!checkValidDate($("#insertStartDt").val())){
			alert('검색시작일의 날짜형식을 확인해주세요.');
			$("#insertStartDt").focus();
			return  false;
		}
		if(!checkValidDate($("#insertEndDt").val())){
			alert('검색종료일의 날짜형식을 확인해주세요.');
			$("#insertEndDt").focus();
			return  false;
		}
				
		var d1 = params.insertStartDt
		var d2 = params.insertEndDt
		var t1 = parseInt(d1);
		var t2 = parseInt(d2);
		
		if(t1>t2){
			alert('검색기간을 확인해주세요.');
			$("#insertEndDt").focus();
			return  false;
		}

		return true;
	}
	
	function fn_selectSrcDataFileHst(pageNo){
		if(!pageNo)pageNo=1;
		var param = makeSelectSrcDatFileHstParam(pageNo);
		
		var flag = fn_validationDate(param);
		
		if(flag){
			$("#srcDataFileHstListDiv").loading('start');
			$.ajax({
			    url:"<c:url value='/udt/file/selectSrcDataFileHstByTbNm.do'/>",
			    data: JSON.stringify(param),
				dataType:'text',
				processData:false,
				contentType:"application/json",
			    type:'POST',
			    success: function(data){
			    	$("#srcDataFileHstListDiv").html(data);
			    	setTimeout(function(e){
			    		$("#srcDataFileHstListDiv").loading('stop');
			    		$('.is-file-size-td').each(function(e){
							var bytes = $(this).text();
							$(this).text(byteCalculation(bytes));
						})
			    	},200);
			    }
			});
		}
	}
	
	function uploadIndividualFile(file,srcDataNm,tbNm){
		var form = new FormData();
		form.append("file",file);
		form.append("srcDataTbNm",tbNm);
		$('#stopDivWhole').loading('start');
		$.ajax({
			  url:"<c:url value='/udt/file/uploadIndividualFile.do'/>"
	          ,type : "POST"
	          ,processData : false
	          ,contentType : false
	          ,data : form
	          ,success:function(response) {
	        	  setTimeout(function(){
		             alert("원천데이터["+srcDataNm+"] 갱신에 성공하였습니다.");
		             $("#uploadCancleBtn").trigger('click');
		             $("#stopDivWhole").loading('stop');
		             fn_selectSrcDataFileHst();
		             if($("#showUploadFileDiv").hasClass('toggle-on')){
		            	 $("#showUploadFileDiv").trigger('click');
		             }
	        	  },100);
	          }
	          ,error:function(request, status, error){
	        	  setTimeout(function(){
		      		alert("갱신에 실패하였습니다. 에러내용을 출력합니다.");
		      		showAjaxFailedErrorPop(request, status, error);
		      		$('#stopDivWhole').loading('stop');
	        	  },100);
	      	  }
      	});
	}
	
</script>
<!-- JS 기능 끝 -->

<!-- 본문 시작 -->
<div class="wrapper wrapper-content">
	<div class="row" style="justify-content: center;">
        <div class="col-lg-11">
            <div class="ibox">
            	<div class="ibox-title">
                    <h3>원천데이터 목록</h3>
                    <div class="ibox-tools">
                        <a class="collapse-link">
                            <i class="fa fa-chevron-up"></i>
                        </a>
                    </div>
                </div>
                <div class="ibox-content" id="stopDivWhole">
					<div class="row">
						<div class="col-sm-2" style="height: 560px;overflow-y: scroll;">
						     <ul class="folder-list meta-dataset-title-list" style="padding: 0;">
				   				<c:forEach var="result" items="${srcDataTbList}" varStatus="status">
				   						<li class="" style="height:70px;padding-top: 25px;">
							   				<i class="fa fa-file-text"></i><span class="src-data-nm"><c:out value="${result.srcTbKrNm}"/></span>
							   				<input type="hidden" value="<c:out value="${result.srcTbEnNm}"/>"/>
							   			</li>
			                   	</c:forEach>
						   </ul>
						</div>
						<div class="col-sm-9" style="height: 560;margin-left: 5px;flex: 0 0 82%;max-width: 82%;">
							<div id="dataSetMetaListDataDiv">
								<div class="ibox">
			                        <div class="ibox-title src-file-search-header">
			                            <div class="col-md-5">
			                                  <h4><i class="fa fa-history"></i> 원천데이터 업로드 이력  <small id="showUploadFileDiv" class="upload-text toggle-off">최신자료 업로드<i class="fa fa-chevron-down"></i></small></h4>
			                                      
			                                  <div class="row" id="showFileBoxRow" style="display:none">
				                                  <div class="filebox">
							                    	 	<input disabled class="upload-name" value="" placeholder="파일을 업로드하세요.">
													    <label for="inputFileTag">파일검색</label> 
													    <i id="uploadCancleBtn" class="fa fa-times active-file cancle-file require-hide"></i>
													    <i class="fa fa-upload active-file upload-file require-hide"></i>
													    <input type="file" class="hidden_file" id="inputFileTag">
												  </div>
											   </div> 
		                                </div>
		                                	<form id="srchFrm">
				                                <div class="col-md-8" style="float:right;margin-top: -30px;">
				                                	<div class="row src-data-search-row"  style="justify-content: end;">
					                                   	<div class="col-sm-5" style="flex: 0 0 60.666667%; max-width: 60.666667%;">
									                        <div class="form-group">
									                            <label class="col-form-label" for="insertStartDt">
									                            <i class="fa fa-search"></i>업로드일자</label>
									                            <div class="row src-calendar-row" style="justify-content:end;">
										                            <input type="text" id="insertStartDt" name="insertStartDt" value="" placeholder="" style="width:40%" class="is-src-enter-key datepicker-custom datepicker picker-ago job-srch-input form-control">
										                             <i class="fa fa-calendar custom-cal-btn" for="insertStartDt"></i>
										                             <span>~</span>
										                             <input type="text" id="insertEndDt" name="insertEndDt" value="" placeholder="" style="width:40%" class="is-src-enter-key datepicker-custom datepicker picker-after job-srch-input form-control">
										                             <i class="fa fa-calendar custom-cal-btn" for="insertEndDt"></i>
									                            </div>
									                        </div>
									                    </div>
									                    <div class="col-sm-4"  style="flex: 0 0 36.333333%; max-width: 36.333333%;">
									                        <div class="form-group">
									                            <label class="col-form-label" style="margin-left: 5px;" for="fileNm">
									                            <i class="fa fa-search"></i>파일명</label>
									                            <input type="text" id="fileNm" name="fileNm" value="" placeholder="파일명을 입력해주세요." style="width: 80%;" class="is-src-enter-key job-srch-input form-control">
									                            <button class="btn btn-sm btn-primary search-btn" id="searchFileBtn" style="margin-right: -3px;"type="button"><i class="fa fa-search" style="margin-right:3px;"></i>Search</button>
									                        </div>
									                    </div>
									                    
							                        </div>
				                                </div>
			                                </form>
			                        </div>
			                        <div id="srcDataFileHstListDiv">
			                        
			                        </div>
			                    </div>
							</div>
						</div>
					</div>
				</div>
            </div>
        </div>
    </div>
</div>
<!-- 본문 끝-->

<%@include file ="/WEB-INF/jsp/layout/footer.jsp" %>
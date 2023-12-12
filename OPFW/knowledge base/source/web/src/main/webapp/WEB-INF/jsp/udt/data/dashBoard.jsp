<%@ page contentType="text/html; charset=utf-8" pageEncoding="utf-8"%>
<%@include file ="/WEB-INF/jsp/layout/header.jsp" %>


<!-- JS 기능 시작 -->
<script>

	$(document).ready(function() {
		
		bindEvent();//이벤트 바인딩
		
		fn_getListDataSummary(); //연계요약테이블 호출
		
		fn_getJobRunHistList(); //데이터셋 이력현황 가져오기 
		
		fn_getJobRunHstStatisIndicators(); //누적 통계지표 호출
		
		fn_getJobMntlyAccumulateData(); //년간 월별 누적통계치 호출(년간 누적그래프 그리기)
		
	});

	/* 데이터셋 연계 요약 LIST 호출  */
	function fn_getListDataSummary(pageNo){
		 	if(!pageNo)pageNo=1;
			var params = makeSumarryAjaxParam(pageNo);
			//$('#sumarryIbox').loading('start');

			$.ajax({
			    url:"<c:url value='/udt/data/selectJobRunHstStatis.do'/>",
			    data: JSON.stringify(params),
				dataType:'text',
				processData:false,
				contentType:"application/json",
			    type:'POST',
			    success: function(data){
			    	$("#staticSummaryTableDiv").html(data);
			    	//jquery peity pie 리로드
			    	$("span.pie").peity("pie",{
			    	   fill: ["rgb(26, 179, 148)", "rgb(215, 215, 215)"]
			    	});
			    	//툴팁 버그..떔시..재적용
			    	$(".tooltip ").remove();
			    	$(".isToolTip").tooltip();
			    	$('#sumarryIbox').loading('stop');
			    }
			});
	}
	
	function fn_validationDate(params){
		if(!checkValidDate($("#jobStartDt").val())){
			alert('검색시작일의 날짜형식을 확인해주세요.');
			$("#jobStartDt").focus();
			return  false;
		}
		if(!checkValidDate($("#jobEndDt").val())){
			alert('검색종료일의 날짜형식을 확인해주세요.');
			$("#jobEndDt").focus();
			return  false;
		}
				
		var d1 = params.jobStartDt
		var d2 = params.jobEndDt
		var t1 = parseInt(d1);
		var t2 = parseInt(d2);
		
		if(t1>t2){
			alert('검색기간을 확인해주세요.');
			$("#jobStartDt").focus();
			return  false;
		}
		
		
		
		
		return true;
	}
	
	
	/* 데이터셋 이력현황 가져오기 */
	function fn_getJobRunHistList(pageNo){
		 	if(!pageNo)pageNo=1;
			var params = makeJobHstListAjaxParam(pageNo);
			
			var flag = fn_validationDate(params);
			
			if(flag){
				$('#jobRunHistTableDiv').loading('start');
				$.ajax({
				    url:"<c:url value='/udt/data/selectJobRunHstList.do'/>",
				    data: JSON.stringify(params),
					dataType:'text',
					processData:false,
					contentType:"application/json",
				    type:'POST',
				    success: function(data){
				    	$("#jobRunHistTableDiv").html(data);
				    	$('#jobRunHistTableDiv').loading('stop');
				    }
				});
			}
	}
	
	
	/* 주간,월간,년간 누적 통계지표 호출 */
	function fn_getJobRunHstStatisIndicators(){
		 	var params = new Object();
			$.ajax({
			    url:"<c:url value='/udt/data/selectJobRunHstStatisIndicators.do'/>",
			    data: JSON.stringify(params),
				dataType:'json',
				processData:false,
				contentType:"application/json",
			    type:'POST',
			    success: function(data){
			    	var row = data.returnMap;
			    	
			    	//년간 통계지표 percent 처리+게이지 그리기
			    	var totalYearLinkSuccessPer='(0%)';
			    	var totalYearLinkFailePer='(0%)';
			    	if(row.totalYearLinkCnt!=0){
			    		totalYearLinkSuccessPer=((row.totalYearLinkSuccessCnt/row.totalYearLinkCnt)*100).toFixed(1);
			    		totalYearLinkFailePer=(100-totalYearLinkSuccessPer).toFixed(1);
			    		$("#totalYearLinkSuccessPerBar").css('width',totalYearLinkSuccessPer+'%');
			    		$("#totalYearLinkFailePerBar").css('width',totalYearLinkFailePer+'%');
			    		totalYearLinkSuccessPer='('+totalYearLinkSuccessPer+'%)';
			    		totalYearLinkFailePer='('+totalYearLinkFailePer+'%)';
			    	}
			    	row.totalYearLinkSuccessPer=totalYearLinkSuccessPer;
			    	row.totalYearLinkFailePer=totalYearLinkFailePer;
			    	
			    	//주간,월간 성공률 percent 처리 (사용안함)
			    	/*
			    	var totalMnthLinkSuccessPer='(0%)';
			    	if(row.totalMnthLinkCnt!=0){
			    		totalMnthLinkSuccessPer=Math.round(((row.totalMnthLinkSuccessCnt/row.totalMnthLinkCnt)*100));
			    		totalMnthLinkSuccessPer=totalMnthLinkSuccessPer+'%';
			    	}
			    	row.totalMnthLinkSuccessPer=totalMnthLinkSuccessPer;
			    	
			    	var totalWeekLinkSuccessPer='(0%)';
			    	if(row.totalWeekLinkCnt!=0){
			    		totalWeekLinkSuccessPer=Math.round(((row.totalWeekLinkSuccessCnt/row.totalWeekLinkCnt)*100));
			    		totalWeekLinkSuccessPer=totalWeekLinkSuccessPer+'%';
			    	}
			    	row.totalWeekLinkSuccessPer=totalWeekLinkSuccessPer;
			    	row.totalMnthLinkSuccessDataRow=row.totalMnthLinkSuccessDataRow.toLocaleString('ko-KR');
			    	row.totalWeekLinkSuccessDataRow=row.totalWeekLinkSuccessDataRow.toLocaleString('ko-KR');
			    	*/
			    	
			    	// 화면에 결과 반영
			    	var keyArray = Object.keys(row);
			    	for(var index in keyArray){
			    		var key = keyArray[index];
			    		$("#"+key).text(row[key]);
			    	}
			    }
			});
	}
	
	/* 년간 월별 누적통계치 호출(년간 누적그래프 그리기) */
	function fn_getJobMntlyAccumulateData(){
		var params = new Object();
		$.ajax({
		    url:"<c:url value='/udt/data/selectJobMntlyAccumulateData.do'/>",
		    data: JSON.stringify(params),
			dataType:'JSON',
			processData:false,
			contentType:"application/json",
		    type:'POST',
		    success: function(data){
		    	
		    	var list = data.resultList;
		    	var labelsArray = [];
		    	var successDataArray = [];
		    	var faileDataArray = [];
		    	for(var i in list){
		    		labelsArray.push(list[i].graphUpdtMnth);
		    		successDataArray.push(list[i].graphMnthSuccessCnt);
		    		faileDataArray.push(list[i].graphMnthFaileCnt);
		    	}
		    	
		    	var succGraphObj = makeChartGraphObejct('성공',successDataArray);
		    	var failGraphObj = makeChartGraphObejct('실패',faileDataArray);
		    	
		    	var maxSuccessVal= Math.max.apply(Math, successDataArray);   
		    	var maxFaileVal= Math.max.apply(Math, faileDataArray);    
		    	
		    	//그래프 그리기 (맥스치가 작은 데이터셋이 아규먼트상 앞으로 가야함)
		    	if(maxSuccessVal>maxFaileVal)makeYearChartGraph(labelsArray,failGraphObj,succGraphObj);
		    	else makeYearChartGraph(labelsArray,succGraphObj,failGraphObj);
		    
		    }
		});
	};
	
	function fn_callJobRunHistListRefresh(){
		fn_getJobRunHistList();
	}
	function fn_callSumarryRefresh(){
		$('#sumarryIbox').loading('start');
		
		var params = new Object();
		$.ajax({
		    url:"<c:url value='/udt/data/callRetoreJobRunHstStatis.do'/>",
		    data: JSON.stringify(params),
			dataType:'json',
			processData:false,
			contentType:"application/json",
		    type:'POST',
		    success: function(data){
		    	if(data.result=="S"){
		    		setTimeout(function(){
		    			alert('누적 통계수치를 갱신하였습니다. 통계지표를 새로고침합니다.');
		    			fn_getListDataSummary();//연계요약테이블
		    			fn_getJobRunHstStatisIndicators(); //누적 통계지표 호출
		    			fn_getJobMntlyAccumulateData(); //년간 월별 누적통계치 호출(년간 누적그래프 그리기)
		    		},100)
		    		
		    	}else{
		    		alert('요약 통계수치를 갱신도중 오류가 발생하였습니다.\n관리자에게 문의해주세요.');
		    		return;
		    	}
		    }
		});
	}
	
	function fn_jobRunDetailHst(execId){
		popupCenter("/udt/data/selectJobRunDetailHstPop.do?execId="+execId,1000,450);
	}
	
	function fn_showSendDatasetFile(fileId){
		if(!fileId||fileId=="") return;
		$.ajax({
		    url:"<c:url value='/udt/file/selectOneUdtFile.do'/>",
		    data: JSON.stringify({fileId:fileId}),
			dataType:'text',
			processData:false,
			contentType:"application/json",
		    type:'POST',
		    success: function(html){
		    	
		    	var headerText ="파일 조회 및 다운로드";
		        var content = html;
				miniModalOpen(headerText,content,null,true);
				$('.cm-file-size-col').each(function(e){
					var bytes = $(this).text();
					$(this).text(byteCalculation(bytes));
				})
		    }
		});
		
	}
	
	function showErrPop(execId,jobNm){
		var headerText ="오류내용 출력";
        var content = '<p id="errText" class="errText">'+$("#errSpan"+execId).text()+'</p>';
		
        var bodyHeader='<div style="height: 45px;">'
        				+'<small class="float-right">'
        					+'<button class="copy-err-btn" type="button" id="copyErrBtn">'
        					+'복사하기</button></small>'
        					+'<strong>실행번호 : </strong><span>'+execId+'</span><br/>'
        					+'<strong>데이터셋 : </strong><span>'+jobNm+'</span>'
        					+'</div>';
		miniModalOpen(headerText,content,bodyHeader);
	}
	
	/* 이벤트 등록 */
	function bindEvent(){
		
		$("#sumarrySearchBtn").on('click',function(){
			fn_getListDataSummary();
		});
		
		$("#sumarryInput").keydown(function(key) {
	         if (key.keyCode == 13) {
	        	 fn_getListDataSummary();
	         }
	    });
		
		
		
		$("#searchJobBtn").on('click',function(){
			fn_getJobRunHistList();
		});

		$(".is-src-enter-key").keydown(function(key) {
	         if (key.keyCode == 13) {
	        	 fn_getJobRunHistList();
	         }
	    });
		
		$(".custom-cal-btn").on('click',function(e){
			var inputId = $(this).attr('for');
			//$("#"+inputId).trigger('click');
			$("#"+inputId).focus();
		});
		
		
		//데이터셋 연계현황,이력 탭클릭 이벤트
		$('.chagne-tab').on('click',function(e){
			if($(this).hasClass('active'))return;
			var tableId = $(this).attr('for');
			if(tableId=="currTable"){
				alert('준비중입니다...');
				return;
				//$("#jobRunHistTableDiv").hide();
			}else{
				return;
			}
			
		});
	}
	
	/* 데이터셋 연계 요약 LIST 호출 파라미터 세팅 */
	function makeSumarryAjaxParam(pageNo){
		var selectedVal = $("#sumarrySelect").val();
		var inputVal = $("#sumarryInput").val();
		var returnParamObj={};
		returnParamObj.pageIndex=pageNo;
		returnParamObj.jobNmKr='';
		returnParamObj.reciveInst='';
		
		if(selectedVal=="jobNmKr")
			returnParamObj.jobNmKr=inputVal;
		else
			returnParamObj.reciveInst=inputVal;	
		return returnParamObj;
	}
	
	/* 데이터셋 연계이력 호출 파라미터 세팅 */
	function makeJobHstListAjaxParam(pageNo){
		var returnParamObj = $("#srcJobFrm").serializeObject();
		returnParamObj.pageIndex=pageNo;
		returnParamObj.jobStartDt=returnParamObj.jobStartDt.replace(/-/gi,'');
		returnParamObj.jobEndDt=returnParamObj.jobEndDt.replace(/-/gi,'');
		return returnParamObj;
	}
	
	
	/* Chartjs 그래프 data set object 만들기 */
	function makeChartGraphObejct(labelString,dataArray){
		
		var _backgroundColor = "rgba(26,179,148,0.5)";
        var _borderColor = "rgba(26,179,148,0.7)";
        var _pointBackgroundColor = "rgba(26,179,148,1)";
        
		if(labelString=='실패'){
			_backgroundColor = "rgba(220,220,220,0.5)";
            _borderColor = "rgba(220,220,220,1)";
            _pointBackgroundColor = "rgba(220,220,220,1)";
		}
			 
		return {
            label: labelString,
            backgroundColor: _backgroundColor,
            borderColor: _borderColor,
            pointBackgroundColor: _pointBackgroundColor,
            pointBorderColor: "#fff",
            data: dataArray
        }
	}
	
	/* 년간 월별 누적통계치 Chart.js 그래프그리기 */
	function makeYearChartGraph(labelArray,datasetObj1,datasetObj2){
		
	    var lineData = {
	        labels: labelArray,
	        datasets: [
	        	datasetObj1,datasetObj2
	        ]
	    };
	    var lineOptions = {
	        responsive: true
	    };
	    var ctx = document.getElementById("lineChart").getContext("2d");
	    new Chart(ctx, {type: 'line', data: lineData, options:lineOptions});
	}
</script>
<!-- JS 기능 끝 -->

<!-- 본문 시작 -->
<div class="wrapper wrapper-content">
    <div class="container" style="max-width: 1523px;">
		<div class="row" style="height:445px;">
			<div class="col-lg-8" style="max-width: 50%;">
				<div class="ibox ">
					<div class="ibox-content">
						<div>
							<span class="float-right text-right">
								<br/>
								<small>총 연계시도: </small><strong id="totalYearLinkCnt"></strong><small>회</small>
							</span>
							<h3 class="font-bold no-margins">
								데이터셋 연계 누적 통계(년)
							</h3>
							<small id="updtYear">2022</small><small>.</small>
						</div>
		
						<div class="m-t-sm">
		
							<div class="row">
								<div class="col-md-8">
									<div>
										<canvas id="lineChart" height="190"></canvas>
									</div>
								</div>
								<div class="col-md-4">
									<ul class="stat-list m-t-lg" style="margin-top:35px;">
										<li>
											<h2 class="no-margins"><strong id="totalYearLinkSuccessCnt">130</strong> 
												<small style="font-size:70%" id="totalYearLinkSuccessPer">(84.9%)</small>
											</h2>
											<small>총 성공횟수</small>
											<div class="progress progress-mini">
												<div class="progress-bar" id="totalYearLinkSuccessPerBar" style="width: 0%;"></div>
											</div>
										</li>
										<li style="margin-top:5px;">
											<h2 class="no-margins "><strong id="totalYearLinkFaileCnt">23</strong> 
												<small style="font-size:70%" id="totalYearLinkFailePer">(11.9%)</small>
											</h2>
											<small>총 실패횟수</small>
											<div class="progress progress-mini">
												<div class="progress-bar" id="totalYearLinkFailePerBar" style="width: 0%;"></div>
											</div>
										</li>
									</ul>
								</div>
							</div>
		
						</div>
		
						<div class="m-t-md" style="margin-left:10px;">
							<small class="float-right">
								<i class="fa fa-clock-o"> </i>
								갱신일 : <span id="lastUpdtDt">2021.11.24</span>
							</small>
							
								<strong>통계지표:</strong> 
								<small>모든 데이터셋의 대한 년간 연계 성공ㆍ실패 합산누적치</small>
						</div>
		
					</div>
				</div>
			</div>
			<div class="col-lg-8" style="max-width: 50%;">
				<dIv class="ibox" id="sumarryIbox">
                     <div class="ibox-title">
                         <h4>데이터셋 연계 요약</h4>
                         <div class="ibox-tools">
                             <a class="collapse-link">
                                 <i class="fa fa-chevron-up"></i>
                             </a>
                         </div>
                     </div>
                     <div class="ibox-content">
                         <div class="row">
                             <div class="input-group m-b sumarry-table-select-div">
                                 <div class="input-group-prepend">
                                    <select id="sumarrySelect" class="form-control-sm form-control input-s-sm inline">
	                                    <option value="jobNmKr">데이터셋</option>
	                                </select>
                                 </div>
                                 <input id="sumarryInput" type="text" class="form-control form-search-input" placeholder="검색어를 입력하세요.">
                                 <div class="input-group-append">
                                    <button class="btn btn-sm btn-primary" id="sumarrySearchBtn" type="button" style="font-weight: bolder;"><i class="fa fa-search" style="margin-right: 4px;"></i>Search</button>
                                 </div>
                             </div>
                         </div>
                         <div id="staticSummaryTableDiv">
						 </div>
                     </div>
                 </div>
			</div>
		</div>

         <div class="row">
             <div class="col-lg-12">
                 <div class="ibox ">
                     <div class="ibox-title">
                         <h5>데이터셋 연계·이력 현황
                         </h5>
                         <div class="ibox-tools">
                             <a class="collapse-link">
                                 <i class="fa fa-chevron-up"></i>
                             </a>
                         </div>
                     </div>
                     <div class="ibox-content">
                         <form id="srcJobFrm" class="dash-bord-srcfrm">
						    <div class="row search-box-row" style="background-color:#f1f1f1;border:none">
						    	<div class="col-sm-4">
			                        <div class="form-group">
			                            <label class="col-form-label" for="jobNmKr">
			                            <i class="fa fa-search"></i>데이터셋명</label>
			                            <input type="text" id="jobNmKr" name="jobNmKr" value="" placeholder="데이터셋명을 입력하세요." class="is-src-enter-key job-srch-input form-control">
			                        </div>
			                    </div>
						    	<div class="col-sm-3">
			                        <div class="form-group">
			                            <label class="col-form-label" for="jobStartDt">
			                            <i class="fa fa-search"></i>연계일 <small style="color:#93817c"></small></label>
			                            <div class="row src-calendar-row">
				                            <input type="text" id="jobStartDt" name="jobStartDt" value="" placeholder="" style="width:40%"class="is-src-enter-key datepicker-custom datepicker picker-ago job-srch-input form-control">
				                             <i class='fa fa-calendar custom-cal-btn' for="jobStartDt"></i>
				                             <span>~</span>
				                             <input type="text" id="jobEndDt" name="jobEndDt" value="" placeholder="" style="width:40%" class="is-src-enter-key datepicker-custom datepicker picker-after job-srch-input form-control">
				                             <i class='fa fa-calendar custom-cal-btn' for="jobEndDt"></i>
			                            </div>
			                        </div>
			                    </div>
			                    <div class="col-sm-2">
			                        <div class="form-group">
			                            <label class="col-form-label" for="jobType">
			                            <i class="fa fa-search"></i>데이터 수집방식</label>
			                            <select name="jobType" id="jobType" class="form-control">
			                                <option value="" selected>전체</option>
			                                <option value="OPENAPI">OPEN API</option>
			                                <option value="UPLOAD_WEB">파일 수동업로드</option>
			                            </select>
			                        </div>
			                    </div>
			                     
			                    <div class="col-sm-2">
			                        <div class="form-group">
			                            <label class="col-form-label" for="jobUseAt">
			                            <i class="fa fa-search"></i>성공여부</label>
			                            <select name="jobEndRslt" id="jobEndRslt" class="form-control">
			                            	<option value="" selected>전체</option>
			                                <option value="S">성공</option>
			                                <option value="F">실패</option>
			                            </select>
			                        </div>
			                    </div>
			                    
			                    <div class="col-sm-1">
			                        <button class="btn btn-sm btn-primary search-btn" id="searchJobBtn" type="button"><i class="fa fa-search"></i>Search</button>
			                    </div>
		                	</div>
		                </form>
		                
                         <div id="jobRunHistTableDiv" style="margin: 0 -1.4%;"></div>
                      </div>
                     </div>
                 </div>
             </div>
         </div>
     </div>
<!-- 본문 끝-->

<%@include file ="/WEB-INF/jsp/layout/footer.jsp" %>
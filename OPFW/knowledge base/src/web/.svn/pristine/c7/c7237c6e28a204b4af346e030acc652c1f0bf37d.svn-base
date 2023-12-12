<%@ page contentType="text/html; charset=utf-8" pageEncoding="utf-8"%>
<%@ taglib prefix="c"      uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="form"   uri="http://www.springframework.org/tags/form" %>
<%@ taglib prefix="ui"     uri="http://egovframework.gov/ctl/ui"%>
<%@ taglib prefix="spring" uri="http://www.springframework.org/tags"%>
<%@ taglib prefix="sec" uri="http://www.springframework.org/security/tags" %>
<!DOCTYPE html>

<html lang="ko">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="_csrf" content="${_csrf.token}"/>
<meta name="_csrf_header" content="${_csrf.headerName}"/>
<meta name="_menu_no" content="${menuNo}"/>
<link type="text/css" rel="stylesheet" href="<c:url value='/css/bootstrap.min.css'/>"/>
<link type="text/css" rel="stylesheet" href="<c:url value='/css/font-awesome/css/font-awesome.css'/>"/>
<link type="text/css" rel="stylesheet" href="<c:url value='/css/animate.css'/>"/>
<link type="text/css" rel="stylesheet" href="<c:url value='/css/style.css'/>"/>
<link type="text/css" rel="stylesheet" href="<c:url value='/css/plugins/footable/footable.core.css'/>"/>



 <!-- Mainly scripts -->
<script src="/js/jquery-3.1.1.min.js"></script>
<script src="/js/jquery.loading.min.js"></script>
<script src="/js/popper.min.js"></script>
<script src="/js/bootstrap.js"></script>
<script src="/js/plugins/metisMenu/jquery.metisMenu.js"></script>
<script src="/js/plugins/slimscroll/jquery.slimscroll.min.js"></script>
<script src="/js/udt.common.js"></script>

<!-- Custom and plugin javascript -->
<script src="/js/inspinia.js"></script>
<script src="/js/plugins/pace/pace.min.js"></script>
<script src="/js/plugins/footable/footable.all.min.js"></script>

<!-- Flot -->
<script src="/js/plugins/flot/jquery.flot.js"></script>
<script src="/js/plugins/flot/jquery.flot.tooltip.min.js"></script>
<script src="/js/plugins/flot/jquery.flot.resize.js"></script>

<!-- ChartJS-->
<script src="/js/plugins/chartJs/Chart.min.js"></script>

<!-- Peity -->
<script src="/js/plugins/peity/jquery.peity.min.js"></script>
<!-- Peity demo -->
<script src="/js/plugins/peity/peity-demo.js"></script>
<title>UDT 빅데이터 센터 - 크론표현식 설명</title>
</head>
<body class="top-navigation" style="overflow-y:scroll">
<script>
   $(document).ready(function() {

      /*  $('.footable').footable();
       $('.footable-sort-indicator').hide();
       $('.footable th').css('cursor','default');
       $(document).on('click','.footable th',function(e){
    	   return false;
       }); */
   });
</script>

<!-- 헤더 -->
<div id="wrapper" style="background-color: #f3f3f4;">
    <div id="page-wrapper" class="gray-bg">
     		<div class="ibox" style="margin-top:15px;">
                        
                <div class="ibox-content">
                	
                    <div class="text-center article-title" style="margin:40px 0px;">
                        <h3>크론표현식 설명</h3>
                    </div>
                    <p>Cron expression은 공백(space)으로 구분된 6~7개의 문자(숫자, 영문자, 기호)를 포함합니다. </p>
                    
                    <table class="txc-table" width="784" cellspacing="5" cellpadding="5" border="0" style="border:none;border-collapse:collapse;">
					<tbody><tr><td style="width:196;height:24;border-bottom:1px solid #ccc;border-right:1px solid #ccc;border-top:1px solid #ccc;border-left:1px solid #ccc;;">&nbsp;필드 명<small>(필드순)</small>&nbsp;</td>
					<td style="width:196;height:24;border-bottom:1px solid #ccc;border-right:1px solid #ccc;border-top:1px solid #ccc;;">필수&nbsp;</td>
					<td style="width:196;height:24;border-bottom:1px solid #ccc;border-right:1px solid #ccc;border-top:1px solid #ccc;;">허용 값</td>
					<td style="width:196;height:24;border-bottom:1px solid #ccc;border-right:1px solid #ccc;border-top:1px solid #ccc;;">&nbsp;Special characters&nbsp;</td>
					</tr>
					<tr><td style="width:196;height:24;border-bottom:1px solid #ccc;border-right:1px solid #ccc;border-left:1px solid #ccc;;">&nbsp;초(seconds)</td>
					<td style="width:196;height:24;border-bottom:1px solid #ccc;border-right:1px solid #ccc;;">Yes</td>
					<td style="width:196;height:24;border-bottom:1px solid #ccc;border-right:1px solid #ccc;;">&nbsp;0-59</td>
					<td style="width:196;height:24;border-bottom:1px solid #ccc;border-right:1px solid #ccc;;">&nbsp;, - * /&nbsp;</td>
					</tr>
					<tr><td style="width:196;height:24;border-bottom:1px solid #ccc;border-right:1px solid #ccc;border-left:1px solid #ccc;;">&nbsp;분(minutes)</td>
					<td style="width:196;height:24;border-bottom:1px solid #ccc;border-right:1px solid #ccc;;">Yes</td>
					<td style="width:196;height:24;border-bottom:1px solid #ccc;border-right:1px solid #ccc;;">&nbsp;0-59</td>
					<td style="width:196;height:24;border-bottom:1px solid #ccc;border-right:1px solid #ccc;;">&nbsp;, - * /&nbsp;</td>
					</tr>
					<tr><td style="width:196;height:24;border-bottom:1px solid #ccc;border-right:1px solid #ccc;border-left:1px solid #ccc;;">&nbsp;시(hours)</td>
					<td style="width:196;height:24;border-bottom:1px solid #ccc;border-right:1px solid #ccc;;">Yes</td>
					<td style="width:196;height:24;border-bottom:1px solid #ccc;border-right:1px solid #ccc;;">&nbsp;0-23</td>
					<td style="width:196;height:24;border-bottom:1px solid #ccc;border-right:1px solid #ccc;;">&nbsp;, - * /&nbsp;</td>
					</tr>
					<tr><td style="width:196;height:24;border-bottom:1px solid #ccc;border-right:1px solid #ccc;border-left:1px solid #ccc;;">&nbsp;날짜(day of month)&nbsp;</td>
					<td style="width:196;height:24;border-bottom:1px solid #ccc;border-right:1px solid #ccc;;">Yes</td>
					<td style="width:196;height:24;border-bottom:1px solid #ccc;border-right:1px solid #ccc;;">&nbsp;1-31</td>
					<td style="width:196;height:24;border-bottom:1px solid #ccc;border-right:1px solid #ccc;;">&nbsp;, - * / ? L W &nbsp;</td>
					</tr>
					<tr><td style="width:196;height:24;border-bottom:0.5px solid #ccc;border-right:0.5px solid #ccc;border-left:0.5px solid #ccc;;">&nbsp;월(month)&nbsp;</td>
					<td style="width:196;height:24;border-bottom:0.5px solid #ccc;border-right:0.5px solid #ccc;;">Yes</td>
					<td style="width:196;height:24;border-bottom:0.5px solid #ccc;border-right:0.5px solid #ccc;;">&nbsp;1-12 or JAN-DEC&nbsp;</td>
					<td style="width:196;height:24;border-bottom:0.5px solid #ccc;border-right:0.5px solid #ccc;;">&nbsp;, - * /&nbsp;</td>
					</tr>
					<tr><td style="width:196;height:24;border-bottom:1px solid #ccc;border-right:1px solid #ccc;border-left:1px solid #ccc;;">&nbsp;요일(day of week)</td>
					<td style="width:196;height:24;border-bottom:1px solid #ccc;border-right:1px solid #ccc;;">Yes</td>
					<td style="width:196;height:24;border-bottom:1px solid #ccc;border-right:1px solid #ccc;;">&nbsp;1-7 or SUN-SAT&nbsp;</td>
					<td style="width:196;height:24;border-bottom:1px solid #ccc;border-right:1px solid #ccc;;">&nbsp;, - * / ? L #&nbsp;</td>
					</tr>
					<tr><td style="width:196;height:24;border-bottom:1px solid #ccc;border-right:1px solid #ccc;border-left:1px solid #ccc;;">&nbsp;년(year)</td>
					<td style="width:196;height:24;border-bottom:1px solid #ccc;border-right:1px solid #ccc;;">No&nbsp;</td>
					<td style="width:196;height:24;border-bottom:1px solid #ccc;border-right:1px solid #ccc;;">&nbsp;empty , 1979-2099</td>
					<td style="width:196;height:24;border-bottom:1px solid #ccc;border-right:1px solid #ccc;;">&nbsp;, - * /</td>
					</tr>
					</tbody></table>
					<br/>
					
					<h4>Special Characters 설명</h4>
                    <ul class="CronExpUl">
						<li>* : 모든 값을 의미합니다. 만약 초에 사용하면 0초~59초까지를 의미합니다.</li>
						<li>? : 특정 값을 정하지 않은 것입니다. 일과 요일에서 사용가능한데 일에 사용할 경우 어떤 요일도 상관 없는 것 입니다.</li>
						<li>- : 범위를 의미합니다. 예를 들어 0-10이면 0부터 10까지입니다. 여기서 주의할 것은 마지막 값인 10이 포함된다는 것입니다.</li>
						<li>, : 값을 추가할 때 사용합니다. 0-10,20-30은 0부터 10까지, 그리고 20부터 30까지를 의미합니다.</li>
						<li>/ : 증분을 의미합니다. 예를 들어 초에 0/15를 사용하면 15초마다(0, 15, 30, 45) triggering합니다.</li>
						<li>L : 마지막을 뜻합니다. 날짜에 사용하면 월의 마지막 날을 의미합니다. 31, 30 또는 28(윤달에는 29)일입니다.</li>
						<li>W : 주중(weekday)를 의미합니다. 날짜와 같이 쓰면 그 날짜가 주중인 날을 의미합니다.</li>
						<li># : n번째를 의미합니다. 그 달의 몇번째 무슨 요일을 설정할 때 사용합니다. 예를 들어 3번째 월요일은 "2#3"으로 설정합니다.</li>
                    </ul>
                    
                    <h4>Cron expression 예제</h4>
                    <ul class="CronExpUl">
                    	<li><div class="left">0 0 12 * * ?</div>        : 매일 12시(정오)</li>
                    	<li><div class="left">0 15 10 ? * *</div>       : 매일 오전 10시 15분</li>
                    	<li><div class="left">0 0 17 ? * FRI</div>      : 매주 금요일 오후 5시 0분</li>
                    	<li><div class="left">0 0 0 1 6,12 ? </div>     : 매년 6월1일 자정과 매년 12월1일 자정</li>
						<li><div class="left">59 59 23 L * ?</div>      : 매달 마지막날 23시 59분 59초</li>
						<li><div class="left">0 10,44 14 ? 3 WED</div>  : 매년 3월의 수요일마다 오후 2시 10분과 2시 44분</li>
						<li><div class="left">0 15 10 ? * MON-FRI</div> : 월요일부터 금요일까지 오전 10시 15분</li>
						<li><div class="left">0 15 10 15 * ?</div>      : 매달 15일 오전 10시 15분</li>
						<li><div class="left">0 15 10 L * ? </div>      : 매달 마지막 날 오전 10시 15분</li>
						<li><div class="left">0 15 10 ? * 6#3 </div>    : 매달 3번째 금요일 오전 10시 15분</li>
						<li><div class="left">0 0 12 1/5 * ?</div>      : 매달 첫날부터 5일마다 12시(정오)</li>
                    </ul>
                    <br>
                    	<h4>주의사항 : <small>날짜에 ?를 쓰면 요일에 ?를 사용할 수 없고, 요일에 ?를 쓰면 날짜에는 ?를 사용할 수 없습니다.</small></h4>
                    <hr>
                    
                    <h4>출처 : <a target='_blank' href="http://www.quartz-scheduler.org/documentation/quartz-2.3.0/tutorials/crontrigger.html">
                    			http://www.quartz-scheduler.org/documentation/quartz-2.3.0/tutorials/crontrigger.html
                    		</a></h4>

                </div>
          </div>
	</div>
</div>
</body>
</html>
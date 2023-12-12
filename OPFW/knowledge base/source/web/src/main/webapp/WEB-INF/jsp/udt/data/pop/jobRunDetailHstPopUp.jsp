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
<title>UDT 빅데이터 센터 - 연계 상세이력</title>
</head>
<body class="top-navigation" style="overflow-y:clip">
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
<c:if test="${empty resultList}">
	<script>alert('연계 상세이력 조회중 오류가 발생하였습니다. 관리자에게 문의해주세요.');</script>
</c:if>
<!-- 헤더 -->
<div id="wrapper" style="background-color: #f3f3f4;">
    <div id="page-wrapper" class="gray-bg">
     		<div class="ibox" style="margin-top:15px;">
                        <div class="ibox-title">
                            <h5><c:out value="${jobRunHstMap.jobNmKr}"/> <small>[연계 상세이력]</small></h5>
                            <div class="ibox-tools" style="top:5px; text-align:left;">
                                <small>
                                	<i class="fa fa-play-circle-o"></i>
                                	실행번호 : <c:out value="${jobRunHstMap.execId}"/></small>
								<br/>
								<small>
									<i class="fa fa-clock-o"> </i>
									연계일시 : <c:out value="${jobRunHstMap.jobStartDt}"/></small>
                            </div>
                        </div>
                        <div class="ibox-content">

                            <table class="footable table table-stripped toggle-arrow-tiny">
                                <thead>
                                <tr>
									<th data-toggle="true">실행순서</th>	
                                    <th>프로세스명</th>
                                    <th>성공여부</th>
                                    <th>프로세스 시작시간</th>
                                    <th>프로세스 종료시간</th>
                                    <th>처리시간</th>
                                </tr>
                                </thead>
                                <tbody>
                               <c:if test="${!empty resultList}">
			   						<c:forEach var="result" items="${resultList}" varStatus="status">
			   							 <tr>
		                                    <td><c:out value="${result.processSn}"/></td>
		                                    <td><c:out value="${result.processNmKr}"/></td>
		                                    <td>
		                                    	<c:choose>
			                                    	<c:when test="${result.processEndRslt eq 'S'}">
			                                    		<i class="fa fa-check text-navy"></i>
			                                    	</c:when>
			                                    	<c:otherwise>
			                                    		<i class="fa fa-times text-navy"></i>
			                                    	</c:otherwise>
		                                    	</c:choose>
		                                    </td>
		                                    <td><c:out value="${result.processStartDt}"/></td>
		                                    <td><c:out value="${result.processEndDt}"/></td>
		                                    <td><c:out value="${result.processElapTime}"/>(s)</td>
		                                </tr>
			   						</c:forEach>
			   					</c:if>
                                </tbody>
                                <tfoot>
                                	<tr>
                                	<td colspan="6">
                                		<div style="padding:7px;">
											<i class="fa fa-clock-o" style="color:#10863b;margin: 0px 5px 0px 15px;"> </i>
											총 처리시간 : <c:out value="${jobRunHstMap.jobElapTime}"/>(s)
										</div>
                                    </td>
                                </tfoot>
                            </table>

                        </div>
                    </div>
	</div>
</div>
</body>
</html>
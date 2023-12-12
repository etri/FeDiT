<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c"      uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="form"   uri="http://www.springframework.org/tags/form" %>
<%@ taglib prefix="ui"     uri="http://egovframework.gov/ctl/ui"%>
<%@ taglib prefix="spring" uri="http://www.springframework.org/tags"%>

<div class="table-responsive dashboard-summary-table">
   <table class="table table-striped table-summary">
   	 <colgroup>
   	 	<col style="width:1%;">
   	 	<col style="width:auto;">
   	 	<col style="width:11%;">
   	 	<col style="width:11%;">
   	 	<col style="width:11%;">
   	 	<col style="width:14%;">
   	 	<col style="width:15%;">
   	 	<col style="width:15%;">
   	 </colgroup>
       <thead class="static-table-head">
        <tr>
            <th>#</th>
            <th>데이터셋 </th>
            <th>주간<br/><small>(성공/실패)</small></th>
            <th>월간<br/><small>(성공/실패)</small> </th>
            <th>년간<br/><small>(성공/실패)</small></th>
            <th>전송성공률<br/><small>(년간누적)</small></th>
            <th>시작전송일</th>
            <th>마지막전송일</th>
        </tr>
       </thead>
       <tbody>
	       <c:choose>
				<c:when test="${!empty resultList}">
			   		<c:forEach var="result" items="${resultList}" varStatus="status">
				        <tr>
				            <td><c:out value="${result.rownum}"/></td>
				            <td><c:out value="${result.jobNmKr}"/></td>
				            <td><c:out value="${result.weekLinkSuccessCnt}"/>/<small><c:out value="${result.weekLinkFaileCnt}"/></small></td>
				            <td><c:out value="${result.mnthLinkSuccessCnt}"/>/<small><c:out value="${result.mnthLinkFaileCnt}"/></small></td>
				            <td><c:out value="${result.yearLinkSuccessCnt}"/>/<small><c:out value="${result.yearLinkFaileCnt}"/></small></td>
				            <td>
				            	<c:choose>
								    <c:when test="${result.totalYealLinkPer eq '0%'}">
								        	<span class="perCent"><c:out value="${result.totalYealLinkPer}"/></span>
								    </c:when>
								    <c:otherwise>
								        	<span class="pie"><c:out value="${result.yearLinkSuccessCnt}"/>/<c:out value="${result.totalYealLinkCnt}"/></span>
				            				<span class="perCent"><c:out value="${result.totalYealLinkPer}"/></span>
								    </c:otherwise>
								</c:choose>
				           		
				            </td>
				            <td><c:out value="${result.startSuccessDt}"/></td>
				            <td><c:out value="${result.endSuccessDt}"/></td>
				        </tr>
			        </c:forEach>
		        </c:when>
		        <c:otherwise>
		        	<tr>
			            <td colspan="9">검색 결과가 없습니다.</td>
			        </tr>
		        </c:otherwise>
	        </c:choose>
        </tbody>
    </table>
</div>
<div class="page_wrap">
	<div class="page_nation">
		<ui:pagination paginationInfo = "${paginationInfo}" type="image" jsFunction="fn_getListDataSummary" />
  	</div>
  	<small class="summary-small">
		<i class="fa fa-clock-o"> </i>
		갱신일시 : <c:out value="${lastUpdtDt}"/>
		<a href="#" onclick="fn_callSumarryRefresh();" id="callSumarryRefresh" class="isToolTip" data-placement="right" title="요약 통계수치를  갱신합니다.(자동갱신 : 매일 자정)">
        	&nbsp;<i class="fa fa-refresh"></i> 
        </a>
	</small>
</div>
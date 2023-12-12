<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c"      uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="form"   uri="http://www.springframework.org/tags/form" %>
<%@ taglib prefix="ui"     uri="http://egovframework.gov/ctl/ui"%>
<%@ taglib prefix="spring" uri="http://www.springframework.org/tags"%>

<div class="table-responsive change-table run-hst-table" style="padding: 0px 1.2%;" id="hstTable">
    <table class="table table-striped">
    	<colgroup>
	   	 	<col style="width:4%;">
	   	 	<col style="width:auto;">
	   	 	<col style="width:8%;">
	   	 	<col style="width:6%;">
	   	 	<col style="width:13%;">
	   	 	<col style="width:6%;">
	   	 	<col style="width:6%;">
	   	 	<col style="width:6%;">
	   	 </colgroup>
        <thead style="box-shadow: 1px 1px 1px 1px #dadce0;">
        <tr>
            <th>실행ID</th>
            <th>데이터셋</th>
            <th>데이터 유형</th>
            <th>성공여부</th>
            <th>구동일시</th>
            <th>소요시간</th>
            <th>상세보기</th>
            <th>오류내용</th>
        </tr>
        </thead>
        <tbody>
	        <c:choose>
				<c:when test="${!empty resultList}">
			   		<c:forEach var="result" items="${resultList}" varStatus="status">
				        <tr>
				            <td><c:out value="${result.execId}"/></td>
				            <td><c:out value="${result.jobNmKr}"/>&nbsp<SMALL>[<c:out value="${result.jobNmEn}"/>]</SMALL></td>
				            <td><c:out value="${result.jobType}"/></td>
				            <c:choose>
							    <c:when test="${result.jobEndRslt eq 'S'}">
							        	<td><a><i class="fa fa-check text-navy"></i></a></td>
							    </c:when>
							    <c:otherwise>
							        	<td><a><i class="fa fa-times"></i></a></td>
							    </c:otherwise>
							</c:choose>
				            <td><c:out value="${result.jobEndDt}"/></td>
				            <td><c:out value="${result.jobElapTime}"/>(s)</td>
				            <td>
				            	<a onclick='fn_jobRunDetailHst(<c:out value="${result.execId}"/>);'>
				            		<i class="fa fa-search-plus text-navy"></i>
				            	</a>
				            </td>
				            <c:choose>
							    <c:when test="${not empty result.processErrCont}">
							        	<td><a onclick="showErrPop(<c:out value="${result.execId}"/>,'<c:out value="${result.jobNmKr}"/>')"><i class="fa fa-print text-navy"></i></a>
							        		<span id="errSpan<c:out value="${result.execId}"/>" style="display:none"><c:out value="${result.processErrCont}"/></span>
							        	</td>
							    </c:when>
							    <c:otherwise>
							        	<td></td>
							    </c:otherwise>
							</c:choose>
			        </c:forEach>
		        </c:when>
		        <c:otherwise>
		        	<tr>
			            <td colspan="12" style="height: 100px;">검색 결과가 없습니다.</td>
			        </tr>
		        </c:otherwise>
	        </c:choose>
        </tbody>
    </table>
</div>
<div class="page_wrap">
	<div class="page_nation">
		<ui:pagination paginationInfo = "${paginationInfo}" type="image" jsFunction="fn_getJobRunHistList" />
  	</div>
</div>
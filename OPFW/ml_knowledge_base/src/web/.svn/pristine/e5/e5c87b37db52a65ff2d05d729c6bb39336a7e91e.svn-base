<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c"      uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="form"   uri="http://www.springframework.org/tags/form" %>
<%@ taglib prefix="ui"     uri="http://egovframework.gov/ctl/ui"%>
<%@ taglib prefix="spring" uri="http://www.springframework.org/tags"%>


<table class="schedule-table footable table table-stripped toggle-arrow-tiny" data-page-size="15">
   <colgroup>
		<col style="width:2%;">
		<col style="width:auto;">
		<col style="width:12%;">
		<col style="width:8%;">
		<col style="width:8%;">
		<col style="width:8%;">
		<col style="width:13%;">
		<col style="width:16%;">
		<col style="width:8%;">
   </colgroup>
   <thead>
	   <tr>
	
	       <th>#</th>
	       <th>데이터셋명</th>
	       <th>데이터<br/>수집방식</th>
	       <th>구동상태</th>
	       <th>구동제어<br/><small>(ON/OFF)</small></th>
	       <th>수동실행<br/><small>(즉시 1회)</small></th>
	       <th>배치주기
	       			<i class="fa fa-question-circle isToolTip cronExplaineMark" id="" title="아이콘을 클릭해주세요."></i><br/>
	       			<small>(크론표현식)</small></th>
	       <th>보관 테이블명</th>
	       <th>삭제</th>
	   </tr>
   </thead>
   <tbody>
   <c:choose>
		<c:when test="${!empty resultList}">
	   		<c:forEach var="result" items="${resultList}" varStatus="status">
			   <tr>
			       <td><c:out value="${result.rownum}"/></td>
			       <td onclick='fn_jobEdit("<c:out value="${result.jobId}"/>");' onmouseover="this.style.cursor='pointer'" onmouseout="this.style.cursor='default'">
			       		<b><c:out value="${result.jobNmKr}"/></b>
			       </td>
			       <td><c:out value="${result.jobType}"/></td>
			       <td>
			       <c:choose>
					    <c:when test="${result.useAt eq 'Y'}">
					        	<span class="label switch-label label-success" style="font-weight: bolder;">Running</span>
					    </c:when>
					    <c:otherwise>
					        	<span class="label switch-label label-warning" style="font-weight: bolder;">Stop</span>
					    </c:otherwise>
					</c:choose>
			           
			           <!-- label-danger label-warning label-success -->
			        </td>
			        <td>
			        	 <div class="switch">
			             <div class="onoffswitch">
			                <c:choose>
							    <c:when test="${result.useAt eq 'Y'}">
							        	<input type="checkbox" value="<c:out value="${result.jobNmEn}"/>" checked class="onoffswitch-checkbox" id="switchBtn<c:out value="${status.count}"/>">
							    </c:when>
							    <c:otherwise>
							        	<input type="checkbox" value="<c:out value="${result.jobNmEn}"/>" class="onoffswitch-checkbox" id="switchBtn<c:out value="${status.count}"/>">
							    </c:otherwise>
							</c:choose>
			                 <label class="onoffswitch-label" for="switchBtn<c:out value="${status.count}"/>">
			                     <span class="onoffswitch-inner"></span>
			                     <span class="onoffswitch-switch"></span>
			                 </label>
			             </div>
			         </div>
			        </td>
			        <td>
			        	<a onclick='fn_jobImmediateExexcute("<c:out value="${result.jobNmEn}"/>");'>
			        		<i class="fa fa-play-circle-o text-navy"></i>
			        	</a>
			        </td>
			        <td class="required-cron-converting"><c:out value="${result.cronExeCycle}"/></td>
			        <td>
			        	<c:out value="${result.saveTbNm}"/>
			        </td>
			        <td>
			        	<a onclick='deleteDataset("<c:out value="${result.jobId}"/>","<c:out value="${result.saveTbNm}"/>");'>
			                <i class="fa fa-minus-square text-danger"></i>
			            </a>
			        </td>
			    </tr>
			</c:forEach>
		</c:when>
		<c:otherwise>
        	<tr>
	            <td colspan="10">검색 결과가 없습니다.</td>
	        </tr>
        </c:otherwise>
	</c:choose>
    </tbody>
</table>
<div class="page_wrap" style="position: absolute;bottom: 7%;margin: 0px 46%;">
	<div class="page_nation">
		<ui:pagination paginationInfo = "${paginationInfo}" type="image" jsFunction="fn_getListJobMstConfig" />
  	</div>
</div>
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c"      uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="form"   uri="http://www.springframework.org/tags/form" %>
<%@ taglib prefix="ui"     uri="http://egovframework.gov/ctl/ui"%>
<%@ taglib prefix="spring" uri="http://www.springframework.org/tags"%>
<%@taglib prefix = "fn" uri = "http://java.sun.com/jsp/jstl/functions" %>

<div class="ibox-content" style="overflow-y: auto;height: 400px;padding: 0px;">
<div class="project-list">
    <table class="table table-hover src-file-hst-tble">
    	<thead class="static-table-head" style="box-shadow: 1px 1px 1px 1px #dadce0;">
			 <tr id="fieldListHead">
			 	<c:choose>
			 		<c:when test="${!empty fieldList}">
			 			<c:forEach var="fieldList" items="${fieldList}" varStatus="status">
			 				<th><c:out value="${fieldList}"/></th>
			 			</c:forEach>
			 		</c:when>
		 		</c:choose>
		 		<th>수집일자</th>
			 </tr>
			 <tr>
			 	 
			 </tr>
			</thead>
            <tbody>
            <c:choose>
				<c:when test="${!empty resultDataMapList}">
		            <c:forEach var="resultList" items="${resultDataMapList}" varStatus="resultList_status">
		            	<tr>
			            	<c:forEach var="fieldList" items="${fieldList_camelCase}">
			            		<c:set var="fieldName" value="${fn:trim(fieldList)}" />
			            		<td class="project-actions">
			            			<c:out value="${resultList[fieldName]}"/>
				                </td>
		            		</c:forEach>
		            		<td><c:out value="${resultList.updtDt}"></c:out></td>
		            	</tr>
		            </c:forEach>
	            </c:when>
	            <c:otherwise>
	            	<tr>
	            		 <td colspan="100%" class="project-people">검색결과가 없습니다.</td>
	            	</tr>
	            </c:otherwise>
	        </c:choose>
            </tbody>
        </table>
    </div>
</div>
<div class="page_wrap">
	<div class="page_nation">
		<ui:pagination paginationInfo = "${paginationInfo}" type="image" jsFunction="fn_selectStorageTblData" />
	</div>
</div>
<input type="hidden" id="startUpdtDt" value="${startUpdtDt}">
<input type="hidden" id="endUpdtDt" value="${endUpdtDt}">
<input type="hidden" id="dataTotCnt" value="${totCount}">
<input type="hidden" id="saveCnt" value="${saveCnt}">
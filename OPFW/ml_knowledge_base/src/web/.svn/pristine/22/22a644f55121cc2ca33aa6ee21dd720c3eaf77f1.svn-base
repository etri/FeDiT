<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c"      uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="form"   uri="http://www.springframework.org/tags/form" %>
<%@ taglib prefix="ui"     uri="http://egovframework.gov/ctl/ui"%>
<%@ taglib prefix="spring" uri="http://www.springframework.org/tags"%>


<table class="table table-striped common-file-list-table">
   <thead class="static-table-head">
    <tr>
        <th>#</th>
        <th>파일명 </th>
        <th>파일크기</th>
        <th>파일유형</th>
        <th>파일생성일시</th>
    </tr>
   </thead>
   <tbody>
   		<c:if test="${!empty resultFileList}">
	   		<c:forEach var="result" items="${resultFileList}" varStatus="status">
	   			<tr>
		    		<td><c:out value="${status.count}"/></td>
		    		<td><c:out value="${result.fileOrgNm}"/></td>
		    		<td class="cm-file-size-col"><c:out value="${result.fileSize}"/></td>
		    		<td><c:out value="${result.fileExt}"/></td>
		    		<td><c:out value="${result.regDt}"/></td>
		    		<td style="display:none">
		    			<input type="hidden" class="file-modal-hidden-id" value="<c:out value="${result.fileId}"/>"/>
		    			<input type="hidden" class="file-modal-hidden-sn" value="<c:out value="${result.fileSn}"/>"/>
		    		</td>
		   		</tr>
	   		</c:forEach>
		</c:if>
    </tbody>
</table>
					
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c"      uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="form"   uri="http://www.springframework.org/tags/form" %>
<%@ taglib prefix="ui"     uri="http://egovframework.gov/ctl/ui"%>
<%@ taglib prefix="spring" uri="http://www.springframework.org/tags"%>


<div class="ibox-content" style="overflow-y: auto;height: 400px;padding: 0px;">
<div class="project-list">
    <table class="table table-hover src-file-hst-tble">
    	<thead class="static-table-head" style="box-shadow: 1px 1px 1px 1px #dadce0;">
			 <tr>
			     <th>구분</th>
			     <th>파일명 </th>
			     <th>파일유형</th>
			     <th>파일크기</th>
			     <th>업로드방식</th>
			     <th>업로드일시</th>
			 </tr>
			 <tr>
			 	 
			 </tr>
			</thead>
            <tbody>
            <c:choose>
				<c:when test="${!empty resultList}">
		            <c:forEach var="result" items="${resultList}" varStatus="status">
		            	<tr class="is-download-tr">
		                 <td class="project-status">
		                 	<c:choose>
							    <c:when test="${result.isLately eq 'true'}">
							        	<span class="label label-primary">최신자료</span>
							    </c:when>
							    <c:otherwise>
							        	<span class="label label-default">과거자료</span>
							    </c:otherwise>
							</c:choose>
		                 </td>
		                 <td class="project-title">
		                     <c:out value="${result.fileOrgNm}"/>
		                     <input type="hidden" class="hidden-file-id" value=" <c:out value="${result.fileId}"/>"/>
		                 </td>
		                 <td class="project-completion">
		                     <c:out value="${result.fileExt}"/>
		                 </td>
		                 <td class="project-people is-file-size-td">
		                      <c:out value="${result.fileSize}"/>
		                 </td>
		                 <td class="project-actions">
		                      <c:out value="${result.fileType}"/>
		                 </td>
		                 <td class="project-actions">
		                      <c:out value="${result.timeStmp}"/>
		                 </td>
		             </tr>
		            </c:forEach>
	            </c:when>
	            <c:otherwise>
	            	<tr>
	            		 <td colspan="6" class="project-people">검색결과가 없습니다.</td>
	            	</tr>
	            </c:otherwise>
	        </c:choose>
            </tbody>
        </table>
    </div>
</div>
<div class="page_wrap">
	<div class="page_nation">
		<ui:pagination paginationInfo = "${paginationInfo}" type="image" jsFunction="fn_selectSrcDataFileHst" />
	</div>
</div>
					
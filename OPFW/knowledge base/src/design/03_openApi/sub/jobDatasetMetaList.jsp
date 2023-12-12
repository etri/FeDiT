<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c"      uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="form"   uri="http://www.springframework.org/tags/form" %>
<%@ taglib prefix="ui"     uri="http://egovframework.gov/ctl/ui"%>
<%@ taglib prefix="spring" uri="http://www.springframework.org/tags"%>
<div class="row">
	<div class="col-sm-3" style="height: 450px;overflow-y: scroll; padding-top:5px;">
	     <ul class="folder-list meta-dataset-title-list" style="padding: 0;">
	    	<c:choose>
		     	<c:when test="${!empty resultList}">
			   		<c:forEach var="result" items="${resultList}" varStatus="status">
			   			<li>
			   				<i class="fa fa-book"></i> <c:out value="${result.dctTitle}"/>
			   				<div class="hidden-div" style ="display:none;"><c:out value="${result.jobId}"/></div>
			   			</li>
			   		</c:forEach>
			   	</c:when>
		   		<c:otherwise>
		   			<li class="active-li">메타데이터(rdf)리소스가 등록된 데이터셋이 없습니다.</li>
		   		</c:otherwise>
			</c:choose>
	       
	   </ul>
	</div>
	<div class="col-sm-8" style="height: 450px;overflow-y: auto;margin-left: 5px;flex: 0 0 73.5%;max-width: 73.5%;">
	<div id="dataSetMetaListDataDiv"></div>
	</div>
</div>
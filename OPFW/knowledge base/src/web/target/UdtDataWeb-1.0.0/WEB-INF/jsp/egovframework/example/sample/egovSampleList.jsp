<%@ page contentType="text/html; charset=utf-8" pageEncoding="utf-8"%>
<%@include file ="/WEB-INF/jsp/layout/header.jsp" %>

<script type="text/javaScript" language="javascript" defer="defer">
  
   /* 글 수정 화면 function */
   function fn_egov_select(id) {
   	document.listForm.selectedId.value = id;
      	document.listForm.action = "<c:url value='/udt/updateSampleView.do'/>";
      	document.listForm.submit();
   }
   
   /* 글 등록 화면 function */
   function fn_egov_addView() {
      	document.listForm.action = "<c:url value='/udt/addSample.do'/>";
      	document.listForm.submit();
   }
   
   /* 글 목록 화면 function */
   function fn_egov_selectList() {
   	document.listForm.action = "<c:url value='/udt/egovSampleList.do'/>";
      	document.listForm.submit();
   }
   
   /* pagination 페이지 링크 function */
   function fn_egov_link_page(pageNo){
   	document.listForm.pageIndex.value = pageNo;
   	document.listForm.action = "<c:url value='/udt/egovSampleList.do'/>";
      	document.listForm.submit();
   }
   
   
</script>

<!-- 로그아웃 버튼 -->
<sec:authorize access="isAuthenticated()">
	<form action="${pageContext.request.contextPath}/logout" method="post">
		<input id="logoutBtn" type="submit" value="Logout" />
		<sec:csrfInput/>
	</form>
</sec:authorize>


<form:form commandName="searchVO" id="listForm" name="listForm" method="post">
   <input type="hidden" name="selectedId" />
   <div id="content_pop">
   	<!-- 타이틀 -->
   	<div id="title">
   		<ul>
   			<li><img src="<c:url value='/images/egovframework/example/title_dot.gif'/>" alt=""/><spring:message code="list.sample" /></li>
   		</ul>
   	</div>
   	<!-- // 타이틀 -->
   	<div id="search">
   		<ul>
   			<li>
   			    <label for="searchCondition" style="visibility:hidden;"><spring:message code="search.choose" /></label>
   				<form:select path="searchCondition" cssClass="use">
   					<form:option value="1" label="Name" />
   					<form:option value="0" label="ID" />
   				</form:select>
   			</li>
   			<li><label for="searchKeyword" style="visibility:hidden;display:none;"><spring:message code="search.keyword" /></label>
                   <form:input path="searchKeyword" cssClass="txt"/>
               </li>
   			<li>
   	            <span class="btn_blue_l">
   	                <a href="javascript:fn_egov_selectList();"><spring:message code="button.search" /></a>
   	                <img src="<c:url value='/images/egovframework/example/btn_bg_r.gif'/>" style="margin-left:6px;" alt=""/>
   	            </span>
   	        </li>
           </ul>
   	</div>
   	<!-- List -->
   	<div id="table">
   		<table width="100%" border="0" cellpadding="0" cellspacing="0" summary="카테고리ID, 케테고리명, 사용여부, Description, 등록자 표시하는 테이블">
   			<caption style="visibility:hidden">카테고리ID, 케테고리명, 사용여부, Description, 등록자 표시하는 테이블</caption>
   			<colgroup>
   				<col width="40"/>
   				<col width="100"/>
   				<col width="150"/>
   				<col width="80"/>
   				<col width="?"/>
   				<col width="60"/>
   			</colgroup>
   			<tr>
   				<th align="center">No</th>
   				<th align="center"><spring:message code="title.sample.id" /></th>
   				<th align="center"><spring:message code="title.sample.name" /></th>
   				<th align="center"><spring:message code="title.sample.useYn" /></th>
   				<th align="center"><spring:message code="title.sample.description" /></th>
   				<th align="center"><spring:message code="title.sample.regUser" /></th>
   			</tr>
   			<c:forEach var="result" items="${resultList}" varStatus="status">
       			<tr>
       				<td align="center" class="listtd"><c:out value="${paginationInfo.totalRecordCount+1 - ((searchVO.pageIndex-1) * searchVO.pageSize + status.count)}"/></td>
       				<td align="center" class="listtd"><a href="javascript:fn_egov_select('<c:out value="${result.id}"/>')"><c:out value="${result.id}"/></a></td>
       				<td align="left" class="listtd"><c:out value="${result.name}"/>&nbsp;</td>
       				<td align="center" class="listtd"><c:out value="${result.useYn}"/>&nbsp;</td>
       				<td align="center" class="listtd"><c:out value="${result.description}"/>&nbsp;</td>
       				<td align="center" class="listtd"><c:out value="${result.regUser}"/>&nbsp;</td>
       			</tr>
   			</c:forEach>
   		</table>
   	</div>
   	
   	<!-- /List -->
   	<div id="paging">
   		<ui:pagination paginationInfo = "${paginationInfo}" type="image" jsFunction="fn_egov_link_page" />
   		<form:hidden path="pageIndex" />
   	</div>
   	<div id="sysbtn">
   	  <ul>
   	      <li>
   	          <span class="btn_blue_l">
   	              <a href="javascript:fn_egov_addView();"><spring:message code="button.create" /></a>
                     <img src="<c:url value='/images/egovframework/example/btn_bg_r.gif'/>" style="margin-left:6px;" alt=""/>
                 </span>
             </li>
         </ul>
   	</div>
   </div>
</form:form>


<%@include file ="/WEB-INF/jsp/layout/footer.jsp" %>
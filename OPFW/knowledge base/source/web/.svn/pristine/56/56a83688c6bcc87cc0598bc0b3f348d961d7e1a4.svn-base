<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c"      uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="form"   uri="http://www.springframework.org/tags/form" %>
<%@ taglib prefix="ui"     uri="http://egovframework.gov/ctl/ui"%>
<%@ taglib prefix="spring" uri="http://www.springframework.org/tags"%>


<table class="table table-striped table-hover user-table">
  <thead>
   	<tr>
   		<th>#</th>
   		<th>사용자 아이디</th>
   		<th>사용자 이름</th>
   		<th>사용자 이메일</th>
   		<th>전화번호</th>
   		<th>사용여부</th>
   		<th>사용자 권한</th>
   		<th>등록일</th>
   		<th>수정일</th>
   	</tr>
  </thead>
  <tbody>
   <c:choose>
		<c:when test="${!empty resultList}">
	   		<c:forEach var="result" items="${resultList}" varStatus="status">
		         <tr onClick="getUserDetailPop('<c:out value="${result.userId}"/>')">
			       <td><c:out value="${result.rownum}"/></td>
			       <td><c:out value="${result.userId}"/></td>
			       <td><c:out value="${result.userName}"/></td>
			       <td class=""><i class="fa fa-envelope"></i><c:out value="${result.userEmail}"/></td>
			       <td class=""><i class="fa fa-phone"></i><c:out value="${result.userPhoneNumber}"/></td>
			       <c:choose>
						<c:when test="${result.userEnabled eq '1'}">
							<td class="client-status"><span class="label label-primary">사용가능</span></td>
						</c:when>
						<c:otherwise>
							<td class="client-status"><span class="label label-defualt">사용중지</span></td>
						</c:otherwise>
				   </c:choose>
				   
				   <c:choose>
						<c:when test="${result.userRole eq 'ADMIN'}">
							<td class=""><i class="fa fa-user-md"></i>관리자</td>
						</c:when>
						<c:otherwise>
							<td class=""><i class="fa fa-user-o"></i>일반사용자</td>
						</c:otherwise>
				   </c:choose>

			       <td class=""><c:out value="${result.regDt}"/></td>
			       <td class=""><c:out value="${result.updtDt}"/></td>
			       <!-- <td class="client-status"><i class="fa fa-user-o"></i>일반사용자</td> -->
			     </tr>
			</c:forEach>
		</c:when>
		<c:otherwise>
			<tr>
				<td colspan="9">검색결과가 없습니다.</td>
			</tr>
		</c:otherwise>
	</c:choose>
    </tbody>
</table>
<div class="page_wrap" style="position: absolute;bottom: 5%;left: 48%;">
	<div class="page_nation">
		<ui:pagination paginationInfo = "${paginationInfo}" type="image" jsFunction="fn_getUserList" />
  	</div>
</div>
					
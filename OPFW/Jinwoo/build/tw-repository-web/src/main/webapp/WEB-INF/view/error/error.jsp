<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ include file="/WEB-INF/view/include/tags.jspf" %>

<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
<section class="content">
	<div class="error-page">
	<c:choose>
		<c:when test="${ errorCode == '404' }">
			<div>
				<h3><i class="material-icons">error_outline</i> 페이지를 찾을 수 없습니다.</h3>
		
				<p>
					입력하신 주소가 정확한지 다시 한번 확인해 주시기 바랍니다. <br/><br/>
					<c:choose>
						<c:when test="${ userRole == 'ROLE_USER' }">
							<a href="javascript:history.back();">이전페이지로</a><br><br>
							<a href="/main.do">메인화면으로 이동</a>							
						</c:when>
						<c:otherwise>
							<a href="javascript:history.back();">이전페이지로</a><br><br>
							<a href="/system/index.mng">메인화면으로 이동</a>
						</c:otherwise>
					</c:choose>
				</p>
			</div>
		</c:when>
		<c:when test="${ errorCode == '401' }">
			<div class="error-content">
				<h3><i class="material-icons">error_outline</i> 접근권한이 없습니다..</h3>
				<p>
					귀하는 방문하시려는 페이지에 대한 접근 권한이 없습니다. <br/>
					입력하신 주소가 정확한지 다시 한번 확인해 주시기 바랍니다. <br/><br/>
					<c:choose>
						<c:when test="${userRole == 'ROLE_USER'}">
							<a href="javascript:history.back();">이전페이지로</a><br><br>
							<a href="/main.do">메인화면으로 이동</a>
						</c:when>
						<c:otherwise>
							<a href="javascript:history.back();">이전페이지로</a><br><br>
							<a href="/system/index.mng">메인화면으로 이동</a>
						</c:otherwise>
					</c:choose>
				</p>
			</div>
		</c:when>
	
		<c:otherwise>
			<div> <!--  class="error-content"> -->
				<h3><i class="material-icons">error_outline</i>프로그램 실행 중 오류가 발생하였습니다.</h3>
				<p>
					빠른 시일 내에  조치하도록 하겠습니다. <br/><br/>
					<c:choose>
						<c:when test="${userRole == 'ROLE_USER'}">
							<a href="javascript:history.back();">이전페이지로</a><br><br>
							<a href="/main.do">메인화면으로 이동</a>
						</c:when>
						<c:otherwise>
							<a href="javascript:history.back();">이전페이지로</a><br><br>
							<a href="/system/index.mng">메인화면으로 이동</a>
						</c:otherwise>
					</c:choose>
				</p>
			</c:otherwise>
	</c:choose>

	</div>
</section>
<script>
	var errorLog = '<c:out value="${errorLog}" escapeXml="false"/>';
	$(document).ready( function () {
		console.log(errorLog);
	});
</script>
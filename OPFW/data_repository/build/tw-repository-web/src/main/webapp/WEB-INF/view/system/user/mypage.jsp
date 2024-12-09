<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ include file="/WEB-INF/view/include/tags.jspf"%>

<script src="/energy/js/validation/common-validation.js"></script>
<script src="/energy/js/user/userService.js"></script>
<script src="/energy/js/user/mypage.js"></script>
<script src="<c:url value='/js/util/formUtil.js'/>"></script>

<section class="content">
	<div class="row">
		<div class="col-xs-12">
			<div class="box box-primary">
				<div class="box-header">
					<h3 class="box-title"><i class='material-icons' style='font-size:16px;'>play_arrow</i>&nbsp;&nbsp;마이페이지</h3>
				</div>
				<div class="box-body">
					<form id="insertForm" name="insertForm" class="form-horizontal form-label-left">
						<c:set value="${Selectuser}" var="user"/>
						<input type="hidden" id="userId" name="userId" value="${user.userId}" />
						<div class="form-group">
							<label class="control-label col-sm-3 col-xs-12">사용자ID * </label>
							<div class="col-sm-4 col-xs-8">
								<input type="text" id="userLoginId" name="userLoginId" class="form-control col-md-7 col-xs-12" value="${user.userLoginId}" readonly>
							</div>
							<div class="col-sm-3 col-xs-4">
								<button type="button" id="userOutBtn" class="btn btn-outline-primary" style="width: 120px;">회원탈퇴</button>
							</div>
						</div>
						<div class="form-group">
							<label class="control-label col-sm-3 col-xs-12">사용자명 * </label>
							<div class="col-sm-4 col-xs-8">
								<input type="text" id="userNm" name="userNm" class="form-control col-md-7 col-xs-12" value="${user.userNm}" placeholder="사용자명 입력">
							</div>
							<div class="col-sm-3 col-xs-4">
								<button id="passwordChangeBtn" type="button" class="btn btn-outline-primary" style="width: 120px;" >비밀번호 변경</button>
							</div>
						</div>
<%--						<div class="form-group">--%>
<%--							<label class="control-label col-sm-3 col-xs-12">성별 * </label>--%>
<%--							<div class="col-sm-4 col-xs-8">--%>
<%--								<select id="gender" name="gender" class="form-control col-md-7 col-xs-12">--%>
<%--									<option value="m" <c:if test="${user.gender == 'm'}">selected</c:if>>남자</option>--%>
<%--									<option value="f" <c:if test="${user.gender == 'f'}">selected</c:if>>여자</option>--%>
<%--								</select>--%>
<%--							</div>--%>
<%--						</div>--%>
<%--						<div class="form-group">--%>
<%--							<label class="control-label col-sm-3 col-xs-12">생년월일 * </label>--%>
<%--							<div class="col-sm-4 col-xs-8">--%>
<%--								<input type="number" id="birth" name="birth" class="form-control col-md-7 col-xs-12" maxlength="8" value="${user.birth}" placeholder="8자리 숫자로만 입력">--%>
<%--							</div>--%>
<%--						</div>--%>
						<div class="form-group">
							<label class="control-label col-sm-3 col-xs-12">연락처 * </label>
							<div class="col-sm-4 col-xs-8">
								<input type="text" id="mobile" name="mobile" class="form-control col-md-7 col-xs-12" maxlength="15" value="${user.mobile}" placeholder="전화번호 입력">
							</div>
						</div>
<%--						<div class="form-group">--%>
<%--							<label class="control-label col-sm-3 col-xs-12">주소 * </label>--%>
<%--							<div class="col-sm-4 col-xs-8">--%>
<%--								<input type="text" id="addr" name="addr" class="form-control col-md-7 col-xs-12" value="${user.addr}" placeholder="주소 입력">--%>
<%--							</div>--%>
<%--						</div>--%>
						<div class="form-group">
							<label class="control-label col-sm-3 col-xs-12">이메일 * </label>
							<div class="col-sm-4 col-xs-8">
								<input type="text" id="email" name="email" class="form-control col-md-7 col-xs-12" maxlength="30" value="${user.email}" placeholder="이메일 입력">
							</div>
						</div>
					</form>
				</div>
				<div class="box-footer">
					<div class="btn-group pull-right">
						<button type="button" id="saveBtn" class="btn btn-outline-primary">저장</button>
						<button type="button" class="btn btn-outline-primary" onclick="history.back()">취소</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<div class="modal fade userOut-modal" data-keyboard="false" data-backdrop="static" tabindex="-1" role="dialog" aria-hidden="true">
	<div class="modal-dialog">
		<div class="modal-content">
			<div class="modal-header">
				<h2>회 원 탈 퇴</h2>
			</div>
			<div class="modal-body">
				<form id="outForm" name="outForm" class="form-horizontal form-label-left">
					<div class="form-group">
						<label class="control-label col-md-4 col-sm-4 col-xs-12">비밀번호 * </label>
						<div class="col-md-7 col-sm-7 col-xs-12">
							<input type="password" id="userPwd" name="userPwd" class="form-control" placeholder="비밀번호 입력">
						</div>
					</div>
					<div class="form-group">
						<label class="control-label col-md-4 col-sm-4 col-xs-12">탈퇴 사유</label>
						<div class="col-md-7 col-sm-7 col-xs-12">
							<textarea type="text" id="userOutRsn" name="userOutRsn" class="form-control" rows="5" placeholder="탈퇴 사유 입력"></textarea>
						</div>
					</div>
				</form>
			</div>
			<div class="modal-footer">
				<button type="button" id="userOut" class="btn btn-outline-primary">탈퇴</button>
				<button type="button" class="btn btn-outline-primary" data-dismiss="modal">닫기</button>
			</div>
		</div>
	</div>
</div>

<div class="modal fade func-modal" data-keyboard="false" data-backdrop="static" tabindex="-1" role="dialog" aria-hidden="true">
	<div class="modal-dialog">
		<div class="modal-content">
			<div class="modal-header">
				<h2>비 밀 번 호 변 경</h2>
			</div>
			<div class="modal-body">
				<form id="funcForm" name="funcForm" class="form-horizontal form-label-left">
					<div class="form-group">
						<label class="control-label col-md-4 col-sm-4 col-xs-12">현재 비밀번호 * </label>
						<div class="col-md-7 col-sm-7 col-xs-12">
							<input type="password" id="nowUserPwd" name="nowUserPwd" class="form-control" placeholder="현재 비밀번호 입력">
							<span class="nowUserPwdCheck"></span>
						</div>
					</div>
					<div class="form-group">
						<label class="control-label col-md-4 col-sm-4 col-xs-12">변경 비밀번호 * </label>
						<div class="col-md-7 col-sm-7 col-xs-12">
							<input type="password" id="chgUserPwd" name="chgUserPwd" class="form-control" placeholder="변경할 비밀번호 입력">
<%--							<small>* 숫자, 영문자, 특수문자 포함 8~20자 이내로 입력</small>--%>
						</div>
					</div>
					<div class="form-group">
						<label class="control-label col-md-4 col-sm-4 col-xs-12">변경 비밀번호 확인 * </label>
						<div class="col-md-7 col-sm-7 col-xs-12">
							<input type="password" id="userPwdConfirm" name="userPwdConfirm" class="form-control" placeholder="변경 비밀번호와 동일하게 입력">
							<span class="userPwdCheck"></span>
						</div>
					</div>
				</form>
			</div>
			<div class="modal-footer">
				<button type="button" id="passwordChange" class="btn btn-outline-primary">변경</button>
				<button type="button" class="btn btn-outline-primary" data-dismiss="modal">닫기</button>
			</div>
		</div>
	</div>
</div>


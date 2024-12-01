<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ include file="/WEB-INF/view/include/tags.jspf"%>

<section class="content-header">
	<tg:menuInfoTag />
</section>

<section class="content">
	<div class="row">
		<div class="col-xs-12">
			<div class="box box-success">
				<div class="box-footer">
					<button type="button" class="btn btn-outline-primary pull-right" onclick="showInsertModal()">등록</button>
				</div>
			</div>
		</div>
		<div class="col-xs-12">
			<div class="box box-success">
				<div class="box-header">
					<h3 class="box-title"><i class='material-icons' style='font-size:16px;'>play_arrow</i>&nbsp;검색조건</h3>
				</div>
				<div class="box-body">
					<form name="searchForm">
						<div class="row">
<%--							<div class="col-sm-4 col-xs-12" style="margin-bottom: 10px;">--%>
<%--                            	<div class="input-group">--%>
<%--                                	<span class="input-group-addon">사용상태</span>--%>
<%--                                	<tg:cdDtl type="select" cd="userSt" name="userSt" styleClass="form-control selectpicker" headerText="전체" id="userSt" labelYn="N"/>--%>
<%--                                </div>--%>
<%--                      		</div>--%>
							<div class="col-sm-6 col-xs-12" style="margin-bottom: 10px;">
	                            <div class="input-group">
	                               	<span class="input-group-addon">사용자 ID</span>
	                               	<input type="text" id="userLoginIdLike" class="form-control searchOption" placeholder="사용자ID 입력" maxlength="30">
	                            </div>
							</div>
							<div class="col-sm-6 col-xs-12">
                             	<div class="input-group">
                                	<span class="input-group-addon">사용자명</span>
                                	<input type="text" id="userNmLike" class="form-control searchOption" placeholder="사용자명 입력" maxlength="30">
                             	</div>
                            </div>
						</div>
					</form>
				</div>
				<div class="box-footer">
					<div class="btn-group pull-right">
						<button type="button" class="btn btn-outline-primary" id="searchBtn">검색</button>
						<button type="button" class="btn btn-outline-primary" id="resetBtn">리셋</button>
					</div>
				</div>
			</div>
		</div>
		<div class="col-xs-12">
			<div class="box box-primary">
				<div class="box-body">
					<table id="datatable" class="table table-bordered table-striped" style="width:100%; table-layout:fixed;"></table>
				</div>
<%--				<div class="box-footer">--%>
<%--					<button type="button" class="btn btn-outline-primary pull-right" onclick="showInsertModal()">등록</button>--%>
<%--				</div>--%>
			</div>
		</div>
	</div>

	<div class="modal fade userDetail-modal" tabindex="-1" aria-hidden="true">
		<div class="modal-dialog">
			<div class="modal-content">
				<div class="modal-header">
					<h2>사용자 상세보기</h2>
				</div>
				<div class="modal-body">
					<form id="userDetailForm" name="userDetailForm" class="form-horizontal form-label-left">
						<table class="table table-condensed">
							<tbody>
							<tr>
								<th class="text-center">사용자ID</th>
								<td><div id="userLoginIdDtl"></div></td>
							</tr>
							<tr>
								<th class="text-center">사용자명</th>
								<td><div id="userNmDtl"></div></td>
							</tr>
<%--							<tr>--%>
<%--								<th class="text-center">성별</th>--%>
<%--								<td><div id="genderDtl"></div></td>--%>
<%--							</tr>--%>
<%--							<tr>--%>
<%--								<th class="text-center">생년월일</th>--%>
<%--								<td><div id="birthDtl"></div></td>--%>
<%--							</tr>--%>
							<tr>
								<th class="text-center">연락처</th>
								<td><div id="mobileDtl"></div></td>
							</tr>
<%--							<tr>--%>
<%--								<th class="text-center">주소</th>--%>
<%--								<td><div id="addrDtl"></div></td>--%>
<%--							</tr>--%>
							<tr>
								<th class="text-center">이메일</th>
								<td><div id="emailDtl"></div></td>
							</tr>
							<tr>
								<th class="text-center">등록일</th>
								<td><div id="regDtDtl"></div></td>
							</tr>
							<tr>
								<th class="text-center">사용자상태</th>
								<td><div id="userStDtl"></div></td>
							</tr>
							<tr id="userOutRsnInfo">
								<th class="text-center">탈퇴사유</th>
								<td><div id="userOutRsnDtl"></div></td>
							</tr>
							</tbody>
						</table>
					</form>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-outline-primary" data-dismiss="modal">닫기</button>
				</div>
			</div>
		</div>
	</div>

	<div class="modal fade save-modal" data-keyboard="false" data-backdrop="static" tabindex="-1" aria-hidden="true">
		<div class="modal-dialog">
			<div class="modal-content">
				<div class="modal-header">
					<h2 id="save-modal-title"></h2>
				</div>
				<div class="modal-body">
					<form id="saveForm" name="saveForm" class="form-horizontal form-label-left">
						<input type="hidden" id="userId" name="userId" />
						<div class="form-group">
							<label class="control-label col-md-3 col-sm-3 col-xs-12">사용자 ID *</label>
							<div class="col-md-7 col-sm-7 col-xs-12">
								<input type="text" id="userLoginId" name="userLoginId" class="form-control col-md-7 col-xs-12" placeholder="로그인 아이디 입력">
								<button type="button" id="idCheckButton" name="idCheckButton" class="btn btn-outline-primary form-control col-md-7 col-xs-12" onclick="idcheck()">중복체크</button>
							</div>
						</div>
						<div class="form-group password">
							<label class="control-label col-md-3 col-sm-3 col-xs-12">비밀번호 *</label>
							<div class="col-md-7 col-sm-7 col-xs-12">
								<input type="password" id="userPwd" name="userPwd" class="form-control col-md-7 col-xs-12" placeholder="비밀번호 입력">
							</div>
						</div>
						<div class="form-group password">
							<label class="control-label col-md-3 col-sm-3 col-xs-12">비밀번호 확인 *</label>
							<div class="col-md-7 col-sm-7 col-xs-12">
								<input type="password" id="userPwdConfirm" name="userPwdConfirm" class="form-control col-md-7 col-xs-12" placeholder="비밀번호 재입력">
							</div>
						</div>
						<div class="form-group">
							<label class="control-label col-md-3 col-sm-3 col-xs-12">사용자명 *</label>
							<div class="col-md-7 col-sm-7 col-xs-12">
								<input type="text" id="userNm" name="userNm" class="form-control col-md-7 col-xs-12" placeholder="사용자명 입력">
							</div>
						</div>
<%--						<div class="form-group">--%>
<%--							<label class="control-label col-md-3 col-sm-3 col-xs-12">성별 *</label>--%>
<%--							<div class="col-md-7 col-sm-7 col-xs-12">--%>
<%--								<select id="gender" name="gender" class="form-control col-md-7 col-xs-12">--%>
<%--									<option value="" hidden selected>성별 선택 *</option>--%>
<%--									<option value="m">남자</option>--%>
<%--									<option value="f">여자</option>--%>
<%--								</select>--%>
<%--							</div>--%>
<%--						</div>--%>
<%--						<div class="form-group">--%>
<%--							<label class="control-label col-md-3 col-sm-3 col-xs-12">생년월일 *</label>--%>
<%--							<div class="col-md-7 col-sm-7 col-xs-12">--%>
<%--								<input type="number" id="birth" name="birth" class="form-control col-md-7 col-xs-12" maxlength="8" placeholder="8자리 숫자로만 입력">--%>
<%--							</div>--%>
<%--						</div>--%>
						<div class="form-group">
							<label class="control-label col-md-3 col-sm-3 col-xs-12">연락처 *</label>
							<div class="col-md-7 col-sm-7 col-xs-12">
								<input type="test" id="mobile" name="mobile" class="form-control col-md-7 col-xs-12">
							</div>
						</div>
<%--						<div class="form-group">--%>
<%--							<label class="control-label col-md-3 col-sm-3 col-xs-12">주소 *</label>--%>
<%--							<div class="col-md-7 col-sm-7 col-xs-12">--%>
<%--								<input type="text" id="addr" name="addr" class="form-control col-md-7 col-xs-12" placeholder="주소 입력">--%>
<%--							</div>--%>
<%--						</div>--%>
						<div class="form-group">
							<label class="control-label col-md-3 col-sm-3 col-xs-12">이메일 *</label>
							<div class="col-md-7 col-sm-7 col-xs-12">
								<input type="text" id="email" name="email" class="form-control col-md-7 col-xs-12" placeholder="이메일 입력">
							</div>
						</div>
					</form>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-outline-primary" onclick="save()">저장</button>
					<button type="button" class="btn btn-outline-primary" data-dismiss="modal">닫기</button>
				</div>
			</div>
		</div>
	</div>

	<div class="modal fade userRole-modal" id="userRole-modal" data-keyboard="false" data-backdrop="static" tabindex="-1" aria-hidden="true">
		<div class="modal-dialog modal-lg">
			<div class="modal-content">
				<div class="modal-header">
					<h2>권한 롤 관리</h2>
				</div>
				<div class="modal-body">
					<form id="userRoleForm" name="userRoleForm" class="form-horizontal form-label-left">
						<input type="hidden" id="userRoleUrl" name="userRoleUrl" />
						<input type="hidden" id="userRoleAuthority" name="userRoleAuthority" />
						<input type="hidden" id="userId_role" name="userId" />
						<table id="userRoleDatatable" class="table table-bordered table-striped" style="table-layout:fixed;"></table>
					</form>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-outline-primary" data-dismiss="modal">닫기</button>
				</div>
			</div>
		</div>
	</div>

	<div class="modal fade memberCard-modal"  id="memberCard-modal" data-keyboard="false" data-backdrop="static" tabindex="-1" aria-hidden="true">
		<div class="modal-dialog modal-lg">
			<div class="modal-content">
				<div class="modal-header">
					<h2>멤버카드 관리</h2>
				</div>
				<div class="modal-body">
					<table id="memberCardDatatable" class="table table-bordered table-striped" style="width:100%; table-layout:fixed;"></table>
					<button type="button" class="btn btn-outline-primary pull-right" id="showRegisterMemberCardModal" onclick="showRegisterMemberCardModal()">멤버카드추가</button>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-outline-primary" data-dismiss="modal">닫기</button>
				</div>
			</div>
		</div>
	</div>

	<div class="modal fade register-membercard-modal" data-keyboard="false" data-backdrop="static" tabindex="-1" role="dialog" aria-hidden="true">
		<div class="modal-dialog modal-lg">
			<div class="modal-content">
				<div class="modal-header">
					<h2>멤버카드 등록</h2>
				</div>
				<div class="modal-body">
					<form id="registerMembercardForm" name="registerMembercardForm" class="form-horizontal form-label-left">
						<input type="hidden" name="userId" value="N"/>
						<div class="form-group">
							<label class="control-label col-md-3 col-sm-3 col-xs-12">카드번호 <span class="required">*</span></label>
							<div class="col-md-7 col-sm-7 col-xs-12">
								<input type="text" name="memberCardNum" class="form-control col-md-7 col-xs-12" placeholder="카드번호">
							</div>
						</div>
						<div class="form-group">
							<label class="control-label col-md-3 col-sm-3 col-xs-12">사용중 여부<span class="required">*</span></label>
							<div class="col-md-7 col-sm-7 col-xs-12">
								<select class="selectpicker" name="usingYn" id="usingYn">
									<option value="" hidden selected>사용중여부 선택 *</option>
									<option value="Y">Y </option>
									<option value="N">N </option>
								</select>
							</div>
						</div>
					</form>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-outline-primary" onclick="funcSaveMemberCard()">저장</button>
					<button type="button" class="btn btn-outline-primary" data-dismiss="modal">닫기</button>
				</div>
			</div>
		</div>
	</div>

</section>

<script>
	var datatable;
	var datatable_memberCard;

	$(document).ready(function() {

		$(document).on('shown.bs.modal', '#memberCard-modal', function () {
			datatable_memberCard.columns.adjust().draw();
		});

		datatable = $("#datatable").DataTable({
			"searching" : false
			,"paging": true
			,"bPaginate": true
			,"responsive": true
			,"language": lang_kor
			,"ajax" : {
				"url" : "<c:url value='/system/user/list.json' />"
				,"method" : "post"
				,"data" : function(d) {
					if ($('#userLoginIdLike').val() != "") {d.userLoginIdLike = $('#userLoginIdLike').val();}
					if ($('#userNmLike').val() != "") {d.userNmLike = $('#userNmLike').val();	}
					if ($('#userSt').val() != "") {d.userSt = $('#userSt').val();	}
				}
				,"error" : function(xhr, status, err) {
					ajaxErrorHandler(xhr);
				}
			},"processing": true
			,"serverSide": true
			,"order" : [[3, 'desc']]
			,"columns": [
				{ "name" : "USER_ID", "title" : "사용자 ID", "data" : "userId", "className" : "dt-head-center","visible" : false} ,
				{ "name" : "USER_LOGIN_ID", "title" : "사용자 ID", "data" : "userLoginId", "className" : "dt-head-center dt-body-left"} ,
				{ "name" : "USER_NM", "title" : "사용자명", "data" : "userNm", "className" : "dt-head-center dt-body-left"} ,
				{ "name" : "REG_DT", "title" : "등록일", "render" :
					function (data, type, row) {
					return new Date(row["regDt"]).format("yyyy-MM-dd HH:mm:ss");
					}, "className" : "dt-head-center dt-body-center"},
				{ "render":
					function (data, type, row) {
						let html = "";
						html += "<button type='button' class='btn btn-sm btn-outline-primary' data-toggle='tooltip' title='상세보기' onclick='goDetailUser(\"" + row["userId"] + "\")'><i class='material-icons'>pageview</i></button>&nbsp;";
						html += "<button type='button' class='btn btn-sm btn-outline-primary' data-toggle='tooltip' title='수정' onclick='showUpdateModal(\"" + row["userId"] + "\")'><i class='material-icons'>create</i></button>&nbsp;";
						html += "<button type='button' class='btn btn-sm btn-outline-primary' data-toggle='tooltip' title='권한부여' onclick='autUser(\"" + row["userId"] + "\")'><i class='material-icons'>assignment_ind</i></button>&nbsp;";
						html += "<button type='button' class='btn btn-sm btn-outline-primary";
						if (row["failCnt"] < 5) {
							html += "disabled' data-toggle='tooltip' title='로그인 실패카운터 5 미만 입니다.' '><i class='material-icons'>lock_open</i>&nbsp;" + row["failCnt"] + "</button>&nbsp;";
						} else {
							html += "' data-toggle='tooltip' title='로그인 제한 풀기' onclick='initFailCntUpdate(\"" + row["userId"] + "\")'><i class='material-icons'>lock</i>&nbsp;" + row["failCnt"] + "</button>&nbsp;";
						}
						return html;
					}, "title": "기능", "className": "dt-head-center dt-body-center", "orderable": false,
				}
			]
			,"scrollX": "100%"
			,"columnDefs": [
				{"targets": [1], width: "100px"}
				,{"targets": [2], width: "100px"}
				,{"targets": [3], width: "180px"}
				,{"targets": [4], width: "200px"}
			]
			,"fnRowCallback": function(nRow, aData, iDisplayIndex) {
				$(nRow).on('click', function() {
					getSearchCondition(document.searchForm);
				});
			}
		});
		setSearchCondition(document.searchForm);
	});

	$("#searchBtn").click(function() {
		datatable.ajax.reload();
	});

	$("#userSt").change(function() {
		datatable.ajax.reload();
	});

	$(".searchOption").keyup(function(e){
		if(e.keyCode == 13)
			datatable.ajax.reload();
	})

	$("#resetBtn").click(function() {
		$('#userSt').val("");
		$('#userSt').selectpicker("refresh");
		$('#userLoginIdLike').val("");
		$('#userNmLike').val("");
		datatable.ajax.reload();
	});

	function showInsertModal(){
		$(".password").show();
		$("#idCheckButton").show();

		var form = document.saveForm;
		form.userId.value = "";
		form.userLoginId.value = "";
		$("#userLoginId").removeAttr("readonly", true);
		form.userNm.value = "";
		form.userPwd.value = "";
		form.userPwdConfirm.value = "";
		// form.gender.value = "";
		// form.birth.value = "";
		form.mobile.value = "";
		// form.addr.value = "";
		form.email.value = "";

		$("#save-modal-title").html("등록");
		$('.save-modal').modal("show");
	}

	function showUpdateModal(userId){
		$(".password").hide();
		$("#idCheckButton").hide();

		$.ajax({
			url : "<c:url value='/system/user/detailUser.json' /> ",
			type : "POST",
			data : { "userId" : userId },
			dataType : "json",
			success : function(res){
				if(res.result == "success"){
					var form = document.saveForm;
					var data = res.data;
					form.userId.value = data.userId;
					form.userLoginId.value = data.userLoginId;
					$("#userLoginId").attr("readonly", true);
					form.userNm.value = data.userNm;
					// form.gender.value = data.gender;
					// form.birth.value = data.birth;
					form.mobile.value = data.mobile;
					// form.addr.value = data.addr;
					form.email.value = data.email;

					$("#save-modal-title").html("수정");
					$('.save-modal').modal("show");
				}else {
					alert(res.message);
				}
			}
		})
	}

	$("#userLoginId").keyup(function () {
		userService.idDuplicateClear();
	})

	$("#userPwd").keyup(function () {
		userService.comparePasswordEquality($("#userPwd").val(), $("#userPwdConfirm").val());
	})

	$("#userPwdConfirm").keyup(function () {
		userService.comparePasswordEquality($("#userPwd").val(), $("#userPwdConfirm").val());
	})

	/* 예고 없이 실행 됨
	$("#userLoginId").change(function () {
		userService.idDuplicateCheckRequest($("#userLoginId").val());
	})
	*/

	function save() {
		var form = document.saveForm;
		if(!formUtil.chkTextDetail(form.userLoginId, "아이디", 2, 30, true, true)) return;
		if($("#userId").val() == "" && !formUtil.chkPassword(form.userPwd, form.userPwdConfirm, 2, 32)) return;
		if(!formUtil.chkText(form.userNm, "사용자명", 2, 30)) return;
		if(!formUtil.chkEmail(form.email, "이메일", 2, 40)) return;
		if(!formUtil.chkTel(form.mobile, "연락처", 2, 30)) return;

		if($("#userId").val() == "") {
			var insertUserParams = {
				id: $("#userLoginId").val(),
				password: $("#userPwd").val(),
				name: $("#userNm").val(),
				// gender: $("#gender").val(),
				// birth: $("#birth").val(),
				mobile: $("#mobile").val(),
				// addr: $("#addr").val(),
				email: $("#email").val(),
			}

			// var insertAble = userService.joinCheckAll(insertUserParams);
			{
				if (confirm("사용자 정보를 등록하시겠습니까?")) {
					$.ajax({
						url: "/system/user/insert.json",
						type: "POST",
						data : {
							//$("#insertForm").serialize(),
							"userId" : form.userId.value,
							"userLoginId" : form.userLoginId.value,
							"userPwd" : form.userPwd.value,
							"userNm" : form.userNm.value,
							"email" : form.email.value,
							"mobile" : form.mobile.value.replace(/[^0-9]/g, "").replace(/(^02|^0505|^1[0-9]{3}|^0[0-9]{2})([0-9]+)?([0-9]{4})$/,"$1-$2-$3").replace("--", "-")
						},
						dataType: "json",
						success: function (res) {
							if (res.result === "success") {
								alert("사용자가 등록되었습니다.");
								$('.save-modal').modal("hide");
								datatable.ajax.reload();
							} else {
								alert(res.message);
							}
						}
					})
				}
			}
		} else {
			var updateUserParams = {
				name: $("#userNm").val(),
				// gender: $("#gender").val(),
				// birth: $("#birth").val(),
				mobile: $("#mobile").val(),
				// addr: $("#addr").val(),
				email: $("#email").val(),
			};

			//var updateAble = userService.userCheckAll(updateUserParams);

			{
				if (confirm("사용자 정보를 수정하시겠습니까?")) {
					$.ajax({
						url: "<c:url value='/system/user/update.json' />",
						type: "POST",
						data : {
							//$("#insertForm").serialize(),
							"userId" : form.userId.value,
							"userLoginId" : form.userLoginId.value,
							"userPwd" : form.userPwd.value,
							"userNm" : form.userNm.value,
							"email" : form.email.value,
							"mobile" : form.mobile.value.replace(/[^0-9]/g, "").replace(/(^02|^0505|^1[0-9]{3}|^0[0-9]{2})([0-9]+)?([0-9]{4})$/,"$1-$2-$3").replace("--", "-")
						},
						dataType: "json",
						success: function (res) {
							if ("success" == res.result) {
								alert("수정되었습니다.");
								$('.save-modal').modal("hide");
								datatable.ajax.reload();
							} else {
								alert(res.message);
							}
						}
					})
				}
			}
		}
	}

	function goDetailUser(id) {
		$.ajax({
			url: "<c:url value='/system/user/detailUser.json' />",
			type: "POST",
			data: {"userId": id},
			dataType: "json",
			success: function (res) {
				if (res.result == "success") {
					var data = res.data;
					$("#userLoginIdDtl").html(data.userLoginId);
					$("#userNmDtl").html(data.userNm);
					// if(data.gender == "m"){
					// 	$("#genderDtl").html("남자");
					// } else {
					// 	$("#genderDtl").html("여자");
					// }
					// $("#birthDtl").html(data.birth);
					$("#mobileDtl").html(data.mobile);
					// $("#addrDtl").html(data.addr);
					$("#emailDtl").html(data.email);
					$("#regDtDtl").html(new Date(data.regDt).format("yyyy-MM-dd"));

					switch (data.userSt) {
						case "1":
							$("#userStDtl").html("사용중");
							$("#userOutRsnInfo").hide();
							break;
						case "8":
							$("#userStDtl").html("사용정지");
							$("#userOutRsnInfo").hide();
							break;
						case "9":
							$("#userStDtl").html("탈퇴");
							$("#userOutRsnInfo").show();
							$("#userOutRsnDtl").html(data.userOutRsn);
							break;
						default:
							break;
					}
					$('div.userDetail-modal').modal("show");
				} else {
					alert(res.message);
				}
			}
		})
	}

	function autUser(id){
		$("#userId_role").val(id);
		datatable = $("#userRoleDatatable").DataTable({
			"destroy" : true
			,"searching" : false
			,"paging": true
			,"bPaginate": true
			,"responsive": true
			,"language": lang_kor
			,"ajax" : {
				"url" : "<c:url value='/system/user/userRole_list.json' />"
				,"method" : "post"
				,"data" : { userId : $("#userId_role").val()}
				,"error" : function(xhr, status, err) {
					ajaxErrorHandler(xhr);
				}
			},"processing": true
			,"serverSide": true
			,"order" : [[0, 'desc']]
			,"columns": [
				{ "name" : "ROLE_AUTH", "title" : "권한",  "data":"roleAuth", "className" : "dt-head-center dt-body-left" },
				{ "name" : "ROLE_NM", "title" : "역할명",  "data":"roleNm", "className" : "dt-head-center dt-body-left" },
				{ "name" : "ROLE_DESC", "title" : "설명",  "data":"roleDesc", "className" : "dt-head-center dt-body-left" },
				// { "name" : "USER_ID", "title" : "사용자ID",  "data":"userId", "className" : "dt-body-center", "visible" : false },
				{ "render" :
					function (data, type, row) {
						var html = "";
						html += "<select name='roleAuth' class='form-control col-md-7 col-xs-12 req' onchange='rolsUseSelect(this.value ,\""+row["roleAuth"]+"\")'>"
						html += "<option value='1'";

						if (row["userId"] == $("#userId_role").val()){
							html += "selected";
						}
						html += ">등록</option><option value='0'";

						if (row["userId"] != $("#userId_role").val()){
							html += "selected";
						}
						html += ">미등록</option></select>";

						return html;
					},
				"className": "dt-head-center dt-body-center", "orderable" : false, "title":"기능"
				}
            ]
			,"scrollX": "100%"
			,"columnDefs": [
				{"targets": [0], width:"150px"}
				,{"targets": [1], width:"100px"}
				,{"targets": [2], width:"180px"}
				,{"targets": [3], width:"100px"}
			],
			"fnRowCallback": function(nRow, aData, iDisplayIndex) {
				$( window ).trigger('resize');
			},
			"fnDrawCallback" : function() {
				$('#userRole-modal').modal("show");
			}
		});
		$('#userRole-modal').modal("show");
	}

	function rolsUseSelect(selectValue,userRoleAuthority){
		$("#userRoleAuthority").val(userRoleAuthority);

		if(selectValue == '1'){
			$("#userRoleUrl").val("<c:url value='/system/user/userRole_insert.json' />");
		}else{
			$("#userRoleUrl").val("<c:url value='/system/user/userRole_delete.json' />");
		}
		$.ajax({
			url : $("#userRoleUrl").val(),
			type : "POST",
			data : { userId : $("#userId_role").val(), roleAuth : $("#userRoleAuthority").val()},
			dataType : "json",
			success : function(res) {
				if("success" == res.result) {
					datatable.ajax.reload();
				}else if("duplicate" == res.result) {
					alert(res.message);
				}else{
					alert(res.message);
				}
			},
			error:function(request, status, error){
				console.log("code:"+request.status+"\n"+"message:"+request.responseText+"\n"+"error:"+error);
				ajaxErrorHandler(request);
			}
		});
	}

	function initFailCntUpdate(id){
		getSearchCondition(document.searchForm);
		if(confirm("해당 사용자 로그인 실패 카운터를 초기화 하시겠습니까?")){
			$.ajax({
				url : "<c:url value='/system/user/initFailCnt.json' />" ,
				type : "POST" ,
				data : {"userId": id} ,
				dataType : "json" ,
				success : function(res) {
					if(res.result == "success"){
						alert("로그인 실패 카운터가 초기화 되었습니다");
						datatable.ajax.reload();
					}else {
						alert(res.message);
					}
				}
			})
		}
	}

	function idcheck() {
		var form = document.saveForm;
		if(!formUtil.chkTextDetail(form.userLoginId, "아이디", 2, 30, true, true)) return;

		$.ajax({
			url : "<c:url value='/login/duplicate.json' />" ,
			type : "POST" ,
			data : {"userLoginId": $("#userLoginId").val()} ,
			dataType : "json" ,
			success : function(res) {
				if ("exist" == res.result) {
					alert("이미 사용중인 아이디 입니다.");
					$("#userLoginId").focus();
				}else {
					alert("사용가능한 아이디 입니다.");
				}
			}
		})
	}

	function goMemberCard(userId) {
		// $("#userId_memberCard").val(userId);
		// userId_memberCard = userId;

		document.registerMembercardForm.userId.value = userId;

		datatable_memberCard = $("#memberCardDatatable").DataTable({
			"destroy" : true
			,"searching" : false
			,"paging": true
			,"bPaginate": true
			,"responsive": true
			,"language": lang_kor
			,"ajax" : {
				"url" : "<c:url value='/system/cim/user/memberCard.json' />"
				,"method" : "post"
				,"data" : function(d) {
					// if ($('#userId_memberCard').val() != "") { d.userId = $('#userId_memberCard').val(); }
					// if( userId_memberCard != null && userId_memberCard != undefined) d.userId = userId_memberCard;
					d.userId = userId;
				}
				,"error" : function(xhr, status, err) {
					ajaxErrorHandler(xhr);
				}
			}
			,"processing": true
			,"serverSide": true
			,"order" : [[2, 'desc']]
			,"columns": [
				{ "name" : "MEMBER_CARD_NUM", "title" : "카드번호", "data" : "memberCardNum", "className" : "dt-head-center dt-body-left"} ,
				{ "name" : "USING_YN", "title" : "사용중여부", "data" : "usingYn", "className" : "dt-head-center dt-body-left"} ,
				{ "name" : "REG_DT", "title" : "등록일", "render" :
							function (data, type, row) {
								return new Date(row["regDt"]).format("yyyy-MM-dd HH:mm:ss");
							}, "className" : "dt-head-center dt-body-center"},
			]
			,"scrollX": "100%"
			,"columnDefs": [
				{"targets": [0], width:"300px"}
				,{"targets": [1], width:"200px"}
				,{"targets": [2], width:"300px"}
			]
			,"fnDrawCallback" : function() {
				$('div.memberCard-modal').modal("show");
			}
		});

		// $('#myCollapsible').on('shown.bs.collapse', function () {
		// 	$($.fn.dataTable.tables(true)).DataTable()
		// 			.columns.adjust();
		// });

		// datatable_memberCard.columns.adjust();
		// datatable_memberCard.columns.adjust().draw();
		// datatable_memberCard.ajax.reload();
		// $('div.memberCard-modal').modal("show");
	}

	function funcSaveMemberCard() {
		let form = document.registerMembercardForm;

		if(!formUtil.chkTextNumber(form.memberCardNum, "카드번호")) return;
		if(!formUtil.chkText(form.usingYn, "사용여부")) return;

		$.ajax({
			url: "<c:url value='/system/user/memberCard_insert.json' />",
			type: "POST",
			data: {
				"memberCardNum" : form.memberCardNum.value,
				"userId" : form.userId.value,
				"usingYn" : form.usingYn.value
			},
			dataType: "json",
			success: function (res) {
				if ("success" == res.result) {
					alert("등록되었습니다.");
					datatable_memberCard.ajax.reload();
				} else {
					alert(res.message);
				}
			}
		})

		$('.register-membercard-modal').modal("hide");
	}

	function clearRegisterMemberDardForm() {
		var form = document.registerMembercardForm;

		form.memberCardNum.value = "";
		formUtil.setSelect($('#usingYn'), "");
	}

	function showRegisterMemberCardModal() {
		clearRegisterMemberDardForm();
		$('.register-membercard-modal').modal("show");
	}
</script>

<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ include file="/WEB-INF/view/include/tags.jspf"%>

<section class="content-header">
	<tg:menuInfoTag />
</section>

<section class="content">
	<div class="row">
		<div class="col-xs-12">
			<div class="box box-success">
				<div class="box-header">
					<h3 class="box-title"><i class='material-icons' style='font-size:16px;'>play_arrow</i>&nbsp;&nbsp;검색조건</h3>
				</div>
				<div class="box-body">
					<form name="searchForm">
						<div class="row">
							<div class="col-sm-6 col-xs-12" style="margin-bottom: 10px;">
                            	<div class="input-group">
                               		<span class="input-group-addon">사용자 ID</span>
                               		<input type="text" name="userLoginIdLike" id="userLoginIdLike" class="form-control searchOption" placeholder="사용자 ID입력" maxlength="50">
                             	</div>
							</div>
							<div class="col-sm-6 col-xs-12">
                             	<div class="input-group">
                                	<span class="input-group-addon">사용자명</span>
                                	<input type="text" name="userNmLike" id="userNmLike" class="form-control searchOption" placeholder="사용자명 입력" maxlength="50">
                            	</div>
                            </div>
						</div>
						<input type="hidden" id="userId" name="user.userId" />
						<input type="hidden" id="loginLogId" name="loginLog.loginLogId" />
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
			</div>
		</div>
	</div>
</section>

<div class="modal fade webLogDtl-modal" tabindex="-1" aria-hidden="true">
	<div class="modal-dialog modal-lg">
		<div class="modal-content">
			<div class="modal-header">
				<h2>사용이력</h2>
			</div>
			<div class="modal-body">
				<form id="form" name="form" class="form-horizontal form-label-left">
					<table class="table table-condensed">
						<colgroup>
							<col width="30%">
							<col width="70%">
						</colgroup>
						<tbody>
							<tr>
								<th class="text-center">사용자ID</th>
								<td><div id="userLoginId"></div></td>
							</tr>
							<tr>
								<th class="text-center">사용자명</th>
								<td><div id="userNm"></div></td>
							</tr>
							<tr>
								<th class="text-center">로그인</th>
								<td><div id="loginDt"></div></td>
							</tr>
							<tr>
								<th class="text-center">로그아웃</th>
								<td><div id="logoutDt"></div></td>
							</tr>
							<tr>
								<th class="text-center">프로그램명</th>
								<td><div id="pgmNm"></div></td>
							</tr>
							<tr>
								<th class="text-center">사용일시</th>
								<td><div id="regDt"></div></td>
							</tr>
							<tr>
								<th class="text-center">형식</th>
								<td><div id="reqMthd"></div></td>
							</tr>
							<tr>
								<th class="text-center">사용IP</th>
								<td><div id="reqIp"></div></td>
							</tr>
							<tr>
								<th class="text-center">파라미터</th>
								<td><div id="reqParam"></div></td>
							</tr>
						</tbody>
					</table>
				<!-- 
					<div class="form-group">
						<lable class="control-label col-md-3 col-sm-3 col-xs-12">사용자 ID</lable>
						<div class="col-md-6 col-sm-9 col-xs-12">
							<input type="text" id="userLoginId" class="form-control" readonly="readonly">
						</div>
					</div>
					<div class="form-group">
						<lable class="control-label col-md-3 col-sm-3 col-xs-12">사용자명</lable>
						<div class="col-md-6 col-sm-9 col-xs-12">
							<input type="text" id="userNm" class="form-control" readonly="readonly">
						</div>
					</div>
					<div class="form-group">
						<lable class="control-label col-md-3 col-sm-3 col-xs-12">로그인</lable>
						<div class="col-md-6 col-sm-9 col-xs-12">
							<input type="text" id="loginDt" class="form-control" readonly="readonly">
						</div>
					</div>
					<div class="form-group">
						<lable class="control-label col-md-3 col-sm-3 col-xs-12">로그아웃</lable>
						<div class="col-md-6 col-sm-9 col-xs-12">
							<input type="text" id="logoutDt" class="form-control" readonly="readonly">
						</div>
					</div>
					<div class="form-group">
						<lable class="control-label col-md-3 col-sm-3 col-xs-12">사용프로그램</lable>
						<div class="col-md-6 col-sm-9 col-xs-12">
							<input type="text" id="pgmNm" class="form-control"  readonly="readonly">
						</div>
					</div>
					<div class="form-group">
						<lable class="control-label col-md-3 col-sm-3 col-xs-12">사용일시</lable>
						<div class="col-md-6 col-sm-9 col-xs-12">
							<input type="text" id="regDt" class="form-control" readonly="readonly">
						</div>
					</div>
					<div class="form-group">
						<lable class="control-label col-md-3 col-sm-3 col-xs-12">형식</lable>
						<div class="col-md-6 col-sm-9 col-xs-12">
							<input type="text" id="reqMthd" class="form-control" readonly="readonly">
						</div>
					</div>
					<div class="form-group">
						<lable class="control-label col-md-3 col-sm-3 col-xs-12">아이피</lable>
						<div class="col-md-6 col-sm-9 col-xs-12">
							<input type="text" id="reqIp" class="form-control" readonly="readonly">
						</div>
					</div>
					<div class="form-group">
						<lable class="control-label col-md-3 col-sm-3 col-xs-12">파라미터</lable>
						<div class="col-md-6 col-sm-9 col-xs-12">
							<input type="text" id="reqParam" class="form-control" readonly="readonly">
						</div>
					</div>
					 -->
				</form>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-outline-primary" data-dismiss="modal">닫기</button>
			</div>
		</div>
	</div>
</div>

<script>
	var datatable;
	var loginLogId = '<%=session.getAttribute("loginLogId")%>';
	
	$(document).ready(function() {
		
		//모달창이동
		$('.modal-content').draggable({
			handle: ".modal-header"
		});
		
		//placeholder 브라우저호환
		$('input').placeholder();
		
		datatable = $("#datatable").DataTable({
			"searching" : false
			,"paging": true
			,"bPaginate": true
			,"responsive": true
			,"language": lang_kor
			,"ajax" : {
				"url" : "<c:url value='/system/webLog/list.json' />"
				,"method" : "post"
				,"data" : function(d) {
					if ($('#loginLogId').val() != "") {d["loginLog.loginLogId"] = $('#loginLogId').val();	}
					if ($('#userId').val() != "") {d["user.userId"] = $('#userId').val();	}
					if ($('#userLoginIdLike').val() != "") {d.userLoginIdLike = $('#userLoginIdLike').val();	}
					if ($('#userNmLike').val() != "") {d.userNmLike = $('#userNmLike').val();	}
				}
				,"error" : function(xhr, status, err) {
					ajaxErrorHandler(xhr);
				}
			},"processing": true
			,"serverSide": true
			,"order" : [[0, 'desc']]
			,"columns": [
				{ "name" : "WEB_LOG_ID", "title" : "번호", "data" : "webLogId", "className" : "dt-head-center dt-body-center"},
				{ "name" : "USER_LOGIN_ID", "title" : "사용자", "render" :
					function (data, type, row) {

						return row["user"]["userLoginId"]+"("+row["user"]["userNm"]+")";  
				}, "className" : "dt-head-center dt-body-left"},
				{ "name" : "REQ_URL", "title" : "프로그램 URL", "data" : "reqUrl", "className" : "dt-head-center dt-body-left"},
				{ "name" : "REQ_MTHD", "title" : "형식", "data" : "reqMthd", "className" : "dt-head-center dt-body-left"},
				{ "name" : "REG_DT", "title" : "사용일시", "render" :
					function (data, type, row) {
						return new Date(row["regDt"]).format("yyyy-MM-dd HH:mm:ss");
				}, "className" : "dt-head-center dt-body-center"},
				{ "render" : 
					function (data, type, row) {
						var html = "";
						html += "<button type='button' class='btn btn-sm btn-outline-primary' data-toggle='tooltip' title='상세' onclick='showWebLogDtl(\""+row["user"]["userLoginId"]+"\",\""+row["user"]["userNm"]+"\",\"";
						html += ""+new Date(row["loginLog"]["loginDt"]).format("yyyy-MM-dd HH:mm:ss")+"\",\"";
						if(row["loginLog.logoutDt"] != null)
							html +=  new Date(row["loginLog"]["logoutDt"]).format("yyyy-MM-dd HH:mm:ss");
						else 
							if(row["loginLog.loginLogId"] ==  loginLogId )
								html += "로그인중";
							else
								html += "세션아웃";
						html += "\",\"";
						if(row["pgmNm"] != null)
							html += row["pgmNm"];
						else
							html += row["reqUrl"];
						html += "\",\"";
						html += ""+new Date(row["regDt"]).format("yyyy-MM-dd HH:mm:ss")+"\",\""+row["reqParam"]+"\",\""+row["reqMthd"]+"\",\""+row["reqIp"]+"\")'><i class='fa fa-search'></i></button>&nbsp;";
						// html += "<button type='button' class='btn btn-sm btn-outline-primary' data-toggle='tooltip' title='사용자이력' onclick='showWebUserLog(\""+row["user"]["userId"]+"\")'><i class='fa fa-user'></i></button>&nbsp;";
						// html += "<button type='button' class='btn btn-sm btn-outline-primary' data-toggle='tooltip' title='세션이력' onclick='showWebLoginLog(\""+row["loginLog"]["loginLogId"]+"\")'><i class='fa fa-list'></i></button>&nbsp;";

						return html;
					},
				   title : "기능", "className": "dt-head-center dt-body-center", "orderable" : false,
				}
			]
			,"scrollX": "100%"
			,"columnDefs": [
				{"targets":[0], width: "100px"}
				,{"targets":[1], width: "150px"}
				,{"targets":[2], width: "200px"}
				,{"targets":[3], width: "100px"}
				,{"targets":[4], width: "180px"}
				,{"targets":[5], width: "120px"}
			]
			,"fnRowCallback": function(nRow, aData, iDisplayIndex) {
				$(nRow).on('click', function() {
					getSearchCondition(document.searchForm);
				});
			}	
		});
		setSearchCondition(document.searchForm);
	});

	$(".searchOption").keyup(function(e){
		if(e.keyCode == 13)
			datatable.ajax.reload();
	})

	$("#searchBtn").click(function() {
		datatable.ajax.reload();
	});

	function resetSearchForm(){
		$('#userId').val("");
		$('#loginLogId').val("");
		$('#userLoginIdLike').val("");
		$('#userNmLike').val("");
	}
	
	$("#resetBtn").click(function() {
		resetSearchForm();
		datatable.ajax.reload();
	});
	
	function showWebLoginLog(id){
		resetSearchForm();
		$('#loginLogId').val(id);
		datatable.ajax.reload();
	}

	function showWebUserLog(id){
		resetSearchForm();
		$('#userId').val(id);
		datatable.ajax.reload();
	}
	
	function showWebLogDtl(userLoginId, userNm, loginDt, logoutDt, pgmNm, regDt, reqParam, reqMthd, reqIp){
		$('#userLoginId').html(userLoginId);
		$('#userNm').html(userNm);
		$('#loginDt').html(loginDt);
		$('#logoutDt').html(logoutDt);
		$('#pgmNm').html(pgmNm);
		$('#regDt').html(regDt);
		$('#reqParam').html(reqParam);
		$('#reqMthd').html(reqMthd);
		$('#reqIp').html(reqIp);
		$('div.webLogDtl-modal').modal("show");
	}

</script>
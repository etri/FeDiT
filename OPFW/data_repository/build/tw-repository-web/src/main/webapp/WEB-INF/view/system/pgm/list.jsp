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
					<h3 class="box-title"><i class='material-icons' style='font-size:16px;'>play_arrow</i>&nbsp;&nbsp;검색조건</h3>
				</div>
				<div class="box-body">
					<div class="row">
						<div class="col-sm-6 col-xs-12" style="margin-bottom: 10px;">
							<div class="input-group">
								<span class="input-group-addon">프로그램명</span>
								<input type="text" id="pgmNmLike" class="form-control searchOption" placeholder="프로그램명 입력" maxlength="50">
							</div>
						</div>
						<div class="col-sm-6 col-xs-12">
							<div class="input-group">
								<span class="input-group-addon">프로그램 URL</span>
								<input type="text" id="pgmUrlLike" class="form-control searchOption" placeholder="프로그램 URL 입력" maxlength="50">
							</div>
						</div>
					</div>
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
</section>

<div class="modal fade func-modal" data-keyboard="false" data-backdrop="static" tabindex="-1" role="dialog" aria-hidden="true">
	<div class="modal-dialog modal-lg">
		<div class="modal-content">
			<div class="modal-header">
				<h2 id="func-modal-title"></h2>
			</div>
			<div class="modal-body">
				<form id="funcForm" name="funcForm" class="form-horizontal form-label-left">
					<input type="hidden" name="pgmId" />
					<div class="form-group">
						<label class="control-label col-md-3 col-sm-3 col-xs-12">프로그램명 <span class="required">*</span></label>
						<div class="col-md-7 col-sm-7 col-xs-12">
							<input type="text" name="pgmNm" class="form-control col-md-7 col-xs-12" placeholder="프로그램명 입력">
						</div>
					</div>
					<div class="form-group">
						<label class="control-label col-md-3 col-sm-3 col-xs-12">프로그램 설명</label>
						<div class="col-md-7 col-sm-7 col-xs-12">
							<textarea class="form-control" rows="3" name="pgmDesc" placeholder="프로그램명 설명"></textarea>
						</div>
					</div>
					<div class="form-group">
						<label class="control-label col-md-3 col-sm-3 col-xs-12">프로그램 URL <span class="required">*</span></label>
						<div class="col-md-7 col-sm-7 col-xs-12">
							<input type="text" name="pgmUrl" class="form-control col-md-7 col-xs-12" placeholder="프로그램명 호출URL 입력">
						</div>
					</div>
					<div class="form-group">
						<input type="hidden" name="recSt" />
						<label class="control-label col-md-3 col-sm-3 col-xs-12">사용유무</label>
						<div class="col-md-7 col-sm-7 col-xs-12">
							<input type="checkbox" id="recSt" data-toggle="toggle" data-on="사용" data-off=" " checked>
						</div>
					</div>
				</form>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-outline-primary" onclick="func()">확인</button>
				<button type="button" class="btn btn-outline-primary" data-dismiss="modal">닫기</button>
			</div>
		</div>
	</div>
</div>

<script>

	var datatable;
	$(document).ready(function() {
		datatable = $("#datatable").DataTable({
			"searching" : false
			,"paging": true
			,"bPaginate": true
			,"responsive": true
			,"language": lang_kor
			,"ajax" : {
				"url" : "<c:url value='/system/pgm/list.json' />"
				,"method" : "post"
				,"data" : function(d) {
					if ($('#pgmNmLike').val() != "") {d.pgmNmLike = $('#pgmNmLike').val();	}
					if ($('#pgmUrlLike').val() != "") {d.pgmUrlLike = $('#pgmUrlLike').val();	}
				}
				,"error" : function(xhr, status, err) {
					ajaxErrorHandler(xhr);
				}
			},"processing": true
			,"serverSide": true
			,"order" : [[2, 'desc']]
			,"columns": [
				{ "name" : "PGM_NM", "title" : "프로그램명", "data" : "pgmNm", "className" : "dt-head-center dt-body-left"},
				{ "name" : "PGM_URL", "title" : "프로그램 URL", "data" : "pgmUrl", "className" : "dt-head-center dt-body-left"}, 
				{ "name" : "REG_DT", "title" : "등록일", "render" : 
					function (data, type, row) {
						return new Date(row["regDt"]).format("yyyy-MM-dd HH:mm:ss");  
					}, "className" : "dt-head-center dt-body-center"},
				{ "name" : "UPD_DT", "title" : "수정일", "render" : 
					function (data, type, row) {
						return new Date(row["updDt"]).format("yyyy-MM-dd HH:mm:ss");  
					}, "className" : "dt-head-center dt-body-center"},
				{ "render" : 
					function (data, type, row) {
						var html = "";
						html += "<button type='button' class='btn btn-xs btn-outline-primary' data-toggle='tooltip' title='수정' onclick='showUpdateModel(\""+row["pgmId"]+"\")'><i class='material-icons'>create</i></button>&nbsp;";
						html += "<button type='button' class='btn btn-xs btn-outline-primary' data-toggle='tooltip' title='삭제' onclick='del(\""+row["pgmId"]+"\")'><i class='material-icons'>delete</i></button>";
						return html;  
					},
				   "className": "dt-head-center dt-body-center", "orderable" : false, "title":"기능"
				},
			]
			,"scrollX": "100%"
			,"columnDefs": [
				{"targets": [0], width: "150px"}
				,{"targets": [1], width: "200px"}
				,{"targets": [2], width: "180px"}
				,{"targets": [3], width: "180px"}
				,{"targets": [4], width: "100px"}
			]
		});
	});

	$(".searchOption").keyup(function(e){
		if(e.keyCode == 13)
			datatable.ajax.reload();
	})
	
	$("#searchBtn").click(function() {
		datatable.ajax.reload();
	});
	
	$("#resetBtn").click(function() {
		$("#pgmNmLike").val("");
		$("#pgmUrlLike").val("");
		datatable.ajax.reload();
	});
	
	function showInsertModal() {
		var form = document.funcForm;
		form.pgmId.value = "";
		form.pgmNm.value = "";
		form.pgmDesc.value = "";
		form.pgmUrl.value = "";
		$("#recSt").bootstrapToggle('on');
		$("#func-modal-title").html("등록");
		$('.func-modal').modal("show");
	}
	
	function showUpdateModel(pgmId) {
		$.ajax({
			url : "<c:url value='/system/pgm/view.json' />",
			type : "POST",
			data : {"pgmId" : pgmId},
			dataType : "json",
			success : function(res) {
				if ("success" == res.result) {
					var data = res.data;
					var form = document.funcForm;
					form.pgmId.value = data.pgmId;
					form.pgmNm.value = data.pgmNm;
					form.pgmDesc.value = data.pgmDesc;
					
					if(data.pgmDesc == null || data.pgmDesc == ""){
						form.pgmDesc.value = "";	
					}else{
						form.pgmDesc.value = data.pgmDesc;	
					}
					
					form.pgmUrl.value = data.pgmUrl;
					
					if(data.recSt == 1){
						$("#recSt").bootstrapToggle('on');
					}else{ 
						$("#recSt").bootstrapToggle('off');
					}
				
					$("#func-modal-title").html("수정");
					$('.func-modal').modal("show");			
				}else {
					alert(res.message);
				}
			}
		});
	}

	$("#funcForm #recSt").change( function () {
		if($("#recSt").is(":checked")){
			$("[name='recSt']").val("1");
		} else {
			$("[name='recSt']").val("0");
		}
	});

	function func() {
		var form = document.funcForm;
		if($.trim(form.pgmNm.value) == "") {
			alert("프로그램명을 입력 해 주세요.");
			form.pgmNm.focus();
		}else if($.trim(form.pgmUrl.value) == "") {
			alert("프로그램 URL을 입력 해 주세요.");
			form.pgmUrl.focus();
		}else {
			if(form.pgmId.value == '') {
				if(confirm("등록하시겠습니까?")) {
					$.ajax({
						url : "<c:url value='/system/pgm/insert.json' />",
						type : "POST",
						data : $("#funcForm").serialize(),
						dataType : "json",
						success : function(res) {
							if ("success" == res.result) {
								alert("등록되었습니다.");
								$('.func-modal').modal("hide");
								datatable.ajax.reload();
							}else {
								alert(res.message);
							}
						}
					});
				}
			}else {
				if(confirm("수정하시겠습니까?")) {
					$.ajax({
						url : "<c:url value='/system/pgm/update.json' />",
						type : "POST",
						data : $("#funcForm").serialize(),
						dataType : "json",
						success : function(res) {
							if ("success" == res.result) {
								alert("수정되었습니다.");
								$('.func-modal').modal("hide");
								datatable.ajax.reload();
							}else {
								alert(res.message);
							}
						}
					});
				}
			}
		}
	}
	
	function del(pgmId) {
		if(confirm("삭제하시겠습니까?")) {
			$.ajax({
				url : "<c:url value='/system/pgm/delete.json' />",
				type : "POST",
				data : {"pgmId" : pgmId},
				dataType : "json",
				success : function(res) {
					if ("success" == res.result) {
						alert("삭제 되었습니다.");
						$('.func-modal').modal("hide");
						datatable.ajax.reload();
					}else {
						alert(res.message);
					}
				}
			});
		}
	}
	
</script>

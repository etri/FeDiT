<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ include file="/WEB-INF/view/include/tags.jspf"%>

<section class="content">
	<div class="row">
		<div class="col-xs-12">
			<div class="box box-primary">
				<div class="box-header">
					<h3 class="box-title"><i class='material-icons' style='font-size:16px;'>play_arrow</i>&nbsp;&nbsp;보안자원</h3>
				</div>
				<div class="box-body">
						<table id="datatable" class="table table-bordered table-striped" style="width:100%; table-layout:fixed;"></table>
				</div>
				<div class="box-footer">
					<button type="button" class="btn btn-outline-primary pull-right" onclick="scurRscModal()">등록</button>
				</div>
			</div>
		</div>
	</div>
</section>

<div class="modal fade scurRsc-modal" data-keyboard="false" data-backdrop="static" tabindex="-1" role="dialog" aria-hidden="true">
	<div class="modal-dialog modal-lg">
		<div class="modal-content">
			<div class="modal-header">
				<h2>보안자원</h2>
			</div>
			<div class="modal-body">
				<form id="scurRscForm" name="scurRscForm" class="form-horizontal form-label-left">
					<input type="hidden" name="saveUrl" id="saveUrl" value="" />
					<div class="form-group">
						<label class="control-label col-md-3 col-sm-3 col-xs-12">자원ID<span class="required">*</span></label>
						<div class="col-md-6 col-sm-6 col-xs-12">
							<input type="text" name="rscId" id="rscId" data-name="보안자원ID를" class="form-control col-md-7 col-xs-12 req" maxlength="25" placeholder="보안자원ID 입력">
						</div>
					</div>
					<div class="form-group">
						<label class="control-label col-md-3 col-sm-3 col-xs-12">자원명 <span class="required">*</span></label>
						<div class="col-md-6 col-sm-6 col-xs-12">
							<input type="text" name="rscNm" id="rscNm" data-name="보안자원명을" class="form-control col-md-7 col-xs-12 req" maxlength="50" placeholder="보안자원명을 입력"> 
						</div>
					</div>
					<div class="form-group">
						<label class="control-label col-md-3 col-sm-3 col-xs-12">자원유형 <span class="required">*</span></label>
						<div class="col-md-6 col-sm-6 col-xs-12">
							<select id="rscTp" name="rscTp" data-name="보안자원 유형을" class="form-control col-md-7 col-xs-12 req">
								<option value="url" selected="selected">url</option>
								<option value="method">method</option>
								<option value="pointcut">pointcut</option>
							</select>
						</div>
					</div>
					<div class="form-group">
						<label class="control-label col-md-3 col-sm-3 col-xs-12">자원패턴<span class="required">*</span></label>
						<div class="col-md-6 col-sm-6 col-xs-12">
							<input type="text" name="rscPatn" id="rscPatn" data-name="보안자원 패턴을" class="form-control col-md-7 col-xs-12 req" maxlength="150" placeholder="보안자원패턴을 입력">
						</div>
					</div>
					<div class="form-group">
						<label class="control-label col-md-3 col-sm-3 col-xs-12">설명 </label>
						<div class="col-md-6 col-sm-6 col-xs-12">
							<textarea name="rscDesc" id="rscDesc" class="form-control col-md-7 col-xs-12" maxlength="2000" placeholder="보안자원 설명을 입력"></textarea>
						</div>
					</div>
				</form>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-outline-primary" onclick="scurRscInsert()">저장</button>
				<button type="button" class="btn btn-outline-primary" data-dismiss="modal">닫기</button>
			</div>
		</div>
	</div>
</div>

<script>

	var datatable;
	var datatableDetail;
	
	$(document).ready(function(){
		
		//모달창이동
		$('.modal-content').draggable({
			handle: ".modal-header"
		});
		
		datatable = $("#datatable").DataTable({
			"searching" : false
			,"paging": true
			,"bPaginate": true
			,"responsive": true
			,"language": lang_kor
			,"ajax" : {
				"url" : "<c:url value='/system/scurRsc/list.json' />"
				,"method" : "post"
				,"data" : function(d) {
					
				}
				,"error" : function(xhr, status, err) {
					ajaxErrorHandler(xhr);
				}
			},"processing": true
			,"serverSide": true
			,"order" : [[0, 'desc']]
			,"columns": [
				{ "name" : "RSC_ID", "title" : "자원 ID", "data" : "rscId", "className" : "dt-head-center dt-body-left"},
				{ "name" : "RSC_NM", "title" : "자원명", "data" : "rscNm", "className" : "dt-head-center dt-body-left"},
				{ "name" : "RSC_TP", "title" : "자원유형", "data" : "rscTp", "className" : "dt-head-center dt-body-left"},
				{ "name" : "RSC_PATN", "title" : "자원패턴", "data" : "rscPatn", "className" : "dt-head-center dt-body-left"},
				{ "render" : 
					function (data, type, row) {
						var html = "";
						html += "<button type='button' class='btn btn-xs btn-outline-primary' data-toggle='tooltip' title='수정' onclick='scurRscModal(\""+row["rscId"]+"\", \""+row["rscNm"] +"\", \""+row["rscTp"]+"\", \""+row["rscPatn"]+"\", \""+ (row["rscDesc"] == null ? '' : row["rscDesc"]) +"\")'><i class='material-icons'>create</i></button>&nbsp;";
						html += "<button type='button' class='btn btn-xs btn-outline-primary' data-toggle='tooltip' title='삭제' onclick='scurRscDelete(\""+row["rscId"]+"\")'><i class='material-icons'>delete</i></button>&nbsp;";

						return html;  
					},
					"title":"기능", "className": "dt-head-center dt-body-center", "orderable" : false,
				}
			],
			"fnRowCallback": function(nRow, aData, iDisplayIndex) {
			 }
		});//datatable
	});
		
	function scurRscModal(id, name, type, pattern, desc){
		if (id == null) {
			$("#saveUrl").val("<c:url value='/system/scurRsc/insert.json' />");
			$('#rscId').val(""); $('#rscId').removeAttr("readonly");
			$('#rscNm').val("");
			$('#rscTp').val("");
			$('#rscPatn').val("");
			$('#rscDesc').val("");
		}else {
			$("#saveUrl").val("<c:url value='/system/scurRsc/update.json' />");
			$('#rscId').val(id); $('#rscId').attr("readonly","readonly");
			$('#rscNm').val(name);
			$('#rscTp').val(type);
			$('#rscPatn').val(pattern);
			$('#rscDesc').val(desc);
		}
		$('.scurRsc-modal').modal("show");
	}

	function scurRscInsert(){
		if (checkForm ("scurRscForm") && confirm ("저장하시겠습니까?")) {
			$.ajax({
				url : $("#saveUrl").val(),
				type : "POST" ,
				data : $("#scurRscForm").serialize(),
				dataType : "json" ,
				success : function(res) {
					if ("success" == res.result) {
						alert("저장되었습니다.");
						$('.scurRsc-modal').modal("hide");
						datatable.ajax.reload();
					}else if("duplicate" == res.result){
						alert(res.message);
					}else {
						alert(res.message);
					}
				}
			});
		}
	}
	
	function scurRscDelete(rscId){
		$('#rscId').val(rscId);
		if (confirm ("삭제하시겠습니까?")) {
			$.ajax({
				url : "<c:url value='/system/scurRsc/delete.json' />",
				type : "POST" ,
				data : $("#scurRscForm").serialize(),
				dataType : "json" ,
				success : function(res) {
					if ("success" == res.result) {
						alert("삭제되었습니다.");
						datatable.ajax.reload();
					}else if("duplicate" == res.result){
						alert(res.message);
					}else {
						alert(res.message);
					}
				}
			});
		}
	}

</script>
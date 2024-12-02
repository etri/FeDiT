<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ include file="/WEB-INF/view/include/tags.jspf"%>

<%--<script src="<c:url value='/js/util/formUtil.js'/>"></script>--%>

<style>
	.where {
		display: block;
		margin: 25px 15px;
		font-size: 11px;
		color: #000;
		text-decoration: none;
		font-family: verdana;
		font-style: italic;
	}

	.filebox > * {
		margin-right: 5px;
	}
	.filebox input[type="file"] {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		/*margin: -1px;*/
		overflow: hidden;
		clip:rect(0,0,0,0);
		border: 0;
	}

	/* named upload */
	.filebox .upload-name {
		display: inline-block;
		padding: .5em .75em;
		font-size: inherit;
		font-family: inherit;
		line-height: normal;
		vertical-align: middle;
		background-color: #f5f5f5;
		border: 1px solid #ebebeb;
		border-bottom-color: #e2e2e2;
		border-radius: .25em;
		-webkit-appearance: none; /* 네이티브 외형 감추기 */
		-moz-appearance: none;
		appearance: none;
	}

	/* imaged preview */
	.filebox .upload-display {
		margin-bottom: 5px;
	}

	@media(min-width: 768px) {
		.filebox .upload-display {
			display: inline-block;
			margin-right: 5px;
			margin-bottom: 0;
		}
	}

	.filebox .upload-thumb-wrap {
		display: inline-block;
		width: 54px;
		padding: 2px;
		vertical-align: middle;
		border: 1px solid #ddd;
		border-radius: 5px;
		background-color: #fff;
	}

	.filebox .upload-display img {
		display: block;
		max-width: 100%;
		width: 100% \9;
		height: auto;
	}

	.filebox.bs3-primary label {
		color: #fff;
		background-color: #337ab7;
		border-color: #2e6da4;
	}
</style>

<section class="content-header">
	<tg:menuInfoTag />
</section>

<section class="content">
	<div class="row">
		<div class="col-xs-12">
			<div class="box box-success">
				<div class="box-footer">
					<div class="box-tools pull-right">
						<button type="button" class="btn btn-outline-primary pull-right" onclick="cdDtlModal(0)"><spring:message code='ui.common.register'/></button>
					</div>
				</div>
			</div>
		</div>
		<div class="col-xs-12">
			<div class="box box-success">
				<div class="box-header">
					<h3 class="box-title"><i class='material-icons' style='font-size:16px;'>play_arrow</i>&nbsp;&nbsp;<spring:message code='ui.common.codeClassification'/></h3>
				</div>
				 <div class="box-body">
					<div class="row">
						<div class="col-xs-12">
							<div class="form-group">
								<div class="col-sm-6 col-xs-7" style="margin-bottom: 10px;">
									<select class="form-control selectpicker" id="cdSelect" name="cdSelect">
										<c:forEach var="cd" items="${cdList}">
											<option value="${cd.cdId}">${cd.cdNm} [${cd.cdId}]</option>
										</c:forEach>
									</select>
								</div>
								<div class="col-sm-6 col-xs-5">
									<button type="button" class="btn btn-sm btn-outline-primary" data-toggle="tooltip" title="<spring:message code='ui.common.register'/>" onclick="cdModal(0)" ><i class="material-icons">playlist_add</i></button>
									<button type="button" class="btn btn-sm btn-outline-primary" data-toggle="tooltip" title="<spring:message code='ui.common.modify'/>" onclick="cdModal(1)" ><i class="material-icons">create</i></button>
								</div>
							</div>
						</div>
					</div>
					<div class="row">
						<div class="col-xs-12">
						    <input type="hidden" id="cdClsSelect" name="cdClsSelect" value="cms">
							<input type="hidden" id="cdClsSelectId" name="cdClsSelectId" value="cms">
							<input type="hidden" id="cdClsSelectNm" name="cdClsSelectNm"  value="cms">
							<input type="hidden" id="cdClsSelectUseSt" name="cdClsSelectUseSt">
							<textarea id="cdClsSelectDesc" class="form-control" readonly>
							</textarea>
						</div>
					</div>
				</div>
			</div>
		</div>
		
		<!-- <div class="col-xs-6">
			<div class="box box-primary">
				<div class="box-header">
					<h3 class="box-title"><i class='material-icons' style='font-size:16px;'>play_arrow</i>&nbsp;&nbsp;코드</h3>
				</div>
				<div class="box-body">
					<table id="datatable" class="table table-bordered table-striped" style="width:98%; table-layout:fixed;"></table>
				</div>
				<div class="box-footer">
					<div class="box-tools pull-right">
						<button type="button" class="btn btn-outline-primary pull-right" onclick="cdModal(0)">등록</button>
					</div>
				</div>
			</div>
		</div>
		 -->
		<div class="col-xs-12">
			<div class="box box-primary">
				<div class="box-header">
					<h3 class="box-title"><i class='material-icons' style='font-size:16px;'>play_arrow</i>&nbsp;&nbsp;<spring:message code='ui.common.detailedCode'/></h3>
				</div>
				<div class="box-body">
					<table id="datatableDetail" class="table table-bordered table-striped" style="width:98%; table-layout:fixed;"></table>
				</div>
<%--				<div class="box-footer">--%>
<%--					<div class="box-tools pull-right">--%>
<%--						<button type="button" class="btn btn-outline-primary pull-right" onclick="cdDtlModal(0)">등록</button>--%>
<%--					</div>--%>
<%--				</div>--%>
			</div>
		</div>
	</div>
</section>

<!-- 코드분류 모달 -->
<div class="modal fade cdCls-modal" data-keyboard="false" data-backdrop="static" tabindex="-1" role="dialog" aria-hidden="true">
	<div class="modal-dialog modal-lg">
		<div class="modal-content">
			<div class="modal-header">
				<h2><spring:message code='ui.common.codeClassification'/></h2>
			</div>
			<div class="modal-body">
				<form id="cdClsForm" name="cdClsForm" class="form-horizontal form-label-left">
					<input type="hidden" name="saveUrl" id="saveUrlClass" value="" />
					<div class="form-group">
						<label class="control-label col-md-3 col-sm-3 col-xs-12"><spring:message code='ui.common.codeClassificationId'/> <span class="required">*</span></label>
						<div class="col-md-7 col-sm-7 col-xs-12">
							<input type="text" name="cdClsId" id="cdClsId" data-name="코드분류ID를" class="form-control col-md-7 col-xs-12 req" placeholder="코드분류ID를 입력">
						</div>
					</div>
					<div class="form-group">
						<label class="control-label col-md-3 col-sm-3 col-xs-12"><spring:message code='ui.common.codeClassificationName'/> <span class="required">*</span></label>
						<div class="col-md-7 col-sm-7 col-xs-12">
							<input type="text" name="cdClsNm" id="cdClsNm" data-name="코드분류 명이" class="form-control col-md-7 col-xs-12 req" placeholder="코드분류명을 입력">
						</div>
					</div>
					<div class="form-group">
						<label class="control-label col-md-3 col-sm-3 col-xs-12"><spring:message code='ui.common.codeClassificationExplanation'/> </label>
						<div class="col-md-7 col-sm-7 col-xs-12">
							<textarea name="cdClsDesc" id="cdClsDesc" data-name="코드분류 설명이" class="form-control col-md-7 col-xs-12" placeholder="코드분류 설명을 입력"></textarea>
						</div>
					</div>
					<div class="form-group">
						<label class="control-label col-md-3 col-sm-3 col-xs-12"><spring:message code='ui.common.useOrNot'/> <span class="required">*</span></label>
						<div class="col-md-7 col-sm-7 col-xs-12">
							<select id="cdClsUseSt" name="recSt" class="form-control selectpicker">
								<option value="Y"><spring:message code='ui.common.use'/></option>
								<option value="N"><spring:message code='ui.common.사용안함'/></option>
							</select>
						</div>
					</div>
				</form>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-outline-primary" onclick="cdClsInsert ()"><spring:message code='ui.common.save'/></button>
				<button type="button" class="btn btn-outline-primary" data-dismiss="modal"><spring:message code='ui.common.close'/></button>
			</div>
		</div>
	</div>
</div>

<!-- 코드 모달 -->
<div class="modal fade cd-modal" data-keyboard="false" data-backdrop="static" tabindex="-1" role="dialog" aria-hidden="true">
	<div class="modal-dialog modal-lg">
		<div class="modal-content">
			<div class="modal-header">
				<h2><spring:message code='ui.common.code'/></h2>
			</div>
			<div class="modal-body">
				<form id="cdForm" name="cdForm" class="form-horizontal form-label-left">
					<input type="hidden" name="saveUrl" id="saveUrl" value="" />
					<input type="hidden" name="cdClsId" id="cdClsId1" value="cms" />
					<input type="hidden" name="cdClsNm" id="cdClsNm1" value="cms" />
					<div class="form-group">
						<label class="control-label col-md-3 col-sm-3 col-xs-12"><spring:message code='ui.common.codeId'/> <span class="required">*</span></label>
						<div class="col-md-7 col-sm-7 col-xs-12">
							<input type="text" name="cdId" id="cdId" data-name="코드ID를" class="form-control col-md-7 col-xs-12 req" placeholder="코드ID를 입력">
						</div>
					</div>
					<div class="form-group">
						<label class="control-label col-md-3 col-sm-3 col-xs-12"><spring:message code='ui.common.codeName'/> <span class="required">*</span></label>
						<div class="col-md-7 col-sm-7 col-xs-12">
							<input type="text" name="cdNm" id="cdNm" data-name="코드명을" class="form-control col-md-7 col-xs-12 req" placeholder="코드명를 입력">
						</div>
					</div>
					<div class="form-group">
						<label class="control-label col-md-3 col-sm-3 col-xs-12"><spring:message code='ui.common.codeExplanation'/> </label>
						<div class="col-md-7 col-sm-7 col-xs-12">
							<textarea name="cdDesc" id="cdDesc" class="form-control col-md-7 col-xs-12" placeholder="코드설명을 입력"></textarea>
						</div>
					</div>
					<div class="form-group">
						<label class="control-label col-md-3 col-sm-3 col-xs-12"><spring:message code='ui.common.useOrNot'/> <span class="required">*</span></label>
						<div class="col-md-7 col-sm-7 col-xs-12">
							<select id="cdUseSt" name="recSt" class="form-control selectpicker">
								<option value="Y" selected><spring:message code='ui.common.use'/></option>
								<option value="N"><spring:message code='ui.common.noUse'/></option>
							</select>
						</div>
					</div>
				</form>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-outline-primary" onclick="cdInsert()"><spring:message code='ui.common.save'/></button>
				<button type="button" class="btn btn-outline-primary" data-dismiss="modal"><spring:message code='ui.common.close'/></button>
			</div>
		</div>
	</div>
</div>

<!-- 상세코드 모달 -->
<div class="modal fade cdDtl-modal" data-keyboard="false" data-backdrop="static" tabindex="-1" role="dialog" aria-hidden="true">
	<div class="modal-dialog modal-lg">
		<div class="modal-content">
			<div class="modal-header">
				<h2><spring:message code='ui.common.detailedCode'/></h2>
			</div>
			<div class="modal-body">
				<form id="cdDtlForm" name="cdDtlForm" class="form-horizontal form-label-left">
					<input type="hidden" name="saveUrl" id="saveUrlDetail" value="" />
					<input type="hidden" name="cdId" id="cdId1">
					<input type="hidden" name="cdDtlActiveIcon" id="cdDtlActiveIcon">
					<input type="hidden" name="cdDtlInactiveIcon" id="cdDtlInactiveIcon">
					<div class="form-group">
						<label class="control-label col-md-3 col-sm-3 col-xs-12"><spring:message code='ui.common.codeName'/> </label>
						<div class="col-md-7 col-sm-7 col-xs-12">
							<input type="text" name="cdNm" id="cdNm1" data-name="코드명이" class="form-control col-md-7 col-xs-12 req" readOnly disabled>
						</div>
					</div>
					<div class="form-group">
						<label class="control-label col-md-3 col-sm-3 col-xs-12"><spring:message code='ui.common.detailedCodeId'/><span class="required">*</span></label>
						<div class="col-md-7 col-sm-7 col-xs-12">
							<input type="text" name="cdDtlId" id="cdDtlId" data-name="상세코드ID를" class="form-control col-md-7 col-xs-12 req" placeholder="상세코드명ID를 입력">
						</div>
					</div>
					<div class="form-group">
						<label class="control-label col-md-3 col-sm-3 col-xs-12"><spring:message code='ui.common.detailedCodeName'/> <span class="required">*</span></label>
						<div class="col-md-7 col-sm-7 col-xs-12">
							<input type="text" name="cdDtlNm" id="cdDtlNm" data-name="상세코드명을" class="form-control col-md-7 col-xs-12 req" placeholder="상세코드명을 입력">
						</div>
					</div>
					<div class="form-group">
						<label class="control-label col-md-3 col-sm-3 col-xs-12"><spring:message code='ui.common.label'/><span class="required">*</span></label>
							<div class="col-md-7 col-sm-7 col-xs-12">
								<label>
	                 				<input type="radio" name="cdDtlLabel" value="default" checked >
	                 				<span class="label label-default">&nbsp; &nbsp; &nbsp; &nbsp;</span>
	               				</label>
	               				<label>
	               					<input type="radio" name="cdDtlLabel" value="primary">
	               					<span class="label label-primary">&nbsp; &nbsp; &nbsp; &nbsp;</span>
	               				</label>
	               				<label>
	               					<input type="radio" name="cdDtlLabel" value="success">
	               					<span class="label label-success">&nbsp; &nbsp; &nbsp; &nbsp;</span>
	               				</label>
	               				<label>
	               					<input type="radio" name="cdDtlLabel" value="info" >
	               					<span class="label label-info">&nbsp; &nbsp; &nbsp; &nbsp;</span>
	               				</label>
	               				<label>
	               					<input type="radio" name="cdDtlLabel" value="warning">
	               					<span class="label label-warning">&nbsp; &nbsp; &nbsp; &nbsp;</span>
	               				</label>
	               				<label>
	               					<input type="radio" name="cdDtlLabel" value="danger" >
	               					<span class="label label-danger">&nbsp; &nbsp; &nbsp; &nbsp;</span>
	               				</label>
							</div>
					</div>
					<div class="form-group">
						<label class="control-label col-md-3 col-sm-3 col-xs-12"><spring:message code='ui.common.detailedCodeExplanation'/> </label>
						<div class="col-md-7 col-sm-7 col-xs-12">
							<textarea name="cdDtlDesc" id="cdDtlDesc" class="form-control col-md-7 col-xs-12" placeholder="상세코드 설명을 입력"></textarea>
						</div>
					</div>
					<div class="form-group">
						<label class="control-label col-md-3 col-sm-3 col-xs-12"><spring:message code='ui.common.detailedCodeOrder'/><span class="required">*</span></label>
						<div class="col-md-7 col-sm-7 col-xs-12">
							<input type="text" name="cdDtlOrd" id="cdDtlOrd" class="form-control col-md-7 col-xs-12" placeholder="상세코드 순서를 입력">
						</div>
					</div>
					<div class="form-group">
						<label class="control-label col-md-3 col-sm-3 col-xs-12"><spring:message code='ui.common.useOrNot'/> <span class="required">*</span></label>
						<div class="col-md-7 col-sm-7 col-xs-12">
							<select id="cdDtlUseSt" name="recSt" class="form-control selectpicker">
								<option value="Y" selected><spring:message code='ui.common.use'/></option>
								<option value="N"><spring:message code='ui.common.noUse'/></option>
							</select>
						</div>
					</div>
					<div class="form-group">
						<label class="control-label col-md-3 col-sm-3 col-xs-12"><spring:message code='ui.common.activeIcon'/> </label>
						<div class="col-md-7 col-sm-7 col-xs-12 filebox" style='display:flex; align-items: center;'>
							<input id="activeIconFileNm" class="upload-name" value="<spring:message code='ui.common.selectFile'/>" disabled="disabled">
							<label for="activeIcon" class="btn btn-outline-primary"><spring:message code='ui.common.selectFile'/></label>
							<input type="file"
								   id="activeIcon" name="activeIcon"
								   accept="image/png, image/jpeg" class="upload-hidden">
							<button type="button" class="btn btn-outline-primary delete-file"><spring:message code='ui.common.deleteFile'/></button>
						</div>
					</div>
					<div class="form-group">
						<label class="control-label col-md-3 col-sm-3 col-xs-12"><spring:message code='ui.common.inactiveIcon'/> </label>
						<div class="col-md-7 col-sm-7 col-xs-12 filebox" style='display:flex; align-items: center;'>
							<input id="inactiveIconFileNm" class="upload-name" value="<spring:message code='ui.common.selectFile'/>" disabled="disabled">
							<label for="inactiveIcon" class="btn btn-outline-primary"><spring:message code='ui.common.selectFile'/></label>
							<input type="file"
								   id="inactiveIcon" name="inactiveIcon"
								   accept="image/png, image/jpeg" class="upload-hidden">
							<button type="button" class="btn btn-outline-primary delete-file"><spring:message code='ui.common.deleteFile'/></button>
						</div>
					</div>
					<div class="form-group">
						<label class="control-label col-md-3 col-sm-3 col-xs-12"><spring:message code='ui.common.customIntData'/></label>
						<div class="col-md-7 col-sm-7 col-xs-12">
							<input type="text" name="cdDtlCustomInt" id="cdDtlCustomInt" class="form-control col-md-7 col-xs-12" placeholder="커스텀 Int 데이터를 입력">
						</div>
					</div>
				</form>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-outline-primary" onclick="cdDtlInsert ()"><spring:message code='ui.common.save'/></button>
				<button type="button" class="btn btn-outline-primary" data-dismiss="modal"><spring:message code='ui.common.close'/></button>
			</div>
		</div>
	</div>
</div>

<script>

	var datatableDetail;
	
	$(document).ready(function(){
		
		$("#cdDtlOrd").numeric ({
			allowSpace: false
		});
		
		//모달창이동
		$('.modal-content').draggable({
			handle: ".modal-header"
		});
		
		$('#all').attr("checked", true);
		$("#cdClsSelectDesc").hide();
		
		datatableDetail = $("#datatableDetail").DataTable({
			"searching" : false
			,"paging": true
			,"bPaginate": true
			,"responsive": true
			,"language": lang_kor
			,"ajax" : {
				"url" : "<c:url value='/system/cdDtl/list.json' />"
				,"method" : "post"
				,"data" : function(d) {
					d.cdId = $("#cdSelect").val();
				}
				,"error" : function(xhr, status, err) {
					ajaxErrorHandler(xhr);
				}
			}
			,"processing": true
			,"serverSide": true
			,"order" : [[0, 'desc']]
			,"columns": [
				{ "width": "100px", "name" : "CD_DTL_ID", "title" : "<spring:message code='ui.common.detailedCode'/>", "data" : "item.cdDtlId" , defaultContent:"-", "className" : "dt-head-center dt-body-left"},
				{ "width": "100px", "name" : "CD_DTL_NM", "title" : "<spring:message code='ui.common.detailedCodeName'/>",
					"render" : function (data, type, row) {
						return "<span class='label label-"+row.item.cdDtlLabel+"'>"+row.item.cdDtlNm+"</span>";
					}, "className" : "dt-head-center dt-body-center"},
				{ "width": "150px", "name" : "CD_DTL_DESC", "title" : "<spring:message code='ui.common.detailedCodeExplanation'/>", "data" : "item.cdDtlDesc" , defaultContent:"-", "className" : "dt-head-center dt-body-left"},
				{ "width": "50px", "name" : "CD_DTL_ORD", "title" : "<spring:message code='ui.common.order'/>", "data" : "item.cdDtlOrd" , defaultContent:"-", "className" : "dt-head-center dt-body-left"},
				{ "width": "100px", "name" : "REC_ST", "title" : "<spring:message code='ui.common.useOrNot'/>", "data" : "item.recSt" , defaultContent:"-", "className" : "dt-head-center dt-body-left",
					"render" : function (data, type, row) {
						if(row.item.recSt=="Y"){
							return "<spring:message code='ui.common.use'/>"
						} else if(row.item.recSt=="N"){
							return "<spring:message code='ui.common.noUse'/>"
						}
					}, "searchable": true},
				{
					"width": "100px", "render":
							function (data, type, row) {
								var html = "<div style='display:flex; justify-content:center;'>";
								if (strUtil.isNotEmpty(row.activeIcon)) {
									html += "<img src='/res/" + row.activeIcon + "?ut=" + row.item.updDt + "'/>";
								}
								html += "</div>";
								return html;
							}, "title": "<spring:message code='ui.common.activeIcon'/>", "className": "dt-head-center dt-body-center", "orderable": false,
				},
				{
					"width": "100px", "render":
							function (data, type, row) {
								var html = "<div style='display:flex; justify-content:center;'>";
								if (strUtil.isNotEmpty(row.inactiveIcon)) {
									html += "<img src='/res/" + row.inactiveIcon + "?ut=" + row.item.updDt + "'/>";
								}
								html += "</div>";
								return html;
							}, "title": "<spring:message code='ui.common.inactiveIcon'/>", "className": "dt-head-center dt-body-center", "orderable": false,
				},
				{ "width": "100px", "render" :
					function (data, type, row) {
						var html = "";
						html += "<button type='button' class='btn btn-xs btn-outline-primary' data-toggle='tooltip' title='<spring:message code='ui.common.modify'/>' onclick='cdDtlModal(\""
																															+row.item.cdDtlId+"\", \""
																															+row.item.cdDtlNm+"\", \""
																															+row.item.cdDtlLabel+"\", \""
																															+(row.item.cdDtlDesc == null ? '' : row.item.cdDtlDesc)+"\", \""
																															+row.item.cdDtlOrd+"\", \""
																															+row.item.recSt+"\", \""
																															+(row.item.cdDtlActiveIcon == null ? '' : row.item.cdDtlActiveIcon)+"\" ,\""
																															+(row.item.cdDtlInactiveIcon == null ? '' : row.item.cdDtlInactiveIcon)+"\" ,\""
																															+row.activeIconFileNm+"\" ,\""
																															+row.inactiveIconFileNm+"\" ,\""
																															+(row.item.cdDtlCustomInt == null ? '' : row.item.cdDtlCustomInt)
																																			+"\")'><i class='material-icons'>create</i></button>&nbsp;";
						html += "<button type='button' class='btn btn-xs btn-outline-primary' data-toggle='tooltip' title='<spring:message code='ui.common.delete'/>' onclick='cdDtlDelte(\""+row.item.cdDtlId+"\", \""+row.item.cdId+"\")'><i class='material-icons'>delete</i></button>&nbsp;";
						return html;
					}, "title":"<spring:message code='ui.common.function'/>", "className": "dt-head-center dt-body-center", "orderable" : false
				}
			]
			,"scrollX": "100%"
		});//datatableDetail
		
		$("#cdSelect").change(function(){//코드 분류 값이 바뀔 때
			// datatable.ajax.reload(); //데이터 테이블 리로드
			datatableDetail.ajax.reload(); //데이터 테이블 리로드
		});
		
		$('input:radio[name="checkUseSt"]').click(function(){
			cdClsList($(this).val());
		});

		$(".upload-hidden").on('change',function(){
			let fileName;
			//var fileName = $("#inactiveIcon").val();
			if(window.FileReader){
				// 파일명 추출
				fileName = $(this)[0].files[0].name;
			}

			else {
				// Old IE 파일명 추출
				fileName = $(this).val().split('/').pop().split('\\').pop();
			};

			$(this).siblings('.upload-name').val(fileName);
		});

		$(".delete-file").on('click',function(){
			$('#cdDtlActiveIcon').val("");
			$('#cdDtlInactiveIcon').val("");
			$(this).siblings('.upload-hidden').val("");
			$(this).siblings('.upload-name').val("");
		});
	});
	
	function cdClsModal(id){//코드 분류 모달 오픈
		
		if (id == 0){
			$("#saveUrlClass").val("<c:url value='/system/cdCls/insert.json' />");
			$('#cdClsId').val(""); $("#cdClsId").removeAttr('readOnly');
			$('#cdClsNm').val("");
			$('#cdClsDesc').val("");
		} else {
			
			if(isEmptyString ($("#cdClsSelect").val())){
				alert("<spring:message code='ui.message.error.input.selectCodeClassification'/>");
				return;
			}
			
			$("#saveUrlClass").val("<c:url value='/system/cdCls/update.json' />");
			$('#cdClsId').val($("#cdClsSelectId").val()); $("#cdClsId").attr('readOnly', true); $("#cdClsId").attr('disabled', true);
			$('#cdClsNm').val($("#cdClsSelectNm").val());
			//$('#cdClsDesc').val($("#cdClsSelectDesc").text());
			$('#cdClsDesc').val($("#cdClsSelectDesc").val());
			if($("#cdClsSelectUseSt").val() == "Y"){
				$("#cdClsUseSt").val("Y");
			}else{
				$("#cdClsUseSt").val("N");
			}
		}
		$('.cdCls-modal').modal("show");
	}	
	
	function cdModal(id, name, desc, recSt){ //코드 모달 오픈
		if(isEmptyString ($("#cdClsSelect").val())){
			alert("<spring:message code='ui.message.error.input.selectCodeClassification'/>");
			return;
		}
		$("#cdClsId1").val($("#cdClsSelectId").val());
		$("#cdClsNm1").val($("#cdClsSelectNm").val());

		if (id == 0) {
			$("#saveUrl").val("<c:url value='/system/cd/insert.json' />");
			$('#cdId').val("");
			$("#cdId").removeAttr('readOnly'); 
			$('#cdNm').val("");
			$('#cdDesc').val("");
			$('#cdUseSt').val("");
			$('#cdUseSt').selectpicker("refresh");
			$('.cd-modal').modal("show");
		} else {
			$.ajax({
				url : "/system/cd/select.json",
				type : "POST",
				data : { "cdClsId" : $("#cdClsSelectId").val(), "cdId" : $("#cdSelect").val() },
				dataType : "json" ,
				success : function(res) {
					if ("success" == res.result) {
						$("#cdForm #saveUrl").val("<c:url value='/system/cd/update.json' />");						
						$("#cdForm #cdId").attr('readOnly', true);
						$("#cdForm #cdId").val(res.data.cdId);
						$("#cdForm #cdNm").val(res.data.cdNm);
						$("#cdForm #cdDesc").val(res.data.cdDesc);
						$("#cdForm #cdUseSt").val(res.data.recSt);
						$("#cdForm #cdUseSt").selectpicker("refresh");
						$('.cd-modal').modal("show");
					}else if("duplicate" == res.result){
						alert(res.message);
					}else {
						alert(res.message);
					}
				}
			});
		}		
	}

	function cdDtlModal(id, name, label, desc, order, recSt, activeIconId, inactiveIconId, activeIconFileNm, inactiveIconFileNm, customInt) { //코드 상세 모달 오픈
		if (isEmptyString ($("#cdSelect").val())) {
			alert("<spring:message code='ui.message.error.input.selectCode'/>");
			return;
		}

		if (id == 0) {
			$("#saveUrlDetail").val("<c:url value='/system/cdDtl/insert.json' />");
			$("#mode").val("cdDtlInsert");
			$("#cdId1").val($("#cdSelect").val());
			$("#cdNm1").val($("#cdSelect option:selected").text());
			$("#cdDtlId").removeAttr('readOnly');
			$('#cdDtlId').val("");
			$('#cdDtlNm').val("");
			$('input:radio[name="cdDtlLabel"]:eq(0)').prop("checked", true).change();
			$('#cdDtlDesc').val("");
			$('#cdDtlOrd').val("");
			$("#cdDtlUseSt").val("Y");
			$("#cdDtlUseSt").selectpicker("refresh");
			$('#cdDtlActiveIcon').val("");
			$('#cdDtlInactiveIcon').val("");
			$("#activeIconFileNm").val("");
			$("#inactiveIconFileNm").val("");
			$('#cdDtlCustomInt').val("");
		} else {
			if("undefined" == activeIconFileNm){
				activeIconFileNm = "";
			}
			if("undefined" == inactiveIconFileNm){
				inactiveIconFileNm = "";
			}

			$("#saveUrlDetail").val("<c:url value='/system/cdDtl/update.json' />");
			$("#cdId1").val($("#cdSelect").val());
			$("#cdNm1").val($("#cdSelect option:selected").text());
			$("#cdDtlId").attr('readOnly', true);
			$("#cdDtlId").val(id); 
			$("#cdDtlNm").val(name);
			$('input:radio[name="cdDtlLabel"]:input[value="' + label + '"]').prop("checked", true).change();
			$("#cdDtlDesc").val(desc);
			$("#cdDtlOrd").val(order);
			$("#cdDtlUseSt").val(recSt);
			$("#cdDtlUseSt").selectpicker("refresh");
			$('#cdDtlActiveIcon').val(activeIconId);
			$('#cdDtlInactiveIcon').val(inactiveIconId);
			$("#activeIconFileNm").val(activeIconFileNm);
			$("#inactiveIconFileNm").val(inactiveIconFileNm);
			$("#cdDtlCustomInt").val(customInt);
		}
		$('#activeIcon').val("");
		$('#inactiveIcon').val("");
		$('.cdDtl-modal').modal("show");
	}
	
	function cdClsInsert(){//코드 분류 등록 및 수정
		if (checkForm ("cdClsForm") && confirm ("<spring:message code='ui.message.ask.insert'/>")) {
			$.ajax({
				url : $("#saveUrlClass").val() ,
				type : "POST" ,
				data : $("#cdClsForm").serialize(),
				dataType : "json" ,
				success : function(res) {
					if ("success" == res.result) {
						alert("<spring:message code='ui.message.success.inserted'/>");
						$('.cdCls-modal').modal("hide");
						cdClsList();
					}else if("duplicate" == res.result){
						alert(res.message);
					}else {
						alert(res.message);
					}
				}
			});
		}
	}
	
	function cdInsert(){//코드 등록
		if (checkForm ("cdForm") && confirm ("<spring:message code='ui.message.ask.insert'/>")) {
			$.ajax({
				url : $("#saveUrl").val(),
				type : "POST" ,
				data : $("#cdForm").serialize(),
				dataType : "json" ,
				success : function(res) {
					if ("success" == res.result) {						
						var option = $("<option value='"+$('#cdId').val()+"'>" +$('#cdNm').val()+" ["+ $('#cdId').val() +"]"+ "</option>");
		                $('#cdSelect').append(option);
		                $('#cdSelect').val($('#cdId').val());
		                $('#cdSelect').change();
		                
						alert("<spring:message code='ui.message.success.inserted'/>");
						$('.cd-modal').modal("hide");
						
						//datatable.ajax.reload(); // 데이터 테이블 리로드
					}else if("duplicate" == res.result){
						alert(res.message);
					}else {
						alert(res.message);
					}
				}
			});
		}
	}
	
	function cdDtlInsert(){//코드상세 등록
		if (checkForm ("cdDtlForm") && confirm ("<spring:message code='ui.message.ask.insert'/>")) {
			let cdDtl_form = $("#cdDtlForm")[0];
			let formData = new FormData(cdDtl_form);

			let fileInput_active = $('#activeIcon');
			let fileList_active = fileInput_active[0].files;
			let fileObj_active = fileList_active[0];

			formData.append("activeIcon", fileObj_active);

			let fileInput_inactive = $('#inactiveIcon');
			let fileList_inactive = fileInput_inactive[0].files;
			let fileObj_inactive = fileList_inactive[0];

			formData.append("inactiveIcon", fileObj_inactive);

			let deleteActiveIcon = false;
			if( strUtil.isEmpty($("#activeIconFileNm").val()) ){
				deleteActiveIcon = true;
			}
			formData.append("deleteActiveIcon", deleteActiveIcon);

			let deleteInactiveIcon = false;
			if( strUtil.isEmpty($("#inactiveIconFileNm").val()) ){
				deleteInactiveIcon = true;
			}
			formData.append("deleteInactiveIcon", deleteInactiveIcon);

			$.ajax({
				url : $("#saveUrlDetail").val(),
				type : "POST" ,
				processData: false,
				contentType: false,
				data : formData,
				dataType : "json" ,
				success : function(res) {
					if ("success" == res.result) {
						alert("<spring:message code='ui.message.success.inserted'/>");
						$('.cdDtl-modal').modal("hide");
						datatableDetail.ajax.reload(); // 데이터 테이블 리로드
					}else if("duplicate" == res.result){
						alert(res.message);
					}else {
						alert(res.message);
					}
				}
			});
		}
	}
	
	function cdClsList(recSt){//코드 분류 리스트 전송
		$.ajax({
			url : "<c:url value='/system/cdCls/list.json' />",
			type : "POST" ,
			data : {"recSt" : recSt} ,
			dataType : "json" ,
			success : function(res) {
				var list = res.result;
				$("#cdClsSelect").find('option').each(function(){
					$(this).remove();	
				});
				$("#cdClsSelect").append("<option value=''><spring:message code='ui.common.selectCodeClassification'/></option>");
				for(var i=0; i<list.length; i++){
					$("#cdClsSelect").append("<option value="+list[i].cdClsId+">"+list[i].cdClsNm+"</option>");
				}
				datatable.ajax.reload();
				$("#cdSelectId").val('');
				datatableDetail.ajax.reload();
			}
		});
	}
	
	function cdDelte(cdId ,cdClsId){
		if (confirm ("<spring:message code='ui.message.ask.delete'/>")) {
			$.ajax({
				url : "<c:url value='/system/cd/delete.json' />",
				type : "POST" ,
				data : {"cdId" : cdId, "cdClsId":cdClsId} ,
				dataType : "json" ,
				success : function(res) {
					if(res.result == "cntFail"){
						alert("<spring:message code='ui.message.error.common.subCodeExist'/>");
					}else if(res.result = "success"){
						alert("<spring:message code='ui.message.success.delete'/>");
						datatable.ajax.reload();	
					}
				}
			});
		}
	}
	
	function cdClsDelte(cdClsId){
		if (confirm ("<spring:message code='ui.message.ask.delete'/>")) {
			$.ajax({
				url : "<c:url value='/system/cdCls/delete.json' />",
				type : "POST" ,
				data : {"cdClsId" : cdClsId} ,
				dataType : "json" ,
				success : function(res) {
					if(res.result == "cntFail"){
						alert("<spring:message code='ui.message.error.common.subCodeExist'/>");
					}else if(res.result = "success"){
						alert("<spring:message code='ui.message.success.delete'/>");
						datatableDetail.ajax.reload();	
					}
				}
			});
		}
	}
	
	function cdDtlDelte(cdDtlId , cdId){
		if (confirm ("<spring:message code='ui.message.ask.delete'/>")) {
			$.ajax({
				url : "<c:url value='/system/cdDtl/delete.json' />",
				type : "POST" ,
				data : {"cdDtlId" : cdDtlId,"cdId" : cdId} ,
				dataType : "json" ,
				success : function(res) {
					alert("<spring:message code='ui.message.success.delete'/>");
					datatableDetail.ajax.reload();
				}
			});
		}
	}
</script>
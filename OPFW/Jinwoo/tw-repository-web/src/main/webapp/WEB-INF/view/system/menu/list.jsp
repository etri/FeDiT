<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ include file="/WEB-INF/view/include/tags.jspf"%>

<section class="content-header">
	<tg:menuInfoTag />
</section>

<section class="content">
	<div class="row">
		<div class="col-xs-12">
			<div class="box box-primary">
				<div class="box-header">
					<h3 class="box-title"><i class='material-icons' style='font-size:16px;'>play_arrow</i>&nbsp;&nbsp;<spring:message code='ui.common.menuList'/></h3>
				</div>
				<div class="box-footer">
					<button type="button" class="btn btn-outline-primary" onclick="goChangeOrder()"><i class='fa fa-bars'></i> <spring:message code='ui.common.changeMenuOrder'/></button>
					<button type="button" class="btn btn-outline-primary pull-right" onclick="showInsertModal()"><spring:message code='ui.common.addTopMenu'/></button>
				</div>
				<div class="box-body">
					<div class="row">
						<div class="col-xs-12">
							<div style="overflow: auto;">
								<table id="datatable" class="table table-bordered table-striped" style="width:100%; table-layout:fixed;">
									<thead>
										<tr>
											<th class="text-center" style="width: 200px;"><spring:message code='ui.common.menuName'/></th>
											<th class="text-center" style="width: 150px;"><spring:message code='ui.common.programName'/></th>
											<th class="text-center" style="width: 250px;"><spring:message code='ui.common.programUrl'/></th>
											<th class="text-center" style="width: 150px;"><spring:message code='ui.common.function'/></th>
										</tr>
									</thead>
									<tbody></tbody>
								</table>
							</div>
						</div>
					</div>
				</div>
<%--				--%>
<%--				<div class="box-footer">--%>
<%--					<button type="button" class="btn btn-outline-primary" onclick="goChangeOrder()"><i class='fa fa-bars'></i> 메뉴 순서 변경</button>--%>
<%--					<button type="button" class="btn btn-outline-primary pull-right" onclick="showInsertModal()">최상위 메뉴 추가</button>--%>
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
					<input type="hidden" name="menuId" />
					<input type="hidden" name="upperMenuId" />
					<input type="hidden" name="icon" value="label_important"/>
					<div class="form-group" id="upperMenuTxtDiv">
						<label class="control-label col-md-3 col-sm-3 col-xs-12"><spring:message code='ui.common.upperMenu'/></label>
						<div class="col-md-7 col-sm-7 col-xs-12" id="upperMenuTxt"></div>
					</div>
					<div class="form-group">
						<label class="control-label col-md-3 col-sm-3 col-xs-12"><spring:message code='ui.common.menuName'/> <span class="required">*</span></label>
						<div class="col-md-7 col-sm-7 col-xs-12">
							<input type="text" name="menuNm" class="form-control col-md-7 col-xs-12" placeholder="메뉴명 입력">
						</div>
					</div>
					<div class="form-group">
						<label class="control-label col-md-3 col-sm-3 col-xs-12"><spring:message code='ui.common.program'/> <span class="required">*</span></label>
						<div class="col-md-7 col-sm-7 col-xs-12">
							<select name="pgmId" class="form-control selectpicker" data-live-search="true">
								<c:forEach var="pgm" items="${pgmList}">
									<option value="${pgm.pgmId}" data-subtext="${pgm.pgmUrl}">${pgm.pgmNm}</option>
								</c:forEach>
							</select>
						</div>
					</div>
					<div class="form-group">
						<label class="control-label col-md-3 col-sm-3 col-xs-12"><spring:message code='ui.common.menuExplanation'/></label>
						<div class="col-md-7 col-sm-7 col-xs-12">
							<textarea class="form-control" rows="3" name="menuDesc" placeholder="메뉴설명 입력"></textarea>
						</div>
					</div>
					<div class="form-group">
						<label class="control-label col-md-3 col-sm-3 col-xs-12"><spring:message code='ui.common.icon'/></label>
						<div class="col-md-7 col-sm-7 col-xs-12">
							<a class="btn btn-app" onclick="showIconWindow()">
								<i id="iconI" class="material-icons">label_important</i><br> <spring:message code='ui.common.change'/>
							</a>
						</div>
					</div>
				</form>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-outline-primary" onclick="func()"><spring:message code='ui.common.confirm'/></button>
				<button type="button" class="btn btn-default" data-dismiss="modal"><spring:message code='ui.common.close'/></button>
			</div>
		</div>
	</div>
</div>

<script>

	let siteStartUrl;
	
	$(document).ready(function() {
		select();
	});
	
	function showIconWindow() {
		window.open("/system/window/icons.mng", "Icons", "width=800px, height=800px, toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=no,resizable=no");
	}
	
	function setIcon(icon) {
		let form = document.funcForm;
		form.icon.value=icon;
		$("#iconI").empty();
		$("#iconI").append(icon);
	}
	
	function select() {
		$("#datatable > tbody").html("");
		$.ajax({
			url : "<c:url value='/system/menu/list.json' />",
			type : "POST",
			dataType : "json",
			success : function(res) {
				if ("success" == res.result) {
					let html = "";
					for(idx in res.data) {
						let menu = res.data[idx];
						html += makeTbody(menu, 0);
					}
					$("#datatable > tbody").html(html);
				}else {
					alert(res.message);
				}
			}
		});
	}
	
	function makeTbody(menu, depth) {
		
		var html = "";
		html += "<tr>";
		html += "<td>";
		
		for(var i = 0; i < depth; i++) {
			html += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
		}
		
		var pnm = "";
		var purl = ""
		if(menu.pgm!=null && menu.pgm!=undefined) {
			pnm = menu.pgm.pgmNm;
			purl = menu.pgm.pgmUrl;
		}
		html += "<i class='material-icons' style='font-size:16px;'>"+menu.icon+"</i>";
		html += "&nbsp;"+menu.menuNm;
		html += "</td>";
		html += "<td>";
		html += pnm;
		html += "</td>";
		html += "<td><a href='"+purl+"' target='_blank'>";
		html += purl;
		html += "</a></td>";
		html += "<td class='text-center'>";
		html += "<button type='button' class='btn btn-xs btn-outline-primary' data-toggle='tooltip' title='수정' onclick='showUpdateModal(\""+menu.menuId+"\")'><i class='material-icons'>create</i></button>&nbsp;";
		html += "<button type='button' class='btn btn-xs btn-outline-primary' data-toggle='tooltip' title='하위 메뉴 추가' onclick='showInsertModal(\""+menu.menuId+"\",\""+menu.menuNm+"\")'><i class='material-icons'>playlist_add</i></button>&nbsp;";
		html += "<button type='button' class='btn btn-xs btn-outline-primary' data-toggle='tooltip' title='삭제' onclick='del(\""+menu.menuId+"\")'><i class='material-icons'>delete</i></button>";
		html += "</td>";
		html += "</tr>";
		
		for(idx in menu.childList) {
			var childMenu = menu.childList[idx];
			html += makeTbody(childMenu, parseInt(depth)+1);
		}
		return html;
	}
	
	function showInsertModal(upperMenuId, upperMenuNm) {
		$("#upperMenuTxtDiv").hide();
		
		var form = document.funcForm;
		form.menuId.value = "";
		form.menuNm.value = "";
		form.pgmId.value = "";
		$(".selectpicker").selectpicker("refresh");
		form.menuDesc.value = "";
		form.icon.value = "label_important";
		$("#iconI").empty();
		$("#iconI").append("label_important");
		
		if(upperMenuId != null) {
			$("#upperMenuTxtDiv").show();
			$("#upperMenuTxt").html(upperMenuNm);
			form.upperMenuId.value = upperMenuId;
		}else {
			form.upperMenuId.value = "";
		}
		
		$("#func-modal-title").html("<spring:message code='ui.common.register'/>");
		$('.func-modal').modal("show");
	}
	
	function showUpdateModal(menuId) {
		$.ajax({
			url : "<c:url value='/system/menu/view.json' />",
			type : "POST",
			data : {"menuId" : menuId},
			dataType : "json",
			success : function(res) {
				if ("success" == res.result) {
					$("#upperMenuTxtDiv").hide();
					
					var form = document.funcForm;
					var data = res.data;
					form.menuId.value = data.menuId;
					form.menuNm.value = data.menuNm;
					
					if(data.menuDesc == null || data.menuDesc == ""){
						form.menuDesc.value = "";
					}else{
						form.menuDesc.value = data.menuDesc;	
					}

					form.icon.value = data.icon;
					$(form.pgmId).selectpicker("val", data.pgmId);
					$("#iconI").empty();
					$("#iconI").append(data.icon);
					
					if(data.upperMenuId != null) {
						$("#upperMenuTxtDiv").show();
						$("#upperMenuTxt").html(data.upperMenu.menuNm);
					}
					
					$("#func-modal-title").html("<spring:message code='ui.common.modify'/>");
					$('.func-modal').modal("show");			
				}else {
					alert(res.message);
				}
			}
		});
	}
	
	function func() {
		var form = document.funcForm;
		if($.trim(form.menuNm.value) == '') {
			alert("<spring:message code='ui.message.error.input.inputMenuName'/>");
			form.menuNm.focus();
		}else {
			if(form.menuId.value == '') {
				if(confirm("<spring:message code='ui.message.ask.register'/>")) {
					$.ajax({
						url : "<c:url value='/system/menu/insert.json' />",
						type : "POST",
						data : $("#funcForm").serialize(),
						dataType : "json",
						success : function(res) {
							if ("success" == res.result) {
								alert("<spring:message code='ui.message.success.registered'/>");
								select();
								$('.func-modal').modal("hide");
							}else {
								alert(res.message);
							}
						}
					});
				}
			}else {
				if(confirm("<spring:message code='ui.message.ask.modify'/>")) {
					$.ajax({
						url : "<c:url value='/system/menu/update.json' />",
						type : "POST",
						data : $("#funcForm").serialize(),
						dataType : "json",
						success : function(res) {
							if ("success" == res.result) {
								alert("<spring:message code='ui.message.success.modified'/>");
								select();
								$('.func-modal').modal("hide");
							}else {
								alert(res.message);
							}
						}
					});
				}
			}
		}
	}
	
	//메뉴 순서 변경 페이지 이동
	function goChangeOrder() {
		location.href = "/system/menu/changeOrder.mng";
	}
	
	function del(menuId) {
		if(confirm("<spring:message code='ui.message.ask.delete'/>")) {
			$.ajax({
				url : "<c:url value='/system/menu/delete.json' />",
				type : "POST",
				data : {"menuId" : menuId},
				dataType : "json",
				success : function(res) {
					if ("success" == res.result) {
						alert("<spring:message code='ui.message.success.deleted'/>");
						select();
						$('.func-modal').modal("hide");
					}else {
						alert(res.message);
					}
				}
			});
		}
	}
</script>
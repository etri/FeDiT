<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ include file="/WEB-INF/view/include/tags.jspf"%>

<section class="content-header">
	<tg:menuInfoTag />
</section>

<section class="content">
	<div class="row">
		<div id="id-box-register" class="col-xs-12">
			<div class="box box-success">
				<div class="box-footer">
					<button type="button" class="btn btn-outline-primary pull-right" onclick="showInsertModal()">등록</button>
				</div>
			</div>
		</div>
		<div class="col-xs-12">
			<div class="box box-primary">
				<div class="box-header">
					<h3 class="box-title"><i class='material-icons' style='font-size:16px;'>play_arrow</i>&nbsp;&nbsp;권한</h3>
				</div>
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

<div class="modal fade roleManage-modal" data-keyboard="false" data-backdrop="static" tabindex="-1" aria-hidden="true">
	<div class="modal-dialog modal-lg">
		<div class="modal-content">
			<div class="modal-header">
				<h2>권한 롤 관리</h2>
			</div>
			<div class="modal-body">
				<input type="text" class="pull-right" name="roleMngAuth" id="roleMngAuth" readonly="readonly" style="border:0;"/>
				<label class="pull-right">권한명&nbsp;:&nbsp;</label>
				<input type="hidden" name="roleMngUrl" id="roleMngUrl" value="" />
				<table id="roleManageDatatable" class="table table-bordered table-striped" style="width: 100%; table-layout: fixed;"></table>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-outline-primary" data-dismiss="modal">닫기</button>
			</div>
		</div>
	</div>
</div>

<div class="modal fade role-modal" data-keyboard="false" data-backdrop="static" tabindex="-1" aria-hidden="true">
	<div class="modal-dialog modal-lg">
		<div class="modal-content">
			<div class="modal-header">
				<h2>롤 권한</h2>
			</div>
			<div class="modal-body">
				<form id="roleForm" name="roleForm" class="form-horizontal form-label-left">
					<input type="hidden" name="goUrl" id="goUrl" value="" />
					<div class="form-group">
						<label class="control-label col-md-3 col-sm-3 col-xs-12">권한 <span class="required">*</span></label>
						<div class="col-md-7 col-sm-7 col-xs-12">
							<input type="text" name="roleAuth" id="roleAuth" onkeydown="fn_press_han(this);" data-role="권한" class="form-control col-md-7 col-xs-12 req" maxlength="25" placeholder="권한 영문으로 입력 ex)ROLE_XXX">
						</div>
					</div>
					<div class="form-group">
						<label class="control-label col-md-3 col-sm-3 col-xs-12">역할명 <span class="required">*</span></label>
						<div class="col-md-7 col-sm-7 col-xs-12">
							<input type="text" name="roleNm" id="roleNm" data-role="역할명" class="form-control col-md-7 col-xs-12 req" maxlength="25" placeholder="역할명을 입력">
						</div>
					</div>
					<div class="form-group">
						<label class="control-label col-md-3 col-sm-3 col-xs-12">설명 </label>
						<div class="col-md-7 col-sm-7 col-xs-12">
							<textarea name="roleDesc" id="roleDesc" data-role="설명" class="form-control col-md-7 col-xs-12" maxlength="2000" placeholder="권한설명을 입력"> </textarea>
						</div>
					</div>
				</form>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-outline-primary" onclick="roleInsert()">저장</button>
				<button type="button" class="btn btn-outline-primary" data-dismiss="modal">닫기</button>
			</div>
		</div>
	</div>
</div>

<div class="modal fade menu-modal" data-keyboard="false" data-backdrop="static" tabindex="-1" aria-hidden="true">
	<div class="modal-dialog modal-lg">
		<div class="modal-content">
			<div class="modal-header">
				<h2>시스템 메뉴 권한</h2>
			</div>
			<div class="modal-body">
				<div id="jstree"></div>
			</div>
			<div class="modal-footer">
				<div class="pull-left btn-group">
					<button type="button" class="btn btn-outline-primary" onclick="checkMenu()"><i class="fa fa-check-circle-o"></i> 전체선택</button>
					<button type="button" class="btn btn-outline-primary" onclick="uncheckMenu()"><i class="fa fa-circle-thin"></i> 전체해제</button>
				</div>
				<div class="pull-right btn-group">
					<button type="button" class="btn btn-outline-primary" onclick="updateMenu()">저장</button>
					<button type="button" class="btn btn-outline-primary" data-dismiss="modal">닫기</button>
				</div>
			</div>
		</div>
	</div>
</div>

<script>
	let fromSpring_RSYn = '<c:out value="${RSYn}"/>';
	let RSYn = fromSpring_RSYn=='true'?true:false;

	let userRole = '<c:out value="${userRole}"/>';

	var datatable;
	var roleAuth;

	$(document).ready(function() {

		let box_regist = RSYn?"block":"none";
		document.getElementById("id-box-register").style.display = box_regist;

		//모달창이동
		$('.modal-content').draggable({
			handle: ".modal-header"
		});

		datatable = $("#datatable").DataTable({
			"searching" : false,
			"paging" : true,
			"bPaginate" : true,
			"responsive" : true,
			"language": lang_kor,
			"ajax" : {
				"url" : "<c:url value='/system/role/list.json' />",
				"method" : "post",
				"data" : function(d) {
					/* if($("")) */
				}
				,"error" : function(xhr, status, err) {
					ajaxErrorHandler(xhr);
				}
			},
			"processing" : true,
			"serverSide" : true,
			"order" : [[0, 'desc']],
			"columns" : [
				{ "name" : "ROLE_AUTH", "title" : "권한",  "data":"roleAuth", "className" : "dt-head-center dt-body-left" },
				{ "name" : "ROLE_NM", "title" : "역할명",  "data":"roleNm", "className" : "dt-head-center dt-body-left" },
				{ "name" : "ROLE_DESC", "title" : "설명",  "data":"roleDesc", "className" : "dt-head-center dt-body-left" },
				{ "render" :
							function (data, type, row) {
								var html = "";
								if(userRole === 'ROLE_SYSTEM') {
									html += "<button type='button' class='btn btn-xs btn-outline-primary' data-toggle='tooltip' title='수정' onclick='showInsertModal(\"" + row["roleAuth"] + "\",\"" + row["roleNm"] + "\",\"" + row["roleDesc"] + "\")'><i class='material-icons'>create</i></button>&nbsp;"
								}
								// html +="<button type='button' class='btn btn-xs btn-outline-primary' data-toggle='tooltip' title='권한부여' onclick='showRoleMngModal(\""+row["roleAuth"]+"\")'><i class='material-icons'>account_box</i></button>&nbsp;";
								if(userRole === 'ROLE_SYSTEM' || userRole === 'ROLE_MANAGER') {
									html += "<button type='button' class='btn btn-xs btn-outline-primary' data-toggle='tooltip' title='시스템메뉴 권한' onclick='showMenuModal(\"" + row["roleAuth"] + "\")'><i class='material-icons'>menu</i></button>&nbsp;";
								}
								if(userRole === 'ROLE_SYSTEM') {
									html += "<button type='button' class='btn btn-xs btn-outline-primary' data-toggle='tooltip' title='삭제' onclick='deletebtn(\"" + row["roleAuth"] + "\",\"" + row["roleNm"] + "\")'><i class='material-icons'>delete</i></button>&nbsp;";
								}
								return html;
							},
					"title":"기능", "className": "dt-head-center dt-body-center", "orderable" : false,
				}
			]
			,"scrollX": "100%"
			,"columnDefs": [
				{"targets": [0], width: "150px"}
				,{"targets": [1], width: "120px"}
				,{"targets": [2], width: "200px"}
				,{"targets": [3], width: "180px"}
			]
		});

		$.ajax({
			url : "<c:url value='/system/role/jstreeList.json'/>",
			type : "POST",
			dataType : "json",
			success : function(res) {
				if ("success" == res.result) {
					$('#jstree').jstree({
						"core" : {
							"data" : res.data
						}
						,"plugins" : [ "wholerow", "checkbox" ]
					});
				} else {
					alert(res.message);
				}
			}
		});
	});

	function roleInsert(){
		/*
		if(isEmptyString ($("#roleAuth").val())){
			alert("권한입력을 해 주세요.");
			return;
		}
	 	if(isEmptyString ($("#roleNm").val())){
			alert("역할명을 해 주세요.");
			return;
		}
	 	*/

		if($.trim($("#roleAuth").val()) == ""){
			alert("권한을 입력을 해 주세요.");
			return;
		}
		if($.trim($("#roleAuth").val()).substring(0,5) != "ROLE_"){
			alert("권한명은 'ROLE_'로 시작되어야 합니다.");
			return;
		}
		if($.trim($("#roleNm").val()) == ""){
			alert("역할명을 입력해 주세요.");
			return;
		}

		$.ajax({
			url : $('#goUrl').val(),
			type : "POST",
			data : $("#roleForm").serialize(),
			dataType : "json",
			success : function(res) {
				if ("success" == res.result) {
					alert("등록되었습니다.");
					$('.role-modal').modal("hide");
					datatable.ajax.reload();
				} else if ("duplicate" == res.result) {
					alert(res.message);
				} else {
					alert(res.message);
				}
			}
		});
	};

	function showInsertModal(roleAuth, roleNm, roleDesc) {
		$("#roleAuth").val(roleAuth);
		$("#roleNm").val(roleNm);

		if(roleDesc == "null" || roleDesc == null || roleDesc == ""){
			$("#roleDesc").val("");
		}else{
			$("#roleDesc").val(roleDesc);
		}

		if ($("#roleAuth").val() != "") {
			$('#goUrl').val('/system/role/update.json');
			$('#roleAuth').attr("readonly","readonly");
		} else {
			$('#goUrl').val('/system/role/insert.json');
			$('#roleAuth').removeAttr("readonly");
		}

		$('div.role-modal').modal("show");
	}

	function deletebtn(roleAuth, roleNm) {
		$("#roleAuth").val(roleAuth);
		$("#roleNm").val(roleNm);
		if (confirm("삭제하시겠습니까?") == true) {
			$.ajax({
				url : "/system/role/delete.json",
				type : "POST",
				data : $("#roleForm").serialize(),
				dataType : "json",
				success : function(res) {
					if ("success" == res.result) {
						alert("삭제되었습니다.");
						datatable.ajax.reload();
					} else if ("duplicate" == res.result) {
						alert(res.message);
					} else {
						alert(res.message);
					}
				}
			});
		} else {
			alert("취소되었습니다.");
		}
	}

	function showRoleMngModal(roleMngAuth) {
		$("#roleMngAuth").val(roleMngAuth);
		dataRoleMngtable = $("#roleManageDatatable").DataTable({
			"destroy" : true,
			"searching" : false
			,"paging": true
			,"bPaginate": true
			,"responsive": true
			,"language": lang_kor
			,"ajax" : {
				"url" : "<c:url value='/system/role/scurRscRole_list.json' />"
				,"method" : "post"
				,"data" : { roleAuth : $("#roleMngAuth").val ()}
				,"error" : function(xhr, status, err) {
					ajaxErrorHandler(xhr);
				}
			},"processing": true
			,"serverSide": true
			,"order" : [[0, 'desc']]
			,"columns": [
				{ "name" : "RSC_ID", "title" : "자원아이디", "data" : "rscId", "className" : "dt-head-center dt-body-left"},
				{ "name" : "RSC_NM", "title" : "자원명", "data" : "rscNm", "className" : "dt-head-center dt-body-left"},
				{ "name" : "RSC_TP", "title" : "유형", "data" : "rscTp", "className" : "dt-head-center dt-body-left"},
				{ "name" : "RSC_PATN", "title" : "패턴", "data" : "rscPatn", "className" : "dt-head-center dt-body-left"},
				{ "name" : "REG_DT", "title" : "등록일", "render" :
							function (data, type, row) {
								return new Date(row["regDt"]).format("yyyy-MM-dd");
							}, "className" : "dt-head-center dt-body-center"},
				// { "name" : "ROLE_AUTH", "title" : "자원패턴", "data" : "roleAuth", "className" : "dt-head-center dt-body-left", "visible" : false},
				{ "render" :
							function (data, type, row) {
								var html = "";
								html += "<select name='roleAuth' class='form-control col-md-7 col-xs-12 req' onchange='rolsUseSelect(this.value, \""+row["rscId"]+"\")'>"
								html += "<option value='1'";
								if (row["roleAuth"] == $("#roleMngAuth").val ())
									html += "selected";
								html += ">등록</option><option value='0'";
								if (row["roleAuth"] != $("#roleMngAuth").val ())
									html += "selected";
								html += ">미등록</option></select>";
								return html;
							},
					"className": "dt-head-center dt-body-center", "orderable" : false, //"title":"기능"
				}
			]
			,"scrollX": "100%"
			,"columnDefs": [
				{"targets": [0], width:"180px"}
				,{"targets": [1], width:"100px"}
				,{"targets": [2], width:"50px"}
				,{"targets": [3], width:"150px"}
				,{"targets": [4], width:"180px"}
				,{"targets": [5], width:"100px"}
			],
			"fnDrawCallback": function() {
				$('div.roleManage-modal').modal("show");
			}
		});
	}

	function rolsUseSelect(selectValue, rscId){

		if(selectValue == '1'){
			$("#roleMngUrl").val("<c:url value='/system/role/scurRscRole_insert.json' />");
		}else{
			$("#roleMngUrl").val("<c:url value='/system/role/scurRscRole_delete.json' />");
		}

		$.ajax({
			url : $("#roleMngUrl").val(),
			type : "POST",
			data : { rscId : rscId, roleAuth : $("#roleMngAuth").val ()},
			dataType : "json",
			success : function(res) {
				if ("success" == res.result) {
					dataRoleMngtable.ajax.reload();
				} else if ("duplicate" == res.result) {
					alert(res.message);
				} else {
					alert(res.message);
				}
			}
		});
	}

	function showMenuModal(ra) {
		$.ajax({
			url : "<c:url value='/system/role/menuRole_list.json'/>",
			type : "POST",
			data : {"roleAuth" : ra},
			dataType : "json",
			success : function(res) {
				if ("success" == res.result) {
					roleAuth = ra;

					$('.jstree-node').each(function(){
						$('#jstree').jstree("uncheck_node", $(this));
						let id = $(this).attr('id');
						let onlySystem = $(this).attr('data-only-system')==='true';
						let show_node = RSYn||!onlySystem?"show_node":"hide_node";

						$('#jstree').jstree(show_node, $(this));

						let enable_node = (userRole==='ROLE_MANAGER'&&roleAuth==='ROLE_SYSTEM')?"disable_node":"enable_node";

						$('#jstree').jstree(enable_node, $(this));


						for(idx in res.data) {
							let menuRole = res.data[idx];
							if(menuRole.menuId == id) {
								$('#jstree').jstree("check_node", $(this));
								break;
							}
						}
					});
					$('.menu-modal').modal("show");
				} else {
					alert(res.message);
				}
			}
		});
	}

	function updateMenu() {

		var checkedList = $('#jstree').jstree("get_bottom_checked",true);
		var idList = new Array();

		for(var i=0; i<checkedList.length; i++) {
			checked = checkedList[i];
			idList.push(checked.id);
			var parent = $('#jstree').jstree("get_parent",checked);
			if(idList.indexOf(parent) == -1) {
				idList.push(parent);
			}
		}

		if(confirm("수정하시겠습니까?")) {
			$.ajax({
				url : "<c:url value='/system/role/menuRole_update.json' />",
				type : "POST",
				data : {"roleAuth" : roleAuth, "checkIdList" : idList},
				dataType : "json",
				success : function(data) {
					if ("success" == data.result) {
						alert("수정되었습니다.");
						$('.menu-modal').modal("hide");
					}else {
						alert(data.message);
					}
				}
			});
		}
	}

	function checkMenu() {
		$('#jstree').jstree("check_all");
	}

	function uncheckMenu() {
		$('#jstree').jstree("uncheck_all");
	}

	function fn_press_han(obj) {
		//좌우 방향키, 백스페이스, 딜리트, 탭키에 대한 예외
		if(event.keyCode == 8 || event.keyCode == 9 || event.keyCode == 37 || event.keyCode == 39
				|| event.keyCode == 46 ) return;
		//obj.value = obj.value.replace(/[\a-zㄱ-ㅎㅏ-ㅣ가-힣]/g, '');
		obj.value = obj.value.replace(/[\ㄱ-ㅎㅏ-ㅣ가-힣]/g, '');
	}
</script>
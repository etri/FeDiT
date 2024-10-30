<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ include file="/WEB-INF/view/include/tags.jspf"%>

<link rel="stylesheet" href="/css/plugins/nestable/nestable.css">

<section class="content">
	<div class="row">
		<div class="col-xs-12">
			<div class="box box-primary">
				<div class="box-header">
					<h3 class="box-title"><i class='material-icons' style='font-size:16px;'>play_arrow</i>&nbsp;&nbsp;<spring:message code='ui.common.changeMenuOrder'/></h3>
				</div>
				<div class="box-body">
					<div class="row">
						<div class="col-xs-1"></div>
						<div class="col-xs-11">
							<div class="dd">
								<ol class="dd-list">
							    </ol>
							</div>
						</div>
					</div>
				</div>
				<div class="box-footer">
					<div class="btn-group">
						<button type="button" class="btn btn-outline-primary" onclick="expandAll()"><spring:message code='ui.common.expandAll'/></button>
						<button type="button" class="btn btn-outline-primary" onclick="collapseAll()"><spring:message code='ui.common.collapseAll'/></button>
						<button type="button" class="btn btn-outline-primary" onclick="select()"><spring:message code='ui.common.initialize'/></button>
					</div>
					<div class="btn-group pull-right">
						<button type="button" class="btn btn-outline-primary" onclick="update()"><spring:message code='ui.common.modify'/></button>
						<button type="button" class="btn btn-outline-primary" onclick="goMenu()"><spring:message code='ui.common.list'/></button>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<script src="/js/plugins/nestable/jquery.nestable.js"></script>

<script>
	$(document).ready(function() {
		select(); 
	});
	
	function expandAll() {
		$('.dd').nestable('expandAll');
	}
	
	function collapseAll() {
		$('.dd').nestable('collapseAll');
	}
	
	function select() { 
		$(".dd-list").html("");
		$.ajax({
			url : "<c:url value='/system/menu/list.json' />",
			type : "POST",
			dataType : "json",
			success : function(res) {
				if ("success" == res.result) {
					var html = "";
					for(idx in res.data) {
						var menu = res.data[idx];
						html += makeTbody(menu, 0);
					}
					$(".dd-list").html(html);
				}else {
					alert(res.message);
				}
			}
		});
		$('.dd').nestable({});
	}
	
	function makeTbody(menu, depth) {
		var html = "";
		html += "<li class='dd-item ";
		if(depth == 0) html += "item-red";
		else if(depth == 1) html += "item-orange";
		else if(depth == 2) html += "item-green";
		else if(depth == 3) html += "item-blue";
		else if(depth == 4) html += "item-purple";
		else if(depth == 5) html += "item-grey";
		html += "' data-id='"+menu.menuId+"'>";
		html += "<div class='dd-handle'>"+menu.menuNm;
		html += "<small class='text-muted'>&nbsp;&nbsp;&nbsp;"+menu.pgm.pgmUrl+"</small>";
		html += "</div>";
		if(menu.childList.length > 0) {
			html += "<ol class='dd-list'>";
			for(idx in menu.childList) {
				var childMenu = menu.childList[idx];
				html += makeTbody(childMenu, parseInt(depth)+1);
			}
			html += "</ol>";
		}
		html += "</li>";
		return html;
	}
	
	function update() {
		if(confirm("<spring:message code='ui.message.ask.modify'/>")) {
			$.ajax({
				url : "<c:url value='/system/menu/changeOrder.json' />",
				type : "POST",
				data : {"order" : $('.dd').nestable('serialize')},
				dataType : "json",
				success : function(res) {
					if ("success" == res.result) {
						alert("<spring:message code='ui.message.success.modified'/>");
						location.href="/system/menu/list.mng";
					}else {
						alert(res.message);
					}
				}
			});
		}
	}

	function goMenu() {
		location.href="/system/menu/list.mng";
	}
</script>
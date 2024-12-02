<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ include file="/WEB-INF/view/include/tags.jspf"%>

<section class="content">
	<div class="row">
		<div class="col-xs-12">
			<div class="box box-primary">
				<div class="box-header">
					<h3 class="box-title"><i class='material-icons' style='font-size:16px;'>play_arrow</i>&nbsp;&nbsp;메뉴별 접속 통계</h3>
				</div>
				<div class="box-body">
					<div class="row">
						<div class="col-sm-6 col-xs-12">
							<div class="input-group">
								<span class="input-group-addon">사이트 구분</span>
								<select id="siteId" class="form-control selectpicker">
									<c:forEach var="site" items="${siteList}">
										<option value="${site.siteId}" <c:if test="${site.siteId eq 1}">selected</c:if>>${site.siteNm} (${site.domain})</option>
									</c:forEach>
								</select>
							</div>
						</div>
						<!-- <label class="control-label col-md-3 col-sm-3 col-xs-12">일정기간</label>
						<div class="input-group col-md-6 col-sm-6 col-xs-12">
							<input type="text" class="form-control datepicker" name="startRegDt" id="startRegDt" placeholder="시작">
							<span class="input-group-addon"> ~ </span>
							<input type="text" class="form-control datepicker" name="endRegDt" id="endRegDt" placeholder="종료">
						</div> -->
					</div>
				</div>

				<div class="box-body">
					<div class="row">
						<div class="col-xs-12">
							<table id="datatable" class="table table-bordered table-striped" style="width:100%; table-layout:fixed;">
								<colgroup>
							        <col width="25%">
							        <col width="25%">
							        <col width="40%">
							        <col width="10%">
							    </colgroup>
								<thead>
									<tr>
										<th class="text-center">메뉴명</th>
										<th class="text-center">URL</th>
										<th class="text-center">퍼센트</th>
										<th class="text-center">카운트</th>
									</tr>
								</thead>
								<tbody></tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>



<script>
	var selectSite;
	var stats;
	
	$(document).ready(function() {
		
		select();
		
		$("#siteId").change(function() {
			select();
		});
		
		$("#searchBtn").click(function(){
			select();
		});
	});
	
	function select() {
		$("#datatable > tbody").html("");
		$.ajax({
			url : "<c:url value='/system/menuStats/view.json' />",
			type : "POST",
			data : {"siteId" : $("#siteId").val(),"startRegDt":$("#startRegDt").val(),"endRegDt" : $("#endRegDt").val()},
			dataType : "json",
			success : function(res) {
				if ("success" == res.result) {
					selectSite = res.data;
					$.ajax({
						url : "<c:url value='/system/menuStats/list.json' />",
						type : "POST",
						data : {"siteId" : $("#siteId").val()},
						dataType : "json",
						success : function(res) {
							if ("success" == res.result) {
								var html = "";
								stats = res.stats;
								for(idx in res.data) {
									var menu = res.data[idx];
									for(idx in menu.childList) {
										var childMenu = menu.childList[idx];
										total(childMenu.menuId);
									}
									total(menu.menuId);
								}
								for(idx in res.data) {
									var menu = res.data[idx];
									html += makeTbody(menu, 0);
								}
								$("#datatable > tbody").html(html);
							}else {
								alert(res.message);
							}
						}
					});
				}else {
					alert(res.message);
				}
			}
		});
	}
	//총 카운트
	var totalcount = 0;
	function total(menuId) {
		for(inx in stats) {
			var menuStats = stats[inx];
			if(menuStats.menuId == menuId){
				totalcount += menuStats.menuCount;
			}
		}
	}

	function makeTbody(menu, depth) {
		var html = "";
		html += "<tr>";
		html += "<td>";
		for(var i = 0; i < depth; i++) {
			html += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
		}
		if(menu.childList.length > 0){ 
			html += "<i class='fa fa-chevron-down'></i>"; 
		}else{ 
			html += "<i class='fa fa-chevron-right'></i>";
		}
		html += "&nbsp;"+menu.menuNm;
		html += "</td>";
		
		html += "<td><a href='http://";
		html += selectSite.domain+"/";
		if(selectSite.startUrl != null && selectSite.startUrl != '') {
			html += selectSite.startUrl+"/";
		}
		if(menu.upperMenuId != null) {
			if(menu.upperMenu.upperMenuId != null) {
				html += menu.upperMenu.upperMenu.menuUrl+"/";
			}
			html += menu.upperMenu.menuUrl+"/";
		}
		html += menu.menuUrl;
		html += ".do' target='_blank'>/";
		if(selectSite.startUrl != null && selectSite.startUrl != '') {
			html += selectSite.startUrl+"/";
		}
		if(menu.upperMenuId != null) {
			if(menu.upperMenu.upperMenuId != null) {
				html += menu.upperMenu.upperMenu.menuUrl+"/";
			}
			html += menu.upperMenu.menuUrl+"/";
		}
		html += menu.menuUrl;
		html += "</a></td>";
		var percent = 0;
		var menuCount = 0;
		var tempPercent = 0;
		for(inx in stats) {
			var menuStats = stats[inx];
			if(menuStats.menuId == menu.menuId){
				menuCount = menuStats.menuCount;
				temppercent = (menuCount/totalcount) * 100;
				percent = 	Math.round(temppercent*100)/100;
			
			}
		}
		html += "<td>"; 
		html += "<div class='progress'>";
		html += "<div class='progress-bar progress-bar-info' role='progressbar' aria-valuenow="+percent+" aria-valuemin='0' aria-valuemax='100' style='width:"+percent+"%'>";
		html += "</div>";
		html += "<span class='progress-completed'>"+percent+"%</span>";
		html += "</div>";
		html += "</td>";
		html += "<td class='text-center'>";
		html += "<span>"+menuCount+"&nbsp;회</span>";
		html += "</td>";
		html += "</tr>";
		for(idx in menu.childList) {
			var childMenu = menu.childList[idx];
			html += makeTbody(childMenu, parseInt(depth)+1);
		}
		return html;
	}
	
</script>
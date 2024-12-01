<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ include file="/WEB-INF/view/include/tags.jspf"%>

<section class="content">
	<div class="row">
		<div class="col-xs-12">
			<div class="box box-success">
				<div class="box-header">
					<h3 class="box-title"><i class='material-icons' style='font-size:16px;'>play_arrow</i>&nbsp;&nbsp;검색조건</h3>
				</div>
				<div class="box-body">
					<div class="row">
						<div class="col-sm-12 col-xs-12">
							<div class="input-group">
								<span class="input-group-addon">일정기간</span>
								<input type="text" class="form-control datepicker" name="startSearchDt" id="startSearchDt" placeholder="시작일">
								<span class="input-group-addon"> ~ </span>
								<input type="text" class="form-control datepicker" name="endSearchDt" id="endSearchDt" placeholder="종료일">
							</div>
						</div>
					</div>
				</div>

				<div class="box-footer">
					<div class="btn-group pull-right">
						<button type="button" class="btn btn-outline-primary" id="searchBtn" onclick="chatData()">검색</button>
						<button type="button" class="btn btn-outline-primary" id="resetBtn">리셋</button>
					</div>
				</div>
			</div>
		</div>

		<div class="col-xs-12">
			<div class="box box-primary">
				<div class="box-header">
					<h3 class="box-title">사용자 접속통계</h3>
				</div>
				<div class="box-body" >
					<div class="box-body chart-responsive">
						<div id="line-chart" class="chart" style="width:100%; height:300px;"></div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<script>

	$(document).ready(function(){
		chatData();
	});

	/*
	$("#siteId").change(function() {
		chatData();
	});
	*/

	function chatData() {
		if($('#startSearchDt').val() > $('#endSearchDt').val()){
			alert("일정기간 : 시작일은 종료일보다 클 수 없습니다.");
			return ;
		}

		$.ajax({
			url : "<c:url value='/system/siteStats/list.json' />",
			type : "POST",
			// data : {"siteId":$("#siteId").val(),"startSearchDt":$("#startSearchDt").val(),"endSearchDt":$("#endSearchDt").val()},
			data : {"startSearchDt":$("#startSearchDt").val(),"endSearchDt":$("#endSearchDt").val()},
			dataType : "json",
			success : function(result) {
				//chart 초기화
				$('#line-chart').html('');

				var data = result.data;
				Morris.Line({
					element: 'line-chart',
					data: data,
					xkey: 'convertedSearchDate',
					ykeys: ['loginCount'],
					labels: ['접속자수'],
					lineColors: ['#3c8dbc'],
					hideHover: 'auto',
					resize: true	//반응형 리사이징 문제점 파악
				});
			}
		});
	}

</script>
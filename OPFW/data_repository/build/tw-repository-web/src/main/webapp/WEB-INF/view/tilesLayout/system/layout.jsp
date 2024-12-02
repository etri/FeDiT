<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ include file="/WEB-INF/view/include/tags.jspf" %>
<!DOCTYPE html>
<html style="">
<head>
	<meta charset="UTF-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" name="viewport">
	<title><spring:message code='ui.common.title'/></title>
	<link rel="stylesheet" type="text/css" href="/css/main.css">

	<link rel="stylesheet" href="/css/fullcalendar.min.css">

	<link rel="stylesheet" href="/css/_all-skins.min.css">
	<link rel="stylesheet" href="/css/cms.css">
	<link rel="stylesheet" href="/css/board.css">
	<link rel="stylesheet" href="/css/selectStyle.css">

	<link rel="stylesheet" href="/css/bootstrap.css">
	<link rel="stylesheet" href="/css/plugins/datatables/dataTables.bootstrap.css">
	<link rel="stylesheet" href="/css/plugins/bootstrapSelect/bootstrap-select.min.css">
	<link rel="stylesheet" href="/css/plugins/datepicker/bootstrap-datepicker3.css">
	<link rel="stylesheet" href="/css/plugins/datepicker/bootstrap-datetimepicker.css"> <!-- css 추가 -->
	<link rel="stylesheet" href="/css/plugins/jstree/style.min.css">
	<link rel="stylesheet" href="/css/plugins/lightbox/lightbox.css">
	<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.4.0/css/font-awesome.min.css">
	<link rel="stylesheet" href="https://code.ionicframework.com/ionicons/2.0.1/css/ionicons.min.css">
	<link href="https://gitcdn.github.io/bootstrap-toggle/2.2.2/css/bootstrap-toggle.min.css" rel="stylesheet">
	<link rel="stylesheet" href="/fullcalendar/lib/cupertino/jquery-ui.min.css" />
	<link rel="stylesheet" href="/fullcalendar/fullcalendar.css"  />
	<link rel="stylesheet" media="print" href="/fullcalendar/fullcalendar.print.css"  />
	<link rel="stylesheet" type="text/css" href="/css/plugins/morris/morris.css" />
	<link rel="stylesheet" type="text/css" href="/css/plugins/d3/nv.d3.css" />
	<link rel="stylesheet" type="text/css" href="/css/plugins/d3/c3.css" />
	<link rel="stylesheet" type="text/css" href="/css/plugins/d3/c3.min.css" />
	<link rel="stylesheet" type="text/css" href="/css/plugins/d3/nv.d3.min.css" />

	<!--[if IE 7]>
		<link rel="stylesheet"  href="../css/font-awesome-ie7.min.css">
	<![endif]-->
	<!--[if IE 9]>
		<script src="http://html5shiv.googlecode.com/svn/trunk/html5.js"></script>
	<![endif]-->

<%--	<script src="https://unpkg.com/react@17/umd/react.production.min.js" crossorigin></script>--%>
<%--	<script src="https://unpkg.com/react-dom@17/umd/react-dom.production.min.js" crossorigin></script>--%>
<%--	<script src="https://unpkg.com/react@17/umd/react.development.js" crossorigin></script>--%>
<%--	<script src="https://unpkg.com/react-dom@17/umd/react-dom.development.js" crossorigin></script>--%>
<%--	<script src="https://cdnjs.cloudflare.com/ajax/libs/prop-types/15.7.2/prop-types.min.js"></script>--%>

	<!-- react-is -->
<%--	<script crossorigin src="//unpkg.com/react-is/umd/react-is.production.min.js"></script>--%>

<%--	<script src="https://unpkg.com/styled-components/dist/styled-components.min.js"></script>--%>


	<script src="<c:url value='/js/d3/d3.js'/>" charset="utf-8"></script>
	<script src="<c:url value='/js/d3/c3.js'/>" charset="utf-8"></script>
	<script src="<c:url value='/js/d3/c3.min.js'/>" charset="utf-8"></script>
	<script src="<c:url value='/js/d3/nv.d3.js'/>" charset="utf-8"></script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.5/d3.min.js"></script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/nvd3/1.7.1/nv.d3.min.js"></script>
	<script type="text/javascript" src="http://d3js.org/d3.v3.min.js" charset="utf-8"></script>
	<%--<script src="<c:url value='/js/jquery/jQuery-2.1.4.min.js' />"></script>--%>
	<script src="https://code.jquery.com/jquery-2.2.4.min.js" integrity="sha256-BbhdlvQf/xTY9gja0Dq3HiwQF8LaCRTXxZKRutelT44=" crossorigin="anonymous"></script>
	<script src="<c:url value='/ckeditor/ckeditor.js' />"></script>
	<script src="<c:url value='/fullcalendar/lib/moment.min.js'/>"></script>
	<script src="<c:url value='/fullcalendar/lib/jquery.min.js'/>"></script>
	<script src="<c:url value='/fullcalendar/fullcalendar.min.js'/>"></script>
	<script src="<c:url value='/fullcalendar/lang-all.js'/>"></script>
	<script src="<c:url value='/js/plugins/placeholder/jquery.placeholder.js'/>"></script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/raphael/2.1.0/raphael-min.js"></script>
	<script src="<c:url value='/js/plugins/morris/morris.min.js'/>"></script>
	<!-- <script src="/js/jquery/jQuery-2.1.4.min.js"></script> -->
	<script src="/js/jquery/jquery-ui.js"></script>
	<script src="/js/plugins/moment/moment-with-locales.js"></script>
	<script src="https://gitcdn.github.io/bootstrap-toggle/2.2.2/js/bootstrap-toggle.min.js"></script>
	<script src="<c:url value='/js/bootstrap.js' />"></script>
	<script src="<c:url value='/js/plugins/datatables/jquery.dataTables.min.js' />"></script>
	<script src="https://cdn.datatables.net/buttons/2.3.5/js/dataTables.buttons.min.js"></script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.3/jszip.min.js"></script>
	<script src="https://cdn.datatables.net/buttons/2.3.5/js/buttons.html5.min.js"></script>

	<script src="<c:url value='/js/plugins/datatables/dataTables.bootstrap.min.js' />"></script>
	<script src="<c:url value='/js/plugins/bootstrapSelect/bootstrap-select.min.js' />"></script>
	<script src="<c:url value='/js/plugins/datepicker/bootstrap-datepicker.js' />"></script>
<%--	<script src="<c:url value='/js/plugins/datepicker/bootstrap-datepicker.ko.min.js' />"></script>--%>
<%--	<script src="<c:url value='/js/plugins/datepicker/bootstrap-datetimepicker.js' />"></script> <!-- js 추가 -->--%>
	<script src="<c:url value='/js/plugins/jqueryForm/jquery.form.js' />"></script>
	<script src="<c:url value='/js/plugins/jstree/jstree.min.js' />"></script>
	<script src="<c:url value='/js/plugins/lightbox/lightbox.js' />"></script>
	<script src="<c:url value='/js/plugins/fileupload/jquery.fileupload.js' />"></script>
	<script src="<c:url value='/js/plugins/alphanum/jquery.alphanum.js' />"></script>
	<script src="<c:url value='/js/app.min.js' />"></script>
	<script src="<c:url value='/js/common.js' />"></script>
	<script src="<c:url value='/js/file.js' />"></script>
	<script src="<c:url value='/js/smsExcel.js' />"></script>

	<script src="<c:url value='/js/plugins/datatables/korLanguegeSet.js' />"></script>
	<%--
	<script src="<c:url value='/js/plugins/dotdotdot/jquery.dotdotdot.min.js'/>"></script>
	--%>
	<script src="<c:url value='/js/innerWidthCheck.js' />"></script>
	<script defer src="<c:url value='/js/util/formUtil.js?ver=${build_date}'/>"></script>
</head>
<body class="hold-transition skin-blue sidebar-mini" style="background-color: #ecf0f5">
	<div class="wrapper">
		<tiles:insertAttribute name="header"/>
		<tiles:insertAttribute name="main-sidebar"/>
		
		<div class="content-wrapper">
			<tiles:insertAttribute name="content"/>
		</div>
	</div>
	<div style="position: absolute; width: 100%;">
	<tiles:insertAttribute name="footer"/>
	</div>
	<script>
		$(document).ready(function() {
			$(".datepicker").datepicker({
				format: "yyyy-mm-dd"
				,autoclose: true
				,language: "ko"
				,todayBtn: "linked"
				,clearBtn: true
			});
			
			//모달창이동
			$('.modal-content').draggable({
				handle: ".modal-header"
			});
		});
	</script>
</body>
</html>
var totalCnt = 0;
var currentPage = 1; //현재 페이지
var totalPage = 0; //총 페이지 수
var viewCnt = 0; //한화면에 보여줄 게시물 갯수

var firstRecordIndex = 0; //조회 시작 Index

var pageViewCnt = 5; //한화면에 보여줄 페이지수
var pageStartNum = 1; //페이지 시작번호
var pageEndNum = 5; //페이지 종료번호
function setPagination(artiTotalCnt, artiCnt) {
	totalCnt = artiTotalCnt;
	viewCnt = artiCnt;
	totalPage = Math.ceil(artiTotalCnt/artiCnt);
	
	renderPagination();
}

function renderPagination() {
	var html = "";
	html += "<div class='paging-container'>";
	html += "<div class='text-center'>";
	html += "<ul class='pagination pagination-sm'>";

	if(currentPage > pageViewCnt) {
		pageStartNum = currentPage-(currentPage%pageViewCnt)+1;
		pageEndNum = pageStartNum + pageViewCnt;
		if(pageEndNum > totalPage) pageEndNum = totalPage;
		
		html += "<li><a href='#;' onclick='goList(1)' title='이전 페이지'><i class='fa fa-angle-double-left' aria-hidden='true'></i></a></li>";
	}else {
		pageStartNum = 1;
		pageEndNum = pageStartNum + pageViewCnt - 1;
		if(pageEndNum > totalPage) pageEndNum = totalPage;
	}
	
	if(currentPage > 1) {
		html += "<li><a href='#;' onclick='goList("+(parseInt(currentPage)-1)+")' title='이전 페이지'><i class='fa fa-angle-left' aria-hidden='true'></i></a></li>";
	}
	for(var i=pageStartNum; i <= pageEndNum; i++) {
		html += "<li ";
		if(currentPage == i) {
			html += "class='active'";
		}
		html += "><a href='#;' onclick='goList("+i+")'>"+i+"</a></li>";
	}
	if(totalPage > 1 && currentPage < totalPage) {
		html += "<li><a href='#;' onclick='goList("+(parseInt(currentPage)+1)+")' title='다음 페이지'><i class='fa fa-angle-right' aria-hidden='true'></i></a></li>";
	}
	if(totalPage > pageViewCnt && currentPage < totalPage) {
		html += "<li><a href='#;' onclick='goList("+totalPage+")' title='마지막 페이지'><i class='fa fa-angle-double-right' aria-hidden='true'></i></a></li>";
	}
	
	html += "</ul>";
	html += "</div>";
	html += "</div>";
	$("#pagination").html(html);
	
	$("#paginationTotalCnt").html(totalCnt+"건");
	$("#paginationTotalPage").html(totalPage);
	$("#paginationCurrentPage").html(currentPage);
}

function goList(page) {
	currentPage = page;
	firstRecordIndex = (parseInt(currentPage)-1)*parseInt(viewCnt);
	renderPagination();
	selectList();
}
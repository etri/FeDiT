<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ include file="/WEB-INF/view/include/tags.jspf" %>
<footer class="main-footer">
    <div style="text-align: left; margin-left: 10px; margin-top: 30px; float: left;">
        <h5>
            (주)진우소프트이노베이션<br><br>
            tel : 064-742-1816<br><br>
            address : 제주특별자치도 제주시 구남로 55
        </h5>
    </div>
    <div class="web" style="text-align: left; margin-right: 50px; margin-top: 30px; float: right;">
        <select class="form-control" id="goSite" onchange="go_site()">
            <option value="0">-사이트이동-</option>
            <option value="http://jinwoosi.co.kr">(주)진우소프트</option>
            <option value="http://www.jeju.go.kr">제주도청</option>
        </select>
    </div>
</footer>

<script>
    function go_site(){
        if($("#goSite").val() != "0"){
            location.href = $("#goSite").val();
        }
    }
</script>
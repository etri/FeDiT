<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ include file="/WEB-INF/view/include/tags.jspf" %>

<script type="text/javascript" src="/js/front/frontCommon.js"></script>

<!--
<div class="side-menubar">
<c:forEach var="result" items="${sideMenu.childList}">
    <c:if test="${result.recSt == 'Y'}">
        <ul>
            <li><a href="/front/${startUrl}/${result.upperMenu.menuUrl}/${result.menuUrl}.do"><c:out value="${result.menuNm}" /></a></li>
        </ul>
    </c:if>
</c:forEach>
</div>
-->
<div id="menu-container">

    <ul class="menu-list accordion">
        <c:forEach var="menu" items="${menuList}" varStatus="status">
            <c:if test="${menu.menuUrl != 'main' && menu.recSt == 'Y'}">
                <c:choose>
                    <c:when test="${fn:length(menu.childList) > 0}">
                        <li id="nav1" class="toggle accordion-toggle">
                            <span class="icon-plus"></span>
                            <a class="menu-link" href="#">${menu.menuNm}</a>
                        </li>
                        <ul class="menu-submenu accordion-content">
                            <c:forEach var="subMenu" items="${menu.childList}">
                                <c:if test="${subMenu.recSt == 'Y'}">
<%--                                        <li><a href="/front/${subMenu.upperMenu.menuUrl}/${subMenu.menuUrl}.do">${subMenu.menuNm}</a></li>--%>
                                    <li><a class="head" <c:if test="${subMenu.menuId eq menuId}"> id="selected_submenu" </c:if> href="/front/${subMenu.upperMenu.menuUrl}/${subMenu.menuUrl}.do">${subMenu.menuNm}</a></li>
                                </c:if>
                            </c:forEach>
                        </ul>
                    </c:when>
                </c:choose>
            </c:if>
        </c:forEach>
    </ul>
</div>

<script>
    document.title = "test12";
    let small_width = null;

    const max_width = getComputedStyle(document.documentElement).getPropertyValue("--responsive-max-width");
    const check_media = '(min-width:0px) and (max-width:' + max_width +')';


    function slideMenu() {
        var activeState = $("#menu-container .menu-list").hasClass("active");
        $("#menu-container .menu-list").animate({left: activeState ? "0%" : "-100%"}, 400);
    }

    function menu_wrapper_click(){
        $("#hamburger-menu").toggleClass("open");
        $("#menu-container .menu-list").toggleClass("active");
        slideMenu();

        $("body").toggleClass("overflow-hidden");
    }


    function detectMediaSize() {
       if (window.matchMedia(check_media).matches) {
           console.log("window.matchMedia(check_media).matches");
           console.log("small_width:"+small_width);

            if(false == small_width) {
                const activeState = $("#menu-container .menu-list").hasClass("active");
                if(activeState) {
                    menu_wrapper_click();
                }
                small_width = true;
            }
        }
        else {
           console.log("not    window.matchMedia(check_media).matches");
           console.log("small_width:"+small_width);

            if( true == small_width) {
                const activeState = $("#menu-container .menu-list").hasClass("active");
                if(false == activeState) {
                    menu_wrapper_click();
                }

                small_width = false;
            }
        }
    }

    function update_selected_submenu(){
        if($("#selected_submenu").length > 0){
            const selected_submenu = document.getElementById("selected_submenu");
            if(is_empty(selected_submenu)){
                console.log("selected_submenu is null.");
            }

            const content = selected_submenu.closest(".accordion-content");
            if(is_empty(content)){
                console.log("content is null.");
            }

            const menu_list = content.closest(".menu-list");
            if(is_empty(menu_list)){
                console.log("menu_list is null.");
            }

            const toggle = content.previousElementSibling;
            if(is_empty(toggle)){
                console.log("toggle is null.");
            }

            const menu_link = toggle.querySelector(".menu-link");
            if(is_empty(menu_link)){
                console.log("menu_link is null.");
            }

            if (window.matchMedia(check_media).matches) {
                small_width = true;
            }else{
                menu_list.classList.add("active");
                menu_list.style.left = '0%';

                const hamburger_menu = document.getElementById("hamburger-menu");
                if(is_empty(hamburger_menu)){
                    console.log("hamburger_menu is null.");
                }
                hamburger_menu.classList.toggle("open");

                small_width = false;
            }

            menu_link.classList.add("active");
            toggle.classList.add("active-tab");
            content.classList.add("open");
            content.style.display = "block";
        }
    }


    $(function() {
        update_selected_submenu();

        window.addEventListener('resize', detectMediaSize, false);




        $("#menu-wrapper").click(function(event) {
            event.stopPropagation();
            menu_wrapper_click();
        });

        $(".menu-list").find(".accordion-toggle").click(function() {
            $(this).next().toggleClass("open").slideToggle("fast");
            $(this).toggleClass("active-tab").find(".menu-link").toggleClass("active");

            $(".menu-list .accordion-content").not($(this).next()).slideUp("fast").removeClass("open");
            $(".menu-list .accordion-toggle").not(jQuery(this)).removeClass("active-tab").find(".menu-link").removeClass("active");
        });
    }); // jQuery load
</script>
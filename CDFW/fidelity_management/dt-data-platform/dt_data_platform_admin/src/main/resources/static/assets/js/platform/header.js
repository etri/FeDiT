document.addEventListener('DOMContentLoaded', function () {
    const pathName = location.pathname;
    const menuCd = new URLSearchParams(location.search).get('menuCd');

    /**
     * 특정 메뉴 그룹에서 현재 경로 또는 menuCd 기반으로 current 클래스 부여
     */
    function activateMenu(menuSelector) {
        const menus = document.querySelectorAll(menuSelector);
        let found = false;

        menus.forEach(menu => {
            const urlInfo = menu.dataset.leftUrlInfo;
            if (urlInfo && pathName.includes(urlInfo)) {
                menu.classList.add('current');
                found = true;
            }
        });

        if (!found && menuCd) {
            menus.forEach(menu => {
                const urlInfo = menu.dataset.leftUrlInfo;
                if (urlInfo && urlInfo.includes(menuCd)) {
                    menu.classList.add('current');

                    // filter-layer-box에 대해 추가적인 current 처리
                    const filterLayerBox = menu.closest('.filter-layer-box');
                    if (filterLayerBox) {
                        filterLayerBox.classList.add('current');
                    }
                }
            });
        }
    }

    // 사이드 메뉴 처리
    const sideMenuContainer = document.querySelector('.side-menu #gnb, .side-menu .gnb');
    if (sideMenuContainer) {
        activateMenu('#gnb li > ul.depth2 > li[data-left-url-info], #gnb li > ul.depth3 > li[data-left-url-info]');
    }

    // 탑 메뉴 처리
    const topMenuContainer = document.querySelector('.flat-menu .filter-wrap');
    if (topMenuContainer) {
        activateMenu('.filter-layer-box > .filter-layer > .option-list > li[data-left-url-info]');
    }
});
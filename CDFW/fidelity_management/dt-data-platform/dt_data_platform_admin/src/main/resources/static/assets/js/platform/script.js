window.addEventListener('load', function () {

    //PASSWORD VIEW BUTTON
    if (document.querySelector('.btn-toggle-pw')) {
        const pwToggleButton = document.querySelector('.btn-toggle-pw');
        pwToggleButton.addEventListener('click', function () {
            this.classList.toggle('is-show');
        });
    }

    //MODAL POPUP
    if (document.querySelector('.btn-popup-open')) { // 모달이 있는 페이지인지 확인

        document.querySelectorAll('.btn-popup-open').forEach((button) => {
            button.addEventListener('click', () => {
                if (button.dataset.action === 'custom') {
                    return;
                }
                const modalPopupId = button.getAttribute('data-popup-id');
                document.getElementById(modalPopupId).classList.add('is-open');
            });
        });

        const closeButton = document.querySelectorAll('.btn-popup-close');
        closeButton.forEach((button) => {
            button.addEventListener('click', () => {
                const modalPopupId = button.getAttribute('data-popup-id');
                document.getElementById(modalPopupId).classList.remove('is-open');
            });
        });

        const modalMask = document.querySelectorAll('.modal-popup-mask');
        modalMask.forEach((mask) => {
            mask.addEventListener('click', () => {
                const modalPopupId = mask.parentNode.getAttribute('id');
                document.getElementById(modalPopupId).classList.remove('is-open');
            });
        });

        //모달이 켜져있는 상태에서 또 다른 모달을 활성화할때 기존 모달은 꺼짐
        document.querySelectorAll('.btn-popup-open').forEach((button) => {
            button.addEventListener('click', () => {
                if (button.dataset.action === 'custom') {
                    return;
                }
                const modalPopupId = button.getAttribute('data-popup-id');
                const currentModal = document.querySelector('.modal-popup-wrap.is-open');

                if (currentModal) {
                    currentModal.classList.remove('is-open');
                }

                document.getElementById(modalPopupId).classList.add('is-open');
            });
        });

    }


    function toggleLayer(boxes, box, layer) {
        // 다른 레이어 닫기
        boxes.forEach(b => {
            if (b !== box) {
                b.classList.remove('is-show');
                const menu = b.querySelector(layer);
                if (menu) menu.setAttribute('aria-expanded', 'false');
            }
        });

        // 현재 레이어 토글
        box.classList.toggle('is-show');
        const isExpanded = box.classList.contains('is-show');
        const menu = box.querySelector(layer);
        if (menu) menu.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    }

    //외부 클릭 시 레이어 닫음
    function closeLayerOnOutsideClick(boxes, layer, excludeLayer) {
        document.addEventListener('click', (e) => {
            boxes.forEach(box => {
                if (!e.target.closest(box.classList[0]) && (!excludeLayer || (excludeLayer && !e.target.closest(excludeLayer)))) {
                    box.classList.remove('is-show');
                    const menu = box.querySelector(layer);
                    if (menu) menu.setAttribute('aria-expanded', 'false');
                }
            });
        });
    }

    // Dropdowns
    const dropdownBoxes = document.querySelectorAll('.dropdown-box');
    dropdownBoxes.forEach(dropdownBox => {
        const dropdownBtn = dropdownBox.querySelector('.dropdown-toggle');
        if (dropdownBtn) {
            dropdownBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleLayer(dropdownBoxes, dropdownBox, '.dropdown-layer');
            });
        }
    });
    closeLayerOnOutsideClick(dropdownBoxes, '.dropdown-layer');

    // UI Layers
    const layerBoxes = document.querySelectorAll('.ui-layer-box');
    layerBoxes.forEach(layerBox => {
        const layerBtn = layerBox.querySelector('.ui-layer-toggle');
        if (layerBtn) {
            layerBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleLayer(layerBoxes, layerBox, '.ui-layer');
            });
        }
    });
    closeLayerOnOutsideClick(layerBoxes, '.ui-layer');

    // Filter Layers
    const filterBoxes = document.querySelectorAll('.filter-layer-box');
    filterBoxes.forEach(filterBox => {
        const filterBtn = filterBox.querySelector('.filter-toggle');
        if (filterBtn) {
            filterBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleLayer(filterBoxes, filterBox, '.filter-layer');
            });
        }
    });
    closeLayerOnOutsideClick(filterBoxes, '.filter-layer', '.exclude-layer');

    // 처음 페이지 로드 시 실행
    adjustLayerPosition();

    // Href Button Event
    const hrefButtons = document.querySelectorAll('[data-href]');
    hrefButtons.forEach(hrefButton => {
        hrefButton.addEventListener('click', function (e) {
            location.href = this.dataset.href;
            e.stopPropagation();
            e.preventDefault();
        });
    });
});

//hamburger menu toggle
function toggleMenu() {
    let side_menu = document.querySelector(".side-menu");
    side_menu.classList.toggle("is-open");
}

//드롭다운박스 모바일일때 옵션 위치 계산 ..
function adjustLayerPosition() {
    const isMobile = window.innerWidth <= 768;
    const layerBoxes = document.querySelectorAll('.dropdown-box, .filter-layer-box, .ui-layer-box');

    layerBoxes.forEach(layerBox => {
        const layer = layerBox.querySelector('.dropdown-layer, .filter-layer, .ui-layer');

        if (layer) {
            if (isMobile) {
                // 모바일 화면에서 레이어 위치와 너비 조정
                const layerBoxRect = layerBox.getBoundingClientRect();
                const viewportWidth = window.innerWidth;
                const layerWidth = viewportWidth * 0.96; // 96vw로 설정
                const layerLeft = Math.min(layerBoxRect.left, (viewportWidth - layerWidth) / 4);

                layer.style.position = 'absolute';
                layer.style.width = `${layerWidth}px`;
                layer.style.left = `${layerLeft}px`;
                layer.style.transform = `translateX(-${layerBoxRect.left - layerLeft}px)`;
                layer.style.top = 'calc(100% + 8px)';
                layer.style.zIndex = '1000';
            } else {
                // 데스크탑일 경우 기본 스타일로 복원
                layer.style.position = 'absolute';
                layer.style.width = '';
                layer.style.left = '';
                layer.style.transform = '';
                layer.style.top = 'calc(100% + 2px)';
                if (layer.closest('.flat-menu')) {
                    let layerBoxRect = layerBox.getBoundingClientRect();
                    layer.style.width = `${layerBoxRect.width}px`;
                }
            }
        }
    });
}

window.addEventListener('resize', adjustLayerPosition);



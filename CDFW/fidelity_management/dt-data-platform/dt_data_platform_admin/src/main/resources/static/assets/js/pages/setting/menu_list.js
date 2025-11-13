document.addEventListener('DOMContentLoaded', () => {
    /**
     * Menu List Search Event
     * */
    let fieldInitializeElem = document.querySelector('span.filter-value[data-initialize]');
    if (fieldInitializeElem) {
        let type = fieldInitializeElem.dataset.initialize;
        let filterLayerBox = fieldInitializeElem.closest('.filter-layer-box');
        let input = filterLayerBox.querySelector(`input[type="radio"][value="${type}"]`);
        let label = filterLayerBox.querySelector(`label[for="${input.id}"]`);
        fieldInitializeElem.innerHTML = `${label.textContent.trim()}`;
    }
    let filterKeyword = document.querySelector('#filterKeyword');
    if (filterKeyword) {
        filterKeyword.addEventListener('keyup', function (event) {
            if (event.key === 'Enter' || event.code === 'Enter') {
                let filterKeywordAction = document.querySelector('#filterKeywordAction');
                if (filterKeywordAction) {
                    filterKeywordAction.click();
                }
            }
        });
    }
    let filterKeywordAction = document.querySelector('#filterKeywordAction');
    if (filterKeywordAction) {
        filterKeywordAction.addEventListener('click', function (event) {
            let keywordElem = document.querySelector('#filterKeyword');
            let keyword = keywordElem.value;
            let hiddenKeyword = document.querySelector('#keyword');
            hiddenKeyword.value = keyword;

            let fieldElem = document.querySelector('input[name="searchType"]:checked');
            let field = fieldElem.value;
            let hiddenField = document.querySelector('#field');
            hiddenField.value = field;

            console.log(hiddenKeyword.value, hiddenField.value);

            let search = document.querySelector('button[type="submit"].btn-search');
            search.click();
        });
    }

    commonSearchPaging();

    // 메뉴 등록
    $('.btn-add-menu').on('click', function () {
        openMenuModal();
    });

    $('.btn-modify').on('click', function () {
        let menuCode = $(this).data('menu-code');
        openMenuModal(menuCode);
    });

    $('.btn-delete').on('click', function () {
        if (confirm('해당 메뉴를 삭제하시겠습니까?')) {
            var data = {
                menuCd: $(this).data('menu-code'),
                upMenuCd: $(this).data('parent-menu-code')
            };

            ajaxPost('/setting/menu/delete', data, function (result) {
                if (result.result_code === 200) {
                    $('.btn-search').click();
                }
            });

        }
    });

    function openMenuModal(menuCode) {
        ajaxPost('/setting/menu/parent', {}, function (result) {
            let container = document.querySelector('#parent_menu_code_label').parentElement;
            let dropdownWrapper = container.querySelector('.dropdown-wrapper');
            dropdownWrapper.innerHTML = ``;
            let dropdown = document.createElement('div');
            ['dropdown-box'].forEach(function (className) {
                dropdown.classList.add(className);
            });

            let dropdownButton = document.createElement('button');
            dropdownButton.setAttribute('type', 'button');
            ['form-control', 'sm', 'dropdown-toggle'].forEach(function (className) {
                dropdownButton.classList.add(className);
            });
            dropdownButton.id = 'parent_menu_code';

            dropdownButton.addEventListener('click', dropdownToggleButtonClickEventListener);
            dropdown.appendChild(dropdownButton);

            let dropdownLayer = document.createElement('div');
            ['dropdown-layer'].forEach(function (className) {
                dropdownLayer.classList.add(className);
            });
            dropdownLayer.id = 'parent_menu_code_selection';
            dropdownLayer.style.maxHeight = '220px';

            let optionUl = document.createElement('ul');
            ['option-list'].forEach(function (className) {
                optionUl.classList.add(className);
            });
            console.log('result.data', result.data);
            result.data.forEach(function (data) {
                let optionLi = document.createElement('li');
                let label = document.createElement('label');
                label.setAttribute('for', `input_parent_menu_code_${data.code}`);
                label.addEventListener('click', labelClickEventListener);
                label.innerHTML = `${data.code_name}`;

                let input = document.createElement('input');
                input.setAttribute('type', 'radio');
                input.id = `input_parent_menu_code_${data.code}`;
                input.name = `parent_menu_code_input`;
                input.value = `${data.code}`;
                if (data.code === 'TOP') {
                    input.checked = true;
                    dropdownButton.innerHTML = `${data.code_name}`;
                    dropdownButton.dataset.value = `${data.code}`;
                }

                optionLi.appendChild(input);
                optionLi.appendChild(label);
                optionUl.appendChild(optionLi);
            });
            dropdownLayer.appendChild(optionUl);
            dropdown.appendChild(dropdownLayer);
            dropdownWrapper.appendChild(dropdown);
            container.appendChild(dropdownWrapper);
            closeLayerOnOutsideClick(Array.from(dropdown ? [dropdown] : []), '.dropdown-layer');

            if (menuCode) {
                getMenu(menuCode);
            } else {
                let menuModal = document.querySelector('#modal-menu');
                let menu_name = menuModal.querySelector('#menu_name');
                let menu_link = menuModal.querySelector('#menu_link');
                let menu_icon = menuModal.querySelector('#menu_icon');
                let ordby = menuModal.querySelector('#ordby');
                menu_name.value = '';
                menu_link.value = '';
                menu_icon.value = '';
                ordby.value = '';
                if (!menuModal.classList.contains('is-open')) {
                    menuModal.classList.add('is-open');
                }
            }
        });
    }

    function getMenu(menuCode) {
        let data = {
            menuCd: menuCode
        };

        ajaxPost('/setting/menu/load', data, function (result) {
            console.log('result', result);
            let menuModal = document.querySelector('#modal-menu');
            let parent_menu_code = menuModal.querySelector('#parent_menu_code');
            let dropdownBox = parent_menu_code.closest('.dropdown-box');
            let targetInput = dropdownBox.querySelector(`ul.option-list li input[value="${result.data.up_menu_cd}"]`);
            let targetLabel = dropdownBox.querySelector(`ul.option-list li label[for="${targetInput.id}"]`);
            targetLabel.click();

            let menu_code = menuModal.querySelector('#menu_code');
            let menu_name = menuModal.querySelector('#menu_name');
            let menu_link = menuModal.querySelector('#menu_link');
            let menu_icon = menuModal.querySelector('#menu_icon');
            let ordby = menuModal.querySelector('#ordby');

            parent_menu_code.value = `${result.data.up_menu_cd}`;
            menu_code.value = `${result.data.menu_cd}`;
            menu_name.value = `${result.data.menu_nm}`;
            menu_link.value = `${result.data.menu_url}`;
            menu_icon.value = `${result.data.menu_icon}`;
            ordby.value = `${result.data.ordby}`;

            if (!menuModal.classList.contains('is-open')) {
                menuModal.classList.add('is-open');
            }
        });
    }

    $('.btn-register').on('click', function () {
        let menuModal = document.querySelector('#modal-menu');
        let menu_code = menuModal.querySelector('#menu_code').value.trim();
        let menu_name = menuModal.querySelector('#menu_name').value.trim();
        let parent_menu_code = menuModal.querySelector('#parent_menu_code').dataset.value.trim();
        let menu_link = menuModal.querySelector('#menu_link').value.trim();
        let menu_icon = menuModal.querySelector('#menu_icon').value.trim();
        let ordby = menuModal.querySelector('#ordby').value.trim();

        if (menu_code === '') {
            alert('메뉴코드를 입력하세요.');
            return false;
        }

        if (menu_name === '') {
            alert('메뉴명을 입력하세요.');
            return false;
        }

        let data = {
            menuCd: menu_code,
            menuNm: menu_name,
            upMenuCd: parent_menu_code,
            menuUrl: menu_link,
            menuIcon: menu_icon,
            ordby: ordby ? ordby : null
        };

        ajaxPost('/setting/menu/register', data, function (result) {
            if (result.result_code === 200) {
                $('.btn-search').click();
            }
        });
    });
});
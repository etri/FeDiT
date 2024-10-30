(function() {
    'use strict'
    $(document).ready(function() {

        commonSearchPaging();

        // 메뉴 등록
        $('.btn-add-menu').on('click', function() {
            openMenuModal();
        });

        $('.btn-modify').on('click', function() {
            var menuCode = $(this).data('menu-code');
            openMenuModal(menuCode);
        });

        $('.btn-delete').on('click', function() {
            if (confirm('해당 메뉴를 삭제하시겠습니까?')) {
                var data = {
                    menuCd: $(this).data('menu-code'),
                    upMenuCd: $(this).data('parent-menu-code')
                };

                ajaxPost('/setting/menu/delete', data, function(result) {
                    if (result.result_code === 200) {
                        //showAlert('3');
                        $('.btn-search').click();
                    }
                });

            }
        });

        function openMenuModal(menuCode) {
            ajaxPost('/setting/menu/parent', {}, function(result) {
                $('#parent_menu_code').empty();
                $.each(result.data, function(index, item) {
                    $('#parent_menu_code').append($('<option value="' + item.code + '">' + item.code_name + '</option>'))
                });
                if (menuCode) {
                    getMenu(menuCode);
                } else {
                    $('#menu_code').val('');
                    $('#menu_name').val('');
                    $('#menu_link').val('');
                    $('#menu_icon').val('');
                    $('#ordby').val('');
                    $('#modal-menu').modal('show');
                }
            });
        }

        function getMenu(menuCode) {
            var data = {
                menuCd: menuCode
            };
            
            ajaxPost('/setting/menu/load', data, function(result) {
                $('#parent_menu_code').val(result.data.up_menu_cd);
                $('#menu_code').val(result.data.menu_cd);
                $('#menu_name').val(result.data.menu_nm);
                $('#menu_link').val(result.data.menu_url);
                $('#menu_icon').val(result.data.menu_icon);
                $('#ordby').val(result.data.ordby);
                $('#modal-menu').modal('show');
            });
        }

        $('.btn-register').on('click', function() {
            var menu_code = $('#menu_code').val().trim();
            var menu_name = $('#menu_name').val().trim();
            var parent_menu_code = $('#parent_menu_code').val();
            var menu_link = $('#menu_link').val().trim();
            var menu_icon = $('#menu_icon').val().trim();
            var ordby = $('#ordby').val().trim();

            if (menu_code === '') {
                alert('메뉴코드를 입력하세요.');
                return false;
            }

            if (menu_name === '') {
                alert('메뉴명을 입력하세요.');
                return false;
            }

            if (parent_menu_code === 'TOP' && menu_icon === '') {
                alert('메뉴명 아이콘을 입력하세요.');
                return false;
            }

            if (parent_menu_code !== 'TOP' && menu_link === '') {
                alert('링크를 입력하세요.');
                return false;
            }

            var data = {
                menuCd: menu_code,
                menuNm: menu_name,
                upMenuCd: parent_menu_code,
                menuUrl: menu_link,
                menuIcon: menu_icon,
                ordby: ordby ? ordby : null
            };
			
            ajaxPost('/setting/menu/register', data, function(result) {
                if (result.result_code === 200) {
                    //showAlert('4');
                    $('.btn-search').click();
                }
            });
        });
    });
})();
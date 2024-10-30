document.addEventListener('DOMContentLoaded', () => {
    modelListCommonSearchPaging();

    console.log('list event register');
    let listItems = document.querySelectorAll('[action-type="delete"]');
    console.log('listItems', listItems);
    listItems?.forEach(function (item) {
        console.log('item', item);
        item.addEventListener('click', function (event) {
            let augment_seq = this.dataset.number;
            let data = {
                augment_seq
            }

            $.ajax({
                type: "POST",
                url: '/dt/simulation/delete',
                data: JSON.stringify(data),
                contentType: "application/json; charset=utf-8;",
                dataType: "json",
                success: function (result) {
                    console.log('result', result);
                    if (result.code === 200) {
                        switch (result.type) {
                            case 'success':
                                alert('삭제가 완료되었습니다.');
                                const url = new URL(window.location.href);
                                const urlParams = url.searchParams;
                                let menu_cd = urlParams.get('menuCd');
                                console.log('contextPath', contextPath);
                                location.href = window.location.href;
                                break;
                            case 'restrict':
                                alert(result.message);
                                break;
                            case 'nofind':
                                alert('해당되는 시뮬레이션을 찾을 수 없습니다.\n새로고침 후 다시 시도해주세요.');
                                break;
                        }
                    } else {
                        alert('API 내 에러 발생');
                    }
                },
                error: function (xhr, status, error) {
                    console.error('error : ', error);
                    alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
                }
            });
        });
    });

    $(document).on('click', '.schd-test', function () {
        $('.wrap-loading').removeClass('display-none');
        $.ajax({
            type: "POST",
            //async: false,
            url: '/dt/sch/sim/test',
            //data: JSON.stringify(data),
            contentType: "application/json; charset=utf-8;",
            dataType: "json",
            success: function (result) {
                $('.wrap-loading').addClass('display-none');
                if (result.code == 200) {
                    console.log(result);
                } else {
                    alert('API 내 에러 발생');
                }
            },
            error: function (xhr, status, error) {
                $('.wrap-loading').addClass('display-none');
                console.error('error : ', error);
                alert('에러가 발생하였습니다. 관리자에게 문의하십시오.');
            }
        });
    });
});
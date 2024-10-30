document.addEventListener('DOMContentLoaded', function () {
    boardListCommonSearchPaging();
    console.log('list event register');
    let listItems = document.querySelectorAll('[data-action="delete"]');
    console.log('listItems', listItems);
    listItems?.forEach(function (item) {
        console.log('item', item);
        item.addEventListener('click', function (event) {
            let board_no = this.dataset.number;
            let _this = this;
            let url;
            if (_this.dataset.type === 'NOTICE') {
                url = `/dt/board/notice/${board_no}/delete`;
            } else {
                url = `/dt/board/community/${board_no}/delete`;
            }

            showProgressBar({element: null, process_id: 'process-52'});

            $.ajax({
                type: "POST",
                url: url,
                contentType: "application/json; charset=utf-8;",
                dataType: "json",
                success: function (result) {
                    if (result.code === 200) {
                        closeProgressBar({element: null, process_id: 'process-52'});
                        location.href = window.location.href;
                    } else {
                        closeProgressBar({element: null, process_id: 'process-52'});
                        console.error('Error:', 'result.code is not success');
                    }
                },
                error: function (xhr, status, error) {
                    closeProgressBar({element: null, process_id: 'process-52'});
                    console.error('error : ', error);
                }
            });
        });
    });
});